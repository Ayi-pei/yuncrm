import { DashboardStats } from "@/components/admin/DashboardStats";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KeyRound, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="At-a-glance statistics for your AgentVerse." />
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Key Activity</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">No recent activity to show.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Agent Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">No recent logins to show.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
