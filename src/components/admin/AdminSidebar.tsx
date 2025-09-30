"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Headset, KeyRound, Users, BarChart3, LogOut, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

const menuItems = [
  { href: "/admin", label: "仪表盘", icon: BarChart3 },
  { href: "/admin/keys", label: "密钥管理", icon: KeyRound },
  { href: "/admin/agents", label: "智能体管理", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Headset size={24} />
                </div>
                <span className="font-semibold group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden"/>
        </SidebarHeader>

        <SidebarMenu className="flex-1 p-2">
            {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.label}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            ))}
        </SidebarMenu>
        
        <SidebarFooter className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:bg-transparent">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
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
        </SidebarFooter>
    </Sidebar>
  );
}
