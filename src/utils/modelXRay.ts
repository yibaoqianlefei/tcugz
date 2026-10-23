import { LineSegments, Material, Mesh, Object3D } from 'three';
import { isHitboxName } from './nameUtils';

export type XRayFocus = 'clear' | 'hover' | 'selected';
type SurfaceState = Pick<Material, 'transparent' | 'opacity' | 'depthWrite' | 'depthTest' | 'forceSinglePass'>;

/** Operates only on a viewer's owned materials. Color/emissive highlights,
 * authored textures, geometry, visibility and animation are left independent. */
export function createModelXRay(root: Object3D) {
  const materials = new Map<Material, SurfaceState>();
  const lines = new Map<LineSegments, number>();
  const meshes = new Map<Mesh, boolean>();
  function restore() {
    materials.forEach((state, material) => { Object.assign(material, state); material.needsUpdate = true; });
    lines.forEach((order, line) => { line.renderOrder = order; });
    meshes.forEach((castShadow, mesh) => { mesh.castShadow = castShadow; });
  }
  return {
    update(enabled: boolean, focus: (mesh: Mesh) => XRayFocus = () => 'clear') {
      if (!enabled) { restore(); return; }
      // Traverse on updates too: node initialization may add outlines after the
      // controller is created, and a model may finish loading with X-ray on.
      root.traverse(object => {
        if (!(object instanceof Mesh) && !(object instanceof LineSegments)) return;
        for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
          if (ancestor.userData._isProxy || isHitboxName(ancestor.name) || ancestor.name.startsWith('__dev_')) return;
          if (ancestor === root) break;
        }
        const outline = object instanceof LineSegments;
        if (outline && !lines.has(object)) lines.set(object, object.renderOrder);
        if (object instanceof Mesh && !meshes.has(object)) meshes.set(object, object.castShadow);
        const active = object instanceof Mesh ? focus(object) : 'clear';
        const opacity = outline ? .24 : active === 'selected' ? .8 : active === 'hover' ? .5 : .18;
        for (const material of [object.material].flat()) {
          if (!materials.has(material)) materials.set(material, {
            transparent: material.transparent, opacity: material.opacity, depthWrite: material.depthWrite,
            depthTest: material.depthTest, forceSinglePass: material.forceSinglePass,
          });
          material.transparent = true;
          material.opacity = Math.min(materials.get(material)!.opacity, opacity);
          material.depthWrite = false;
          material.forceSinglePass = true;
          // Faint existing feature edges reveal the internal construction.
          // Surface depth testing remains authored; no proxy becomes visible.
          if (outline) material.depthTest = false;
          material.needsUpdate = true;
        }
        if (outline) object.renderOrder = 2;
        else object.castShadow = false;
      });
    },
    restore,
  };
}
