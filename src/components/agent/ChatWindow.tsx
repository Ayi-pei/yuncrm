
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatSession, ChatMessage, FileChatMessage, TextChatMessage, Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Sparkles, Loader2, User as UserIcon, Smile, Mic, Paperclip, Image as ImageIcon, Ban, Dot, Folder, Globe, HardDrive, MapPin, Calendar, CheckCircle, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/lib/stores/agentStore";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ScrollArea } from "../ui/scroll-area";
import { redactPii } from "@/ai/flows/redact-pii";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CircularProgress } from "../shared/CircularProgress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { QuickReplies } from "./QuickReplies";

interface ChatWindowProps {
    session: ChatSession;
    customer: Customer;
}

const EMOJIS = [
    '😀', '😂', '😊', '😍', '🤔', '😢', '😠', '😮',
    '👍', '👎', '❤️', '💔', '🎉', '🔥', '🙏', '🙌',
    '👏', '💪', '💯', '✨', '✅', '❌', '❓', '💡'
];

export function ChatWindow({ session, customer }: ChatWindowProps) {
    const { agent, sendMessage, settings, sendFileMessage, blockCustomer, unblockCustomer, archiveSession } = useAgentStore();
    const [message, setMessage] = useState("");
    const [isRedacting, setIsRedacting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const isCustomerBlocked = customer?.ipAddress ? settings?.blockedIps.includes(customer.ipAddress) : false;
    const isArchived = session?.status === 'archived';

    const customerDetails = [
        { icon: Globe, label: "IP 地址", value: customer.ipAddress },
        { icon: HardDrive, label: "设备", value: customer.device },
        { icon: MapPin, label: "位置", value: customer.location },
        { icon: Calendar, label: "首次访问", value: format(new Date(customer.firstSeen), "PPP", { locale: zhCN }) },
    ];
    
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
        
        const textMessage: Omit<TextChatMessage, 'id' | 'timestamp' | 'sender' | 'agentId'> = {
            type: 'text',
            text: message,
        };

        await sendMessage(session.id, textMessage);
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
            toast({ title: "处理失败", description: "无法处理您的消息。", variant: "destructive" });
        } finally {
            setIsRedacting(false);
        }
    };
    
    const handleEmojiSelect = (emoji: string) => {
        setMessage(prev => prev + emoji);
    }
    
    const handleAttachmentClick = (type: 'file' | 'image') => {
        if (type === 'file') {
            fileInputRef.current?.click();
        } else {
            imageInputRef.current?.click();
        }
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && agent) {
            sendFileMessage(session.id, file);
        }
        e.target.value = "";
    }
    
    const toggleRecording = () => {
        setIsRecording(!isRecording);
        toast({
            title: isRecording ? "录音已停止" : "开始录音...",
            description: "语音输入功能正在开发中。"
        });
    }
    
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
     const handleToggleBlock = () => {
        if (!customer.ipAddress) {
            toast({ title: "操作失败", description: "该客户没有IP地址，无法拉黑。", variant: "destructive" });
            return;
        }
        if (isCustomerBlocked) {
            unblockCustomer(customer.ipAddress);
            toast({ title: "客户已解除拉黑" });
        } else {
            blockCustomer(customer.ipAddress);
            toast({ title: "客户已被拉黑", description: "您将不会再收到该IP地址的消息。" });
        }
    };
    
    const handleArchive = () => {
        if (!session.id) return;
        archiveSession(session.id);
        toast({ title: "会话已归档" });
    }

    if (!customer || !agent) return null;

    return (
       <main className="flex flex-1">
            <div className="flex-1 flex flex-col h-full bg-background">
                <header className="p-4 border-b flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback><UserIcon/></AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-lg">{customer.name}</h2>
                            <p className="text-xs text-muted-foreground">会话开始于: {format(new Date(session.createdAt), "PPP p", { locale: zhCN })}</p>
                        </div>
                    </div>
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
                                        <p className="text-sm text-muted-foreground">您可以从归档列表中恢复此会话。</p>
                                    </div>
                                )}
                                <div className="text-center flex flex-col items-center flex-shrink-0">
                                    <Avatar className="h-24 w-24 border-2 border-primary mb-4">
                                        <AvatarImage src={customer.avatar} />
                                        <AvatarFallback>{customer.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl font-bold">{customer.name}</h2>
                                </div>
                                <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="info">客户信息</TabsTrigger>
                                        <TabsTrigger value="replies">快捷回复</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="info" className="flex-1 mt-4 min-h-0">
                                        <ScrollArea className="h-full">
                                            <div className="flex flex-col gap-6 pr-4">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">客户信息</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        {customerDetails.map(detail => (
                                                            <div key={detail.label} className="flex items-start gap-3 text-sm">
                                                                <detail.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                                <div>
                                                                    <p className="text-muted-foreground">{detail.label}</p>
                                                                    <p className="font-medium">{detail.value}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">会话历史</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-xs text-muted-foreground text-center">没有与该客户的过往会话。</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="replies" className="flex-1 mt-4 min-h-0">
                                        <QuickReplies />
                                    </TabsContent>
                                </Tabs>

                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "flex-1", 
                                            isCustomerBlocked && "bg-yellow-400 hover:bg-yellow-500 text-black"
                                        )}
                                        onClick={handleToggleBlock}
                                        disabled={!customer.ipAddress}
                                    >
                                        {isCustomerBlocked ? <CheckCircle className="mr-2" /> : <Ban className="mr-2" />}
                                        {isCustomerBlocked ? '解除' : '拉黑'}
                                    </Button>
                                    
                                    <Button variant="outline" className="flex-1" onClick={handleArchive}>
                                        <Archive className="mr-2" />
                                        归档
                                    </Button>
                                </div>
                           </aside>
                        </SheetContent>
                    </Sheet>
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
                                    {msg.type === 'text' ? (
                                        <p className="text-sm">{msg.text}</p>
                                    ) : (
                                        <a href={(msg as FileChatMessage).file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                                            <CircularProgress progress={(msg as FileChatMessage).file.progress} />
                                            <div>
                                                <p className="text-sm font-medium break-all underline">{(msg as FileChatMessage).file.name}</p>
                                                <p className={cn("text-xs", msg.sender === 'agent' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                                    {formatFileSize((msg as FileChatMessage).file.size)}
                                                </p>
                                            </div>
                                        </a>
                                    )}
                                    <p className={cn("text-xs mt-1 text-right", msg.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
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
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                                            <Smile />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                        <div className="grid grid-cols-6 gap-2">
                                            {EMOJIS.map(emoji => (
                                                <Button key={emoji} variant="ghost" size="icon" onClick={() => handleEmojiSelect(emoji)}>{emoji}</Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button variant="ghost" size="icon" className={cn("text-muted-foreground", isRecording && "text-red-500 bg-red-500/10")} onClick={toggleRecording}>
                                    <Mic />
                                    {isRecording && <Dot className="absolute -top-1 -right-1 text-red-500 animate-ping" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleAttachmentClick('file')}>
                                    <Paperclip />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => handleAttachmentClick('image')}>
                                    <ImageIcon />
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} className="hidden" />
                            </div>
                            <div className="relative">
                                <Textarea 
                                    placeholder="输入您的消息..." 
                                    className="pr-32"
                                    rows={4}
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
       </main>
    );
}

    