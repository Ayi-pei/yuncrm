/**
 * 类型安全工具函数
 * 替换代码中的 any 类型使用
 */

import type { ChatMessage, FileChatMessage, TextChatMessage } from './types';

// 类型守卫函数
export function isTextMessage(message: ChatMessage): message is TextChatMessage {
  return message.type === 'text';
}

export function isFileMessage(message: ChatMessage): message is FileChatMessage {
  return message.type === 'file';
}

// 安全的类型转换
export function assertTextMessage(message: ChatMessage): TextChatMessage {
  if (!isTextMessage(message)) {
    throw new Error(`Expected text message, got ${message.type}`);
  }
  return message;
}

export function assertFileMessage(message: ChatMessage): FileChatMessage {
  if (!isFileMessage(message)) {
    throw new Error(`Expected file message, got ${message.type}`);
  }
  return message;
}

// QR 码样式类型
export type QRStyle = 'none' | 'icon' | 'avatar';

export interface QRCodeConfig {
  id: string;
  value: string;
  size: number;
  level: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };
}

// 创建密钥的数据类型
export interface CreateKeyData {
  name: string;
  key_type: 'admin' | 'agent';
  notes?: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

// 分页类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 操作结果类型
export type OperationResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// 异步操作状态
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 表单验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}