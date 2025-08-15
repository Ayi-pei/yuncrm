
"use client";

import type { Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Globe, HardDrive, MapPin, Calendar, Ban, CheckCircle, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { QuickReplies } from "./QuickReplies";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


interface CustomerDetailsProps {
    customer: Customer;
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
    const { blockCustomer, unblockCustomer, settings, archiveSession, activeSessionId } = useAgentStore();
    const { toast } = useToast();
    
    const isBlocked = settings?.blockedIps.includes(customer.ipAddress || "") || false;
    const activeSession = useAgentStore(state => state.sessions.find(s => s.id === state.activeSessionId));
    const isArchived = activeSession?.status === 'archived';

    const details = [
        { icon: Globe, label: "IP 地址", value: customer.ipAddress },
        { icon: HardDrive, label: "设备", value: customer.device },
        { icon: MapPin, label: "位置", value: customer.location },
        { icon: Calendar, label: "首次访问", value: format(new Date(customer.firstSeen), "PPP", { locale: zhCN }) },
    ];

    const handleToggleBlock = () => {
        if (!customer.ipAddress) {
            toast({ title: "操作失败", description: "该客户没有IP地址，无法拉黑。", variant: "destructive" });
            return;
        }
        if (isBlocked) {
            unblockCustomer(customer.ipAddress);
            toast({ title: "客户已解除拉黑" });
        } else {
            blockCustomer(customer.ipAddress);
            toast({ title: "客户已被拉黑", description: "您将不会再收到该IP地址的消息。" });
        }
    };
    
    const handleArchive = () => {
        if (!activeSessionId) return;
        archiveSession(activeSessionId);
        toast({ title: "会话已归档" });
    }
    
    return (
        <aside className="w-80 border-l bg-muted/20 p-6 flex flex-col gap-6 relative">
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
                                    {details.map(detail => (
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
                        isBlocked && "bg-yellow-400 hover:bg-yellow-500 text-black"
                    )}
                    onClick={handleToggleBlock}
                    disabled={!customer.ipAddress}
                >
                    {isBlocked ? <CheckCircle className="mr-2" /> : <Ban className="mr-2" />}
                    {isBlocked ? '解除' : '拉黑'}
                </Button>
                
                <Button variant="outline" className="flex-1" onClick={handleArchive}>
                    <Archive className="mr-2" />
                    归档
                </Button>
            </div>
        </aside>
    );
}

