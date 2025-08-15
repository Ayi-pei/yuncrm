
// Simulates a backend API, managing all data in-memory.
import {
  AccessKey,
  Agent,
  AgentSettings,
  AgentStatus,
  Alias,
  ChatMessage,
  ChatSession,
  Customer,
  QuickReply,
  User,
  UserRole,
} from "./types";
import { ADMIN_KEY } from "./constants";

// --- NEW KEY MANAGEMENT SYSTEM based on user's proposal ---

// 1. Memory Structure Design
const nanoid = (size = 16) => {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < size; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
};

interface KeyInfo {
  key: string;
  name: string;
  notes?: string;
  key_type: AccessKeyType;
  createdAt: string;
  userId?: string;
  expireAt: number; // timestamp
}

const keys: Record<string, KeyInfo> = {};
const shortLinks: Record<string, { shareId: string; expireAt: number }> = {};


// 2. Key Generation Logic
function getAlignedExpireAt(now = new Date()): number {
  const hours = now.getHours();
  const expire = new Date(now);
  if (hours >= 12) {
    // 12:00 PM onwards -> expires at 12:00 PM next day
     expire.setDate(expire.getDate() + 1);
     expire.setHours(12, 0, 0, 0);
  } else {
    // 00:00 AM - 11:59 AM -> expires at 12:00 PM same day
    expire.setHours(12, 0, 0, 0);
  }
  return expire.getTime();
}

function createKey(data: { name: string; key_type: UserRole; notes?: string }): KeyInfo {
    const key = `${data.key_type.toUpperCase()}-${nanoid(8)}`;
    const expireAt = getAlignedExpireAt();
    const keyInfo: KeyInfo = {
        key,
        expireAt,
        name: data.name,
        key_type: data.key_type,
        notes: data.notes,
        createdAt: new Date().toISOString(),
    };
    keys[keyInfo.key] = keyInfo;

    // Create a corresponding agent if it's an agent key and doesn't exist.
    if (keyInfo.key_type === 'agent' && !agents.some(a => a.name === keyInfo.name)) {
        const agentId = `agent-${nanoid(8)}`;
        const newAgent: Agent = {
            id: agentId,
            name: keyInfo.name,
            avatar: `https://i.pravatar.cc/150?u=${agentId}`,
            status: "offline",
            role: 'agent',
            lastActiveAt: new Date().toISOString(),
        };
        agents.push(newAgent);
        agentSettings[newAgent.id] = { welcomeMessages: ["欢迎!"], quickReplies: [], blockedIps: [] };
    }

    return keyInfo;
}

// 3. Key Binding Logic
function bindKeyToUser(userId: string, key: string): boolean {
  const keyInfo = keys[key];
  if (!keyInfo) return false;
  if (Date.now() > keyInfo.expireAt) return false;

  // Unbind any old key associated with this user
  for (const k in keys) {
    if (keys[k].userId === userId) {
      delete keys[k]; // Old key is invalidated
    }
  }
  
  // Unbind any user associated with this new key (shouldn't happen with current logic, but safe)
  if(keyInfo.userId && keyInfo.userId !== userId) {
      // This key is already bound to another user. Cannot rebind.
      return false;
  }

  // Bind the new key
  keyInfo.userId = userId;
  return true;
}

// 4. Short Link / Alias Logic
function generateShortLink(shareId: string, key: string): string | null {
    const token = nanoid(5);
    const keyInfo = keys[key];
    if (!keyInfo) return null;

    const expireAt = keyInfo.expireAt;
    shortLinks[token] = { shareId, expireAt };
    return token;
}

function resolveShortLink(token: string): string | null {
  const item = shortLinks[token];
  if (!item) return null;
  if (Date.now() > item.expireAt) {
    delete shortLinks[token];
    return null;
  }
  return item.shareId;
}

// 6. Automatic Cleanup
setInterval(() => {
  const now = Date.now();
  // Cleanup keys
  for (const k in keys) {
    if (keys[k].expireAt < now) {
      delete keys[k];
    }
  }
  // Cleanup short links
  for (const t in shortLinks) {
    if (shortLinks[t].expireAt < now) {
      delete shortLinks[t];
    }
  }
}, 60 * 1000); // Cleanup every minute


// --- IN-MEMORY DATABASE (Legacy parts) ---

// Initial admin key setup
keys[ADMIN_KEY] = {
    key: ADMIN_KEY,
    name: "默认管理员",
    key_type: "admin",
    expireAt: new Date().setFullYear(new Date().getFullYear() + 10), // 10 years from now
    createdAt: new Date().toISOString(),
};

