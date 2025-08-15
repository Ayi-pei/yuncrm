

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
    key: string;
    role: AccessKeyType;
    status: AccessKeyStatus;
    userId?: string; // UUID of a user
    createdBy?: string; // UUID of a user
    expiresAt: string | null; // Timestamp
    maxUsage?: number;
    usageCount: number;
    lastUsedAt?: string | null; // Timestamp
    notes?: string;
    name: string; // Added for compatibility with current UI
    createdAt: string; // Timestamp
    updatedAt?: string; // Timestamp
}


export interface Customer {
  id: string; // UUID
  name: string;
  email?: string;
  avatar?: string; // Changed from avatarUrl for consistency
  phone?: string;
  ipAddress?: string;
  device?: string; // Changed from deviceInfo for consistency
  userAgent?: string;
  location?: string;
  isOnline: boolean;
  isBlacklisted: boolean;
  hasReceivedWelcome: boolean;
  firstSeen: string; // Changed from lastSeenAt for consistency
  createdAt: string; // Timestamp
  updatedAt: string; // Timestamp
}

export type ChatSessionStatus = 'pending' | 'active' | 'ended' | 'archived'; // pending instead of waiting for current logic
export type ChatPriority = 'low' | 'normal' | 'high' | 'vip';

export interface ChatSession {
  id: string; // UUID
  customerId: string; // UUID
  agentId?: string; // UUID
  status: ChatSessionStatus;
  priority?: ChatPriority;
  source?: string; // 'web', 'mobile', 'api'
  createdAt: string; // Timestamp. Renamed from startedAt for consistency
  endedAt?: string; // Timestamp
  lastMessageAt?: string; // Timestamp
  messageCount?: number;
  satisfactionRating?: number;
  welcomeSent?: boolean;
  tags?: string[];
  metadata?: Record<string, any>; // JSONB
  messages: ChatMessage[]; // Populated for UI
}

export type MessageSenderType = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string; // UUID
  sessionId?: string; // UUID
  sender: MessageSenderType; // simplified from senderType
  senderId?: string; // UUID of customer or user
  messageType?: MessageType;
  text: string; // simplified from content
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status?: MessageStatus;
  isWelcomeMessage?: boolean;
  metadata?: Record<string, any>; // JSONB
  timestamp: string; // Renamed from createdAt for consistency
  agentId?: string; // Keep for current logic
}

export interface QuickReply {
  id: string; // UUID
  agentId?: string; // UUID
  shortcut: string; // simplified from title
  message: string; // simplified from content
  category?: string;
  usageCount?: number;
  isActive?: boolean;
  createdAt?: string; // Timestamp
  updatedAt?: string; // Timestamp
}

export interface AgentSettings {
    welcomeMessage: string; // Simplified for now
    quickReplies: QuickReply[];
    blockedIps: string[];
    autoWelcomeEnabled?: boolean;
    soundNotifications?: boolean;
    autoReplyEnabled?: boolean;
    maxConcurrentSessions?: number;
    workingHours?: any; // JSONB
    breakDuration?: number; // minutes
}

// Simplified User for UI purposes, will be replaced by the main User type
export interface AppUser {
  id: string;
  role: 'admin' | 'agent';
  name: string;
  avatar?: string;
  shareId?: string;
  status?: AgentStatus;
}
