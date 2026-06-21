import { create } from "zustand";

type Store = {
  // ── Selection & hover ──
  selectedObject: string | null;
  hoveredObject: string | null;
  // ── Animation ──
  isPlaying: boolean;
  animationProgress: number; // 0-1, updated each frame
  // ── Actions ──
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setIsPlaying: (v: boolean) => void;
  setAnimationProgress: (v: number) => void;
};

export const useNodeStore = create<Store>((set) => ({
  selectedObject: null,
  hoveredObject: null,
  isPlaying: false,
  animationProgress: 0,

  setSelectedObject: (name) => set({ selectedObject: name }),
  setHoveredObject: (name) => set({ hoveredObject: name }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setAnimationProgress: (v) => set({ animationProgress: v }),
}));
