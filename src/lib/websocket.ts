/**
 * WebSocket 管理系统
 * 替代轮询机制，提供实时通信能力
 */

import { logger } from "./logger";
import { ErrorHandler, ErrorCode } from "./error-handler";
import { AppConfig } from "./config";

export enum WebSocketEventType {
  MESSAGE_RECEIVED = "message_received",
  SESSION_UPDATED = "session_updated",
  AGENT_STATUS_CHANGED = "agent_status_changed",
  CUSTOMER_JOINED = "customer_joined",
  CUSTOMER_LEFT = "customer_left",
  KEY_EXPIRED = "key_expired",
  TYPING_INDICATOR = "typing_indicator",
}

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
  id: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export type WebSocketEventHandler = (data: any) => void;

export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<WebSocketEventType, Set<WebSocketEventHandler>> =
    new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private userId: string | null = null;
  private userRole: "admin" | "agent" | "visitor" | null = null;

  private constructor(config: WebSocketConfig) {
    this.config = config;
    this.initializeEventHandlers();
  }

  static getInstance(config?: WebSocketConfig): WebSocketManager {
    if (!WebSocketManager.instance) {
      const defaultConfig: WebSocketConfig = {
        url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws",
        reconnectInterval: AppConfig.websocket.reconnectInterval,
        maxReconnectAttempts: AppConfig.websocket.maxReconnectAttempts,
        heartbeatInterval: AppConfig.websocket.heartbeatInterval,
      };
      WebSocketManager.instance = new WebSocketManager(config || defaultConfig);
    }
    return WebSocketManager.instance;
  }

  // 初始化事件处理器
  private initializeEventHandlers(): void {
    Object.values(WebSocketEventType).forEach((type) => {
      this.eventHandlers.set(type, new Set());
    });
  }

  // 连接WebSocket
  async connect(
    userId: string,
    userRole: "admin" | "agent" | "visitor"
  ): Promise<boolean> {
    if (this.isConnecting || this.isConnected()) {
      logger.warn("WebSocket already connecting or connected");
      return this.isConnected();
    }

    this.isConnecting = true;
    this.userId = userId;
    this.userRole = userRole;

    try {
      const wsUrl = `${this.config.url}?userId=${encodeURIComponent(
        userId
      )}&role=${userRole}`;
      this.ws = new WebSocket(wsUrl);

      await this.setupWebSocketListeners();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.isConnecting = false;
          resolve(false);
        }, 10000); // 10秒超时

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          logger.info("WebSocket connected", { userId, userRole });
          resolve(true);
        };
      });
    } catch (error) {
      this.isConnecting = false;
      ErrorHandler.handle(error, "WebSocket.connect");
      return false;
    }
  }

  // 设置WebSocket监听器
  private async setupWebSocketListeners(): Promise<void> {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logger.error("Failed to parse WebSocket message", error as Error);
      }
    };

    this.ws.onclose = (event) => {
      logger.info("WebSocket closed", {
        code: event.code,
        reason: event.reason,
      });
      this.stopHeartbeat();

      if (
        !event.wasClean &&
        this.reconnectAttempts < this.config.maxReconnectAttempts
      ) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      logger.error("WebSocket error occurred", error as any);
      ErrorHandler.handle(
        ErrorHandler.createError(ErrorCode.NETWORK_ERROR, "WebSocket连接错误"),
        "WebSocket.error"
      );
    };
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          logger.error(
            `Error in WebSocket event handler for ${message.type}`,
            error as Error
          );
        }
      });
    } else {
      logger.warn("No handlers registered for WebSocket event", {
        type: message.type,
      });
    }
  }

  // 发送消息
  send(type: WebSocketEventType, data: any): boolean {
    if (!this.isConnected()) {
      logger.warn("Cannot send message: WebSocket not connected");
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };

      this.ws!.send(JSON.stringify(message));
      logger.debug("WebSocket message sent", {
        type,
        dataSize: JSON.stringify(data).length,
      });
      return true;
    } catch (error) {
      ErrorHandler.handle(error, "WebSocket.send");
      return false;
    }
  }

  // 订阅事件
  on(
    eventType: WebSocketEventType,
    handler: WebSocketEventHandler
  ): () => void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
      logger.debug(`Handler registered for ${eventType}`);
    }

    // 返回取消订阅函数
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        logger.debug(`Handler unregistered for ${eventType}`);
      }
    };
  }

  // 取消订阅事件
  off(eventType: WebSocketEventType, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // 断开连接
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.userId = null;
    this.userRole = null;
    logger.info("WebSocket disconnected");
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 获取连接状态
  getConnectionState(): string {
    if (!this.ws) return "DISCONNECTED";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "CONNECTED";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }

  // 计划重连
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      AppConfig.websocket.heartbeatInterval // 使用配置中的心跳间隔作为最大延迟
    );

    logger.info(`Scheduling WebSocket reconnect in ${delay}ms`, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId && this.userRole) {
        this.connect(this.userId, this.userRole);
      }
    }, delay);
  }

  // 启动心跳
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(WebSocketEventType.TYPING_INDICATOR, { type: "heartbeat" });
      }
    }, this.config.heartbeatInterval);
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 获取统计信息
  getStats() {
    return {
      connected: this.isConnected(),
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      userRole: this.userRole,
      registeredHandlers: Array.from(this.eventHandlers.entries()).map(
        ([type, handlers]) => ({
          type,
          count: handlers.size,
        })
      ),
    };
  }
}

// 单例实例
export const wsManager = WebSocketManager.getInstance();
