"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Headset } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const protectedRoutes = {
  admin: "/admin",
  agent: "/agent",
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const userRole = user?.role;
    const isAuthRoute = pathname === "/";
    const isAdminRoute = pathname.startsWith(protectedRoutes.admin);
    const isAgentRoute = pathname.startsWith(protectedRoutes.agent);
    const isChatRoute = pathname.startsWith("/chat") || pathname.startsWith("/noiod") || pathname.startsWith("/naoiod");

    if (isChatRoute) {
      setIsChecking(false);
      return;
    }
    
    if (userRole) {
      if (isAuthRoute) {
        router.push(`/${userRole}`);
      } else if (isAdminRoute && userRole !== 'admin') {
        router.push('/agent');
      } else if (isAgentRoute && userRole !== 'agent') {
        router.push('/admin');
      } else {
        setIsChecking(false);
      }
    } else {
      if (!isAuthRoute) {
        router.push('/');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Headset size={36} />
            </div>
            <p className="text-muted-foreground animate-pulse">正在加载{APP_NAME}...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
