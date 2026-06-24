import { create } from "zustand";

type Store = {
  // ── Selection & hover ──
  selectedObject: string | null;
  hoveredObject: string | null;
  // ── Animation ──
  isPlaying: boolean;
  animationProgress: number;
  // ── Linkage toggle ──
  linkageEnabled: boolean;
  // ── Actions ──
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setIsPlaying: (v: boolean) => void;
  setAnimationProgress: (v: number) => void;
  setLinkageEnabled: (v: boolean) => void;
};

export const useNodeStore = create<Store>((set) => ({
  selectedObject: null,
  hoveredObject: null,
  isPlaying: false,
  animationProgress: 0,
  linkageEnabled: true,

  setSelectedObject: (name) => set({ selectedObject: name }),
  setHoveredObject: (name) => set({ hoveredObject: name }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setAnimationProgress: (v) => set({ animationProgress: v }),
  setLinkageEnabled: (v) => set({ linkageEnabled: v }),
}));
