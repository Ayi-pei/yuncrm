import { AgentManagementTable } from "@/components/admin/AgentManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AgentManagementPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Agent Management" description="View all agents in the system and their current status." />
      <AgentManagementTable />
    </div>
  );
}
