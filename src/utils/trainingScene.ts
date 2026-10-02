import * as THREE from 'three';
import type { TrainingPart } from '../data/training';
import { canonicalName, isHitboxName } from './nameUtils';

export interface TrainingScene {
  scene: THREE.Group;
  bounds: THREE.Box3;
  centers: Map<string, THREE.Vector3>;
  meshes: Map<string, THREE.Mesh[]>;
  positions: Map<THREE.Mesh, THREE.Vector3>;
  ghosts: Map<string, THREE.Mesh[]>;
  materials: THREE.Material[];
  edges: THREE.EdgesGeometry[];
}
export function trainingPartForObject(object: THREE.Object3D, parts: TrainingPart[], groups?: Record<string, string>): string | undefined {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    const name = canonicalName(current.name, groups);
    const part = parts.find(part => part.meshes.some(mesh => canonicalName(mesh, groups) === name));
    if (part) return part.id;
  }
}
export function createTrainingScene(source: THREE.Group, parts: TrainingPart[], groups?: Record<string, string>): TrainingScene {
  const scene = source.clone(true);
  const meshes = new Map<string, THREE.Mesh[]>();
  const positions = new Map<THREE.Mesh, THREE.Vector3>();
  const materials: THREE.Material[] = [];
  const edges: THREE.EdgesGeometry[] = [];
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    if (isHitboxName(object.name)) { object.visible = false; return; }
    const partId = trainingPartForObject(object, parts, groups);
    object.userData = { ...object.userData, trainingPart: partId };
    if (partId) meshes.set(partId, [...meshes.get(partId) ?? [], object]);
    positions.set(object, object.position.clone());
    const clones = (Array.isArray(object.material) ? object.material : [object.material]).map(material => material.clone());
    materials.push(...clones);
    object.material = Array.isArray(object.material) ? clones : clones[0];
    const geometry = new THREE.EdgesGeometry(object.geometry, 15);
    const material = new THREE.LineBasicMaterial({ color: '#24314a', transparent: true, opacity: 0.75, toneMapped: false });
    const lines = new THREE.LineSegments(geometry, material);
    lines.raycast = () => {};
    object.add(lines);
    edges.push(geometry);
    materials.push(material);
  });
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const centers = new Map<string, THREE.Vector3>();
  for (const [id, objects] of meshes) {
    const box = new THREE.Box3();
    objects.forEach(object => box.union(new THREE.Box3().setFromObject(object)));
    centers.set(id, box.getCenter(new THREE.Vector3()));
  }
  const missing = parts.filter(part => !meshes.has(part.id));
  if (missing.length) {
    materials.forEach(material => material.dispose());
    edges.forEach(edge => edge.dispose());
    throw new Error(`训练构件未绑定：${missing.map(part => part.name).join('、')}`);
  }
  const ghosts = new Map<string, THREE.Mesh[]>();
  for (const [id, objects] of meshes) {
    const copies = objects.map(object => {
      const material = new THREE.MeshBasicMaterial({ color: '#6d83bb', transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
      materials.push(material);
      const ghost = new THREE.Mesh(object.geometry, material);
      ghost.name = `training-slot-${id}`;
      ghost.userData = { trainingSlot: id };
      ghost.visible = false;
      ghost.matrix.copy(object.matrixWorld);
      ghost.matrixAutoUpdate = false;
      return ghost;
    });
    // Ghost matrices are in world coordinates, so attach at the identity root.
    ghosts.set(id, copies);
  }
  return { scene, bounds, centers, meshes, positions, ghosts, materials, edges };
}

export function applyTrainingPresentation(model: TrainingScene, { selected, hidden = [], placements, separated = false }: { selected: string[]; hidden?: string[]; placements?: Record<string, string>; separated?: boolean }) {
  const center = model.bounds.getCenter(new THREE.Vector3());
  const size = model.bounds.getSize(new THREE.Vector3()).length();
  for (const [id, objects] of model.meshes) {
    const slot = placements ? Object.keys(placements).find(slot => placements[slot] === id) : undefined;
    const offset = placements && slot ? model.centers.get(slot)!.clone().sub(model.centers.get(id)!) : new THREE.Vector3();
    if (separated && !placements) {
      offset.copy(model.centers.get(id)!).sub(center);
      if (offset.lengthSq() < 1e-8) offset.set(0, size * 0.12, 0);
      offset.multiplyScalar(0.45);
    }
    for (const object of objects) {
      object.position.copy(model.positions.get(object)!);
      const originalWorld = object.getWorldPosition(new THREE.Vector3());
      object.position.copy(object.parent!.worldToLocal(originalWorld.add(offset)));
      object.visible = placements ? Boolean(slot) : !hidden.includes(id);
      object.userData.trainingSlot = placements ? slot : undefined;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if ('emissive' in material && material.emissive instanceof THREE.Color) {
          material.emissive.set(selected.includes(slot ?? id) ? '#4761b2' : '#000000');
          if ('emissiveIntensity' in material) material.emissiveIntensity = selected.includes(slot ?? id) ? 0.55 : 0;
        }
      });
      object.updateMatrixWorld(true);
    }
  }
  for (const [id, ghosts] of model.ghosts) ghosts.forEach(ghost => { ghost.visible = Boolean(placements && !placements[id]); });
}
