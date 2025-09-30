"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/lib/stores/agentStore";
import { useAuthContext } from "@/lib/auth";
import { CustomerList } from "./CustomerList";
import { UnifiedChatWindow } from "./UnifiedChatWindow";
import { Skeleton } from "../ui/skeleton";
import { MessageCircle } from "lucide-react";

export function AgentUI() {
  const { user } = useAuthContext();
  const {
    fetchAgentData,
    isLoading,
    activeSessionId,
    sessions,
    customers,
    agent,
  } = useAgentStore();

  useEffect(() => {
    if (user?.role === "agent") {
      fetchAgentData(user.id);
    }
  }, [user, fetchAgentData]);

  if (isLoading && !agent) {
    return <LoadingSkeleton />;
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeCustomer = customers.find(
    (c) => c.id === activeSession?.customerId
  );

  return (
    <div className="flex h-full">
      <CustomerList />
      {activeSession && activeCustomer ? (
        <UnifiedChatWindow 
          session={activeSession} 
          customer={activeCustomer}
          showCustomerDetails={true}
          enableWebSocket={true}
          enableAIRedaction={true}
          enablePerformanceMonitoring={true}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/30">
          <MessageCircle size={48} className="mb-4" />
          <h2 className="text-xl font-semibold">无有效对话</h2>
          <p>从列表中选择一个对话开始。</p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r p-2 flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full opacity-50" />
        <Skeleton className="h-16 w-full opacity-50" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-16 w-2/3" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
