
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatSession } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Sparkles, Loader2, User as UserIcon, Smile, Mic, Paperclip, Image as ImageIcon, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/lib/stores/agentStore";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ScrollArea } from "../ui/scroll-area";
import { redactPii } from "@/ai/flows/redact-pii";

interface ChatWindowProps {
    session: ChatSession;
}

export function ChatWindow({ session }: ChatWindowProps) {
    const { agent, customers, sendMessage, settings } = useAgentStore();
    const customer = customers.find(c => c.id === session.customerId);
    const [message, setMessage] = useState("");
    const [isRedacting, setIsRedacting] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const isCustomerBlocked = customer?.ipAddress ? settings?.blockedIps.includes(customer.ipAddress) : false;

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [session.messages]);

    const handleSend = async () => {
        if (!message.trim() || isCustomerBlocked) return;
        await sendMessage(session.id, message);
        setMessage("");
    };
    
    const handleRedact = async () => {
        if (!message.trim()) return;
        setIsRedacting(true);
        try {
            const result = await redactPii({ message });
            setMessage(result.redactedMessage);
        } catch (error) {
            console.error("Failed to redact message:", error);
        } finally {
            setIsRedacting(false);
        }
    };

    if (!customer || !agent) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            <header className="p-4 border-b flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={customer.avatar} />
                    <AvatarFallback><UserIcon/></AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold text-lg">{customer.name}</h2>
                    <p className="text-xs text-muted-foreground">会话开始于: {format(new Date(session.createdAt), "PPP p", { locale: zhCN })}</p>
                </div>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-6 space-y-6">
                    {session.messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'agent' && "justify-end")}>
                           {msg.sender === 'customer' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={customer.avatar} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                           )}
                           <div className={cn(
                                "max-w-md p-3 rounded-2xl", 
                                msg.sender === 'agent' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                            )}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={cn("text-xs mt-1", msg.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                                    {format(new Date(msg.timestamp), 'p', { locale: zhCN })}
                                </p>
                           </div>
                            {msg.sender === 'agent' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={agent.avatar} />
                                    <AvatarFallback>{agent.name[0]}</AvatarFallback>
                                </Avatar>
                           )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <footer className="p-4 border-t">
                <div className="relative">
                    {isCustomerBlocked && (
                        <div className="absolute inset-0 bg-background/80 z-10 flex flex-col items-center justify-center rounded-lg">
                            <Ban className="h-8 w-8 text-destructive mb-2" />
                            <p className="font-semibold">用户已被拉黑</p>
                            <p className="text-sm text-muted-foreground">您无法向该用户发送消息。</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <Smile />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <Mic />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <Paperclip />
                            </Button>
                             <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <ImageIcon />
                            </Button>
                        </div>
                        <div className="relative">
                            <Textarea 
                                placeholder="输入您的消息..." 
                                className="pr-32"
                                rows={3}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isCustomerBlocked}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={handleRedact} disabled={isRedacting || !message || isCustomerBlocked}>
                                    {isRedacting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-muted-foreground" />}
                                </Button>
                                <Button onClick={handleSend} disabled={!message || isCustomerBlocked}>
                                    <Send className="h-4 w-4 mr-2" />
                                    发送
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

    
