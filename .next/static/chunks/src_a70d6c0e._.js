(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/constants.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ADMIN_KEY": (()=>ADMIN_KEY),
    "APP_NAME": (()=>APP_NAME)
});
const APP_NAME = "云聚-CRM";
const ADMIN_KEY = "ADMIN-SUPER-SECRET";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/mock-api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Simulates a backend API, managing all data in-memory.
__turbopack_context__.s({
    "mockApi": (()=>mockApi)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-client] (ecmascript)");
;
// --- NEW KEY MANAGEMENT SYSTEM based on user's proposal ---
// 1. Memory Structure Design
const nanoid = (size = 16)=>{
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = '';
    for(let i = 0; i < size; i++){
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
};
const keys = {};
const shortLinks = {};
// 2. Key Generation Logic
function getAlignedExpireAt(now = new Date()) {
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
function createKey(data) {
    const key = `${data.key_type.toUpperCase()}-${nanoid(8)}`;
    const expireAt = getAlignedExpireAt();
    const keyInfo = {
        key,
        expireAt,
        name: data.name,
        key_type: data.key_type,
        notes: data.notes,
        createdAt: new Date().toISOString()
    };
    keys[keyInfo.key] = keyInfo;
    return keyInfo;
}
// 3. Key Binding Logic
function bindKeyToUser(userId, key) {
    const keyInfo = keys[key];
    if (!keyInfo) return false; // Key does not exist
    if (Date.now() > keyInfo.expireAt) return false; // Key is expired
    if (keyInfo.userId) return false; // Key is already used/bound
    if (keyInfo.key_type !== 'agent') return false; // Only agent keys can be bound this way
    // Unbind any old key associated with this user
    for(const k in keys){
        if (keys[k].userId === userId) {
            delete keys[k]; // Old key is invalidated
        }
    }
    // Bind the new key
    keyInfo.userId = userId;
    return true;
}
// 4. Short Link / Alias Logic
function generateShortLink(shareId, key) {
    const token = nanoid(5);
    const keyInfo = keys[key];
    if (!keyInfo) return null;
    const expireAt = keyInfo.expireAt;
    shortLinks[token] = {
        shareId,
        expireAt
    };
    return token;
}
function resolveShortLink(token) {
    const item = shortLinks[token];
    if (!item) return null;
    if (Date.now() > item.expireAt) {
        delete shortLinks[token];
        return null;
    }
    return item.shareId;
}
function renewKeyForUser(userId) {
    // Find the old key
    const oldKeyInfo = Object.values(keys).find((keyInfo)=>keyInfo.userId === userId);
    if (!oldKeyInfo) {
        return null;
    }
    // Create a new key
    const newKeyInfo = createKey({
        name: `续期-${oldKeyInfo.name}`,
        key_type: oldKeyInfo.key_type,
        notes: oldKeyInfo.notes
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
setInterval(()=>{
    const now = Date.now();
    // Cleanup keys
    for(const k in keys){
        if (keys[k].expireAt < now) {
            delete keys[k];
        }
    }
    // Cleanup short links
    for(const t in shortLinks){
        if (shortLinks[t].expireAt < now) {
            delete shortLinks[t];
        }
    }
}, 60 * 1000); // Cleanup every minute
// --- IN-MEMORY DATABASE (Legacy parts) ---
// Initial admin key setup
keys[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ADMIN_KEY"]] = {
    key: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ADMIN_KEY"],
    name: "默认管理员",
    key_type: "admin",
    expireAt: new Date().setFullYear(new Date().getFullYear() + 10),
    createdAt: new Date().toISOString()
};
let agents = [
    {
        id: "agent-01",
        name: "小爱",
        avatar: "https://i.pravatar.cc/150?u=alice",
        status: "online",
        lastActiveAt: new Date().toISOString(),
        role: "agent"
    },
    {
        id: "agent-02",
        name: "小博",
        avatar: "https://i.pravatar.cc/150?u=bob",
        status: "busy",
        lastActiveAt: new Date().toISOString(),
        role: "agent"
    },
    {
        id: "agent-03",
        name: "小驰",
        avatar: "https://i.pravatar.cc/150?u=charlie",
        status: "offline",
        lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
        role: "agent"
    }
];
// Pre-bind some keys for initial setup for demo purposes
bindKeyToUser('agent-01', createKey({
    name: '小爱-初始密钥',
    key_type: 'agent'
}).key);
bindKeyToUser('agent-02', createKey({
    name: '小博-初始密钥',
    key_type: 'agent'
}).key);
let customers = [
    {
        id: "cust-01",
        name: "访客 1",
        avatar: "https://i.pravatar.cc/150?u=visitor1",
        ipAddress: "123.45.67.89",
        device: "Chrome on macOS",
        location: "美国，纽约",
        firstSeen: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: "cust-02",
        name: "访客 2",
        avatar: "https://i.pravatar.cc/150?u=visitor2",
        ipAddress: "98.76.54.32",
        device: "Safari on iOS",
        location: "英国，伦敦",
        firstSeen: new Date(Date.now() - 86400000).toISOString()
    }
];
let chatSessions = [
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
                timestamp: new Date(Date.now() - 60000 * 5).toISOString()
            },
            {
                id: "msg-02",
                type: "text",
                text: "您好！我当然可以帮助您。请问您的订单号是多少？",
                sender: "agent",
                agentId: "agent-01",
                timestamp: new Date(Date.now() - 60000 * 4).toISOString()
            }
        ]
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
                timestamp: new Date(Date.now() - 60000 * 10).toISOString()
            }
        ]
    }
];
let agentSettings = {
    "agent-01": {
        welcomeMessages: [
            "欢迎！今天有什么可以帮您的吗？",
            "请随时提出您的问题。"
        ],
        quickReplies: [
            {
                id: "qr-1",
                shortcut: "你好",
                message: "您好，很高兴为您服务！"
            },
            {
                id: "qr-2",
                shortcut: "感谢",
                message: "不客气！还有其他可以帮助您的吗？"
            }
        ],
        blockedIps: []
    },
    "agent-02": {
        welcomeMessages: [
            "您好，感谢您的联系。"
        ],
        quickReplies: [],
        blockedIps: [
            "1.2.3.4"
        ]
    },
    "agent-03": {
        welcomeMessages: [
            "您好！"
        ],
        quickReplies: [],
        blockedIps: []
    }
};
const delay = (ms)=>new Promise((res)=>setTimeout(res, ms));
const generateId = (prefix)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const generateChineseName = ()=>{
    const nameChars = "梦琪忆柳之桃慕青初夏沛菡傲珊曼文乐菱惜文香菡新柔语蓉海安夜蓉涵柏水桃醉蓝语琴从彤傲晴语兰又菱碧彤元霜怜梦紫寒妙彤曼易南蓮紫翠雨寒易烟如萱若南寻真晓亦向珊慕靈水凡".split('');
    let name = '';
    for(let i = 0; i < 4; i++){
        name += nameChars[Math.floor(Math.random() * nameChars.length)];
    }
    return name;
};
const mockApi = {
    async loginWithKey (key) {
        await delay(500);
        const keyInfo = keys[key];
        if (!keyInfo || Date.now() > keyInfo.expireAt) {
            return null;
        }
        if (keyInfo.key_type === 'admin') {
            const adminUser = {
                id: keyInfo.userId || 'admin-user',
                role: 'admin',
                name: keyInfo.name,
                status: 'online',
                lastActiveAt: new Date().toISOString()
            };
            return adminUser;
        }
        if (keyInfo.key_type === 'agent') {
            const agent = agents.find((a)=>a.id === keyInfo.userId);
            if (agent) {
                agent.status = 'online';
                agent.lastActiveAt = new Date().toISOString();
                const agentUser = {
                    id: agent.id,
                    role: 'agent',
                    name: agent.name,
                    avatar: agent.avatar,
                    shareId: agent.id,
                    status: agent.status,
                    lastActiveAt: agent.lastActiveAt,
                    accessKey: keyInfo.key
                };
                return agentUser;
            }
        }
        return null;
    },
    // --- Admin Functions ---
    async getDashboardData () {
        await delay(500);
        const totalAgents = agents.length;
        const onlineAgents = agents.filter((a)=>a.status === 'online' || a.status === 'busy').length;
        const totalKeys = Object.keys(keys).length;
        const activeKeys = Object.values(keys).filter((k)=>Date.now() <= k.expireAt).length;
        return {
            totalAgents,
            onlineAgents,
            totalKeys,
            activeKeys
        };
    },
    async getAccessKeys () {
        await delay(300);
        return Object.values(keys).map((k)=>{
            let status;
            if (Date.now() > k.expireAt) {
                status = 'expired';
            } else if (k.userId) {
                status = 'used';
            } else {
                status = 'active';
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
                maxUsage: 1
            };
        }).sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async createAccessKey (data) {
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
            maxUsage: 1
        };
    },
    async updateAccessKey (id, updates) {
        await delay(500);
        const keyInfo = keys[id];
        if (!keyInfo) return null;
        if (updates.name) keyInfo.name = updates.name;
        if (updates.notes) keyInfo.notes = updates.notes;
        // Status update is now derived, but we can simulate deletion via this
        if (updates.status === 'suspended') {
        // 'suspended' is a client state, we don't store it. To "suspend", just delete the key.
        // For this mock, we'll just leave it as is. A real backend might toggle a flag.
        }
        let status;
        if (Date.now() > keyInfo.expireAt) {
            status = 'expired';
        } else if (keyInfo.userId) {
            status = 'used';
        } else {
            status = 'active';
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
            maxUsage: 1
        };
    },
    async deleteAccessKey (id) {
        await delay(500);
        if (keys[id]) {
            delete keys[id];
            return true;
        }
        return false;
    },
    async getAgents () {
        await delay(300);
        return [
            ...agents
        ].map((a)=>({
                id: a.id,
                name: a.name,
                avatar: a.avatar,
                role: a.role,
                status: a.status,
                lastActiveAt: a.lastActiveAt,
                accessKey: Object.values(keys).find((k)=>k.userId === a.id)?.key
            })).sort((a, b)=>new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    },
    // --- Agent Functions ---
    async getAgentData (agentId) {
        await delay(500);
        const agent = agents.find((a)=>a.id === agentId);
        if (!agent) return null;
        const sessions = chatSessions.filter((s)=>s.agentId === agentId);
        const customerIds = sessions.map((s)=>s.customerId);
        const relevantCustomers = customers.filter((c)=>customerIds.includes(c.id));
        const settings = agentSettings[agentId];
        const keyInfo = Object.values(keys).find((k)=>k.userId === agentId) || null;
        const key = keyInfo ? {
            id: keyInfo.key,
            key: keyInfo.key,
            name: keyInfo.name,
            notes: keyInfo.notes,
            key_type: keyInfo.key_type,
            status: Date.now() > keyInfo.expireAt ? 'expired' : 'used',
            createdAt: keyInfo.createdAt,
            expiresAt: new Date(keyInfo.expireAt).toISOString(),
            userId: keyInfo.userId
        } : null;
        return {
            agent,
            sessions,
            customers: relevantCustomers,
            settings,
            key
        };
    },
    async sendMessage (sessionId, message) {
        await delay(250);
        const session = chatSessions.find((s)=>s.id === sessionId);
        if (!session) throw new Error("Session not found");
        const newMessage = {
            ...message,
            id: generateId('msg'),
            timestamp: new Date().toISOString()
        };
        session.messages.push(newMessage);
        return newMessage;
    },
    async updateAgentStatus (agentId, status) {
        await delay(200);
        const agent = agents.find((a)=>a.id === agentId);
        if (agent) {
            agent.status = status;
            return {
                ...agent
            };
        }
        return null;
    },
    async updateAgentProfile (agentId, updates) {
        await delay(400);
        const agent = agents.find((a)=>a.id === agentId);
        if (agent) {
            if (updates.name) agent.name = updates.name;
            if (updates.avatar) agent.avatar = updates.avatar;
            return {
                ...agent
            };
        }
        return null;
    },
    async updateAgentSettings (agentId, settings) {
        await delay(400);
        if (agentSettings[agentId]) {
            agentSettings[agentId] = settings;
            return {
                ...settings
            };
        }
        return null;
    },
    async updateSessionStatus (sessionId, status) {
        await delay(200);
        const session = chatSessions.find((s)=>s.id === sessionId);
        if (session) {
            session.status = status;
            return {
                ...session
            };
        }
        return null;
    },
    async extendAgentKey (agentId, newKeyString) {
        const agent = agents.find((a)=>a.id === agentId);
        if (!agent) throw new Error("坐席不存在。");
        // Invalidate all old short links for this agent
        for(const token in shortLinks){
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
                status: 'used',
                createdAt: keyInfo.createdAt,
                expiresAt: new Date(keyInfo.expireAt).toISOString(),
                userId: keyInfo.userId
            };
        }
        return null;
    },
    async deleteCustomer (customerId) {
        await delay(300);
        const initialCustomerCount = customers.length;
        customers = customers.filter((c)=>c.id !== customerId);
        chatSessions = chatSessions.filter((s)=>s.customerId !== customerId);
        return customers.length < initialCustomerCount;
    },
    // --- Visitor & Alias Functions ---
    async getOrCreateAlias (agentId) {
        await delay(100);
        const agent = agents.find((a)=>a.id === agentId);
        if (!agent) return null;
        const boundKey = Object.values(keys).find((k)=>k.userId === agentId);
        if (!boundKey || Date.now() > boundKey.expireAt) return null; // Agent has no valid key
        // Check for existing valid alias first
        const existingToken = Object.keys(shortLinks).find((token)=>{
            const link = shortLinks[token];
            return link.shareId === agentId && Date.now() <= link.expireAt;
        });
        if (existingToken) {
            return {
                token: existingToken,
                shareId: agentId,
                expireAt: new Date(shortLinks[existingToken].expireAt).toISOString()
            };
        }
        const newToken = generateShortLink(agentId, boundKey.key);
        if (newToken) {
            return {
                token: newToken,
                shareId: agentId,
                expireAt: new Date(boundKey.expireAt).toISOString()
            };
        }
        return null;
    },
    async getChatDataForVisitorByToken (token) {
        await delay(500);
        const agentId = resolveShortLink(token);
        if (!agentId) return null;
        const agent = agents.find((a)=>a.id === agentId);
        if (!agent) return null;
        const key = Object.values(keys).find((k)=>k.userId === agent.id);
        if (!key || Date.now() > key.expireAt) {
            return null;
        }
        const customerId = generateId('cust');
        const newCustomer = {
            id: customerId,
            name: generateChineseName(),
            avatar: `https://i.pravatar.cc/150?u=${customerId}`,
            ipAddress: "192.168.1.100",
            device: "Chrome on Windows",
            location: "美国，旧金山",
            firstSeen: new Date().toISOString()
        };
        customers.push(newCustomer);
        const welcomeMessages = agentSettings[agent.id]?.welcomeMessages || [
            "您好！有什么可以帮您的吗？"
        ];
        const initialMessages = welcomeMessages.filter((m)=>m.trim() !== '').map((msg, index)=>({
                id: generateId(`msg-welcome-${index}`),
                type: 'text',
                text: msg,
                sender: 'agent',
                agentId: agent.id,
                timestamp: new Date(Date.now() + index).toISOString()
            }));
        const newSession = {
            id: generateId('session'),
            customerId: newCustomer.id,
            agentId: agent.id,
            status: "pending",
            createdAt: new Date().toISOString(),
            messages: initialMessages
        };
        chatSessions.push(newSession);
        return {
            agent: {
                name: agent.name,
                avatar: agent.avatar,
                status: agent.status
            },
            session: newSession,
            customer: newCustomer
        };
    },
    async getSessionUpdates (sessionId) {
        await delay(1000);
        const session = chatSessions.find((s)=>s.id === sessionId);
        return session || null;
    },
    async renewKeyForUser (userId) {
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
            status: 'active',
            createdAt: newKeyInfo.createdAt,
            expiresAt: new Date(newKeyInfo.expireAt).toISOString(),
            usageCount: 0,
            maxUsage: 1
        };
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/stores/authStore.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useAuthStore": (()=>useAuthStore)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mock$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mock-api.ts [app-client] (ecmascript)");
;
;
;
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        user: null,
        isLoading: false,
        error: null,
        login: async (key)=>{
            set({
                isLoading: true,
                error: null
            });
            try {
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mock$2d$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mockApi"].loginWithKey(key);
                if (user) {
                    set({
                        user,
                        isLoading: false
                    });
                    return true;
                } else {
                    set({
                        error: `密钥无效、过期或未激活: ${key}`,
                        isLoading: false
                    });
                    return false;
                }
            } catch (e) {
                const error = e instanceof Error ? e.message : "An unknown error occurred.";
                set({
                    error,
                    isLoading: false
                });
                return false;
            }
        },
        logout: ()=>{
            set({
                user: null
            });
        },
        updateCurrentUser: (updates)=>{
            const currentUser = get().user;
            if (currentUser) {
                set({
                    user: {
                        ...currentUser,
                        ...updates
                    }
                });
            }
        }
    }), {
    name: "agentverse-auth",
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>sessionStorage)
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/providers/AppProviders.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AppProviders": (()=>AppProviders)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stores$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stores/authStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$headset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Headset$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/headset.js [app-client] (ecmascript) <export default as Headset>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const protectedRoutes = {
    admin: "/admin",
    agent: "/agent"
};
function AppProviders({ children }) {
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stores$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isChecking, setIsChecking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AppProviders.useEffect": ()=>{
            const userRole = user?.role;
            const isAuthRoute = pathname === "/";
            const isAdminRoute = pathname.startsWith(protectedRoutes.admin);
            const isAgentRoute = pathname.startsWith(protectedRoutes.agent);
            const isChatRoute = pathname.startsWith("/chat") || pathname.startsWith("/noiod") || pathname.startsWith("/naoiod");
            if (isChatRoute) {
                setIsChecking(false);
                return;
            }
            if (userRole) {
                if (isAuthRoute) {
                    router.push(`/${userRole}`);
                } else if (isAdminRoute && userRole !== 'admin') {
                    router.push('/agent');
                } else if (isAgentRoute && userRole !== 'agent') {
                    router.push('/admin');
                } else {
                    setIsChecking(false);
                }
            } else {
                if (!isAuthRoute) {
                    router.push('/');
                } else {
                    setIsChecking(false);
                }
            }
        }
    }["AppProviders.useEffect"], [
        user,
        pathname,
        router
    ]);
    if (isChecking) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-screen w-full items-center justify-center bg-background",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$headset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Headset$3e$__["Headset"], {
                            size: 36
                        }, void 0, false, {
                            fileName: "[project]/src/components/providers/AppProviders.tsx",
                            lineNumber: 57,
                            columnNumber: 17
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/providers/AppProviders.tsx",
                        lineNumber: 56,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-muted-foreground animate-pulse",
                        children: [
                            "正在加载",
                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["APP_NAME"],
                            "..."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/providers/AppProviders.tsx",
                        lineNumber: 59,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/providers/AppProviders.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/providers/AppProviders.tsx",
            lineNumber: 54,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(AppProviders, "UF8PvB5pClCTyKQKMLKJZWj09YA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stores$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AppProviders;
var _c;
__turbopack_context__.k.register(_c, "AppProviders");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/hooks/use-toast.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "reducer": (()=>reducer),
    "toast": (()=>toast),
    "useToast": (()=>useToast)
});
// Inspired by react-hot-toast library
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(memoryState);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/toast.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Toast": (()=>Toast),
    "ToastAction": (()=>ToastAction),
    "ToastClose": (()=>ToastClose),
    "ToastDescription": (()=>ToastDescription),
    "ToastProvider": (()=>ToastProvider),
    "ToastTitle": (()=>ToastTitle),
    "ToastViewport": (()=>ToastViewport)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, this));
