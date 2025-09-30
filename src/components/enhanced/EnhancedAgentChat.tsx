/**
 * 增强版坐席聊天组件
 * 集成了所有优化：错误处理、性能监控、WebSocket、配置管理
 */

"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useChatWebSocket } from "@/hooks/use-websocket";
import { ErrorHandler, ErrorCode } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { AppConfig } from "@/lib/config";
import { usePerformanceMonitor, useDebounce } from "@/lib/performance";
import { isTextMessage, isFileMessage } from "@/lib/types-safe";
import { memoryManager } from "@/lib/memory-manager";
import { WebSocketEventType } from "@/lib/websocket";

interface EnhancedAgentChatProps {
  sessionId: string | null;
  className?: string;
}

export const EnhancedAgentChat = React.memo<EnhancedAgentChatProps>(
  ({ sessionId, className }) => {
    const { sessions, sendMessage, pollSessionUpdates, agent } =
      useAgentStore();

    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // WebSocket集成
    const { isConnected, send: sendWebSocketMessage } = useChatWebSocket();

    // 性能监控
    const { start: startSendTimer, end: endSendTimer } =
      usePerformanceMonitor("agent-send-message");

    // 防抖输入
    const debouncedMessage = useDebounce(
      message,
      AppConfig.ui.animationDuration
    );

    // 当前会话
    const currentSession = sessions.find((s) => s.id === sessionId);

    // 内存管理 - 注册清理任务
    useEffect(() => {
      if (sessionId) {
        memoryManager.registerCleanupTask(`session-${sessionId}`, () => {
          logger.debug("Cleaning up session resources", { sessionId });
        });

        return () => {
          memoryManager.unregisterCleanupTask(`session-${sessionId}`);
        };
      }
    }, [sessionId]);

    // 智能轮询 - 仅在WebSocket未连接时使用
    useEffect(() => {
      if (!sessionId || isConnected()) return; // 修复：调用函数

      logger.info("WebSocket not connected, falling back to polling", {
        sessionId,
      });

      memoryManager.setInterval(
        `polling-${sessionId}`,
        async () => {
          try {
            await pollSessionUpdates(sessionId);
          } catch (error) {
            ErrorHandler.handle(error, "EnhancedAgentChat.polling");
          }
        },
        AppConfig.polling.sessionPollInterval,
        true // immediate execution
      );

      return () => {
        memoryManager.clearTimer(`polling-${sessionId}`);
      };
    }, [sessionId, isConnected, pollSessionUpdates]);

    // 发送消息处理
    const handleSendMessage = useCallback(async () => {
      if (!currentSession || !debouncedMessage.trim() || isSending) {
        return;
      }

      // 验证消息长度
      if (debouncedMessage.length > AppConfig.security.maxMessageLength) {
        ErrorHandler.handle(
          ErrorHandler.createError(
            ErrorCode.VALIDATION_ERROR,
            `消息长度不能超过 ${AppConfig.security.maxMessageLength} 个字符`
          ),
          "EnhancedAgentChat.validateMessage"
        );
        return;
      }

      setIsSending(true);
      startSendTimer();

      try {
        // 尝试通过WebSocket发送
        if (isConnected()) {
          const success = sendWebSocketMessage(
            WebSocketEventType.MESSAGE_RECEIVED,
            {
              // 修复：使用枚举
              sessionId: currentSession.id,
              message: {
                type: "text",
                text: debouncedMessage.trim(),
              },
            }
          );

          if (!success) {
            throw new Error("WebSocket send failed");
          }

          logger.info("Message sent via WebSocket", {
            sessionId: currentSession.id,
            messageLength: debouncedMessage.length,
          });
        } else {
          // 降级到HTTP API
          logger.info("Sending message via HTTP API", {
            sessionId: currentSession.id,
          });

          await sendMessage(currentSession.id, {
            type: "text",
            text: debouncedMessage.trim(),
          });
        }

        setMessage("");

        const duration = endSendTimer();

        // 记录用户行为
        logger.logUserAction("agent_send_message", agent?.id || "unknown", {
          sessionId: currentSession.id,
          messageLength: debouncedMessage.length,
          duration,
          method: isConnected() ? "websocket" : "http", // 修复：调用函数
        });

        // 性能警告
        if (duration > AppConfig.ui.loadingDelayMs) {
          logger.logPerformance(
            "slow-message-send",
            duration,
            AppConfig.ui.loadingDelayMs
          );
        }
      } catch (error) {
        const appError = ErrorHandler.createError(
          ErrorCode.API_ERROR,
          "发送消息失败，请重试",
          {
            sessionId: currentSession.id,
            messageLength: debouncedMessage.length,
            connectionState: isConnected() ? "websocket" : "http", // 修复：调用函数
          },
          error as Error
        );

        ErrorHandler.handle(appError, "EnhancedAgentChat.sendMessage");
      } finally {
        setIsSending(false);
      }
    }, [
      currentSession,
      debouncedMessage,
      isSending,
      isConnected,
      sendMessage,
      sendWebSocketMessage,
      startSendTimer,
      endSendTimer,
      agent?.id,
    ]);

    // 键盘快捷键
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      },
      [handleSendMessage]
    );

    // 打字指示器
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // 通过WebSocket发送打字指示器
        if (isConnected() && currentSession) {
          sendWebSocketMessage(WebSocketEventType.TYPING_INDICATOR, {
            // 修复：使用枚举
            sessionId: currentSession.id,
            agentId: agent?.id,
            typing: e.target.value.length > 0,
          });
        }
      },
      [isConnected, currentSession, sendWebSocketMessage, agent?.id]
    );

    if (!currentSession) {
      return (
        <div className={`flex items-center justify-center h-full ${className}`}>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">请选择一个会话开始聊天</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected() ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              {isConnected() ? "WebSocket 已连接" : "使用 HTTP 模式"}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* 连接状态指示器 */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <span className="text-sm font-medium">会话: {currentSession.id}</span>
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected() ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-muted-foreground">
              {isConnected() ? "WebSocket" : "HTTP 轮询"}
            </span>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentSession.messages.map((msg) => {
            const isOwn = msg.sender === "agent";
            const content = isTextMessage(msg)
              ? msg.text
              : isFileMessage(msg)
              ? `📎 ${msg.file.name}`
              : "未知消息类型";

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md p-3 rounded-lg ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              id="enhanced-chat-message"
              name="enhanced-chat-message"
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="flex-1 resize-none border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              disabled={isSending}
              maxLength={AppConfig.security.maxMessageLength}
            />
            <button
              onClick={handleSendMessage}
              disabled={!debouncedMessage.trim() || isSending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isSending ? "发送中..." : "发送"}
            </button>
          </div>

          {/* 状态信息 */}
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>
              {message.length}/{AppConfig.security.maxMessageLength}
            </span>
            {isSending && (
              <span className="flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                {isConnected() ? "通过 WebSocket 发送" : "通过 HTTP 发送"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EnhancedAgentChat.displayName = "EnhancedAgentChat";
