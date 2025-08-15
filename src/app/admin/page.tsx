
'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Users, ArrowRight, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { logout } = useAuthStore();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title={`欢迎回来，管理员！`}
        description={`您正在管理 ${APP_NAME}。在这里您可以管理访问密钥和客服智能体。`} 
      >
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/keys">
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl">密钥管理</CardTitle>
                <CardDescription className="mt-1">创建和管理坐席/管理员密钥</CardDescription>
              </div>
               <KeyRound className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium">
                前往管理 <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/agents">
          <Card className="hover:border-primary/50 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl">智能体管理</CardTitle>
                <CardDescription className="mt-1">查看和管理所有客服坐席</CardDescription>
              </div>
               <Users className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium">
                 前往管理 <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
