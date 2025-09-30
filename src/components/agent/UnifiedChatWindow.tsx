"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useAuthContext } from "@/lib/auth";
import { useChatWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { ErrorHandler, ErrorCode } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { AppConfig } from "@/lib/config";
import { usePerformanceMonitor, useDebounce } from "@/lib/performance";
import { isTextMessage, isFileMessage } from "@/lib/types-safe";
import { memoryManager } from "@/lib/memory-manager";
import { WebSocketEventType } from "@/lib/websocket";
import { redactPii } from "@/ai/flows/redact-pii";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

import type {
  ChatSession,
  FileChatMessage,
  TextChatMessage,
  Customer,
} from "@/lib/types";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CircularProgress } from "../shared/CircularProgress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { QuickReplies } from "./QuickReplies";
import { Label } from "../ui/label";

// Icons
import {
  Send,
  Sparkles,
  Loader2,
  User as UserIcon,
  Smile,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Ban,
  Dot,
  Globe,
  HardDrive,
  MapPin,
  Calendar,
  CheckCircle,
  Archive,
  Wifi,
  WifiOff,
} from "lucide-react";

interface UnifiedChatWindowProps {
  session: ChatSession;
  customer: Customer;
  className?: string;
  // 配置选项
  showCustomerDetails?: boolean;
  enableWebSocket?: boolean;
  enableAIRedaction?: boolean;
  enablePerformanceMonitoring?: boolean;
}

const EMOJIS = [
  "😀",
  "😂",
  "😊",
  "😍",
  "🤔",
  "😢",
  "😠",
  "😮",
  "👍",
  "👎",
  "❤️",
  "💔",
  "🎉",
  "🔥",
  "🙏",
  "🙌",
  "👏",
  "💪",
  "💯",
  "✨",
  "✅",
  "❌",
  "❓",
  "💡",
];

// 优化的消息项组件
const MessageItem = React.memo<{
  message: TextChatMessage | FileChatMessage;
  isOwn: boolean;
  customer: Customer;
  agent: any;
}>(
  ({ message, isOwn, customer, agent }) => {
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
      <div className={cn("flex items-end gap-3", isOwn && "justify-end")}>
        {!isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={customer.avatar} />
            <AvatarFallback>
              <UserIcon />
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            "max-w-md p-3 rounded-2xl",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted rounded-bl-none"
          )}
        >
          {isTextMessage(message) ? (
            <p className="text-sm">{message.text}</p>
          ) : (
            <a
              href={message.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <CircularProgress progress={message.file.progress} />
              <div>
                <p className="text-sm font-medium break-all underline">
                  {message.file.name}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isOwn
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {formatFileSize(message.file.size)}
                </p>
              </div>
            </a>
          )}
          <p
            className={cn(
              "text-xs mt-1 text-right",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground/70"
            )}
          >
            {format(new Date(message.timestamp), "HH:mm", { locale: zhCN })}
          </p>
        </div>
        {isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={agent?.avatar} />
            <AvatarFallback>{agent?.name?.[0] || "A"}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.message.id === next.message.id &&
      prev.isOwn === next.isOwn &&
      prev.message.timestamp === next.message.timestamp
    );
  }
);

MessageItem.displayName = "MessageItem";

