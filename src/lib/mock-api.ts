// Simulates a backend API, managing all data in-memory.
import {
  AccessKey,
  Agent,
  AgentSettings,
  AgentStatus,
  ChatMessage,
  ChatSession,
  Customer,
  QuickReply,
  User,
  UserRole,
} from "./types";
import { ADMIN_KEY } from "./constants";

// --- IN-MEMORY DATABASE ---

let accessKeys: AccessKey[] = [
  {
    id: "key-admin-01",
    key: ADMIN_KEY,
    role: "admin",
    name: "Default Admin",
    status: "active",
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  },
  {
    id: "key-agent-01",
    key: "AGENT-ALICE-123",
    role: "agent",
    name: "Alice",
    status: "active",
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  },
  {
    id: "key-agent-02",
    key: "AGENT-BOB-456",
    role: "agent",
    name: "Bob",
    status: "active",
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  },
  {
    id: "key-agent-03",
    key: "AGENT-CHARLIE-789",
    role: "agent",
    name: "Charlie",
    status: "suspended",
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  },
];

let agents: Agent[] = [
  {
    id: "agent-01",
    name: "Alice",
    avatar: "https://i.pravatar.cc/150?u=alice",
    status: "online",
    shareId: "chat-with-alice",
    sessionLoad: 1,
    maxLoad: 5,
    accessKeyId: "key-agent-01",
  },
  {
    id: "agent-02",
    name: "Bob",
    avatar: "https://i.pravatar.cc/150?u=bob",
    status: "busy",
    shareId: "talk-to-bob",
    sessionLoad: 5,
    maxLoad: 5,
    accessKeyId: "key-agent-02",
  },
  {
    id: "agent-03",
    name: "Charlie",
    avatar: "https://i.pravatar.cc/150?u=charlie",
    status: "offline",
    shareId: "help-from-charlie",
    sessionLoad: 0,
    maxLoad: 5,
    accessKeyId: "key-agent-03",
  },
];

let customers: Customer[] = [
  {
    id: "cust-01",
    name: "Visitor 1",
    avatar: "https://i.pravatar.cc/150?u=visitor1",
    ipAddress: "123.45.67.89",
    device: "Chrome on macOS",
    location: "New York, USA",
    firstSeen: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "cust-02",
    name: "Visitor 2",
    avatar: "https://i.pravatar.cc/150?u=visitor2",
    ipAddress: "98.76.54.32",
    device: "Safari on iOS",
    location: "London, UK",
    firstSeen: new Date(Date.now() - 86400000).toISOString(),
  },
];

let chatSessions: ChatSession[] = [
  {
    id: "session-01",
    customerId: "cust-01",
    agentId: "agent-01",
    status: "active",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: "msg-01",
        text: "Hello, I need help with my order.",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      },
      {
        id: "msg-02",
        text: "Hi there! I can certainly help with that. What is your order number?",
        sender: "agent",
        agentId: "agent-01",
        timestamp: new Date(Date.now() - 60000 * 4).toISOString(),
      },
    ],
  },
  {
    id: "session-02",
    customerId: "cust-02",
    agentId: "agent-01",
    status: "pending",
    createdAt: new Date(Date.now() - 60000 * 10).toISOString(),
    messages: [
      {
        id: "msg-03",
        text: "I have a question about pricing.",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
      },
    ],
  },
];

