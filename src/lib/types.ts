

export type UserRole = 'admin' | 'agent';

export type UserStatus = 'online' | 'busy' | 'offline' | 'away';

export interface User {
    id: string; 
    name: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    accessKey?: string;
    lastActiveAt: string; 
    shareId?: string; 
}

export type AccessKeyType = 'agent' | 'admin';
export type AccessKeyStatus = 'active' | 'expired' | 'suspended' | 'used';

export interface AccessKey {
    id: string;
    key: string;
    key_type: AccessKeyType;
    status: AccessKeyStatus;
    name: string;
    notes?: string;
    usageCount?: number;
    maxUsage?: number;
    expiresAt: string | null; 
    createdAt: string;
    lastUsedAt?: string | null;
}


export interface Customer {
  id: string;
  name: string;
  avatar?: string;
  ipAddress?: string;
  device?: string; 
  location?: string;
  firstSeen: string; 
}

export type ChatSessionStatus = 'pending' | 'active' | 'closed';

export interface ChatSession {
  id: string; 
  customerId: string; 
  agentId: string;
  status: ChatSessionStatus;
  createdAt: string; 
  messages: ChatMessage[];
}

export type MessageSenderType = 'customer' | 'agent' | 'system';

export interface ChatMessage {
  id: string; 
  text: string;
  sender: MessageSenderType;
  timestamp: string; 
  agentId?: string;
}

export interface QuickReply {
  id: string; 
  shortcut: string;
  message: string;
}

export interface AgentSettings {
    welcomeMessage: string; 
    quickReplies: QuickReply[];
    blockedIps: string[];
}


export interface Agent extends User {
    accessKeyId: string;
}
