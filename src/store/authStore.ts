import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  userName: string;

  login: (user: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userName: "",

  login: (user: string) => {
    set({ isLoggedIn: true, userName: user });
  },

  logout: () => {
    set({ isLoggedIn: false, userName: "" });
  },
}));
