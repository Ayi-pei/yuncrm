import { create } from "zustand";
import { mockApi } from "@/lib/mock-api";
import type { AccessKey, User, UserRole } from "@/lib/types";

interface AdminState {
  dashboardData: {
    totalAgents: number;
    onlineAgents: number;
    totalKeys: number;
    activeKeys: number;
  } | null;
  keys: AccessKey[];
  agents: User[];
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  fetchKeys: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  createKey: (data: Partial<Omit<AccessKey, 'id' | 'key' | 'createdAt'>>) => Promise<AccessKey | null>;
  updateKey: (id: string, updates: Partial<AccessKey>) => Promise<AccessKey | null>;
  deleteKey: (id: string) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  dashboardData: null,
  keys: [],
  agents: [],
  isLoading: false,
  error: null,
  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const data = await mockApi.getDashboardData();
      set({ dashboardData: data, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch dashboard data", isLoading: false });
    }
  },
  fetchKeys: async () => {
    set({ isLoading: true });
    try {
      const keys = await mockApi.getAccessKeys();
      set({ keys, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch keys", isLoading: false });
    }
  },
  fetchAgents: async () => {
    set({ isLoading: true });
    try {
      const agents = await mockApi.getAgents();
      set({ agents, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch agents", isLoading: false });
    }
  },
  createKey: async (data) => {
    try {
        const newKey = await mockApi.createAccessKey(data);
        set(state => ({ keys: [...state.keys, newKey].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) }));
        return newKey;
    } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to create key" });
        return null;
    }
  },
  updateKey: async (id, updates) => {
    try {
        const updatedKey = await mockApi.updateAccessKey(id, updates);
        if(updatedKey) {
            set(state => ({
                keys: state.keys.map(k => k.id === id ? updatedKey : k)
            }));
        }
        return updatedKey;
    } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to update key" });
        return null;
    }
  },
  deleteKey: async (id) => {
    try {
        const success = await mockApi.deleteAccessKey(id);
        if(success) {
            set(state => ({
                keys: state.keys.filter(k => k.id !== id)
            }));
        }
        return success;
    } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to delete key" });
        return false;
    }
  }
}));
