/**
 * WebSocket React Hook
 * 提供组件级别的WebSocket集成
 */

import React, { useEffect, useCallback, useRef } from "react";
import {
  wsManager,
  WebSocketEventType,
  type WebSocketEventHandler,
} from "@/lib/websocket";
import { useAuthContext } from "@/lib/auth";
import { useAgentStore } from "@/lib/stores/agentStore";
import { logger } from "@/lib/logger";

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  events?: {
    [K in WebSocketEventType]?: WebSocketEventHandler;
  };
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, events = {} } = options;
  const { user } = useAuthContext();
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // 连接WebSocket
  const connect = useCallback(async () => {
    if (!user?.id || !user?.role) {
      logger.warn("Cannot connect WebSocket: user not available");
      return false;
    }

    const userRole =
      user.role === "admin"
        ? "admin"
        : user.role === "agent"
        ? "agent"
        : "visitor";
    return await wsManager.connect(user.id, userRole);
  }, [user]);

  // 断开连接
  const disconnect = useCallback(() => {
    // 清理所有事件订阅
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current = [];

    wsManager.disconnect();
  }, []);

  // 发送消息
  const send = useCallback((type: WebSocketEventType, data: any) => {
    return wsManager.send(type, data);
  }, []);

  // 订阅事件
  const subscribe = useCallback(
    (eventType: WebSocketEventType, handler: WebSocketEventHandler) => {
      const unsubscribe = wsManager.on(eventType, handler);
      unsubscribersRef.current.push(unsubscribe);
      return unsubscribe;
    },
    []
  );

  // 获取连接状态
  const getConnectionState = useCallback(() => {
    return wsManager.getConnectionState();
  }, []);

  const isConnected = useCallback(() => {
    return wsManager.isConnected();
  }, []);

  // 自动连接和事件订阅
  useEffect(() => {
    if (autoConnect && user?.id && user?.role) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, user?.role, connect, disconnect]);

  // 订阅传入的事件处理器
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    Object.entries(events).forEach(([eventType, handler]) => {
      if (handler) {
        const unsubscribe = wsManager.on(
          eventType as WebSocketEventType,
          handler
        );
        unsubscribers.push(unsubscribe);
      }
    });

    // 保存到ref中以便后续清理
    unsubscribersRef.current.push(...unsubscribers);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [events]);

  return {
    connect,
    disconnect,
    send,
    subscribe,
    isConnected,
    getConnectionState,
    connectionState: getConnectionState(),
  };
}

// 专用于聊天的WebSocket Hook
export function useChatWebSocket() {
  const { agent, sessions, pollSessionUpdates } = useAgentStore();

  return useWebSocket({
    autoConnect: true,
    events: {
      [WebSocketEventType.MESSAGE_RECEIVED]: (data) => {
        logger.info("New message received via WebSocket", data);
        // 更新对应会话的消息
        if (data.sessionId) {
          pollSessionUpdates(data.sessionId);
        }
      },

      [WebSocketEventType.SESSION_UPDATED]: (data) => {
        logger.info("Session updated via WebSocket", data);
        if (data.sessionId) {
          pollSessionUpdates(data.sessionId);
        }
      },

      [WebSocketEventType.CUSTOMER_JOINED]: (data) => {
        logger.info("Customer joined via WebSocket", data);
        // 刷新客户列表或创建新会话
        if (agent?.id) {
          // 可以触发重新获取agent数据
        }
      },

      [WebSocketEventType.CUSTOMER_LEFT]: (data) => {
        logger.info("Customer left via WebSocket", data);
        // 更新会话状态
      },

      [WebSocketEventType.AGENT_STATUS_CHANGED]: (data) => {
        logger.info("Agent status changed via WebSocket", data);
        // 如果是当前代理，更新状态
      },

      [WebSocketEventType.KEY_EXPIRED]: (data) => {
        logger.warn("Key expired notification via WebSocket", data);
        // 显示密钥过期提醒
      },
    },
  });
}

// 访客聊天专用的WebSocket Hook
export function useVisitorWebSocket(sessionId: string | null) {
  return useWebSocket({
    autoConnect: !!sessionId,
    events: {
      [WebSocketEventType.MESSAGE_RECEIVED]: (data) => {
        if (data.sessionId === sessionId) {
          logger.info("Visitor received new message via WebSocket", data);
          // 触发消息更新
          window.dispatchEvent(
            new CustomEvent("websocket-message-received", {
              detail: data,
            })
          );
        }
      },

      [WebSocketEventType.AGENT_STATUS_CHANGED]: (data) => {
        logger.info("Agent status changed for visitor", data);
        // 更新代理状态显示
        window.dispatchEvent(
          new CustomEvent("websocket-agent-status-changed", {
            detail: data,
          })
        );
      },

      [WebSocketEventType.TYPING_INDICATOR]: (data) => {
        if (data.sessionId === sessionId && data.type !== "heartbeat") {
          // 显示打字指示器
          window.dispatchEvent(
            new CustomEvent("websocket-typing-indicator", {
              detail: data,
            })
          );
        }
      },
    },
  });
}
