
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
import { add, differenceInMilliseconds } from 'date-fns';


const getFutureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();


// --- IN-MEMORY DATABASE ---

let accessKeys: AccessKey[] = [
  {
    id: "key-admin-01",
    key: ADMIN_KEY,
    name: "默认管理员",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: null, // Admins don't expire
    key_type: "admin",
  },
  {
    id: "key-agent-01",
    key: "AGENT-ALICE-123",
    name: "小爱",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: getFutureDate(30),
    key_type: "agent",
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "key-agent-02",
    key: "AGENT-BOB-456",
    name: "小博",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: getFutureDate(7),
    key_type: "agent",
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "key-agent-03",
    key: "AGENT-CHARLIE-789",
    name: "小驰",
    status: "suspended",
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    key_type: "agent",
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: 'key-agent-04',
    key: 'AGENT-UNUSED-001',
    name: '备用密钥1',
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: getFutureDate(15),
    key_type: "agent",
    lastUsedAt: null,
  },
];

let agents: Agent[] = [
  {
    id: "agent-01",
    name: "小爱",
    avatar: "https://i.pravatar.cc/150?u=alice",
    status: "online",
    shareId: "chat-with-alice",
    accessKeyId: "key-agent-01",
    lastActiveAt: new Date().toISOString(),
    role: "agent",
  },
  {
    id: "agent-02",
    name: "小博",
    avatar: "https://i.pravatar.cc/150?u=bob",
    status: "busy",
    shareId: "talk-to-bob",
    accessKeyId: "key-agent-02",
    lastActiveAt: new Date().toISOString(),
    role: "agent",
  },
  {
    id: "agent-03",
    name: "小驰",
    avatar: "https://i.pravatar.cc/150?u=charlie",
    status: "offline",
    shareId: "help-from-charlie",
    accessKeyId: "key-agent-03",
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    role: "agent",
  },
];

let customers: Customer[] = [
  {
    id: "cust-01",
    name: "访客 1",
    avatar: "https://i.pravatar.cc/150?u=visitor1",
    ipAddress: "123.45.67.89",
    device: "Chrome on macOS",
    location: "美国，纽约",
    firstSeen: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "cust-02",
    name: "访客 2",
    avatar: "https://i.pravatar.cc/150?u=visitor2",
    ipAddress: "98.76.54.32",
    device: "Safari on iOS",
    location: "英国，伦敦",
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
        text: "你好，我需要订单方面的帮助。",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      },
      {
        id: "msg-02",
        text: "您好！我当然可以帮助您。请问您的订单号是多少？",
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
        text: "我有一个关于价格的问题。",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
      },
    ],
  },
];

