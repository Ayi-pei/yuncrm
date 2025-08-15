import { AgentManagementTable } from "@/components/admin/AgentManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AgentManagementPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="智能体管理" 
        description="查看系统中的所有智能体及其当前状态。"
      >
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回仪表盘
          </Link>
        </Button>
      </PageHeader>
      <AgentManagementTable />
    </div>
  );
}
