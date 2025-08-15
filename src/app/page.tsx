import { LoginForm } from "@/components/auth/LoginForm";
import { Headset } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Headset size={36} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
                {APP_NAME}
            </h1>
            <p className="mt-2 text-muted-foreground">
                云聚精研，匠心CRM。智能驱动，重塑客户体验。
            </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
