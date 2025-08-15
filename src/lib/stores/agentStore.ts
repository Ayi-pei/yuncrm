
import { create } from "zustand";
import { mockApi } from "@/lib/mock-api";
import type { AccessKey, Agent, AgentSettings, AgentStatus, ChatMessage, ChatSession, Customer, FileChatMessage, TextChatMessage } from "@/lib/types";

interface AgentState {
  agent: Agent | null;
  sessions: ChatSession[];
  customers: Customer[];
  settings: AgentSettings | null;
  activeSessionId: string | null;
  isLoading: boolean;
  isExtendingKey: boolean;
  error: string | null;
  key: AccessKey | null;
  shouldInvalidateAliases: boolean;


  fetchAgentData: (agentId: string) => Promise<void>;
  setActiveSessionId: (sessionId: string | null) => void;
  sendMessage: (sessionId: string, message: Omit<TextChatMessage | FileChatMessage, 'id' | 'timestamp' | 'sender' | 'agentId'>) => Promise<void>;
  updateStatus: (agentId: string, status: AgentStatus) => Promise<void>;
  updateProfile: (agentId: string, updates: { name?: string; avatar?: string }) => Promise<void>;
  updateSettings: (agentId: string, settings: AgentSettings) => Promise<void>;
  pollSessionUpdates: (sessionId: string) => Promise<void>;
  extendKey: (agentId: string, newKeyString: string) => Promise<boolean>;
  blockCustomer: (ipAddress: string) => void;
  unblockCustomer: (ipAddress: string) => void;
  deleteCustomer: (customerId: string) => void;
  archiveSession: (sessionId: string) => Promise<void>;
  unarchiveSession: (sessionId: string) => Promise<void>;
  sendFileMessage: (sessionId: string, file: File) => Promise<void>;
  invalidateAliases: () => void;
  aliasesInvalidated: () => void;
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
  isExtendingKey: false,
  error: null,
  key: null,
  shouldInvalidateAliases: false,


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
          key: data.key,
          isLoading: false,
          activeSessionId: data.sessions.find(s => s.status === 'active')?.id || data.sessions.find(s => s.status === 'pending')?.id || null,
        });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to fetch agent data", isLoading: false });
    }
  },
  setActiveSessionId: (sessionId) => {
    const customerId = get().sessions.find(s => s.id === sessionId)?.customerId;
    if (customerId) {
        const isBlocked = get().settings?.blockedIps.includes(get().customers.find(c => c.id === customerId)?.ipAddress || "");
        if (isBlocked) {
             set({ activeSessionId: sessionId, error: "This customer is blocked." });
             return;
        }
    }
    set({ activeSessionId: sessionId, error: null });
  },
  sendMessage: async (sessionId, messageData) => {
    const message: ChatMessage = {
        id: '', // will be set by mock api
        ...messageData,
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
  extendKey: async (agentId, newKeyString) => {
    set({ isExtendingKey: true, error: null });
    try {
        const updatedKey = await mockApi.extendAgentKey(agentId, newKeyString);
        if (updatedKey) {
            set({ key: updatedKey, isExtendingKey: false, shouldInvalidateAliases: true });
            return true;
        }
        set({ isExtendingKey: false });
        return false;
    } catch (e) {
        set({ error: e instanceof Error ? e.message : "Failed to extend key", isExtendingKey: false });
        return false;
    }
  },
  blockCustomer: (ipAddress) => {
    set(state => {
      if (!state.settings || state.settings.blockedIps.includes(ipAddress)) return {};
      const newSettings = {
        ...state.settings,
        blockedIps: [...state.settings.blockedIps, ipAddress],
      };
      mockApi.updateAgentSettings(state.agent!.id, newSettings);
      return { settings: newSettings };
    });
  },
  unblockCustomer: (ipAddress) => {
    set(state => {
      if (!state.settings) return {};
      const newSettings = {
        ...state.settings,
        blockedIps: state.settings.blockedIps.filter(ip => ip !== ipAddress),
      };
      mockApi.updateAgentSettings(state.agent!.id, newSettings);
      return { settings: newSettings };
    });
  },
  deleteCustomer: (customerId) => {
    set(state => {
        const sessionsToRemove = state.sessions.filter(s => s.customerId === customerId).map(s => s.id);
        
        const newSessions = state.sessions.filter(s => s.customerId !== customerId);
        const newCustomers = state.customers.filter(c => c.id !== customerId);
        
        let newActiveSessionId = state.activeSessionId;
        if(sessionsToRemove.includes(state.activeSessionId || '')) {
            newActiveSessionId = newSessions[0]?.id || null;
        }

        mockApi.deleteCustomer(customerId);

        return {
            sessions: newSessions,
            customers: newCustomers,
            activeSessionId: newActiveSessionId
        }
    });
  },
  archiveSession: async (sessionId) => {
    const updatedSession = await mockApi.updateSessionStatus(sessionId, 'archived');
    if (updatedSession) {
      set(state => {
        const otherSessions = state.sessions.filter(s => s.status !== 'archived' && s.id !== sessionId);
        return {
          sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
          activeSessionId: otherSessions[0]?.id || null,
        }
      });
    }
  },
  unarchiveSession: async (sessionId) => {
    const updatedSession = await mockApi.updateSessionStatus(sessionId, 'active');
    if(updatedSession) {
      set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        activeSessionId: sessionId,
      }));
    }
  },
  sendFileMessage: async (sessionId, file) => {
    const agentId = get().agent?.id;
    if (!agentId) return;

    // 1. Create a temporary message and send to API to get a real ID
    const tempFileMessage: Omit<FileChatMessage, 'id'> = {
        type: 'file',
        sender: 'agent',
        agentId: agentId,
        timestamp: new Date().toISOString(),
        file: {
            name: file.name,
            size: file.size,
            progress: 0,
        }
    };
    
    // This will add the message to the mock API's session and return it with an ID
    const persistedMessage = await mockApi.sendMessage(sessionId, tempFileMessage as FileChatMessage) as FileChatMessage;
    
    // 2. Add the message with its new ID to the local state
    set(state => ({
        sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, messages: [...s.messages, persistedMessage] } : s
        )
    }));

    // 3. Simulate upload progress on the now-persisted message
    const interval = setInterval(() => {
        set(state => {
            const currentSession = state.sessions.find(s => s.id === sessionId);
            if (!currentSession) {
                clearInterval(interval);
                return state;
            }
            
            const messageToUpdate = currentSession.messages.find(m => m.id === persistedMessage.id) as FileChatMessage | undefined;
            if (!messageToUpdate) {
                clearInterval(interval);
                return state;
            }

            const currentProgress = messageToUpdate.file.progress;
            const nextProgress = Math.min(currentProgress + Math.random() * 25, 100);
            
            const updatedMessage = {
                ...messageToUpdate,
                file: { ...messageToUpdate.file, progress: nextProgress }
            };

            if (nextProgress >= 100) {
                clearInterval(interval);
            }
            
            return {
                ...state,
                sessions: state.sessions.map(s => 
                    s.id === sessionId ? {
                        ...s,
                        messages: s.messages.map(m => m.id === persistedMessage.id ? updatedMessage : m)
                    } : s
                )
            };
        });
    }, 500);
  },
  invalidateAliases: () => set({ shouldInvalidateAliases: true }),
  aliasesInvalidated: () => set({ shouldInvalidateAliases: false }),
}));
