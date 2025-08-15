"use client";

import { useAgentStore } from "@/lib/stores/agentStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from 'date-fns/locale';
import { Bot, User as UserIcon, Archive, Trash2 } from "lucide-react";
import { AgentProfile } from "./AgentProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

export function CustomerList() {
    const { sessions, customers, activeSessionId, setActiveSessionId, deleteCustomer } = useAgentStore();
    const { toast } = useToast();

    const handleDelete = (e: React.MouseEvent, customerId: string) => {
        e.stopPropagation(); // Prevent session selection
        deleteCustomer(customerId);
        toast({ title: "客户已删除", description: "该客户及其对话已被移除。", variant: "destructive"});
    }
    
    return (
        <aside className="w-80 border-r bg-muted/20 flex flex-col h-full">
            <Tabs defaultValue="conversations" className="flex-1 flex flex-col min-h-0">
                 <div className="p-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                            <Bot size={24} />
                        </div>
                        <TabsList className="grid w-full grid-cols-2 h-10">
                            <TabsTrigger value="conversations">会话</TabsTrigger>
                            <TabsTrigger value="archived" disabled>归档</TabsTrigger>
                        </TabsList>
                    </div>
                </div>
                
                <TabsContent value="conversations" className="flex-1 flex flex-col min-h-0 relative">
                    <div className="absolute inset-0 overflow-y-auto">
                        <div className="p-2 space-y-1">
                        {sessions.map(session => {
                            const customer = customers.find(c => c.id === session.customerId);
                            const lastMessage = session.messages[session.messages.length - 1];
                            if(!customer) return null;

                            return (
                                <div key={session.id} className="relative group">
                                    <button 
                                        onClick={() => setActiveSessionId(session.id)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg flex gap-3 items-start transition-colors",
                                            activeSessionId === session.id ? "bg-primary/10" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={customer.avatar} />
                                            <AvatarFallback><UserIcon /></AvatarFallback>
                                            {session.status === 'pending' && <div className="absolute bottom-0 right-0 h-3 w-3 bg-accent rounded-full border-2 border-background" />}
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline">
                                                <p className="font-semibold truncate">{customer.name}</p>
                                                <p className="text-xs text-muted-foreground shrink-0">
                                                    {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true, locale: zhCN })}
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {lastMessage.text}
                                            </p>
                                        </div>
                                    </button>
                                    <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>您确定要删除该客户吗？</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        此操作无法撤销。这将会永久删除该客户及其所有对话历史。
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                    <AlertDialogAction onClick={(e) => handleDelete(e, customer.id)} className="bg-destructive hover:bg-destructive/90">
                                                        删除
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            )
                        })}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="archived" className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Archive className="h-12 w-12" />
                    <p className="mt-4 text-sm">没有已归档的会话。</p>
                </TabsContent>
            </Tabs>
            
            <div className="p-2 border-t mt-auto flex-shrink-0">
                <AgentProfile />
            </div>
        </aside>
    );
}
