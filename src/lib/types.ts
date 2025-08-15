
export type UserRole = 'admin' | 'agent';

export type UserStatus = 'online' | 'busy' | 'offline' | 'away';

// The User type is a generic model for any logged-in user, containing derived state.
export interface User {
    id: string; 
    name: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    accessKey?: string; // The key string they are currently using
    lastActiveAt: string; 
    shareId?: string; // For agents, this is their own ID used for creating aliases.
}

export type AccessKeyStatus = 'active' | 'expired' | 'suspended' | 'used';

export interface AccessKey {
    id: string;
    key: string;
    key_type: UserRole; // Using UserRole for consistency
    status: AccessKeyStatus;
    name: string; // This is a descriptive name/note for the key
    notes?: string;
    usageCount?: number;
    maxUsage?: number;
    expiresAt: string | null; 
    createdAt: string;
    userId?: string; // Which user this key is bound to
}

// The Agent type represents the core agent entity, independent of login status or keys.
export interface Agent {
    id: string;
    name: string;
    avatar: string;
    role: 'agent';
    status: UserStatus;
    lastActiveAt: string;
}


export interface Customer {
  id: string;
  name: string;
  avatar?: string;
  ipAddress?: string;
  device?: string; 
  location?: string;
  firstSeen: string;
  isBlocked?: boolean;
}

export type ChatSessionStatus = 'pending' | 'active' | 'archived';

export interface ChatSession {
  id: string; 
  customerId: string; 
  agentId: string;
  status: ChatSessionStatus;
  createdAt: string; 
  messages: ChatMessage[];
}

export type MessageSenderType = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'file';

interface BaseChatMessage {
  id: string; 
  sender: MessageSenderType;
  timestamp: string; 
  agentId?: string;
}

export interface TextChatMessage extends BaseChatMessage {
  type: 'text';
  text: string;
}

export interface FileChatMessage extends BaseChatMessage {
  type: 'file';
  file: {
    name: string;
    size: number;
    progress: number; // 0-100
    url?: string;
  };
  text?: string; // Optional text with file
}

export type ChatMessage = TextChatMessage | FileChatMessage;


export interface QuickReply {
  id: string; 
  shortcut: string;
  message: string;
}

export interface AgentSettings {
    welcomeMessages: string[]; 
    quickReplies: QuickReply[];
    blockedIps: string[];
}

export type Alias = {
  token: string;     // The short, 5-character token, e.g. s52wb
  shareId: string;   // The real ID this token points to (agent.id)
  expireAt: string;  // ISO string for when the token expires
};
