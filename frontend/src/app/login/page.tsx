"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export { LoginPage as default };
export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nextUrl = searchParams.get("next") || "/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const loginData = {
      login: formData.get("login") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      if (!res.ok) {
        let errorMessage = "Login failed";
        try {
          const err = await res.json();
          if (err.code === "INVALID_CREDENTIALS") {
            errorMessage = "Invalid login or password";
          } else if (err.error) {
            errorMessage = err.error;
          }
        } catch {
          // Use default message
        }
        setError(errorMessage);
        return;
      }

      // Cookies are set by the server response
      // Redirect to next page
      router.push(nextUrl);
    } catch {
      setError("Network error. Please try again.");
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