let agentSettings: Record<string, AgentSettings> = {
    "agent-01": {
        welcomeMessage: "欢迎！今天有什么可以帮您的吗？",
        quickReplies: [
            { id: "qr-1", shortcut: "你好", message: "您好，很高兴为您服务！" },
            { id: "qr-2", shortcut: "感谢", message: "不客气！还有其他可以帮助您的吗？" },
        ],
        blockedIps: [],
    },
    "agent-02": {
        welcomeMessage: "您好，感谢您的联系。",
        quickReplies: [],
        blockedIps: ["1.2.3.4"],
    },
    "agent-03": {
        welcomeMessage: "您好！",
        quickReplies: [],
        blockedIps: [],
    }
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;


// --- API FUNCTIONS ---

export const mockApi = {
  async loginWithKey(key: string): Promise<User | null> {
    await delay(500);
    const accessKey = accessKeys.find((k) => k.key === key && k.status === 'active');
    if (!accessKey) {
      return null;
    }
    
    // Check for expiration
    if (accessKey.expiresAt && new Date(accessKey.expiresAt) < new Date()) {
      accessKey.status = 'suspended'; // Mark as suspended if expired
      return null;
    }

    accessKey.lastUsedAt = new Date().toISOString();

    if (accessKey.key_type === 'admin') {
      return { id: 'admin-user', role: 'admin', name: '管理员', status: 'online', lastActiveAt: new Date().toISOString() };
    }

    const agent = agents.find((a) => a.accessKeyId === accessKey.id);
    if (agent) {
       agent.status = 'online';
       agent.lastActiveAt = new Date().toISOString();
       return { id: agent.id, role: 'agent', name: agent.name, avatar: agent.avatar, shareId: agent.shareId, status: agent.status, lastActiveAt: agent.lastActiveAt };
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
    // Add usageCount for demonstration
    return [...accessKeys].map(k => ({...k, usageCount: k.lastUsedAt ? 1 : 0, maxUsage: 1 })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createAccessKey(data: { name: string; key_type: UserRole, notes?: string }): Promise<AccessKey> {
    await delay(500);
    const newKey: AccessKey = {
      id: generateId('key'),
      key: `${data.key_type.toUpperCase()}-${data.name.toUpperCase().replace(/\s/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      key_type: data.key_type,
      name: data.name,
      notes: data.notes,
      status: "active",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: data.key_type === 'agent' ? getFutureDate(30) : null,
    };
    accessKeys.push(newKey);

    if (newKey.key_type === 'agent') {
        const agentId = generateId('agent');
        const newAgent: Agent = {
            id: agentId,
            name: newKey.name,
            avatar: `https://i.pravatar.cc/150?u=${agentId}`,
            status: "offline",
            shareId: `chat-with-${newKey.name.toLowerCase().replace(/\s/g, "-")}-${generateId('')}`,
            accessKeyId: newKey.id,
            role: 'agent',
            lastActiveAt: new Date().toISOString(),
        }
        agents.push(newAgent);
        agentSettings[newAgent.id] = { welcomeMessage: "欢迎!", quickReplies: [], blockedIps: [] };
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

  async getAgents(): Promise<User[]> {
    await delay(300);
    return [...agents].map(a => ({
        id: a.id,
        name: a.name,
        avatar: a.avatar,
        role: a.role,
        status: a.status,
        lastActiveAt: a.lastActiveAt,
        accessKey: accessKeys.find(k => k.id === a.accessKeyId)?.key
    })).sort((a,b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
  },

  // --- Agent Functions ---
  async getAgentData(agentId: string) {
    await delay(500);
    const agent = agents.find(a => a.id === agentId);
    if(!agent) return null;
    
    const sessions = chatSessions.filter(s => s.agentId === agentId);
    const customerIds = sessions.map(s => s.customerId);
    const relevantCustomers = customers.filter(c => customerIds.includes(c.id));
    const settings = agentSettings[agentId];
    const key = accessKeys.find(k => k.id === agent.accessKeyId) || null;

    return { agent, sessions, customers: relevantCustomers, settings, key };
  },

  async sendMessage(sessionId: string, message: ChatMessage): Promise<ChatMessage> {
    await delay(250);
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const newMessage = { ...message, id: generateId('msg'), timestamp: new Date().toISOString() };
    
    if (!session.messages.some(m => m.id === newMessage.id)) {
        session.messages.push(newMessage);
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
  
  async updateSessionStatus(sessionId: string, status: ChatSession['status']): Promise<ChatSession | null> {
    await delay(200);
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = status;
      return { ...session };
    }
    return null;
  },

  async extendAgentKey(agentId: string, newKeyString: string): Promise<AccessKey | null> {
      await delay(600);
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
          throw new Error("坐席不存在。");
      }

      const currentKey = accessKeys.find(k => k.id === agent.accessKeyId);
      if (!currentKey) {
          throw new Error("当前坐席密钥不存在。");
      }

      const newKey = accessKeys.find(k => k.key === newKeyString);
      if (!newKey) {
          throw new Error("提供的新密钥无效。");
      }
      if (newKey.key_type !== 'agent' || newKey.lastUsedAt !== null) {
          throw new Error("该密钥不可用（可能已被使用、暂停或角色不符）。");
      }
      if (newKey.status !== 'active') {
          newKey.status = 'active'; // Activate it for extension
      }
      if (!newKey.expiresAt) {
          throw new Error("该密钥没有设置到期时间。");
      }

      const now = new Date();
      const newKeyExpiresAt = new Date(newKey.expiresAt);
      if (newKeyExpiresAt < now) {
          throw new Error("该密钥已过期。");
      }
      
      const timeToAdd = differenceInMilliseconds(newKeyExpiresAt, now);
      
      const currentKeyExpiresAt = currentKey.expiresAt ? new Date(currentKey.expiresAt) : now;
      const newExpiryDate = add(currentKeyExpiresAt < now ? now : currentKeyExpiresAt, { milliseconds: timeToAdd });
      
      currentKey.expiresAt = newExpiryDate.toISOString();
      newKey.status = 'used';
      newKey.lastUsedAt = now.toISOString();

      return currentKey;
  },
  
  async deleteCustomer(customerId: string): Promise<boolean> {
      await delay(300);
      const initialCustomerCount = customers.length;
      customers = customers.filter(c => c.id !== customerId);
      chatSessions = chatSessions.filter(s => s.customerId !== customerId);
      return customers.length < initialCustomerCount;
  },


  // --- Visitor Functions ---
  async getChatDataForVisitor(shareId: string) {
      await delay(500);
      const agent = agents.find(a => a.shareId === shareId && a.status !== 'offline');
      if(!agent) return null;

      const customerId = generateId('cust');
      const newCustomer: Customer = {
          id: customerId,
          name: `访客 ${Math.floor(Math.random() * 1000)}`,
          avatar: `https://i.pravatar.cc/150?u=${customerId}`,
          ipAddress: "192.168.1.100",
          device: "Chrome on Windows",
          location: "美国，旧金山",
          firstSeen: new Date().toISOString()
      };
      customers.push(newCustomer);

      const welcomeMessage = agentSettings[agent.id]?.welcomeMessage || "您好！有什么可以帮您的吗？";
      
      const newSession: ChatSession = {
          id: generateId('session'),
          customerId: newCustomer.id,
          agentId: agent.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          messages: [{
            id: generateId('msg'),
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