let agentSettings: Record<string, AgentSettings> = {
    "agent-01": {
        welcomeMessage: "Welcome! How can I help you today?",
        quickReplies: [
            { id: "qr-1", shortcut: "/thanks", message: "You're welcome! Is there anything else I can help with?" },
            { id: "qr-2", shortcut: "/np", message: "No problem at all!" },
        ],
        blockedIps: [],
    },
    "agent-02": {
        welcomeMessage: "Hello, thanks for reaching out.",
        quickReplies: [],
        blockedIps: ["1.2.3.4"],
    },
    "agent-03": {
        welcomeMessage: "Hi there!",
        quickReplies: [],
        blockedIps: [],
    }
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// --- API FUNCTIONS ---

export const mockApi = {
  async loginWithKey(key: string): Promise<User | null> {
    await delay(500);
    const accessKey = accessKeys.find((k) => k.key === key && k.status === 'active');
    if (!accessKey) {
      return null;
    }
    accessKey.lastUsedAt = new Date().toISOString();

    if (accessKey.role === 'admin') {
      return { id: 'admin-user', role: 'admin', name: 'Admin' };
    }

    const agent = agents.find((a) => a.accessKeyId === accessKey.id);
    if (agent) {
      return { id: agent.id, role: 'agent', name: agent.name, avatar: agent.avatar, shareId: agent.shareId, status: agent.status };
    }

    return null;
  },

  // --- Admin Functions ---
  async getDashboardData() {
    await delay(500);
    const totalAgents = agents.length;
    const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy').length;
    const totalKeys = accessKeys.length;
    const activeKeys = accessKeys.filter(k => k.status === 'active').length;
    return { totalAgents, onlineAgents, totalKeys, activeKeys };
  },

  async getAccessKeys(): Promise<AccessKey[]> {
    await delay(300);
    return [...accessKeys];
  },

  async createAccessKey(data: { name: string; role: UserRole }): Promise<AccessKey> {
    await delay(500);
    const newKey: AccessKey = {
      id: `key-${Date.now()}`,
      key: `${data.role.toUpperCase()}-${data.name.toUpperCase().replace(/\s/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      role: data.role,
      name: data.name,
      status: "active",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    accessKeys.push(newKey);

    if (newKey.role === 'agent') {
        const newAgent: Agent = {
            id: `agent-${Date.now()}`,
            name: newKey.name,
            avatar: `https://i.pravatar.cc/150?u=${newKey.id}`,
            status: "offline",
            shareId: `chat-with-${newKey.name.toLowerCase().replace(/\s/g, "-")}`,
            sessionLoad: 0,
            maxLoad: 5,
            accessKeyId: newKey.id,
        }
        agents.push(newAgent);
        agentSettings[newAgent.id] = { welcomeMessage: "Welcome!", quickReplies: [], blockedIps: [] };
    }

    return newKey;
  },

  async updateAccessKey(id: string, updates: Partial<AccessKey>): Promise<AccessKey | null> {
    await delay(500);
    const keyIndex = accessKeys.findIndex((k) => k.id === id);
    if (keyIndex === -1) return null;
    
    accessKeys[keyIndex] = { ...accessKeys[keyIndex], ...updates };
    
    const agent = agents.find(a => a.accessKeyId === id);
    if(agent && updates.name) {
        agent.name = updates.name;
    }
    if (agent && updates.status === 'suspended') {
        agent.status = 'offline';
    }

    return accessKeys[keyIndex];
  },

  async deleteAccessKey(id: string): Promise<boolean> {
    await delay(500);
    const initialLength = accessKeys.length;
    accessKeys = accessKeys.filter(k => k.id !== id);
    const agentToDelete = agents.find(a => a.accessKeyId === id);
    if(agentToDelete) {
        agents = agents.filter(a => a.id !== agentToDelete.id);
        chatSessions = chatSessions.filter(s => s.agentId !== agentToDelete.id);
        delete agentSettings[agentToDelete.id];
    }
    return accessKeys.length < initialLength;
  },

  async getAgents(): Promise<Agent[]> {
    await delay(300);
    return [...agents];
  },

  // --- Agent Functions ---
  async getAgentData(agentId: string) {
    await delay(500);
    const agent = agents.find(a => a.id === agentId);
    if(!agent) return null;
    
    const sessions = chatSessions.filter(s => s.agentId === agentId && s.status !== 'closed');
    const customerIds = sessions.map(s => s.customerId);
    const relevantCustomers = customers.filter(c => customerIds.includes(c.id));
    const settings = agentSettings[agentId];

    return { agent, sessions, customers: relevantCustomers, settings };
  },

  async sendMessage(sessionId: string, message: ChatMessage): Promise<ChatMessage> {
    await delay(250);
    const session = chatSessions.find(s => s.id === sessionId);
    if(!session) throw new Error("Session not found");
    
    const newMessage = { ...message, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() };
    session.messages.push(newMessage);
    
    // Simulate agent response
    if(message.sender === 'customer') {
        setTimeout(() => {
            const agentResponse: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                text: "Thanks for your message. An agent will be with you shortly.",
                sender: 'agent',
                timestamp: new Date().toISOString(),
                agentId: session.agentId,
            }
            session.messages.push(agentResponse);
        }, 2000);
    }

    return newMessage;
  },

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent | null> {
    await delay(200);
    const agent = agents.find(a => a.id === agentId);
    if(agent) {
        agent.status = status;
        return { ...agent };
    }
    return null;
  },
  
  async updateAgentProfile(agentId: string, updates: { name?: string, avatar?: string }): Promise<Agent | null> {
    await delay(400);
    const agent = agents.find(a => a.id === agentId);
    if(agent) {
        if(updates.name) agent.name = updates.name;
        if(updates.avatar) agent.avatar = updates.avatar;
        return { ...agent };
    }
    return null;
  },

  async updateAgentSettings(agentId: string, settings: AgentSettings): Promise<AgentSettings | null> {
    await delay(400);
    if(agentSettings[agentId]) {
        agentSettings[agentId] = settings;
        return { ...settings };
    }
    return null;
  },

  // --- Visitor Functions ---
  async getChatDataForVisitor(shareId: string) {
      await delay(500);
      const agent = agents.find(a => a.shareId === shareId);
      if(!agent) return null;

      // For simplicity, we'll create a new customer and session for each visit.
      // In a real app, you'd use cookies or localStorage to identify returning visitors.
      const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: `Visitor ${Math.floor(Math.random() * 1000)}`,
          avatar: `https://i.pravatar.cc/150?u=visitor${Date.now()}`,
          ipAddress: "192.168.1.100",
          device: "Chrome on Windows",
          location: "San Francisco, USA",
          firstSeen: new Date().toISOString()
      };
      customers.push(newCustomer);

      const welcomeMessage = agentSettings[agent.id]?.welcomeMessage || "Hello! How can I help you?";
      
      const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          customerId: newCustomer.id,
          agentId: agent.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          messages: [{
            id: `msg-${Date.now()}`,
            text: welcomeMessage,
            sender: 'agent',
            agentId: agent.id,
            timestamp: new Date().toISOString(),
          }]
      };
      chatSessions.push(newSession);

      return {
          agent: { name: agent.name, avatar: agent.avatar, status: agent.status },
          session: newSession,
          customer: newCustomer,
      };
  },
  
  async getSessionUpdates(sessionId: string) {
      await delay(1000);
      const session = chatSessions.find(s => s.id === sessionId);
      return session || null;
  }
};
