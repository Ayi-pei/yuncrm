// Simulates a backend API, managing all data in-memory.
import {
  AccessKey,
  Agent,
  AgentSettings,
  UserStatus,
  Alias,
  ChatMessage,
  ChatSession,
  Customer,
  User,
  UserRole,
  AccessKeyStatus,
} from "./types";

// --- NEW KEY MANAGEMENT SYSTEM based on user's proposal ---

// 1. Memory Structure Design
const nanoid = (size = 16) => {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < size; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
};

interface KeyInfo {
  key: string;
  name: string; // This is the descriptive name/remark for the key.
  notes?: string;
  key_type: UserRole;
  createdAt: string;
  userId?: string;
  expireAt: number; // timestamp
  suspended?: boolean; // when true, key is disabled for login
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

function createKey(data: {
  name: string;
  key_type: UserRole;
  notes?: string;
}): KeyInfo {
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
  return keyInfo;
}

// 3. Key Binding Logic
function bindKeyToUser(userId: string, key: string): boolean {
  const keyInfo = keys[key];
  if (!keyInfo) return false; // Key does not exist
  if (Date.now() > keyInfo.expireAt) return false; // Key is expired
  if (keyInfo.userId) return false; // Key is already used/bound
  if (keyInfo.key_type !== "agent") return false; // Only agent keys can be bound this way

  // Unbind any old key associated with this user
  for (const k in keys) {
    if (keys[k].userId === userId) {
      delete keys[k]; // Old key is invalidated
    }
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

function renewKeyForUser(userId: string): KeyInfo | null {
  // Find the old key
  const oldKeyInfo = Object.values(keys).find(
    (keyInfo) => keyInfo.userId === userId
  );

  if (!oldKeyInfo) {
    return null;
  }

  // Create a new key
  const newKeyInfo = createKey({
    name: `续期-${oldKeyInfo.name}`.slice(0, 24),
    key_type: oldKeyInfo.key_type,
    notes: oldKeyInfo.notes,
  });

  // Bind the new key to the user
  const bindSuccess = bindKeyToUser(userId, newKeyInfo.key);

  if (!bindSuccess) {
    // This should ideally not happen, but handle it in case it does
    delete keys[newKeyInfo.key]; // Remove the newly created key if binding fails
    return null;
  }

  return newKeyInfo;
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

const ADMIN_KEY = process.env.ADMIN_KEY || "ADMIN-SUPER-SECRET";
// Initial admin key setup
keys[ADMIN_KEY] = {
  key: ADMIN_KEY,
  name: "默认管理员",
  key_type: "admin",
  expireAt: new Date().setFullYear(new Date().getFullYear() + 10), // 10 years from now
  createdAt: new Date().toISOString(),
};

const agents: Agent[] = [
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
// Pre-bind some keys for initial setup for demo purposes
bindKeyToUser(
  "agent-01",
  createKey({ name: "小爱-初始密钥", key_type: "agent" }).key
);
bindKeyToUser(
  "agent-02",
  createKey({ name: "小博-初始密钥", key_type: "agent" }).key
);

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
        type: "text",
        text: "我有一个关于价格的问题。",
        sender: "customer",
        timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
      },
    ],
  },
];

const agentSettings: Record<string, AgentSettings> = {
  "agent-01": {
    welcomeMessages: ["欢迎！今天有什么可以帮您的吗？", "请随时提出您的问题。"],
    quickReplies: [
      { id: "qr-1", shortcut: "你好", message: "您好，很高兴为您服务！" },
      {
        id: "qr-2",
        shortcut: "感谢",
        message: "不客气！还有其他可以帮助您的吗？",
      },
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
  },
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const generateChineseName = () => {
  const nameChars =
    "梦琪忆柳之桃慕青初夏沛菡傲珊曼文乐菱惜文香菡新柔语蓉海安夜蓉涵柏水桃醉蓝语琴从彤傲晴语兰又菱碧彤元霜怜梦紫寒妙彤曼易南蓮紫翠雨寒易烟如萱若南寻真晓亦向珊慕靈水凡".split(
      ""
    );
  let name = "";
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

    if (!keyInfo || keyInfo.suspended || Date.now() > keyInfo.expireAt) {
      return null;
    }

    if (keyInfo.key_type === "admin") {
      const adminUser: User = {
        id: keyInfo.userId || "admin-user", // Use bound ID or a default
        role: "admin",
        name: keyInfo.name,
        status: "online",
        lastActiveAt: new Date().toISOString(),
      };
      return adminUser;
    }

    if (keyInfo.key_type === "agent") {
      let agent = agents.find((a) => a.id === keyInfo.userId);

      // 首次使用未绑定的坐席密钥：自动创建并绑定一个新坐席
      if (!agent && !keyInfo.userId) {
        const newAgentId = generateId("agent");
        const newAgentName = keyInfo.name || generateChineseName();
        const newAgent: Agent = {
          id: newAgentId,
          name: newAgentName,
          avatar: `https://i.pravatar.cc/150?u=${newAgentId}`,
          status: "online",
          lastActiveAt: new Date().toISOString(),
          role: "agent",
        };
        agents.push(newAgent);
        // 初始化默认设置
        agentSettings[newAgentId] = {
          welcomeMessages: ["您好！今天有什么可以帮您的吗？"],
          quickReplies: [],
          blockedIps: [],
        };
        // 绑定密钥到此新坐席
        keyInfo.userId = newAgentId;
        agent = newAgent;
      }

      if (agent) {
        agent.status = "online";
        agent.lastActiveAt = new Date().toISOString();
        const agentUser: User = {
          id: agent.id,
          role: "agent",
          name: agent.name,
          avatar: agent.avatar,
          shareId: agent.id,
          status: agent.status,
          lastActiveAt: agent.lastActiveAt,
          accessKey: keyInfo.key,
        };
        return agentUser;
      }
    }

    return null;
  },

  // --- Admin Functions ---
  async getDashboardData() {
    await delay(500);
    const totalAgents = agents.length;
    const onlineAgents = agents.filter(
      (a) => a.status === "online" || a.status === "busy"
    ).length;
    const totalKeys = Object.keys(keys).length;
    const activeKeys = Object.values(keys).filter(
      (k) => Date.now() <= k.expireAt
    ).length;
    return { totalAgents, onlineAgents, totalKeys, activeKeys };
  },

  async getAccessKeys(): Promise<AccessKey[]> {
    await delay(300);
    return Object.values(keys)
      .map((k) => {
        let status: AccessKeyStatus;
        if (Date.now() > k.expireAt) {
          status = "expired";
        } else if (k.suspended) {
          status = "suspended";
        } else if (k.userId) {
          status = "used";
        } else {
          status = "active";
        }

        return {
          id: k.key,
          key: k.key,
          name: k.name,
          notes: k.notes,
          key_type: k.key_type,
          status: status,
          createdAt: k.createdAt,
          expiresAt: new Date(k.expireAt).toISOString(),
          userId: k.userId,
          usageCount: k.userId ? 1 : 0,
          maxUsage: 1,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async createAccessKey(data: {
    name: string;
    key_type: UserRole;
    notes?: string;
  }): Promise<AccessKey> {
    await delay(500);
    const newKeyInfo = createKey(data);
    return {
      id: newKeyInfo.key,
      key: newKeyInfo.key,
      name: newKeyInfo.name,
      notes: newKeyInfo.notes,
      key_type: newKeyInfo.key_type,
      status: "active",
      createdAt: newKeyInfo.createdAt,
      expiresAt: new Date(newKeyInfo.expireAt).toISOString(),
      usageCount: 0,
      maxUsage: 1,
    };
  },

  async updateAccessKey(
    id: string,
    updates: Partial<AccessKey>
  ): Promise<AccessKey | null> {
    await delay(500);
    const keyInfo = keys[id];
    if (!keyInfo) return null;

    if (updates.name) keyInfo.name = updates.name;
    if (updates.notes) keyInfo.notes = updates.notes;

    // Handle suspended toggle
    if (typeof updates.status !== "undefined") {
      if (updates.status === "suspended") {
        keyInfo.suspended = true;
      } else if (updates.status === "active") {
        keyInfo.suspended = false;
      }
    }

    let status: AccessKeyStatus;
    if (Date.now() > keyInfo.expireAt) {
      status = "expired";
    } else if (keyInfo.userId) {
      status = "used";
    } else if (keyInfo.suspended) {
      status = "suspended";
      status = "used";
    } else {
      status = "active";
    }

    return {
      id: keyInfo.key,
      key: keyInfo.key,
      name: keyInfo.name,
      notes: keyInfo.notes,
      key_type: keyInfo.key_type,
      status: status,
      createdAt: keyInfo.createdAt,
      expiresAt: new Date(keyInfo.expireAt).toISOString(),
      userId: keyInfo.userId,
      usageCount: keyInfo.userId ? 1 : 0,
      maxUsage: 1,
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
    return [...agents]
      .map((a) => ({
        id: a.id,
        name: a.name,
        avatar: a.avatar,
        role: a.role,
        status: a.status,
        lastActiveAt: a.lastActiveAt,
        accessKey: Object.values(keys).find((k) => k.userId === a.id)?.key,
      }))
      .sort(
        (a, b) =>
          new Date(b.lastActiveAt).getTime() -
          new Date(a.lastActiveAt).getTime()
      );
  },

  // --- Agent Functions ---
  async getAgentData(agentId: string) {
    await delay(500);
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;

    const sessions = chatSessions.filter((s) => s.agentId === agentId);
    const customerIds = sessions.map((s) => s.customerId);
    const relevantCustomers = customers.filter((c) =>
      customerIds.includes(c.id)
    );
    const settings = agentSettings[agentId];
    const keyInfo =
      Object.values(keys).find((k) => k.userId === agentId) || null;

    const key: AccessKey | null = keyInfo
      ? {
          id: keyInfo.key,
          key: keyInfo.key,
          name: keyInfo.name,
          notes: keyInfo.notes,
          key_type: keyInfo.key_type,
          status:
            Date.now() > keyInfo.expireAt
              ? "expired"
              : keyInfo.suspended
              ? "suspended"
              : "used",
          createdAt: keyInfo.createdAt,
          expiresAt: new Date(keyInfo.expireAt).toISOString(),
          userId: keyInfo.userId,
        }
      : null;

    return { agent, sessions, customers: relevantCustomers, settings, key };
  },

  async sendMessage(
    sessionId: string,
    message: Omit<ChatMessage, "id" | "timestamp">
  ): Promise<ChatMessage> {
    await delay(250);
    const session = chatSessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const newMessage = {
      ...message,
      id: generateId("msg"),
      timestamp: new Date().toISOString(),
    } as ChatMessage;
    session.messages.push(newMessage);

    return newMessage;
  },

  async updateAgentStatus(
    agentId: string,
    status: UserStatus
  ): Promise<Agent | null> {
    await delay(200);
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      agent.status = status;
      return { ...agent };
    }
    return null;
  },

  async updateAgentProfile(
    agentId: string,
    updates: { name?: string; avatar?: string }
  ): Promise<Agent | null> {
    await delay(400);
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      if (updates.name) agent.name = updates.name;
      if (updates.avatar) agent.avatar = updates.avatar;
      return { ...agent };
    }
    return null;
  },

  async updateAgentSettings(
    agentId: string,
    settings: AgentSettings
  ): Promise<AgentSettings | null> {
    await delay(400);
    if (agentSettings[agentId]) {
      agentSettings[agentId] = settings;
      return { ...settings };
    }
    return null;
  },

  async updateSessionStatus(
    sessionId: string,
    status: ChatSession["status"]
  ): Promise<ChatSession | null> {
    await delay(200);
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = status;
      return { ...session };
    }
    return null;
  },

  async extendAgentKey(
    agentId: string,
    newKeyString: string
  ): Promise<AccessKey | null> {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) throw new Error("坐席不存在。");

    // Invalidate all old short links for this agent
    for (const token in shortLinks) {
      if (shortLinks[token].shareId === agentId) {
        delete shortLinks[token];
      }
    }

    const success = bindKeyToUser(agentId, newKeyString);
    if (success) {
      const keyInfo = keys[newKeyString];
      return {
        id: keyInfo.key,
        key: keyInfo.key,
        name: keyInfo.name,
        notes: keyInfo.notes,
        key_type: keyInfo.key_type,
        status: "used",
        createdAt: keyInfo.createdAt,
        expiresAt: new Date(keyInfo.expireAt).toISOString(),
        userId: keyInfo.userId,
      };
    }
    return null;
  },

  async deleteCustomer(customerId: string): Promise<boolean> {
    await delay(300);
    const initialCustomerCount = customers.length;
    customers = customers.filter((c: Customer) => c.id !== customerId);
    chatSessions = chatSessions.filter(
      (s: ChatSession) => s.customerId !== customerId
    );
    return customers.length < initialCustomerCount;
  },

  // --- Visitor & Alias Functions ---
  async getOrCreateAlias(agentId: string): Promise<Alias | null> {
    await delay(100);

    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;

    const boundKey = Object.values(keys).find((k) => k.userId === agentId);
    if (!boundKey || Date.now() > boundKey.expireAt) return null; // Agent has no valid key

    // Check for existing valid alias first
    const existingToken = Object.keys(shortLinks).find((token) => {
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
    if (newToken) {
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
    if (!agentId) return null;

    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;

    const key = Object.values(keys).find((k) => k.userId === agent.id);
    if (!key || Date.now() > key.expireAt) {
      return null;
    }

    const customerId = generateId("cust");
    const newCustomer: Customer = {
      id: customerId,
      name: generateChineseName(),
      avatar: `https://i.pravatar.cc/150?u=${customerId}`,
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      location: "美国，旧金山",
      firstSeen: new Date().toISOString(),
    };
    customers.push(newCustomer);

    const welcomeMessages = agentSettings[agent.id]?.welcomeMessages || [
      "您好！有什么可以帮您的吗？",
    ];
    const initialMessages: ChatMessage[] = welcomeMessages
      .filter((m) => m.trim() !== "")
      .map((msg, index) => ({
        id: generateId(`msg-welcome-${index}`),
        type: "text",
        text: msg,
        sender: "agent",
        agentId: agent.id,
        timestamp: new Date(Date.now() + index).toISOString(),
      }));

    const newSession: ChatSession = {
      id: generateId("session"),
      customerId: newCustomer.id,
      agentId: agent.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      messages: initialMessages,
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
    const session = chatSessions.find((s) => s.id === sessionId);
    return session || null;
  },
  async renewKeyForUser(userId: string): Promise<AccessKey | null> {
    const newKeyInfo = renewKeyForUser(userId);
    if (!newKeyInfo) {
      return null;
    }
    return {
      id: newKeyInfo.key,
      key: newKeyInfo.key,
      name: newKeyInfo.name,
      notes: newKeyInfo.notes,
      key_type: newKeyInfo.key_type,
      status: newKeyInfo.suspended ? "suspended" : "active",
      createdAt: newKeyInfo.createdAt,
      expiresAt: new Date(newKeyInfo.expireAt).toISOString(),
      usageCount: 0,
      maxUsage: 1,
    };
  },
};
