import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SubscriptionTier } from "@/types/billing";

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  locale: "fr" | "en";
  role: "owner" | "collaborator" | "observer";
  companyId?: string;
  subscriptionTier: SubscriptionTier;
  onboardingCompleted: boolean;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "diagoptim-user" }
  )
);
