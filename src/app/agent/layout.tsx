import { AgentUI } from "@/components/agent/AgentUI";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <AgentUI />
    </div>
  );
}
