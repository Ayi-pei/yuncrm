
"use client";

import type { Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Globe, HardDrive, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { QuickReplies } from "./QuickReplies";
import { ScrollArea } from "../ui/scroll-area";

interface CustomerDetailsProps {
    customer: Customer;
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
    const details = [
        { icon: Globe, label: "IP 地址", value: customer.ipAddress },
        { icon: HardDrive, label: "设备", value: customer.device },
        { icon: MapPin, label: "位置", value: customer.location },
        { icon: Calendar, label: "首次访问", value: format(new Date(customer.firstSeen), "PPP", { locale: zhCN }) },
    ];
    
    return (
        <aside className="w-80 border-l bg-muted/20 p-6 flex flex-col gap-6">
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
        </aside>
    );
}

    