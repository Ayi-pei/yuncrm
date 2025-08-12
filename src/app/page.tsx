import { LoginForm } from "@/components/auth/LoginForm";
import { Bot } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Bot size={36} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
                AgentVerse
            </h1>
            <p className="mt-2 text-muted-foreground">
                The AI-powered multi-agent customer service platform.
            </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Use <code className="font-mono p-1 bg-muted rounded-sm">ADMIN-SUPER-SECRET</code> for admin access.
        </p>
      </div>
    </main>
  );
}
