"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/auth/errors";
import { ErrorCodes } from "@/lib/api/dto";

export { LoginPage as default };
export function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nextUrl = searchParams.get("next") || "/";

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const loginValue = formData.get("login") as string;
    const password = formData.get("password") as string;

    try {
      await login({ login: loginValue, password });
      // Full page reload to refresh auth state
      window.location.href = nextUrl;
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case ErrorCodes.INVALID_CREDENTIALS:
            setError("Invalid login or password");
            break;
          case ErrorCodes.VALIDATION:
            setError("Please check your input");
            break;
          default:
            setError(err.message || "Login failed");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-87.5">
        <CardHeader>
          <CardTitle className="text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input id="login" name="login" type="text" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}