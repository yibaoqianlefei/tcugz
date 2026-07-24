import { useMemo, useLayoutEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { NodeModelVariant } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   VariantModel — loads a single GLB, applies per-variant config
   (scale/rotation/position), normalises origin so bottom-centre
   is at local (0,0,0). Reports bounding-box dimensions to parent
   via onReady exactly once.

   NEVER mutates the cached gltf.scene. All transforms go through
   the wrapper group, which is the only object positioned.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  variant: NodeModelVariant;
  /** World-space X offset applied by parent after layout is computed. */
  layoutX: number;
  onReady: (info: VariantModelInfo) => void;
}

export interface VariantModelInfo {
  variantId: string;
  /** The wrapper group — normalised origin, ready for layout positioning. */
  wrapper: THREE.Group;
  /** Bounding-box width (X) after normalisation. */
  width: number;
  /** Bounding-box height (Y) after normalisation. */
  height: number;
  /** Bounding-box depth (Z) after normalisation. */
  depth: number;
}

export default function VariantModel({ variant, layoutX, onReady }: Props) {
  const modelPath = variant.model.path;
  const { scene: sourceScene } = useGLTF(modelPath, true);
  const reportedRef = useRef(false);

  /* ── Clone + normalise + apply config — runs once per sourceScene/variant ── */
  const wrapper = useMemo(() => {
    const clone = sourceScene.clone(true);
    clone.name = `variant-clone-${variant.id}`;

    // Per-variant scale
    const s = variant.model.scale ?? 1;
    clone.scale.setScalar(s);

    // Per-variant rotation (applied before normalisation)
    if (variant.model.rotation) {
      clone.rotation.set(
        variant.model.rotation[0],
        variant.model.rotation[1],
        variant.model.rotation[2],
      );
    }

    // Per-variant position offset
    if (variant.model.position) {
      clone.position.set(
        variant.model.position[0],
        variant.model.position[1],
        variant.model.position[2],
      );
    }

    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clone);

    // Normalise: centre X/Z at 0, bottom Y at 0
    const centre = new THREE.Vector3();
    box.getCenter(centre);

    const w = new THREE.Group();
    w.name = `wrapper-${variant.id}`;
    w.position.set(-centre.x, -box.min.y, -centre.z);
    w.add(clone);
    w.updateMatrixWorld(true);

    return w;
    // Only re-run when sourceScene or variant identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceScene, variant.id]);

  /* ── Report dimensions once (useLayoutEffect fires before paint) ── */
  useLayoutEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const box = new THREE.Box3().setFromObject(wrapper);
    const size = new THREE.Vector3();
    box.getSize(size);

    onReady({
      variantId: variant.id,
      wrapper,
      width: size.x,
      height: size.y,
      depth: size.z,
    });
  }, [wrapper, variant.id, onReady]);

  return (
    <group position={[layoutX, 0, 0]}>
      <primitive object={wrapper} />
    </group>
  );
}
