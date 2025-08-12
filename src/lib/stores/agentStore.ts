import { create } from "zustand";
import { mockApi } from "@/lib/mock-api";
import type { Agent, AgentSettings, AgentStatus, ChatMessage, ChatSession, Customer } from "@/lib/types";

interface AgentState {
  agent: Agent | null;
  sessions: ChatSession[];
  customers: Customer[];
  settings: AgentSettings | null;
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchAgentData: (agentId: string) => Promise<void>;
  setActiveSessionId: (sessionId: string | null) => void;
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  updateStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  updateProfile: (agentId: string, updates: { name?: string; avatar?: string }) => Promise<void>;
  updateSettings: (agentId: string, settings: AgentSettings) => Promise<void>;
  pollSessionUpdates: (sessionId: string) => Promise<void>;
}

// Helper to fetch and update a single session
async function _fetchSession(sessionId: string, set: (fn: (state: AgentState) => Partial<AgentState>) => void) {
    const updatedSession = await mockApi.getSessionUpdates(sessionId);
    if (updatedSession) {
        set(state => ({
            sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        }));
    }
}


export const useAgentStore = create<AgentState>((set, get) => ({
  agent: null,
  sessions: [],
  customers: [],
  settings: null,
  activeSessionId: null,
  isLoading: false,
  error: null,

  fetchAgentData: async (agentId) => {
    set({ isLoading: true });
    try {
      const data = await mockApi.getAgentData(agentId);
      if (data) {
        set({
          agent: data.agent,
          sessions: data.sessions,
          customers: data.customers,
          settings: data.settings,
          isLoading: false,
          activeSessionId: data.sessions.find(s => s.status === 'active')?.id || data.sessions[0]?.id || null,
        });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch agent data", isLoading: false });
    }
  },
  setActiveSessionId: (sessionId) => {
    set({ activeSessionId: sessionId });
  },
  sendMessage: async (sessionId, text) => {
    const message: ChatMessage = {
        id: '', // will be set by mock api
        text,
        sender: 'agent',
        timestamp: new Date().toISOString(),
        agentId: get().agent?.id,
    }
    // Send the message via API
    await mockApi.sendMessage(sessionId, message);
    // Fetch the updated session from the single source of truth (the API)
    await _fetchSession(sessionId, set);
  },
  updateStatus: async (agentId, status) => {
    const updatedAgent = await mockApi.updateAgentStatus(agentId, status);
    if(updatedAgent) {
        set({ agent: updatedAgent });
    }
  },
  updateProfile: async (agentId, updates) => {
    const updatedAgent = await mockApi.updateAgentProfile(agentId, updates);
    if(updatedAgent) {
        set({ agent: updatedAgent });
    }
  },
  updateSettings: async (agentId, settings) => {
    const updatedSettings = await mockApi.updateAgentSettings(agentId, settings);
    if(updatedSettings) {
        set({ settings: updatedSettings });
    }
  },
  pollSessionUpdates: async (sessionId: string) => {
    // This function can now leverage the same helper
    await _fetchSession(sessionId, set);
  },
}));
