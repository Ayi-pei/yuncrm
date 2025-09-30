"use client";

import { useAgentStore } from "@/lib/stores/agentStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut, Settings, Share2, Wifi, Bell, Moon } from "lucide-react";
import { AgentStatus } from "@/lib/types";
import { ErrorHandler } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { AgentSettingsDialog } from "./AgentSettingsDialog";
import { useState, useEffect } from "react";
import { ShareDialog } from "./ShareDialog";

export function AgentProfile() {
  const { agent, updateStatus } = useAgentStore();
  const { logout, user } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 添加一个useEffect来监听agent变化并触发重新渲染
  useEffect(() => {
    // 这个useEffect会在agent变化时触发，确保组件使用最新的数据
  }, [agent]);

  if (!agent || !user) return null;

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus(agent.id, status as AgentStatus);
      logger.logUserAction("change_agent_status", agent.id, {
        oldStatus: agent.status,
        newStatus: status,
      });
    } catch (error) {
      ErrorHandler.handle(error, "AgentProfile.changeStatus");
    }
  };

  const getStatusClass = (status: AgentStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-orange-500";
      case "offline":
        return "text-gray-500";
    }
  };

  const translateStatus = (status: AgentStatus) => {
    switch (status) {
      case "online":
        return "在线";
      case "busy":
        return "忙碌";
      case "offline":
        return "离线";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
            role="button"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar} alt={`${agent.name}的头像`} />
                <AvatarFallback>{agent.name[0]}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background ${getStatusClass(
                  agent.status
                )}`}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{agent.name}</p>
              <p className="text-sm capitalize truncate">
                {translateStatus(agent.status)}
              </p>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" side="top" align="start">
          <DropdownMenuLabel>我的状态</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={agent.status}
            onValueChange={handleStatusChange}
          >
            <DropdownMenuRadioItem value="online">
              <Wifi className="mr-2 h-4 w-4 text-green-500" />
              在线
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="busy">
              <Bell className="mr-2 h-4 w-4 text-orange-500" />
              忙碌
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="offline">
              <Moon className="mr-2 h-4 w-4 text-gray-500" />
              离线
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>分享聊天链接</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>设置</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AgentSettingsDialog
        isOpen={isSettingsOpen}
        setIsOpenAction={setIsSettingsOpen}
      />
      <ShareDialog isOpen={isShareOpen} setIsOpenAction={setIsShareOpen} />
    </>
  );
}
