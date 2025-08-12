"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/lib/stores/adminStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, KeyRound, Wifi, Signal } from "lucide-react";

export function DashboardStats() {
  const { dashboardData, fetchDashboardData, isLoading } = useAdminStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    {
      title: "Total Agents",
      value: dashboardData?.totalAgents,
      icon: Users,
    },
    {
      title: "Online Agents",
      value: dashboardData?.onlineAgents,
      icon: Wifi,
    },
    {
      title: "Total Keys",
      value: dashboardData?.totalKeys,
      icon: KeyRound,
    },
    {
      title: "Active Keys",
      value: dashboardData?.activeKeys,
      icon: Signal,
    },
  ];

  if (isLoading && !dashboardData) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
           <Card key={i}>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-6 rounded-sm" />
             </CardHeader>
             <CardContent>
                <Skeleton className="h-8 w-12 mt-1" />
             </CardContent>
           </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value ?? 0}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
