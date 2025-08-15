import { VisitorChat } from "@/components/visitor/VisitorChat";

interface VisitorPageProps {
  params: {
    shareId: string;
  };
}

export default function VisitorPage({ params }: VisitorPageProps) {
  return (
    <main className="flex h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-lg h-full sm:h-[90vh] sm:max-h-[700px] flex flex-col bg-background shadow-2xl sm:rounded-2xl">
        <VisitorChat shareId={params.shareId} />
      </div>
    </main>
  );
}
