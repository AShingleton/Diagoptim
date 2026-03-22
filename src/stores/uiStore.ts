import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  theme: "light" | "dark" | "system";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  theme: "system",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
