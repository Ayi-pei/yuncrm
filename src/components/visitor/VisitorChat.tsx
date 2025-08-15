

"use client";

import { useEffect, useRef, useState } from "react";
import { mockApi } from "@/lib/mock-api";
import type { Agent, ChatMessage, ChatSession, Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { redactPii } from "@/ai/flows/redact-pii";

interface VisitorChatProps {
    aliasToken: string;
}

type ChatData = {
    agent: Pick<Agent, "name" | "avatar" | "status">;
    session: ChatSession;
    customer: Customer;
};

export function VisitorChat({ aliasToken }: VisitorChatProps) {
    const [data, setData] = useState<ChatData | null>(null);
    const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isRedacting, setIsRedacting] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            if (!aliasToken) {
                setError("无效的聊天链接。");
                setIsLoading(false);
                return;
            }
            try {
                // The API now creates a session if the token is valid, or returns null.
                const chatData = await mockApi.getChatDataForVisitorByToken(aliasToken);
                if (!chatData) {
                    setError("此聊天链接无效或已过期。");
                } else {
                    setData(chatData);
                }
            } catch (e) {
                setError("无法启动聊天会话。请稍后重试。");
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }, [aliasToken]);

    useEffect(() => {
        if (data?.session?.messages) {
            const welcomeMessages = data.session.messages.filter(m => m.sender === 'agent');
            const otherMessages = data.session.messages.filter(m => m.sender !== 'agent');

            if (welcomeMessages.length > 0) {
                setDisplayedMessages([welcomeMessages[0], ...otherMessages]);
                if (welcomeMessages.length > 1) {
                    const timer = setTimeout(() => {
                        setDisplayedMessages(current => {
                            const currentIds = new Set(current.map(m => m.id));
                            if (!currentIds.has(welcomeMessages[1].id)) {
                                return [...current, welcomeMessages[1]];
                            }
                            return current;
                        });
                    }, 3000); 
                    return () => clearTimeout(timer);
                }
            } else {
                 setDisplayedMessages(data.session.messages);
            }
        }
    }, [data?.session?.messages]);

     useEffect(() => {
        if (data?.session.id) {
            const handleManualPoll = async () => {
                 const updatedSession = await mockApi.getSessionUpdates(data.session.id);
                  if (updatedSession && data.session) {
                     const currentMessageCount = data.session.messages.length;
                     if (updatedSession.messages.length > currentMessageCount) {
                         // Update data silently and let the message effect handle display
                         setData(d => d ? { ...d, session: updatedSession } : null);
                     }
                 }
            }
            const timer = setInterval(handleManualPoll, 1500);
            return () => clearInterval(timer);
        }
    }, [data?.session.id, data?.session.messages.length]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [displayedMessages]);

    const handleSend = async () => {
        if (!message.trim() || !data) return;
        setIsSending(true);
        const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
            type: 'text',
            text: message, 
            sender: 'customer', 
        };
        try {
            const sentMessage = await mockApi.sendMessage(data.session.id, newMessage);
            setData(d => d ? { ...d, session: { ...d.session, messages: [...d.session.messages, sentMessage]}} : null);
            setDisplayedMessages(current => [...current, sentMessage]);
            setMessage("");

        } catch(e) {
            console.error("Failed to send message", e);
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
    
    const { agent, customer, session } = data;

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
                    {displayedMessages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((msg) => (
                         <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'customer' && "justify-end")}>
                           {msg.sender === 'agent' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={agent.avatar} />
                                    <AvatarFallback>{agent.name[0]}</AvatarFallback>
                                </Avatar>
                           )}
                           <div className={cn("max-w-md p-3 rounded-2xl", msg.sender === 'customer' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                <p className="text-sm">{msg.type === 'text' ? msg.text : (msg as any).file.name}</p>
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