export const UnifiedChatWindow = React.memo<UnifiedChatWindowProps>(
  ({
    session,
    customer,
    className,
    showCustomerDetails = true,
    enableWebSocket = true,
    enableAIRedaction = true,
    enablePerformanceMonitoring = true,
  }) => {
    const { user } = useAuthContext();
    const {
      agent,
      sendMessage,
      settings,
      sendFileMessage,
      blockCustomer,
      unblockCustomer,
      archiveSession,
      pollSessionUpdates,
    } = useAgentStore();

    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isRedacting, setIsRedacting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // WebSocket集成（可选）
    const { isConnected, send: sendWebSocketMessage } = enableWebSocket
      ? useChatWebSocket()
      : { isConnected: () => false, send: () => false };

    // 性能监控（可选）
    const { start: startSendTimer, end: endSendTimer } =
      enablePerformanceMonitoring
        ? usePerformanceMonitor("unified-chat-send-message")
        : { start: () => {}, end: () => 0 };

    // 防抖输入
    const debouncedMessage = useDebounce(
      message,
      AppConfig.ui.animationDuration
    );

    const isCustomerBlocked = customer?.ipAddress
      ? settings?.blockedIps.includes(customer.ipAddress)
      : false;
    const isArchived = session?.status === "archived";

    const customerDetails = useMemo(
      () => [
        { icon: Globe, label: "IP 地址", value: customer.ipAddress },
        { icon: HardDrive, label: "设备", value: customer.device },
        { icon: MapPin, label: "位置", value: customer.location },
        {
          icon: Calendar,
          label: "首次访问",
          value: format(new Date(customer.firstSeen), "PPP", { locale: zhCN }),
        },
      ],
      [customer]
    );

    // 内存管理和清理
    useEffect(() => {
      if (session.id) {
        memoryManager.registerCleanupTask(`chat-${session.id}`, () => {
          logger.debug("Cleaning up chat resources", { sessionId: session.id });
        });

        return () => {
          memoryManager.unregisterCleanupTask(`chat-${session.id}`);
        };
      }
    }, [session.id]);

    // 智能轮询（WebSocket未连接时）
    useEffect(() => {
      if (!enableWebSocket || isConnected()) return;

      logger.info("WebSocket not available, using polling", {
        sessionId: session.id,
      });

      memoryManager.setInterval(
        `polling-${session.id}`,
        async () => {
          try {
            await pollSessionUpdates(session.id);
          } catch (error) {
            ErrorHandler.handle(error, "UnifiedChatWindow.polling");
          }
        },
        AppConfig.polling.sessionPollInterval,
        true
      );

      return () => {
        memoryManager.clearTimer(`polling-${session.id}`);
      };
    }, [session.id, enableWebSocket, isConnected, pollSessionUpdates]);

    // 自动滚动到底部
    useEffect(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, [session.messages]);

    // 发送消息处理
    const handleSendMessage = useCallback(async () => {
      if (!debouncedMessage.trim() || isCustomerBlocked || isSending) return;

      // 验证消息长度
      if (debouncedMessage.length > AppConfig.security.maxMessageLength) {
        toast({
          title: "消息过长",
          description: `消息长度不能超过 ${AppConfig.security.maxMessageLength} 个字符`,
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      enablePerformanceMonitoring && startSendTimer();

      try {
        const textMessage: Omit<
          TextChatMessage,
          "id" | "timestamp" | "sender" | "agentId"
        > = {
          type: "text",
          text: debouncedMessage.trim(),
        };

        // 优先使用WebSocket
        if (enableWebSocket && isConnected()) {
          const success = sendWebSocketMessage(
            WebSocketEventType.MESSAGE_RECEIVED,
            {
              sessionId: session.id,
              message: textMessage,
            }
          );

          if (!success) {
            throw new Error("WebSocket send failed");
          }

          logger.info("Message sent via WebSocket", {
            sessionId: session.id,
            messageLength: debouncedMessage.length,
          });
        } else {
          // 降级到HTTP API
          await sendMessage(session.id, textMessage);
          logger.info("Message sent via HTTP", {
            sessionId: session.id,
            messageLength: debouncedMessage.length,
          });
        }

        setMessage("");

        const duration = enablePerformanceMonitoring ? endSendTimer() : 0;

        // 记录用户行为
        logger.logUserAction("send_message", user?.id || "unknown", {
          sessionId: session.id,
          messageLength: debouncedMessage.length,
          duration,
          method: enableWebSocket && isConnected() ? "websocket" : "http",
        });

        // 性能警告
        if (
          enablePerformanceMonitoring &&
          duration > AppConfig.ui.loadingDelayMs
        ) {
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
            sessionId: session.id,
            messageLength: debouncedMessage.length,
            connectionState:
              enableWebSocket && isConnected() ? "websocket" : "http",
          },
          error as Error
        );
        ErrorHandler.handle(appError, "UnifiedChatWindow.sendMessage");
      } finally {
        setIsSending(false);
      }
    }, [
      debouncedMessage,
      isCustomerBlocked,
      isSending,
      session.id,
      enableWebSocket,
      isConnected,
      sendWebSocketMessage,
      sendMessage,
      user?.id,
      enablePerformanceMonitoring,
      startSendTimer,
      endSendTimer,
      toast,
    ]);

    // AI脱敏处理
    const handleRedact = useCallback(async () => {
      if (!enableAIRedaction || !message.trim()) return;

      setIsRedacting(true);
      try {
        const result = await redactPii({ message });
        setMessage(result.redactedMessage);
        toast({
          title: "AI脱敏完成",
          description: "已自动处理敏感信息",
        });
      } catch (error) {
        ErrorHandler.handle(error, "UnifiedChatWindow.redactMessage");
        toast({
          title: "处理失败",
          description: "无法处理您的消息",
          variant: "destructive",
        });
      } finally {
        setIsRedacting(false);
      }
    }, [enableAIRedaction, message, toast]);

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

    // 打字指示器
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // WebSocket打字指示器
        if (enableWebSocket && isConnected()) {
          sendWebSocketMessage(WebSocketEventType.TYPING_INDICATOR, {
            sessionId: session.id,
            agentId: agent?.id,
            typing: e.target.value.length > 0,
          });
        }
      },
      [
        enableWebSocket,
        isConnected,
        sendWebSocketMessage,
        session.id,
        agent?.id,
      ]
    );

    const handleEmojiSelect = useCallback((emoji: string) => {
      setMessage((prev) => prev + emoji);
    }, []);

    const handleAttachmentClick = useCallback((type: "file" | "image") => {
      if (type === "file") {
        fileInputRef.current?.click();
      } else {
        imageInputRef.current?.click();
      }
    }, []);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && agent) {
          sendFileMessage(session.id, file);
        }
        e.target.value = "";
      },
      [agent, sendFileMessage, session.id]
    );

    const toggleRecording = useCallback(() => {
      setIsRecording(!isRecording);
      toast({
        title: isRecording ? "录音已停止" : "开始录音...",
        description: "语音输入功能正在开发中",
      });
    }, [isRecording, toast]);

    const handleToggleBlock = useCallback(() => {
      if (!customer.ipAddress) {
        toast({
          title: "操作失败",
          description: "该客户没有IP地址，无法拉黑",
          variant: "destructive",
        });
        return;
      }

      if (isCustomerBlocked) {
        unblockCustomer(customer.ipAddress);
        toast({ title: "客户已解除拉黑" });
      } else {
        blockCustomer(customer.ipAddress);
        toast({
          title: "客户已被拉黑",
          description: "您将不会再收到该IP地址的消息",
        });
      }
    }, [
      customer.ipAddress,
      isCustomerBlocked,
      unblockCustomer,
      blockCustomer,
      toast,
    ]);

    const handleArchive = useCallback(() => {
      archiveSession(session.id);
      toast({ title: "会话已归档" });
    }, [archiveSession, session.id, toast]);

    // 优化的消息列表
    const messageList = useMemo(() => {
      return session.messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.sender === "agent"}
          customer={customer}
          agent={agent}
        />
      ));
    }, [session.messages, customer, agent]);

    if (!customer || !agent) return null;

    return (
      <main className={cn("flex flex-1", className)}>
        <div className="flex-1 flex flex-col h-full bg-background">
          {/* 头部 */}
          <header className="p-4 border-b flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={customer.avatar} />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">{customer.name}</h2>
                <p className="text-xs text-muted-foreground">
                  会话开始于:{" "}
                  {format(new Date(session.createdAt), "PPP HH:mm", {
                    locale: zhCN,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* WebSocket连接状态 */}
              {enableWebSocket && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isConnected() ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-yellow-500" />
                  )}
                  <span className="hidden sm:inline">
                    {isConnected() ? "实时" : "轮询"}
                  </span>
                </div>
              )}

              {/* 客户详情 */}
              {showCustomerDetails && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle>客户详情</SheetTitle>
                      <SheetDescription>
                        查看客户信息，使用快捷回复，或执行操作。
                      </SheetDescription>
                    </SheetHeader>
                    <aside className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
                      {isArchived && (
                        <div className="absolute inset-0 bg-background/80 z-10 flex flex-col items-center justify-center text-center p-4">
                          <Archive className="h-10 w-10 text-muted-foreground mb-4" />
                          <p className="font-semibold text-lg">会话已归档</p>
                          <p className="text-sm text-muted-foreground">
                            您可以从归档列表中恢复此会话。
                          </p>
                        </div>
                      )}

                      <div className="text-center flex flex-col items-center flex-shrink-0">
                        <Avatar className="h-24 w-24 border-2 border-primary mb-4">
                          <AvatarImage src={customer.avatar} />
                          <AvatarFallback>{customer.name[0]}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{customer.name}</h2>
                      </div>

                      <Tabs
                        defaultValue="info"
                        className="flex-1 flex flex-col min-h-0"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="info">客户信息</TabsTrigger>
                          <TabsTrigger value="replies">快捷回复</TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="info"
                          className="flex-1 mt-4 min-h-0"
                        >
                          <ScrollArea className="h-full">
                            <div className="flex flex-col gap-6 pr-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">
                                    客户信息
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {customerDetails.map((detail) => (
                                    <div
                                      key={detail.label}
                                      className="flex items-start gap-3 text-sm"
                                    >
                                      <detail.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <p className="text-muted-foreground">
                                          {detail.label}
                                        </p>
                                        <p className="font-medium">
                                          {detail.value}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent
                          value="replies"
                          className="flex-1 mt-4 min-h-0"
                        >
                          <QuickReplies />
                        </TabsContent>
                      </Tabs>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1",
                            isCustomerBlocked &&
                              "bg-yellow-400 hover:bg-yellow-500 text-black"
                          )}
                          onClick={handleToggleBlock}
                          disabled={!customer.ipAddress}
                        >
                          {isCustomerBlocked ? (
                            <CheckCircle className="mr-2" />
                          ) : (
                            <Ban className="mr-2" />
                          )}
                          {isCustomerBlocked ? "解除" : "拉黑"}
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleArchive}
                        >
                          <Archive className="mr-2" />
                          归档
                        </Button>
                      </div>
                    </aside>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </header>

          {/* 消息列表 */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-6 space-y-6">
              {messageList.length > 0 ? (
                messageList
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">暂无消息</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 */}
          <footer className="p-4 border-t">
            <div className="relative">
              {isCustomerBlocked && (
                <div className="absolute inset-0 bg-background/80 z-10 flex flex-col items-center justify-center rounded-lg">
                  <Ban className="h-8 w-8 text-destructive mb-2" />
                  <p className="font-semibold">用户已被拉黑</p>
                  <p className="text-sm text-muted-foreground">
                    您无法向该用户发送消息。
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                      >
                        <Smile />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJIS.map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEmojiSelect(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-muted-foreground",
                      isRecording && "text-red-500 bg-red-500/10"
                    )}
                    onClick={toggleRecording}
                  >
                    <Mic />
                    {isRecording && (
                      <Dot className="absolute -top-1 -right-1 text-red-500 animate-ping" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => handleAttachmentClick("file")}
                  >
                    <Paperclip />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => handleAttachmentClick("image")}
                  >
                    <ImageIcon />
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    title="上传文件"
                    aria-label="上传文件"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    title="上传图片"
                    aria-label="上传图片"
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="unified-chat-message" className="sr-only">
                    输入您的消息
                  </Label>
                  <Textarea
                    id="unified-chat-message"
                    placeholder="输入您的消息..."
                    className="pr-32"
                    rows={4}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    disabled={isCustomerBlocked || isSending}
                    maxLength={AppConfig.security.maxMessageLength}
                  />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {enableAIRedaction && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRedact}
                        disabled={isRedacting || !message || isCustomerBlocked}
                        title="AI脱敏处理"
                      >
                        {isRedacting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !debouncedMessage.trim() ||
                        isCustomerBlocked ||
                        isSending
                      }
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isSending ? "发送中" : "发送"}
                    </Button>
                  </div>
                </div>

                {/* 状态信息 */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    {message.length}/{AppConfig.security.maxMessageLength}
                  </span>
                  {isSending && (
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                      {enableWebSocket && isConnected()
                        ? "通过 WebSocket 发送"
                        : "通过 HTTP 发送"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    );
  }
);

UnifiedChatWindow.displayName = "UnifiedChatWindow";
