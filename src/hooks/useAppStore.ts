import { create } from "zustand";

type AppStore = {
  isNavigationReady: boolean;
  setNavigationReady: (ready: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isNavigationReady: true,
  setNavigationReady: (ready) => set({ isNavigationReady: ready }),
}));
