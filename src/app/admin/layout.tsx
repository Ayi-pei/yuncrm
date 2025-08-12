import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
    </SidebarProvider>
  );
}
