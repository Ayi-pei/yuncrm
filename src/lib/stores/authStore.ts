import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockApi } from "@/lib/mock-api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      login: async (key) => {
        set({ isLoading: true, error: null });
        try {
          const user = await mockApi.loginWithKey(key);
          if (user) {
            set({ user, isLoading: false });
            return true;
          } else {
            set({ error: `密钥无效、过期或未激活: ${key}`, isLoading: false });
            return false;
          }
        } catch (e) {
          const error = e instanceof Error ? e.message : "An unknown error occurred.";
          set({ error, isLoading: false });
          return false;
        }
      },
      logout: () => {
        set({ user: null });
      },
      updateCurrentUser: (updates) => {
        const currentUser = get().user;
        if(currentUser) {
            set({ user: { ...currentUser, ...updates } });
        }
      }
    }),
    {
      name: "agentverse-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
