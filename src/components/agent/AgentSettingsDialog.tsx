

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
import { PlusCircle, Trash, KeyRound, Bell, Loader2, Edit, Save, GripVertical } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { zhCN } from 'date-fns/locale';
import { Switch } from "../ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";


interface AgentSettingsDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

function SortableReplyItem({ id, qr, editingReplyId, updateQuickReply, setEditingReplyId, removeQuickReply }: { id: any, qr: QuickReply, editingReplyId: string | null, updateQuickReply: (id: string, field: 'shortcut' | 'message', value: string) => void, setEditingReplyId: (id: string | null) => void, removeQuickReply: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded-md border bg-background touch-none">
            <div {...attributes} {...listeners} className="cursor-grab p-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            {editingReplyId === qr.id ? (
                <>
                    <Input placeholder="快捷指令" value={qr.shortcut} onChange={e => updateQuickReply(qr.id, 'shortcut', e.target.value)} className="w-28"/>
                    <Input placeholder="快捷回复内容" className="flex-1" value={qr.message} onChange={e => updateQuickReply(qr.id, 'message', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => setEditingReplyId(null)}><Save className="h-4 w-4 text-primary"/></Button>
                </>
            ) : (
                <>
                    <code className="px-2 py-1 bg-muted rounded-md text-sm font-semibold w-28 text-center truncate">{qr.shortcut}</code>
                    <p className="flex-1 text-sm text-muted-foreground truncate">{qr.message}</p>
                    <Button variant="ghost" size="icon" onClick={() => setEditingReplyId(qr.id)}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeQuickReply(qr.id)}><Trash className="h-4 w-4 text-destructive"/></Button>
                </>
            )}
        </div>
    );
}

export function AgentSettingsDialog({ isOpen, setIsOpen }: AgentSettingsDialogProps) {
    const { agent, settings, key, updateProfile, updateSettings, extendKey, isExtendingKey, error } = useAgentStore();
    const { updateCurrentUser } = useAuthStore();
    const { toast } = useToast();
    
    const [name, setName] = useState(agent?.name || "");
    const [welcomeMessages, setWelcomeMessages] = useState<string[]>(["", ""]);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showReminder, setShowReminder] = useState(true);
    const [newKey, setNewKey] = useState("");
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if(agent) setName(agent.name);
        if(settings) {
            setWelcomeMessages([
                settings.welcomeMessages?.[0] || "",
                settings.welcomeMessages?.[1] || "",
            ]);
            setQuickReplies(settings.quickReplies || []);
        } else {
            setWelcomeMessages(["",""]);
            setQuickReplies([]);
        }
        setNewKey(""); // Reset on open
        setEditingReplyId(null); // Reset editing state on open
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

    if (!agent) return null;

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
        const filteredWelcomeMessages = welcomeMessages.filter(m => m.trim() !== "");
        const finalQuickReplies = quickReplies.filter(qr => qr.shortcut.trim() !== '' && qr.message.trim() !== '');
        
        const newSettings: AgentSettings = { ...settings!, welcomeMessages: filteredWelcomeMessages, quickReplies: finalQuickReplies };
        
        await updateSettings(agent.id, newSettings);
        toast({ title: "设置已保存", description: "您的聊天设置已更新。" });
        setEditingReplyId(null);
    }

    const addQuickReply = () => {
        const newId = `new-${Date.now()}`;
        setQuickReplies(prev => [...prev, { id: newId, shortcut: "", message: "" }]);
        setEditingReplyId(newId);
    }
    
    const updateQuickReply = (id: string, field: 'shortcut' | 'message', value: string) => {
        setQuickReplies(prev => prev.map(qr => qr.id === id ? { ...qr, [field]: value } : qr));
    }
    
    const removeQuickReply = (id: string) => {
        setQuickReplies(prev => prev.filter(qr => qr.id !== id));
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

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
    
        if (over && active.id !== over.id) {
          setQuickReplies((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            
            return arrayMove(items, oldIndex, newIndex);
          });
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
                                <Label>欢迎消息</Label>
                                <p className="text-sm text-muted-foreground">设置一或两条欢迎语，它们将依次发送给访客。</p>
                                <Textarea 
                                    value={welcomeMessages[0]} 
                                    onChange={(e) => setWelcomeMessages([e.target.value, welcomeMessages[1]])} 
                                    placeholder="第一条欢迎消息 (必填)" 
                                />
                                <Textarea 
                                     value={welcomeMessages[1]} 
                                     onChange={(e) => setWelcomeMessages([welcomeMessages[0], e.target.value])} 
                                     placeholder="第二条欢迎消息 (可选，将在3秒后发送)" 
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label>快捷回复</Label>
                                    <p className="text-sm text-muted-foreground">输入您的常用语录，方便快速回复。</p>
                                </div>
                                <div className="space-y-2 relative pb-6">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={quickReplies} strategy={verticalListSortingStrategy}>
                                            {quickReplies.map(qr => (
                                                <SortableReplyItem 
                                                    key={qr.id}
                                                    id={qr.id}
                                                    qr={qr}
                                                    editingReplyId={editingReplyId}
                                                    updateQuickReply={updateQuickReply}
                                                    setEditingReplyId={setEditingReplyId}
                                                    removeQuickReply={removeQuickReply}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                     <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted-foreground/50">拖动可排序</p>
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
