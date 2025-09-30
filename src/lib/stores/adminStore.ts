import { create } from "zustand";
// Note: Use server API routes to keep server-side memory authoritative

import type { AccessKey, User } from "@/lib/types";

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
  createKey: (
    data: Partial<Omit<AccessKey, "id" | "key" | "createdAt">>
  ) => Promise<AccessKey | null>;
  updateKey: (
    id: string,
    updates: Partial<AccessKey>
  ) => Promise<AccessKey | null>;
  deleteKey: (id: string) => Promise<boolean>;
  updateAgent: (id: string, updates: Partial<User>) => Promise<User | null>; // 添加这个新函数
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
      const resp = await fetch("/api/admin/dashboard");
      const json = await resp.json();
      const data = resp.ok && json?.success ? json.data : null;
      if (!data)
        throw new Error(json?.error || "Failed to fetch dashboard data");
      set({ dashboardData: data, isLoading: false });
    } catch (e) {
      set({
        error:
          e instanceof Error ? e.message : "Failed to fetch dashboard data",
        isLoading: false,
      });
    }
  },
  fetchKeys: async () => {
    set({ isLoading: true });
    try {
      const resp = await fetch("/api/admin/keys");
      const json = await resp.json();
      if (!resp.ok || !json?.success)
        throw new Error(json?.error || "Failed to fetch keys");
      const keys = json.data as AccessKey[];
      set({ keys, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch keys",
        isLoading: false,
      });
    }
  },
  fetchAgents: async () => {
    set({ isLoading: true });
    try {
      const resp = await fetch("/api/admin/agents");
      const json = await resp.json();
      if (!resp.ok || !json?.success)
        throw new Error(json?.error || "Failed to fetch agents");
      const agents = json.data as User[];
      set({ agents, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch agents",
        isLoading: false,
      });
    }
  },
  createKey: async (data) => {
    try {
      const keyData = {
        name: data.name || "",
        key_type: data.key_type || "agent",
        notes: data.notes,
      };
      const resp = await fetch("/api/admin/create-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keyData),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success)
        throw new Error(json?.error || "Failed to create key");
      const newKey = json.data as AccessKey;
      if (newKey) {
        set((state) => ({
          keys: [...state.keys, newKey].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        }));
      }
      return newKey;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to create key" });
      return null;
    }
  },
  updateKey: async (id, updates) => {
    try {
      const resp = await fetch("/api/admin/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success)
        throw new Error(json?.error || "Failed to update key");
      const updatedKey = json.data as AccessKey;
      if (updatedKey) {
        set((state) => ({
          keys: state.keys.map((k: AccessKey) =>
            k.id === id ? updatedKey : k
          ),
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
      const resp = await fetch(`/api/admin/keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success)
        throw new Error(json?.error || "Failed to delete key");
      const success = true;
      if (success) {
        set((state) => ({
          keys: state.keys.filter((k: AccessKey) => k.id !== id),
        }));
      }
      return success;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to delete key" });
      return false;
    }
  },
  updateAgent: async (id, updates) => {
    try {
      // 这里应该调用API更新agent，但目前mock-api中没有提供这个功能
      // 我们直接在store中更新数据
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === id ? { ...agent, ...updates } : agent
        ),
      }));
      return get().agents.find((agent) => agent.id === id) || null;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to update agent" });
      return null;
    }
  },

}));
