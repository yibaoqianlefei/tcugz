import { useMemo } from "react";
import * as THREE from "three";
import type { VariantModelInfo } from "./VariantModel";
import type { LayoutSlot } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   useVariantLayout — computes horizontal layout positions and
   combined bounding box from per-variant dimension reports.

   Algorithm:
   1. Gap = clamp(maxWidth * 0.18, 0.6, 2.0)
   2. Arrange left-to-right in variant array order
   3. Re-centre the whole composition around X=0
   ═══════════════════════════════════════════════════════════════ */

interface LayoutResult {
  /** Per-variant X offset (added to the group position). */
  slots: LayoutSlot[];
  /** Combined bounding sphere for camera adapt. */
  combinedSphere: THREE.Sphere;
  /** Combined bounding box centre. */
  combinedCentre: THREE.Vector3;
  /** Combined bounding box for camera adapt. */
  combinedBox: THREE.Box3;
}

export function useVariantLayout(
  models: Map<string, VariantModelInfo>,
  variantOrder: string[],
): LayoutResult | null {
  return useMemo(() => {
    if (variantOrder.length === 0) return null;

    // Gather all reports in order
    const ordered: VariantModelInfo[] = [];
    for (const id of variantOrder) {
      const info = models.get(id);
      if (!info) return null; // Not all ready yet
      ordered.push(info);
    }

    if (ordered.length < 2) return null;

    // Compute gap
    const maxW = Math.max(...ordered.map((m) => m.width), 0.5);
    const gap = Math.max(0.6, Math.min(2.0, maxW * 0.18));

    // Arrange left-to-right
    const slots: LayoutSlot[] = [];
    let cursorX = 0;
    for (let i = 0; i < ordered.length; i++) {
      const m = ordered[i];
      const halfW = m.width / 2;
      const x = cursorX + halfW;
      slots.push({ variantId: m.variantId, x, width: m.width });
      cursorX += m.width + gap;
    }

    // Total width (including gap after last model is excluded)
    const totalW = cursorX - gap;

    // Re-centre around X=0
    const centreOffset = totalW / 2;
    for (const slot of slots) {
      slot.x -= centreOffset;
    }

    // Compute combined bounding box
    const combinedBox = new THREE.Box3();
    for (const m of ordered) {
      // Clone the wrapper's bounding box and translate to layout position
      const wrapperBox = new THREE.Box3().setFromObject(m.wrapper);
      const slot = slots.find((s) => s.variantId === m.variantId)!;
      wrapperBox.translate(new THREE.Vector3(slot.x, 0, 0));
      combinedBox.union(wrapperBox);
    }

    const combinedCentre = new THREE.Vector3();
    combinedBox.getCenter(combinedCentre);
    const combinedSphere = new THREE.Sphere();
    combinedBox.getBoundingSphere(combinedSphere);

    return { slots, combinedSphere, combinedCentre, combinedBox };
  }, [models, variantOrder]);
}
