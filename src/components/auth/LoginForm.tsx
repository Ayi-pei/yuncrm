"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function LoginForm() {
  const [key, setKey] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    await login(key);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {/* 隐藏的用户名字段以提高可访问性 */}
          <input
            type="text"
            autoComplete="username"
            aria-hidden="true"
            className="hidden-input"
          />
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="password"
              id="access-key"
              name="access-key"
              placeholder="请输入您的访问密钥"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isLoading}
              className="pl-10"
              autoFocus
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !key}>
            {isLoading ? <Loader2 className="animate-spin" /> : "解锁"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