_c1 = ToastViewport;
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Toast = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, variant, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
});
_c3 = Toast;
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, this));
_c5 = ToastAction;
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/toast.tsx",
            lineNumber: 86,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 77,
        columnNumber: 3
    }, this));
_c7 = ToastClose;
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 95,
        columnNumber: 3
    }, this));
_c9 = ToastTitle;
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm opacity-90", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, this));
_c11 = ToastDescription;
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "ToastViewport$React.forwardRef");
__turbopack_context__.k.register(_c1, "ToastViewport");
__turbopack_context__.k.register(_c2, "Toast$React.forwardRef");
__turbopack_context__.k.register(_c3, "Toast");
__turbopack_context__.k.register(_c4, "ToastAction$React.forwardRef");
__turbopack_context__.k.register(_c5, "ToastAction");
__turbopack_context__.k.register(_c6, "ToastClose$React.forwardRef");
__turbopack_context__.k.register(_c7, "ToastClose");
__turbopack_context__.k.register(_c8, "ToastTitle$React.forwardRef");
__turbopack_context__.k.register(_c9, "ToastTitle");
__turbopack_context__.k.register(_c10, "ToastDescription$React.forwardRef");
__turbopack_context__.k.register(_c11, "ToastDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/toaster.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Toaster": (()=>Toaster)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function Toaster() {
    _s();
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function({ id, title, description, action, ...props }) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/src/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/src/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(Toaster, "1YTCnXrq2qRowe0H/LBWLjtXoYc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = Toaster;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_a70d6c0e._.js.map