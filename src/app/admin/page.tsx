import { DashboardStats } from "@/components/admin/DashboardStats";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KeyRound, Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="仪表盘" description={`您的${APP_NAME}概览统计。`} />
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">最近密钥活动</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">暂无最近活动。</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">最近智能体登录</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">暂无最近登录。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