let agents: Agent[] = [
  {
    id: "agent-01",
    name: "小爱",
    avatar: "https://i.pravatar.cc/150?u=alice",
    status: "online",
    lastActiveAt: new Date().toISOString(),
    role: "agent",
  },
  {
    id: "agent-02",
    name: "小博",
    avatar: "https://i.pravatar.cc/150?u=bob",
    status: "busy",
    lastActiveAt: new Date().toISOString(),
    role: "agent",
  },
  {
    id: "agent-03",
    name: "小驰",
    avatar: "https://i.pravatar.cc/150?u=charlie",
    status: "offline",
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    role: "agent",
  },
];
// Pre-bind some keys for initial setup
bindKeyToUser('agent-01', createKey({ name: '小爱', key_type: 'agent' }).key);
bindKeyToUser('agent-02', createKey({ name: '小博', key_type: 'agent' }).key);


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
        type: "text",
        text: "你好，我需要订单方面的帮助。",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      },
      {
        id: "msg-02",
        type: "text",
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
        type: 'text',
        text: "我有一个关于价格的问题。",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
      },
    ],
  },
];

let agentSettings: Record<string, AgentSettings> = {
    "agent-01": {
        welcomeMessages: ["欢迎！今天有什么可以帮您的吗？", "请随时提出您的问题。"],
        quickReplies: [
            { id: "qr-1", shortcut: "你好", message: "您好，很高兴为您服务！" },
            { id: "qr-2", shortcut: "感谢", message: "不客气！还有其他可以帮助您的吗？" },
        ],
        blockedIps: [],
    },
    "agent-02": {
        welcomeMessages: ["您好，感谢您的联系。"],
        quickReplies: [],
        blockedIps: ["1.2.3.4"],
    },
    "agent-03": {
        welcomeMessages: ["您好！"],
        quickReplies: [],
        blockedIps: [],
    }
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const generateChineseName = () => {
    const nameChars = "梦琪忆柳之桃慕青初夏沛菡傲珊曼文乐菱惜文香菡新柔语蓉海安夜蓉涵柏水桃醉蓝语琴从彤傲晴语兰又菱碧彤元霜怜梦紫寒妙彤曼易南蓮紫翠雨寒易烟如萱若南寻真晓亦向珊慕靈水凡".split('');
    let name = '';
    for (let i = 0; i < 4; i++) {
        name += nameChars[Math.floor(Math.random() * nameChars.length)];
    }
    return name;
};


// --- API FUNCTIONS (Refactored) ---

export const mockApi = {
  async loginWithKey(key: string): Promise<User | null> {
    await delay(500);
    const keyInfo = keys[key];
    
    if (!keyInfo || Date.now() > keyInfo.expireAt) {
      return null;
    }

    if (keyInfo.key_type === 'admin') {
      return { id: 'admin-user', role: 'admin', name: '管理员', status: 'online', lastActiveAt: new Date().toISOString() };
    }

    // For agents, a key must be bound to a user to be valid for login
    if (keyInfo.key_type === 'agent') {
        const agent = agents.find(a => a.id === keyInfo.userId);
        if (agent) {
           agent.status = 'online';
           agent.lastActiveAt = new Date().toISOString();
           return { id: agent.id, role: 'agent', name: agent.name, avatar: agent.avatar, shareId: agent.id, status: agent.status, lastActiveAt: agent.lastActiveAt };
        }
        // If key is not bound, it's a valid key but cannot be used to log in yet.
        // The user must be bound via the admin panel first. This logic is a bit different now.
        // For simplicity, we'll let `extendKey` handle the binding.
        // A fresh agent key isn't associated with anyone.
    }

    return null;
  },

  // --- Admin Functions ---
  async getDashboardData() {
    await delay(500);
    const totalAgents = agents.length;
    const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy').length;
    const totalKeys = Object.keys(keys).length;
    const activeKeys = Object.values(keys).filter(k => Date.now() <= k.expireAt).length;
    return { totalAgents, onlineAgents, totalKeys, activeKeys };
  },

  async getAccessKeys(): Promise<AccessKey[]> {
    await delay(300);
    // Adapt the new KeyInfo structure to the old AccessKey type for frontend compatibility
    return Object.values(keys).map(k => ({
        id: k.key,
        key: k.key,
        name: k.name,
        notes: k.notes,
        key_type: k.key_type,
        status: Date.now() > k.expireAt ? 'expired' : k.userId ? 'used' : 'active',
        createdAt: k.createdAt,
        expiresAt: new Date(k.expireAt).toISOString(),
        userId: k.userId,
        usageCount: k.userId ? 1 : 0,
        maxUsage: 1,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createAccessKey(data: { name: string; key_type: UserRole, notes?: string }): Promise<AccessKey> {
    await delay(500);
    const newKeyInfo = createKey(data);
    return {
        id: newKeyInfo.key,
        key: newKeyInfo.key,
        name: newKeyInfo.name,
        notes: newKeyInfo.notes,
        key_type: newKeyInfo.key_type,
        status: 'active',
        createdAt: newKeyInfo.createdAt,
        expiresAt: new Date(newKeyInfo.expireAt).toISOString(),
        usageCount: 0,
        maxUsage: 1,
    };
  },

  async updateAccessKey(id: string, updates: Partial<AccessKey>): Promise<AccessKey | null> {
    await delay(500);
    const keyInfo = keys[id];
    if (!keyInfo) return null;

    if (updates.name) keyInfo.name = updates.name;
    if (updates.notes) keyInfo.notes = updates.notes;
    
    // Status update is now derived, but we can simulate deletion via this
    if (updates.status === 'suspended') { // Using 'suspended' as a signal to delete
        delete keys[id];
        return null;
    }

    return {
        id: keyInfo.key,
        key: keyInfo.key,
        name: keyInfo.name,
        notes: keyInfo.notes,
        key_type: keyInfo.key_type,
        status: Date.now() > keyInfo.expireAt ? 'expired' : keyInfo.userId ? 'used' : 'active',
        createdAt: keyInfo.createdAt,
        expiresAt: new Date(keyInfo.expireAt).toISOString(),
        userId: keyInfo.userId,
    };
  },

  async deleteAccessKey(id: string): Promise<boolean> {
    await delay(500);
    if (keys[id]) {
      delete keys[id];
      return true;
    }
    return false;
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
        accessKey: Object.values(keys).find(k => k.userId === a.id)?.key
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
    const keyInfo = Object.values(keys).find(k => k.userId === agentId) || null;
    
    const key: AccessKey | null = keyInfo ? {
        id: keyInfo.key,
        key: keyInfo.key,
        name: keyInfo.name,
        notes: keyInfo.notes,
        key_type: keyInfo.key_type,
        status: Date.now() > keyInfo.expireAt ? 'expired' : 'used',
        createdAt: keyInfo.createdAt,
        expiresAt: new Date(keyInfo.expireAt).toISOString(),
        userId: keyInfo.userId,
    } : null;

    return { agent, sessions, customers: relevantCustomers, settings, key };
  },

  async sendMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    await delay(250);
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const newMessage = { ...message, id: generateId('msg'), timestamp: new Date().toISOString() } as ChatMessage;
    session.messages.push(newMessage);
    
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

  async extendAgentKey(agentId: string, newKeyString: string): Promise<boolean> {
     const agent = agents.find(a => a.id === agentId);
     if (!agent) throw new Error("坐席不存在。");

     // Invalidate all old short links for this agent
     for (const token in shortLinks) {
         if (shortLinks[token].shareId === agentId) {
             delete shortLinks[token];
         }
     }
     
     return bindKeyToUser(agentId, newKeyString);
  },
  
  async deleteCustomer(customerId: string): Promise<boolean> {
      await delay(300);
      const initialCustomerCount = customers.length;
      customers = customers.filter(c => c.id !== customerId);
      chatSessions = chatSessions.filter(s => s.customerId !== customerId);
      return customers.length < initialCustomerCount;
  },

  // --- Visitor & Alias Functions ---
  async getOrCreateAlias(agentId: string): Promise<Alias | null> {
    await delay(100);

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;
    
    const boundKey = Object.values(keys).find(k => k.userId === agentId);
    if (!boundKey || Date.now() > boundKey.expireAt) return null; // Agent has no valid key
    
    // Check for existing valid alias first
    const existingToken = Object.keys(shortLinks).find(token => {
        const link = shortLinks[token];
        return link.shareId === agentId && Date.now() <= link.expireAt;
    });

    if (existingToken) {
        return {
            token: existingToken,
            shareId: agentId,
            expireAt: new Date(shortLinks[existingToken].expireAt).toISOString(),
        };
    }
    
    const newToken = generateShortLink(agentId, boundKey.key);
    if(newToken){
         return {
            token: newToken,
            shareId: agentId,
            expireAt: new Date(boundKey.expireAt).toISOString(),
        };
    }

    return null; 
  },

  async getChatDataForVisitorByToken(token: string) {
      await delay(500);
      
      const agentId = resolveShortLink(token);
      if(!agentId) return null; 
      
      const agent = agents.find(a => a.id === agentId);
      if(!agent) return null; 
      
      const key = Object.values(keys).find(k => k.userId === agent.id);
      if (!key || Date.now() > key.expireAt) {
          return null; 
      }

      const customerId = generateId('cust');
      const newCustomer: Customer = {
          id: customerId,
          name: generateChineseName(),
          avatar: `https://i.pravatar.cc/150?u=${customerId}`,
          ipAddress: "192.168.1.100",
          device: "Chrome on Windows",
          location: "美国，旧金山",
          firstSeen: new Date().toISOString()
      };
      customers.push(newCustomer);
  
      const welcomeMessages = agentSettings[agent.id]?.welcomeMessages || ["您好！有什么可以帮您的吗？"];
      const initialMessages: ChatMessage[] = welcomeMessages.filter(m => m.trim() !== '').map((msg, index) => ({
        id: generateId(`msg-welcome-${index}`),
        type: 'text',
        text: msg,
        sender: 'agent',
        agentId: agent.id,
        timestamp: new Date(Date.now() + index).toISOString(),
      }));
      
      const newSession: ChatSession = {
          id: generateId('session'),
          customerId: newCustomer.id,
          agentId: agent.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          messages: initialMessages
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
