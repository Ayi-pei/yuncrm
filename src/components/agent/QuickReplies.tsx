"use client";

import { useAgentStore } from "@/lib/stores/agentStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MessageSquareQuote, Send } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

export function QuickReplies() {
    const { settings, sendMessage, activeSessionId } = useAgentStore();

    if (!settings) return null;

    const { quickReplies } = settings;
    
    const handleSendReply = (message: string) => {
        if(activeSessionId) {
            sendMessage(activeSessionId, message);
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                    <span>快捷回复</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                    <div className="p-6 pt-0">
                        {quickReplies.length > 0 ? (
                            <div className="space-y-2">
                                {quickReplies.map((reply) => (
                                    <div key={reply.id} className="p-3 bg-background rounded-md border text-sm group relative">
                                        <p className="font-medium text-primary">{reply.shortcut}</p>
                                        <p className="text-muted-foreground pr-8">{reply.message}</p>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100"
                                            onClick={() => handleSendReply(reply.message)}
                                            disabled={!activeSessionId}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center text-muted-foreground py-10">
                                <MessageSquareQuote className="h-10 w-10 mx-auto mb-2" />
                                <p className="text-sm">没有可用的快捷回复。</p>
                                <p className="text-xs">您可以在设置中添加。</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
