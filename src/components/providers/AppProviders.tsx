"use client";

import { useAuthContext, checkRoutePermission } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Headset } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const userRole = user?.role;
    const { allowed, redirectTo } = checkRoutePermission(pathname, userRole);

    if (!allowed && redirectTo) {
      router.push(redirectTo);
      return;
    }

    setIsChecking(false);
  }, [user, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Headset size={36} />
          </div>
          <p className="text-muted-foreground animate-pulse">
            正在加载{APP_NAME}...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
