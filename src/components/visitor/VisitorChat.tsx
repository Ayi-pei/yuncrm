"use client";

import { useEffect, useRef, useState } from "react";
import { mockApi } from "@/lib/mock-api";
import type { Agent, ChatMessage, ChatSession, Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { redactPii } from "@/ai/flows/redact-pii";

interface VisitorChatProps {
    shareId: string;
}

type ChatData = {
    agent: Pick<Agent, "name" | "avatar" | "status">;
    session: ChatSession;
    customer: Customer;
};

export function VisitorChat({ shareId }: VisitorChatProps) {
    const [data, setData] = useState<ChatData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isRedacting, setIsRedacting] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                // In a real app, you might want to prevent re-fetching if data already exists.
                const chatData = await mockApi.getChatDataForVisitor(shareId);
                if (!chatData) {
                    setError("此聊天链接无效或代理不再可用。");
                } else {
                    setData(chatData);
                }
            } catch (e) {
                setError("无法启动聊天会话。");
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }, [shareId]);

    // Polling is removed to prevent duplicate messages from race conditions.
    // In a real app, use WebSockets (e.g., Socket.io, Firebase Realtime DB) for live updates.
    useEffect(() => {
        if (data?.session.id) {
            const handleManualPoll = async () => {
                 const updatedSession = await mockApi.getSessionUpdates(data.session.id);
                 if (updatedSession && updatedSession.messages.length > data.session.messages.length) {
                     setData(d => d ? { ...d, session: updatedSession } : null);
                 }
            }
            // This is a simplified stand-in for a proper real-time solution.
            // It just checks once after a short delay.
            const timer = setTimeout(handleManualPoll, 1500);
            return () => clearTimeout(timer);
        }
    }, [data?.session.id, data?.session.messages.length]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [data?.session.messages]);

    const handleSend = async () => {
        if (!message.trim() || !data) return;
        setIsSending(true);
        const newMessage: ChatMessage = {
            id: '', // will be set by mock api
            text: message, 
            sender: 'customer', 
            timestamp: new Date().toISOString()
        };
        try {
            const sentMessage = await mockApi.sendMessage(data.session.id, newMessage);
            // The state update now fully relies on the API response
            setData(d => {
                if (!d) return null;
                const newMessages = [...d.session.messages, sentMessage];
                // Simple deduplication based on ID to be safe
                const uniqueMessages = Array.from(new Map(newMessages.map(m => [m.id, m])).values());
                return { ...d, session: { ...d.session, messages: uniqueMessages } };
            });
            setMessage("");
        } catch(e) {
            console.error("Failed to send message", e);
            // Optionally: show an error to the user
        } finally {
            setIsSending(false);
        }
    };

    const handleRedact = async () => {
        if (!message.trim()) return;
        setIsRedacting(true);
        try {
            const result = await redactPii({ message });
            setMessage(result.redactedMessage);
        } finally {
            setIsRedacting(false);
        }
    };
    
    const translateStatus = (status: 'online' | 'busy' | 'offline') => {
        switch(status) {
            case 'online': return '在线';
            case 'busy': return '忙碌';
            case 'offline': return '离线';
        }
    }

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error || !data) {
        return <div className="flex-1 flex items-center justify-center p-4 text-center text-destructive">{error || "发生意外错误。"}</div>;
    }
    
    const { agent, session, customer } = data;

    return (
        <>
            <header className="p-4 border-b flex items-center gap-4 bg-muted/30 rounded-t-2xl">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback>{agent.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold text-lg">{agent.name}</h2>
                    <p className="text-xs text-muted-foreground capitalize">{translateStatus(agent.status)}</p>
                </div>
            </header>
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-6 space-y-6">
                    {session.messages.map((msg) => (
                         <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'customer' && "justify-end")}>
                           {msg.sender === 'agent' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={agent.avatar} />
                                    <AvatarFallback>{agent.name[0]}</AvatarFallback>
                                </Avatar>
                           )}
                           <div className={cn("max-w-md p-3 rounded-2xl", msg.sender === 'customer' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                <p className="text-sm">{msg.text}</p>
                           </div>
                            {msg.sender === 'customer' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={customer.avatar} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                           )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
             <footer className="p-4 border-t bg-muted/30 rounded-b-2xl">
                <div className="relative">
                    <Textarea 
                        placeholder="输入您的消息..." 
                        className="pr-32 bg-background"
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleRedact} disabled={isRedacting || !message}>
                            {isRedacting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                        <Button onClick={handleSend} disabled={!message || isSending}>
                           {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} 发送
                        </Button>
                    </div>
                </div>
            </footer>
        </>
    );
}

function LoadingSkeleton() {
    return (
      <div className="flex flex-col h-full">
        <header className="p-4 border-b flex items-center gap-4 bg-muted/30 rounded-t-2xl">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </header>
        <div className="flex-1 p-6 space-y-6">
            <div className="flex items-end gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 w-2/3 rounded-2xl" />
            </div>
             <div className="flex items-end gap-3 justify-end">
                <Skeleton className="h-12 w-1/2 rounded-2xl" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
        <footer className="p-4 border-t bg-muted/30 rounded-b-2xl">
            <Skeleton className="h-16 w-full rounded-lg" />
        </footer>
      </div>
    );
  }
