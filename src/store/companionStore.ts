import { create } from 'zustand';
import type { CompanionContext, CompanionMessage } from '../companion/types';

interface CompanionState {
  open: boolean;
  hasOpened: boolean;
  hidden: boolean;
  draft: string;
  messages: CompanionMessage[];
  context: CompanionContext;
  homeNodeId: string;
  homeSlide: number;
  homeSection: string;
  detail: CompanionContext | null;
  busy: boolean;
  setOpen: (open: boolean) => void;
  setHidden: (hidden: boolean) => void;
  setDraft: (draft: string) => void;
  addMessage: (message: CompanionMessage) => void;
  clearMessages: () => void;
  setContext: (context: CompanionContext) => void;
  publishDetail: (context: CompanionContext | null) => void;
  setHomeNodeId: (id: string) => void;
  setHomeSlide: (index: number) => void;
  setHomeSection: (section: string) => void;
  setBusy: (busy: boolean) => void;
}
export const useCompanionStore = create<CompanionState>((set) => ({
  open: false, hasOpened: false, hidden: false, draft: '', messages: [], busy: false,
  context: { kind: 'home', route: '/', title: '学习首页' },
  homeNodeId: 'water-storage-eaves-drainage-01', homeSlide: 0, homeSection: 'features', detail: null,
  setOpen: open => set({ open, ...(open ? { hidden: false, hasOpened: true } : {}) }),
  setHidden: hidden => set({ hidden, ...(hidden ? { open: false } : {}) }),
  setDraft: draft => set({ draft: draft.slice(0, 1500) }),
  addMessage: message => set(state => ({ messages: [...state.messages, message].slice(-60) })),
  clearMessages: () => set({ messages: [] }),
  setContext: context => set(state => JSON.stringify(state.context) === JSON.stringify(context) ? state : { context }),
  publishDetail: detail => set({ detail }),
  setHomeNodeId: homeNodeId => set({ homeNodeId }),
  setHomeSlide: homeSlide => set({ homeSlide }),
  setHomeSection: homeSection => set(state => state.homeSection === homeSection ? state : { homeSection }),
  setBusy: busy => set({ busy }),
}));
