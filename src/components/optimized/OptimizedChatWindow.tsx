/**
 * 优化后的聊天窗口组件示例
 * 展示如何应用性能优化和最佳实践
 */

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useAgentStore } from "@/lib/stores/agentStore";
import {
  useSmartPolling,
  usePerformanceMonitor,
  useDebounce,
} from "@/lib/performance";
import { ErrorHandler, ErrorCode } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { isTextMessage, isFileMessage } from "@/lib/types-safe";
import { AppConfig } from "@/lib/config";
import type { ChatMessage, ChatSession } from "@/lib/types";

interface OptimizedChatWindowProps {
  session: ChatSession | null;
  className?: string;
}

// 优化的消息项组件
const MessageItem = React.memo<{ message: ChatMessage; isOwn: boolean }>(
  ({ message, isOwn }) => {
    const messageContent = useMemo(() => {
      if (isTextMessage(message)) {
        return message.text;
      }
      if (isFileMessage(message)) {
        return `📎 ${message.file.name}`;
      }
      return "未知消息类型";
    }, [message]);

    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`max-w-md p-3 rounded-lg ${
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          <p className="text-sm">{messageContent}</p>
          <span className="text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // 自定义比较函数，只有消息内容变化时才重新渲染
    return (
      prev.message.id === next.message.id &&
      prev.isOwn === next.isOwn &&
      prev.message.timestamp === next.message.timestamp
    );
  }
);

MessageItem.displayName = "MessageItem";

export const OptimizedChatWindow = React.memo<OptimizedChatWindowProps>(
  ({ session, className }) => {
    const { sendMessage, pollSessionUpdates } = useAgentStore();
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // 防抖输入
    const debouncedMessage = useDebounce(message, 300);

    // 性能监控
    const { start: startSendTimer, end: endSendTimer } =
      usePerformanceMonitor("send-message");

    // 智能轮询 - 页面不可见时自动停止
    useSmartPolling(
      useCallback(async () => {
        if (session?.id) {
          try {
            await pollSessionUpdates(session.id);
          } catch (error) {
            ErrorHandler.handle(error, "OptimizedChatWindow.polling");
          }
        }
      }, [session?.id, pollSessionUpdates]),
      AppConfig.polling.chatUpdateInterval,
      !!session?.id
    );

    // 优化的消息列表
    const messageList = useMemo(() => {
      if (!session?.messages) return [];

      return session.messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.sender === "agent"}
        />
      ));
    }, [session?.messages]);

    // 发送消息处理
    const handleSendMessage = useCallback(async () => {
      if (!session?.id || !debouncedMessage.trim() || isSending) {
        return;
      }

      setIsSending(true);
      startSendTimer();

      try {
        await sendMessage(session.id, {
          type: "text",
          text: debouncedMessage.trim(),
        });

        setMessage("");

        logger.logUserAction("send_message", session.id, {
          messageLength: debouncedMessage.length,
          sessionId: session.id,
        });
      } catch (error) {
        const appError = ErrorHandler.createError(
          ErrorCode.API_ERROR,
          "发送消息失败",
          { sessionId: session.id, messageLength: debouncedMessage.length }
        );
        ErrorHandler.handle(appError, "OptimizedChatWindow.sendMessage");
      } finally {
        setIsSending(false);
        const duration = endSendTimer();

        // 如果发送时间过长，记录性能警告
        if (duration > AppConfig.ui.loadingDelayMs) {
          logger.warn("Slow message send detected", {
            duration,
            sessionId: session.id,
          });
        }
      }
    }, [
      session?.id,
      debouncedMessage,
      isSending,
      sendMessage,
      startSendTimer,
      endSendTimer,
    ]);

    // 键盘事件处理
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      },
      [handleSendMessage]
    );

    // 如果没有会话，显示空状态
    if (!session) {
      return (
        <div className={`flex items-center justify-center h-full ${className}`}>
          <p className="text-muted-foreground">请选择一个会话开始聊天</p>
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messageList.length > 0 ? (
            messageList
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">暂无消息</p>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              id="optimized-chat-message"
              name="optimized-chat-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className="flex-1 resize-none border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
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

          {/* 字符计数 */}
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {message.length}/{AppConfig.security.maxMessageLength}
          </div>
        </div>
      </div>
    );
  }
);

OptimizedChatWindow.displayName = "OptimizedChatWindow";
