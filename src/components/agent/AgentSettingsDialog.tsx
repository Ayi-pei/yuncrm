"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAgentStore } from "@/lib/stores/agentStore";
import { AppConfig } from "@/lib/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import type { AgentSettings, QuickReply } from "@/lib/types";
import {
  PlusCircle,
  Trash,
  KeyRound,
  Loader2,
  Edit,
  Save,
  ArrowUp,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Switch } from "../ui/switch";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ErrorHandler } from "@/lib/error-handler";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface AgentSettingsDialogProps {
  isOpen: boolean;
  setIsOpenAction: (open: boolean) => void;
}

export function AgentSettingsDialog({
  isOpen,
  setIsOpenAction,
}: AgentSettingsDialogProps) {
  const {
    agent,
    settings,
    key,
    updateProfile,
    updateSettings,
    extendKey,
    isExtendingKey,
    error,
    invalidateAliases,
    fetchAgentData,
  } = useAgentStore();
  const { updateCurrentUser } = useAuthStore();
  const { toast } = useToast();
  const agentIdRef = useRef<string | null>(null); // 添加 ref 来跟踪 agent ID

  const [name, setName] = useState(agent?.name || "");
  const [avatar, setAvatar] = useState(agent?.avatar || ""); // 添加头像状态
  const [welcomeMessages, setWelcomeMessages] = useState<string[]>(["", ""]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showReminder, setShowReminder] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 更新 useEffect 以在打开对话框时获取最新数据
  useEffect(() => {
    if (isOpen && agent?.id) {
      // 当对话框打开且有 agent ID 时，获取最新数据
      agentIdRef.current = agent.id;
      fetchAgentData(agent.id);
    } else if (!isOpen) {
      // 当对话框关闭时，重置状态
      setNewKey("");
      setEditingReplyId(null);
    }
  }, [isOpen, agent?.id, fetchAgentData]);

  // 更新 useEffect 以同步 store 中的数据到本地状态
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setAvatar(agent.avatar || ""); // 同步头像状态
      agentIdRef.current = agent.id;
    }

    if (settings) {
      setWelcomeMessages([
        settings.welcomeMessages?.[0] || "",
        settings.welcomeMessages?.[1] || "",
      ]);
      setQuickReplies(settings.quickReplies || []);
    } else {
      setWelcomeMessages(["", ""]);
      setQuickReplies([]);
    }
  }, [agent, settings]);

  useEffect(() => {
    if (!key?.expiresAt || !showReminder) return;

    const checkExpiration = () => {
      const expiresIn = parseISO(key.expiresAt!).getTime() - Date.now();
      const oneHour = 60 * 60 * 1000;
      if (expiresIn > 0 && expiresIn < oneHour) {
        toast({
          title: "密钥即将到期提醒",
          description: `您的坐席密钥将在大约一小时内到期。请及时更换。`,
        });
      }
    };

    const interval = setInterval(
      checkExpiration,
      AppConfig.polling.keyCheckInterval
    );
    return () => clearInterval(interval);
  }, [key, showReminder, toast]);

  if (!agent) return null;

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast({
        title: "保存失败",
        description: "显示名称不能为空。",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfile(agent.id, { name });
      updateCurrentUser({ name });
      setName(name); // 立即更新对话框及 AvatarFallback
      // 刷新agent数据以确保状态同步
      await fetchAgentData(agent.id);
      toast({ title: "个人资料已更新", description: "您的显示名称已更改。" });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "更新个人资料时发生错误，请稍后重试。",
        variant: "destructive",
      });
      ErrorHandler.handle(error, "AgentSettingsDialog.handleProfileSave");
    }
  };

  const handleGenerateAvatar = async () => {
    try {
      const newAvatar = `https://i.pravatar.cc/150?u=${Date.now()}`;
      await updateProfile(agent.id, { avatar: newAvatar });
      updateCurrentUser({ avatar: newAvatar });
      // 立即更新本地组件状态，保证 Avatar 预览马上变化
      setAvatar(newAvatar);
      // 可选：如果你希望使用 fetchAgentData 来同步更多字段，可以仍然调用
      await fetchAgentData(agent.id);
      invalidateAliases();
      toast({ title: "头像已更新", description: "已生成新的随机头像。" });
    } catch (error) {
      toast({
        title: "更新失败",
        description: "生成头像时发生错误，请稍后重试。",
        variant: "destructive",
      });
      ErrorHandler.handle(error, "AgentSettingsDialog.handleGenerateAvatar");
    }
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型和大小
      if (!file.type.startsWith("image/")) {
        toast({
          title: "上传失败",
          description: "请选择有效的图片文件。",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        // 2MB限制
        toast({
          title: "上传失败",
          description: "图片文件大小不能超过2MB。",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadstart = () => {
        toast({ title: "正在上传", description: "头像上传中..." });
      };

      reader.onloadend = async () => {
        try {
          const newAvatar = reader.result as string;
          await updateProfile(agent!.id, { avatar: newAvatar });
          updateCurrentUser({ avatar: newAvatar });
          setAvatar(newAvatar); // 立即更新本地预览
          await fetchAgentData(agent!.id);
          invalidateAliases();
          toast({ title: "头像已更新", description: "您的头像已成功上传。" });
        } catch (error) {
          toast({
            title: "上传失败",
            description: "上传头像时发生错误，请稍后重试。",
            variant: "destructive",
          });
          ErrorHandler.handle(error, "AgentSettingsDialog.handleFileChange");
        }
      };

      reader.onerror = () => {
        toast({
          title: "上传失败",
          description: "读取文件时发生错误。",
          variant: "destructive",
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSave = async () => {
    const filteredWelcomeMessages = welcomeMessages.filter(
      (m) => m.trim() !== ""
    );
    const finalQuickReplies = quickReplies.filter(
      (qr) => qr.shortcut.trim() !== "" && qr.message.trim() !== ""
    );

    const newSettings: AgentSettings = {
      ...settings!,
      welcomeMessages: filteredWelcomeMessages,
      quickReplies: finalQuickReplies,
    };

    await updateSettings(agent.id, newSettings);
    toast({ title: "设置已保存", description: "您的聊天设置已更新。" });
    setEditingReplyId(null);
  };

  const addQuickReply = () => {
    const newId = `new-${Date.now()}`;
    setQuickReplies((prev) => [
      ...prev,
      { id: newId, shortcut: "", message: "" },
    ]);
    setEditingReplyId(newId);
  };

  const updateQuickReply = (
    id: string,
    field: "shortcut" | "message",
    value: string
  ) => {
    setQuickReplies((prev) =>
      prev.map((qr) => (qr.id === id ? { ...qr, [field]: value } : qr))
    );
  };

  const removeQuickReply = (id: string) => {
    setQuickReplies((prev) => prev.filter((qr) => qr.id !== id));
  };

  const getRemainingTime = () => {
    if (!key?.expiresAt) return "无到期限制";
    const expiresDate = parseISO(key.expiresAt);
    if (expiresDate < new Date()) {
      return "已过期";
    }
    return formatDistanceToNow(expiresDate, { addSuffix: true, locale: zhCN });
  };

  const handleExtendKey = async () => {
    if (!newKey.trim() || !agentIdRef.current) return;
    const success = await extendKey(agentIdRef.current, newKey);
    if (success) {
      toast({
        title: "密钥已更换",
        description: "坐席已成功绑定新密钥。旧分享链接已失效，请重新生成。",
      });
      invalidateAliases(); // This will trigger the ShareDialog to refetch a new URL

      // 获取最新数据以确保状态一致性
      if (agentIdRef.current) {
        await fetchAgentData(agentIdRef.current);
      }

      setNewKey("");
    } else {
      toast({
        title: "更换失败",
        description:
          error || "无法使用该密钥。请检查密钥是否正确、未绑定且为坐席角色。",
        variant: "destructive",
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setQuickReplies((prev) => {
      const newReplies = [...prev];
      const temp = newReplies[index];
      newReplies[index] = newReplies[index - 1];
      newReplies[index - 1] = temp;
      return newReplies;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpenAction}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>坐席设置</DialogTitle>
          <DialogDescription>管理您的个人资料和聊天设置。</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="chat">聊天设置</TabsTrigger>
            <TabsTrigger value="key">密钥管理</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="p-1">
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{name?.[0] || "A"}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <Label htmlFor="name">显示名称</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入显示名称"
                    title="输入您的显示名称"
                    autoComplete="name"
                  />
                </div>
              </div>
              <Button onClick={handleProfileSave}>保存名称</Button>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-upload">头像</Label>
                <p className="text-sm text-muted-foreground">
                  上传您自己的头像或生成一个随机头像。
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAvatarUploadClick}>上传头像</Button>
                  <Button variant="outline" onClick={handleGenerateAvatar}>
                    生成随机头像
                  </Button>
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  id="avatar-upload"
                  title="上传头像文件"
                  aria-label="上传头像文件"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat" className="p-1">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-message-1">欢迎消息</Label>
                <p className="text-sm text-muted-foreground">
                  设置一或两条欢迎语，它们将依次发送给访客。
                </p>
                <Textarea
                  id="welcome-message-1"
                  value={welcomeMessages[0]}
                  onChange={(e) =>
                    setWelcomeMessages([e.target.value, welcomeMessages[1]])
                  }
                  placeholder="第一条欢迎消息 (必填)"
                  title="第一条欢迎消息"
                  autoComplete="off"
                />
                <Label htmlFor="welcome-message-2" className="sr-only">
                  第二条欢迎消息
                </Label>
                <Textarea
                  id="welcome-message-2"
                  value={welcomeMessages[1]}
                  onChange={(e) =>
                    setWelcomeMessages([welcomeMessages[0], e.target.value])
                  }
                  placeholder="第二条欢迎消息 (可选，将在3秒后发送)"
                  title="第二条欢迎消息"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>快捷回复</Label>
                  <p className="text-sm text-muted-foreground">
                    输入您的常用语录，方便快速回复。
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {quickReplies.map((qr, index) => (
                    <div
                      key={qr.id}
                      className="flex items-center gap-2 p-2 rounded-md border bg-background"
                    >
                      {editingReplyId === qr.id ? (
                        <>
                          <Button
                            disabled
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-default"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <div className="space-y-2 w-28">
                            <Label
                              htmlFor={`shortcut-${qr.id}`}
                              className="sr-only"
                            >
                              快捷指令
                            </Label>
                            <Input
                              id={`shortcut-${qr.id}`}
                              placeholder="快捷指令"
                              value={qr.shortcut}
                              onChange={(e) =>
                                updateQuickReply(
                                  qr.id,
                                  "shortcut",
                                  e.target.value
                                )
                              }
                              className="w-full"
                              title="快捷指令"
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-2 flex-1">
                            <Label
                              htmlFor={`message-${qr.id}`}
                              className="sr-only"
                            >
                              快捷回复内容
                            </Label>
                            <Input
                              id={`message-${qr.id}`}
                              placeholder="快捷回复内容"
                              className="w-full"
                              value={qr.message}
                              onChange={(e) =>
                                updateQuickReply(
                                  qr.id,
                                  "message",
                                  e.target.value
                                )
                              }
                              title="快捷回复内容"
                              autoComplete="off"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingReplyId(null)}
                          >
                            <Save className="h-4 w-4 text-primary" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            className="h-8 w-8"
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <code className="px-2 py-1 bg-muted rounded-md text-sm font-semibold w-28 text-center truncate">
                            {qr.shortcut}
                          </code>
                          <p className="flex-1 text-sm text-muted-foreground truncate">
                            {qr.message}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingReplyId(qr.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuickReply(qr.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addQuickReply}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  添加回复
                </Button>
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
                      <span className="text-muted-foreground">绑定坐席</span>
                      <span>{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">当前密钥</span>
                      <code className="text-xs">{key?.key}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">到期时间</span>
                      <span className="font-semibold">
                        {getRemainingTime()}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="extend-key">更换绑定密钥</Label>
                <p className="text-sm text-muted-foreground">
                  粘贴一个新的、未绑定的坐席密钥来替换当前密钥，以继续使用坐席服务。旧密钥将会失效。
                </p>
                <div className="flex gap-2">
                  <Input
                    id="extend-key"
                    placeholder="在此处粘贴新密钥"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    disabled={isExtendingKey}
                    title="输入新的坐席密钥"
                    autoComplete="off"
                  />
                  <Button
                    onClick={handleExtendKey}
                    disabled={isExtendingKey || !newKey}
                  >
                    {isExtendingKey && <Loader2 className="animate-spin" />}
                    更换密钥
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
                  <Switch
                    checked={showReminder}
                    onCheckedChange={setShowReminder}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
