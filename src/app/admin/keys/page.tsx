
import { KeyManagementTable } from "@/components/admin/KeyManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function KeyManagementPage() {
  return (
    <div className="flex flex-col gap-8">
       <PageHeader 
        title="密钥管理" 
        description="为您的智能体和管理员创建、编辑和管理访问密钥。"
      >
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回仪表盘
                </Link>
            </Button>
        </div>
      </PageHeader>
      <KeyManagementTable />
    </div>
  );
}
