import { create } from "zustand";
import { clampExplodeProgress } from "../utils/explodeLayout";

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
  // ── Rotation toggle (single source — feeds ModelViewer's autoRotate prop,
  //    consumed by OrbitControls.autoRotate (single-model) AND the multi-model
  //    self-rotation useFrame through the SAME prop) ──
  autoRotate: boolean;
  // ── Manual camera re-fit (R reset) ──
  /** Monotonic token; CameraTracker re-fits whenever it changes. */
  refitToken: number;
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
  /** Unified variant selection.
   *  Atomically sets selectedVariantId + activeExplodeVariantId,
   *  resets explodeProgress.
   *
   *  @param variantId  new variant id, or null to deselect.
   *  @param keepObject  optional scoped key to preserve as selectedObject
   *                     (used by 3D mesh pick when the pick also changes
   *                     the variant — avoids clearing the just-picked object). */
  selectVariant: (variantId: string | null, keepObject?: string | null) => void;
  setLinkageEnabled: (v: boolean) => void;
  setAutoRotate: (v: boolean) => void;
  resetNodeInteractionState: () => void;
  /** Ask CameraTracker to re-run the initial camera fit (R reset).
   *  Only bumps a token — CameraTracker consumes it and re-fits. */
  requestCameraRefit: () => void;
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
  autoRotate: true, // product default: models auto-rotate on load (existing setting)
  refitToken: 0,

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
    }),
  setLinkageEnabled: (v) => set({ linkageEnabled: v }),
  setAutoRotate: (v) => set({ autoRotate: v }),
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
      // Rotation is part of the initial interaction state (product default =
      // rotating), so R reset AND node switch restore it — the next node never
      // inherits a stale rotation toggle.
      autoRotate: true,
    }),
  requestCameraRefit: () =>
    set((s) => ({ refitToken: s.refitToken + 1 })),
}));
