import { create } from "zustand";
import { clampExplodeProgress } from "../utils/explodeLayout";
import { clampSectionOffset } from "../utils/sectionMath";
import type { SectionAxis } from "../utils/sectionMath";

type Store = {
  // ── Selection & hover (mesh-level, backward-compatible) ──
  selectedObject: string | null;
  hoveredObject: string | null;
  // ── Variant-level selection & hover (Phase 3) ──
  selectedVariantId: string | null;
  hoveredVariantId: string | null;
  // ── Animation (normal nodes, GLTF AnimationMixer) ──
  isPlaying: boolean;
  animationProgress: number;
  // ── Explode (multi-variant, Phase 5) ──
  explodeProgress: number;
  activeExplodeVariantId: string | null;
  // ── Linkage toggle ──
  linkageEnabled: boolean;
  // ── Section (Phase 6 Step 2) ──
  sectionEnabled: boolean;
  sectionAxis: SectionAxis;
  sectionOffset: number;
  sectionInvert: boolean;
  // ── Camera Lock (Phase 6 Step 3) ──
  cameraLockEnabled: boolean;
  cameraLockTargetKey: string | null;
  // ── Actions ──
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setSelectedVariantId: (id: string | null) => void;
  setHoveredVariantId: (id: string | null) => void;
  setIsPlaying: (v: boolean) => void;
  setAnimationProgress: (v: number) => void;
  setExplodeProgress: (v: number) => void;
  setActiveExplodeVariantId: (id: string | null) => void;
  resetExplode: () => void;
  /** Phase 6 Step 2: unified variant selection.
   *  Atomically sets selectedVariantId + activeExplodeVariantId,
   *  resets explodeProgress and section.
   *
   *  @param variantId  new variant id, or null to deselect.
   *  @param keepObject  optional scoped key to preserve as selectedObject
   *                     (used by 3D mesh pick when the pick also changes
   *                     the variant — avoids clearing the just-picked object). */
  selectVariant: (variantId: string | null, keepObject?: string | null) => void;
  setLinkageEnabled: (v: boolean) => void;
  resetNodeInteractionState: () => void;
  // ── Section actions (Phase 6 Step 2) ──
  setSectionEnabled: (enabled: boolean) => void;
  setSectionAxis: (axis: SectionAxis) => void;
  setSectionOffset: (offset: number) => void;
  setSectionInvert: (invert: boolean) => void;
  /** Reset only Section state — does NOT touch Explode or Animation. */
  resetSection: () => void;
  // ── Camera Lock actions (Phase 6 Step 3) ──
  /** Lock camera to the currently selected object.
   *  Validates that targetKey is non-null before locking.
   *  Sets cameraLockEnabled + cameraLockTargetKey atomically. */
  lockCameraToObject: (targetKey: string) => void;
  /** Exit Camera Lock.  Resets cameraLockEnabled + cameraLockTargetKey.
   *  Does NOT resume CameraTracker — use resetCameraLock for lifecycle. */
  unlockCamera: () => void;
  /** Full Camera Lock reset for node/variant/relatedNode lifecycle.
   *  Resets lock state AND resumes CameraTracker. */
  resetCameraLock: () => void;
};

export const useNodeStore = create<Store>((set) => ({
  selectedObject: null,
  hoveredObject: null,
  selectedVariantId: null,
  hoveredVariantId: null,
  isPlaying: false,
  animationProgress: 0,
  explodeProgress: 0,
  activeExplodeVariantId: null,
  linkageEnabled: true,
  /* ── Section defaults (Phase 6 Step 2) ── */
  sectionEnabled: false,
  sectionAxis: "y",
  sectionOffset: 0.5,
  sectionInvert: false,
  /* ── Camera Lock defaults (Phase 6 Step 3) ── */
  cameraLockEnabled: false,
  cameraLockTargetKey: null,

  setSelectedObject: (name) => set({ selectedObject: name }),
  setHoveredObject: (name) => set({ hoveredObject: name }),
  setSelectedVariantId: (id) => set({ selectedVariantId: id }),
  setHoveredVariantId: (id) => set({ hoveredVariantId: id }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setAnimationProgress: (v) => set({ animationProgress: v }),
  setExplodeProgress: (v) => set({ explodeProgress: clampExplodeProgress(v) }),
  setActiveExplodeVariantId: (id) => set({ activeExplodeVariantId: id }),
  resetExplode: () => set({ explodeProgress: 0, activeExplodeVariantId: null }),
  selectVariant: (variantId, keepObject) =>
    set({
      selectedVariantId: variantId,
      selectedObject: keepObject ?? null,
      activeExplodeVariantId: variantId,
      explodeProgress: 0,
      sectionEnabled: false,
      sectionAxis: "y",
      sectionOffset: 0.5,
      sectionInvert: false,
      // Phase 6 Step 3: variant switch exits Camera Lock
      cameraLockEnabled: false,
      cameraLockTargetKey: null,
    }),
  setLinkageEnabled: (v) => set({ linkageEnabled: v }),
  resetNodeInteractionState: () =>
    set({
      selectedObject: null,
      hoveredObject: null,
      selectedVariantId: null,
      hoveredVariantId: null,
      isPlaying: false,
      animationProgress: 0,
      explodeProgress: 0,
      activeExplodeVariantId: null,
      sectionEnabled: false,
      sectionAxis: "y",
      sectionOffset: 0.5,
      sectionInvert: false,
      // Phase 6 Step 3: node switch exits Camera Lock
      cameraLockEnabled: false,
      cameraLockTargetKey: null,
    }),

  /* ── Section actions (Phase 6 Step 2) ── */
  setSectionEnabled: (enabled) => set({ sectionEnabled: enabled }),
  setSectionAxis: (axis) => set({ sectionAxis: axis }),
  setSectionOffset: (offset) => set({ sectionOffset: clampSectionOffset(offset) }),
  setSectionInvert: (invert) => set({ sectionInvert: invert }),
  resetSection: () =>
    set({
      sectionEnabled: false,
      sectionAxis: "y",
      sectionOffset: 0.5,
      sectionInvert: false,
    }),

  /* ── Camera Lock actions (Phase 6 Step 3) ── */
  lockCameraToObject: (targetKey) =>
    set({
      cameraLockEnabled: true,
      cameraLockTargetKey: targetKey,
    }),
  unlockCamera: () =>
    set({
      cameraLockEnabled: false,
      cameraLockTargetKey: null,
    }),
  resetCameraLock: () =>
    set({
      cameraLockEnabled: false,
      cameraLockTargetKey: null,
    }),
}));
