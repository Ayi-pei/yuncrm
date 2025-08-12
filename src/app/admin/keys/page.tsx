import { KeyManagementTable } from "@/components/admin/KeyManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";

export default function KeyManagementPage() {
  return (
    <div className="flex flex-col gap-8">
      <KeyManagementTable />
    </div>
  );
}
