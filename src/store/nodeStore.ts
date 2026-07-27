import { create } from "zustand";

type Store = {
  // ── Selection & hover (mesh-level, backward-compatible) ──
  selectedObject: string | null;
  hoveredObject: string | null;
  // ── Variant-level selection & hover (Phase 3) ──
  selectedVariantId: string | null;
  hoveredVariantId: string | null;
  // ── Animation ──
  isPlaying: boolean;
  animationProgress: number;
  // ── Linkage toggle ──
  linkageEnabled: boolean;
  // ── Actions ──
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setSelectedVariantId: (id: string | null) => void;
  setHoveredVariantId: (id: string | null) => void;
  setIsPlaying: (v: boolean) => void;
  setAnimationProgress: (v: number) => void;
  setLinkageEnabled: (v: boolean) => void;
  resetNodeInteractionState: () => void;
};

export const useNodeStore = create<Store>((set) => ({
  selectedObject: null,
  hoveredObject: null,
  selectedVariantId: null,
  hoveredVariantId: null,
  isPlaying: false,
  animationProgress: 0,
  linkageEnabled: true,

  setSelectedObject: (name) => set({ selectedObject: name }),
  setHoveredObject: (name) => set({ hoveredObject: name }),
  setSelectedVariantId: (id) => set({ selectedVariantId: id }),
  setHoveredVariantId: (id) => set({ hoveredVariantId: id }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setAnimationProgress: (v) => set({ animationProgress: v }),
  setLinkageEnabled: (v) => set({ linkageEnabled: v }),
  resetNodeInteractionState: () =>
    set({
      selectedObject: null,
      hoveredObject: null,
      selectedVariantId: null,
      hoveredVariantId: null,
      isPlaying: false,
      animationProgress: 0,
    }),
}));
