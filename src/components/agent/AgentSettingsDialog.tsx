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
        toast({ title: "Profile Updated", description: "Your display name has been changed." });
    };

    const handleGenerateAvatar = async () => {
        const newAvatar = `https://i.pravatar.cc/150?u=${Date.now()}`;
        await updateProfile(agent.id, { avatar: newAvatar });
        updateCurrentUser({ avatar: newAvatar });
        toast({ title: "Avatar Updated", description: "A new random avatar has been generated." });
    }
    
    const handleSettingsSave = async () => {
        const newSettings: AgentSettings = { ...settings, welcomeMessage, quickReplies };
        await updateSettings(agent.id, newSettings);
        toast({ title: "Settings Saved", description: "Your chat settings have been updated." });
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
                    <DialogTitle>Agent Settings</DialogTitle>
                    <DialogDescription>Manage your profile and chat settings.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="chat">Chat Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="p-1">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <Button onClick={handleProfileSave}>Save Name</Button>
                        </div>
                         <div className="space-y-2 py-4">
                            <Label>Avatar</Label>
                            <p className="text-sm text-muted-foreground">Generate a new random avatar.</p>
                            <Button variant="outline" onClick={handleGenerateAvatar}>Generate New Avatar</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="chat" className="p-1">
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="welcome">Welcome Message</Label>
                                <Textarea id="welcome" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="The first message a visitor sees." />
                            </div>
                            <div className="space-y-2">
                                <Label>Quick Replies</Label>
                                <div className="space-y-2">
                                    {quickReplies.map(qr => (
                                        <div key={qr.id} className="flex items-center gap-2">
                                            <Input placeholder="Shortcut (e.g. /hello)" value={qr.shortcut} onChange={e => updateQuickReply(qr.id, 'shortcut', e.target.value)}/>
                                            <Input placeholder="Message" className="flex-1" value={qr.message} onChange={e => updateQuickReply(qr.id, 'message', e.target.value)} />
                                            <Button variant="ghost" size="icon" onClick={() => removeQuickReply(qr.id)}><Trash className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" onClick={addQuickReply}><PlusCircle className="h-4 w-4 mr-2"/>Add Reply</Button>
                            </div>
                        </div>
                         <Button onClick={handleSettingsSave}>Save Chat Settings</Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
