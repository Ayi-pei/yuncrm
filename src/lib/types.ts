export type UserRole = "admin" | "agent";

export interface AccessKey {
  id: string;
  key: string;
  role: UserRole;
  name: string;
  status: "active" | "suspended";
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export type AgentStatus = "online" | "busy" | "offline";

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  shareId: string;
  sessionLoad: number;
  maxLoad: number;
  accessKeyId: string;
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  avatar?: string;
  shareId?: string;
  status?: AgentStatus;
}

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  ipAddress: string;
  device: string;
  location: string;
  firstSeen: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "agent" | "customer";
  timestamp: string;
  agentId?: string;
}

export interface ChatSession {
  id: string;
  customerId: string;
  agentId: string;
  status: "pending" | "active" | "closed";
  createdAt: string;
  messages: ChatMessage[];
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