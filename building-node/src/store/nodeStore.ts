import { create } from "zustand";

type Store = {
  selected: string | null;
  explode: number;
  setSelected: (id: string | null) => void;
  setExplode: (v: number) => void;
};

export const useNodeStore = create<Store>((set) => ({
  selected: null,
  explode: 0,
  setSelected: (id) => set({ selected: id }),
  setExplode: (v) => set({ explode: v }),
}));
