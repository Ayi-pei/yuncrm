
export type RoleName = 'super_admin' | 'admin' | 'supervisor' | 'senior_agent' | 'agent' | 'trainee';

export interface Role {
    id: string; // UUID
    name: RoleName;
    displayName: string;
    color: string; // Hex color
    level: number;
    description?: string;
    createdAt: string;
}

export type UserStatus = 'online' | 'busy' | 'offline' | 'away';

export interface User {
    id: string; // UUID
    name: string;
    email?: string;
    avatarUrl?: string;
    roleId: string; // UUID of a role
    status: UserStatus;
    accessKey?: string;
    keyExpiresAt?: string; // Timestamp
    isOnline: boolean;
    lastActiveAt: string; // Timestamp
    createdAt: string; // Timestamp
    updatedAt: string; // Timestamp
    // For convenience, we might want to populate role info
    role?: Role; 
    shareId?: string; // Kept for visitor link functionality
}

export type AccessKeyType = 'agent' | 'admin';
export type AccessKeyStatus = 'active' | 'expired' | 'suspended' | 'used';

export interface AccessKey {
    id: string; // UUID
    keyValue: string;
    keyType: AccessKeyType;
    status: AccessKeyStatus;
    userId?: string; // UUID of a user
    createdBy?: string; // UUID of a user
    expiresAt: string; // Timestamp
    maxUsage?: number;
    usageCount: number;
    lastUsedAt?: string; // Timestamp
    notes?: string;
    createdAt: string; // Timestamp
    updatedAt: string; // Timestamp
}


export interface Customer {
  id: string; // UUID
  name: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  ipAddress?: string;
  deviceInfo?: string;
  userAgent?: string;
  location?: string;
  isOnline: boolean;
  isBlacklisted: boolean;
  hasReceivedWelcome: boolean;
  lastSeenAt: string; // Timestamp
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
}

export type ChatSessionStatus = 'waiting' | 'active' | 'ended' | 'archived';
export type ChatPriority = 'low' | 'normal' | 'high' | 'vip';

export interface ChatSession {
  id: string; // UUID
  customerId: string; // UUID
  agentId?: string; // UUID
  status: ChatSessionStatus;
  priority: ChatPriority;
  source: string; // 'web', 'mobile', 'api'
  startedAt: string; // Timestamp
  endedAt?: string; // Timestamp
  lastMessageAt: string; // Timestamp
  messageCount: number;
  satisfactionRating?: number;
  welcomeSent: boolean;
  tags?: string[];
  metadata?: Record<string, any>; // JSONB
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
  messages: ChatMessage[]; // Populated for UI
}

export type MessageSenderType = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string; // UUID
  sessionId: string; // UUID
  senderId?: string; // UUID of customer or user
  senderType: MessageSenderType;
  messageType: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status: MessageStatus;
  isWelcomeMessage: boolean;
  metadata?: Record<string, any>; // JSONB
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
  // For convenience, we'll need sender info for the UI
  sender?: {
      name: string;
      avatarUrl?: string;
  }
}

export interface QuickReply {
  id: string; // UUID
  agentId: string; // UUID
  title: string;
  content: string;
  category?: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string; // Timestamp
  updatedAt:string; // Timestamp
}

export interface AgentSettings {
    id: string; // UUID
    agentId: string; // UUID
    autoWelcomeEnabled: boolean;
    soundNotifications: boolean;
    autoReplyEnabled: boolean;
    maxConcurrentSessions: number;
    workingHours?: any; // JSONB
    breakDuration: number; // minutes
}

// Keeping a simplified version for the UI for now
export interface AppUser {
  id: string;
  role: RoleName;
  name: string;
  avatarUrl?: string;
  shareId?: string;
  status?: UserStatus;
}
