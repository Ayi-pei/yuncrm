import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/40">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
