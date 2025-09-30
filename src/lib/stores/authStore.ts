import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  getAuthHeader: () => { Authorization: string } | {};
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
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          });
          const data = await res.json();

          if (res.ok && data?.success && data?.data) {
            set({ user: data.data as User, isLoading: false });
            return true;
          }

          const errMsg = data?.error || `密钥无效、过期或未激活: ${key}`;
          set({ error: errMsg, isLoading: false });
          return false;
        } catch (e) {
          const error =
            e instanceof Error ? e.message : "An unknown error occurred.";
          set({ error, isLoading: false });
          return false;
        }
      },
      logout: () => {
        set({ user: null });
      },
      updateCurrentUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      getAuthHeader: () => {
        const { user } = get();
        return user?.id ? { Authorization: `Bearer ${user.id}` } : {};
      },
    }),
    {
      name: "agentverse-auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
