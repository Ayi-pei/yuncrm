"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { AgentSettings, QuickReply } from "@/lib/types";
import { PlusCircle, Trash } from "lucide-react";

interface AgentSettingsDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AgentSettingsDialog({ isOpen, setIsOpen }: AgentSettingsDialogProps) {
    const { agent, settings, updateProfile, updateSettings } = useAgentStore();
    const { updateCurrentUser } = useAuthStore();
    const { toast } = useToast();
    
    const [name, setName] = useState(agent?.name || "");
    const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcomeMessage || "");
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>(settings?.quickReplies || []);

    useEffect(() => {
        if(agent) setName(agent.name);
        if(settings) {
            setWelcomeMessage(settings.welcomeMessage);
            setQuickReplies(settings.quickReplies);
        }
    }, [agent, settings, isOpen]);

    if (!agent || !settings) return null;

    const handleProfileSave = async () => {
        await updateProfile(agent.id, { name });
        updateCurrentUser({ name });
        toast({ title: "个人资料已更新", description: "您的显示名称已更改。" });
    };

    const handleGenerateAvatar = async () => {
        const newAvatar = `https://i.pravatar.cc/150?u=${Date.now()}`;
        await updateProfile(agent.id, { avatar: newAvatar });
        updateCurrentUser({ avatar: newAvatar });
        toast({ title: "头像已更新", description: "已生成新的随机头像。" });
    }
    
    const handleSettingsSave = async () => {
        const newSettings: AgentSettings = { ...settings, welcomeMessage, quickReplies };
        await updateSettings(agent.id, newSettings);
        toast({ title: "设置已保存", description: "您的聊天设置已更新。" });
    }

    const addQuickReply = () => {
        setQuickReplies([...quickReplies, { id: `new-${Date.now()}`, shortcut: "", message: "" }]);
    }
    
    const updateQuickReply = (id: string, field: 'shortcut' | 'message', value: string) => {
        setQuickReplies(quickReplies.map(qr => qr.id === id ? { ...qr, [field]: value } : qr));
    }
    
    const removeQuickReply = (id: string) => {
        setQuickReplies(quickReplies.filter(qr => qr.id !== id));
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>智能体设置</DialogTitle>
                    <DialogDescription>管理您的个人资料和聊天设置。</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile">
                    <TabsList>
                        <TabsTrigger value="profile">个人资料</TabsTrigger>
                        <TabsTrigger value="chat">聊天设置</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="p-1">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">显示名称</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <Button onClick={handleProfileSave}>保存名称</Button>
                        </div>
                         <div className="space-y-2 py-4">
                            <Label>头像</Label>
                            <p className="text-sm text-muted-foreground">生成一个新的随机头像。</p>
                            <Button variant="outline" onClick={handleGenerateAvatar}>生成新头像</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="chat" className="p-1">
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="welcome">欢迎消息</Label>
                                <Textarea id="welcome" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="访客看到的第一条消息。" />
                            </div>
                            <div className="space-y-2">
                                <Label>快捷回复</Label>
                                <div className="space-y-2">
                                    {quickReplies.map(qr => (
                                        <div key={qr.id} className="flex items-center gap-2">
                                            <Input placeholder="快捷指令 (例如 /hello)" value={qr.shortcut} onChange={e => updateQuickReply(qr.id, 'shortcut', e.target.value)}/>
                                            <Input placeholder="消息" className="flex-1" value={qr.message} onChange={e => updateQuickReply(qr.id, 'message', e.target.value)} />
                                            <Button variant="ghost" size="icon" onClick={() => removeQuickReply(qr.id)}><Trash className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" onClick={addQuickReply}><PlusCircle className="h-4 w-4 mr-2"/>添加回复</Button>
                            </div>
                        </div>
                         <Button onClick={handleSettingsSave}>保存聊天设置</Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
