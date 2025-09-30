import { VisitorChat } from "@/components/visitor/VisitorChat";

interface VisitorPageProps {
  params: Promise<{
    shareId: string; // This is now the alias/token
  }>;
}

// This page now acts as the entry point for the alias token.
// VisitorChat component will handle fetching the real session data using this token.
export default async function VisitorPage({ params }: VisitorPageProps) {
  const { shareId } = await params;
  return (
    <main className="flex h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-lg h-full sm:h-[90vh] sm:max-h-[700px] flex flex-col bg-background shadow-2xl sm:rounded-2xl">
        <VisitorChat aliasToken={shareId} />
      </div>
    </main>
  );
}
