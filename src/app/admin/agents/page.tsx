import { AgentManagementTable } from "@/components/admin/AgentManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AgentManagementPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="智能体管理" description="查看系统中的所有智能体及其当前状态。" />
      <AgentManagementTable />
    </div>
  );
}
