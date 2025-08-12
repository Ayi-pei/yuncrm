"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
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
import { PlusCircle, Trash, KeyRound, Bell, Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { zhCN } from 'date-fns/locale';
import { Switch } from "../ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";


interface AgentSettingsDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AgentSettingsDialog({ isOpen, setIsOpen }: AgentSettingsDialogProps) {
    const { agent, settings, key, updateProfile, updateSettings, extendKey, isExtendingKey, error } = useAgentStore();
    const { updateCurrentUser } = useAuthStore();
    const { toast } = useToast();
    
    const [name, setName] = useState(agent?.name || "");
    const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcomeMessage || "");
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>(settings?.quickReplies || []);
    const [showReminder, setShowReminder] = useState(true);
    const [newKey, setNewKey] = useState("");

    useEffect(() => {
        if(agent) setName(agent.name);
        if(settings) {
            setWelcomeMessage(settings.welcomeMessage);
            setQuickReplies(settings.quickReplies);
        }
        setNewKey(""); // Reset on open
    }, [agent, settings, isOpen]);

    useEffect(() => {
        if (!key?.expiresAt || !showReminder) return;

        const checkExpiration = () => {
            const expiresIn = parseISO(key.expiresAt!).getTime() - Date.now();
            const oneHour = 60 * 60 * 1000;
            if (expiresIn > 0 && expiresIn < oneHour) {
                toast({
                    title: "密钥即将到期提醒",
                    description: `您的坐席密钥将在大约一小时内到期。请及时延续。`,
                });
            }
        };

        const interval = setInterval(checkExpiration, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, [key, showReminder, toast]);

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
    
    const getRemainingTime = () => {
        if(!key?.expiresAt) return "无到期限制";
        const expiresDate = parseISO(key.expiresAt);
        if (expiresDate < new Date()) {
            return "已过期";
        }
        return formatDistanceToNow(expiresDate, { addSuffix: true, locale: zhCN });
    }

    const handleExtendKey = async () => {
        if (!newKey.trim() || !agent) return;
        const success = await extendKey(agent.id, newKey);
        if(success) {
            toast({
                title: "密钥已延续",
                description: "坐席位有效期已成功延长。",
            });
            setNewKey("");
        } else {
             toast({
                title: "延续失败",
                description: error || "无法使用该密钥。请检查密钥是否正确、未使用且为智能体角色。",
                variant: "destructive"
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>智能体设置</DialogTitle>
                    <DialogDescription>管理您的个人资料和聊天设置。</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">个人资料</TabsTrigger>
                        <TabsTrigger value="chat">聊天设置</TabsTrigger>
                        <TabsTrigger value="key">密钥信息</TabsTrigger>
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
                    <TabsContent value="key" className="p-1">
                        <div className="space-y-6 py-4">
                             <Alert>
                                <KeyRound className="h-4 w-4" />
                                <AlertTitle>当前密钥信息</AlertTitle>
                                <AlertDescription>
                                    <div className="mt-2 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">坐席位</span>
                                            <span>{agent.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">剩余时间</span>
                                            <span className="font-semibold">{getRemainingTime()}</span>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                            
                             <div className="space-y-2">
                                <Label htmlFor="extend-key">延续</Label>
                                <p className="text-sm text-muted-foreground">粘贴其它未使用过的密钥，以支持当前坐席位的使用。</p>
                                <div className="flex gap-2">
                                    <Input 
                                        id="extend-key" 
                                        placeholder="在此处粘贴新密钥" 
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        disabled={isExtendingKey}
                                    />
                                    <Button onClick={handleExtendKey} disabled={isExtendingKey || !newKey}>
                                        {isExtendingKey && <Loader2 className="animate-spin" />}
                                        延续
                                    </Button>
                                </div>
                            </div>

                             <div className="space-y-2">
                                <Label>提醒</Label>
                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">到期提醒</p>
                                        <p className="text-xs text-muted-foreground">
                                           在密钥到期前1小时，系统将弹出友好提示。
                                        </p>
                                    </div>
                                    <Switch checked={showReminder} onCheckedChange={setShowReminder} />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
