"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * The interactive login form. Reads the `next` query param, so it must render
 * inside a <Suspense> boundary (see LoginPage) to keep the page prerenderable.
 */
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const nextUrl = searchParams.get("next") || "/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginData = {
      login: formData.get("login") as string,
      password: formData.get("password") as string,
    };

    try {
      // Cookies land in the browser via the /api proxy; AuthProvider
      // updates its state, so the UI reflects the session immediately.
      await login(loginData);
      router.push(nextUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        setError("Invalid login or password");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
  );
}

/** Placeholder shown while the form streams in. */
function LoginFormSkeleton() {
  return (
    <Card className="w-87.5">
      <CardContent className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded bg-zinc-200" />
          <div className="h-10 rounded bg-zinc-200" />
          <div className="h-10 rounded bg-zinc-200" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Page — страница входа (default export — точка входа роута).
 * Форма в Suspense: useSearchParams доступен только в рантайме,
 * статический шелл страницы пререндерится без неё.
 */
export default function LoginPage() {
  return (
    <AuthProvider>
      <main className="flex min-h-screen items-center justify-center">
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </main>
    </AuthProvider>
  );
}
