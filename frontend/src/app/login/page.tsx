"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Paper, TextInput, PasswordInput, Button, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/auth";

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
    // setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginData = {
      login: formData.get("login") as string,
      password: formData.get("password") as string,
    };

    try {
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
    <Paper withBorder shadow="md" p="xl" w={350}>
      <h1 className="text-center text-xl font-semibold mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}
        <TextInput
          id="login"
          name="login"
          label="Login"
          placeholder="Your login"
          required
          disabled={isLoading}
        />
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Your password"
          required
          disabled={isLoading}
        />
        <Button type="submit" fullWidth loading={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Paper>
  );
}

/** Placeholder shown while the form streams in. */
function LoginFormSkeleton() {
  return (
    <Paper withBorder shadow="md" p="xl" w={350}>
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded bg-zinc-200" />
        <div className="h-10 rounded bg-zinc-200" />
        <div className="h-10 rounded bg-zinc-200" />
      </div>
    </Paper>
  );
}

/**
 * Page — страница входа (default export — точка входа роута).
 * Форма в Suspense: useSearchParams доступен только в рантайме,
 * статический шелл страницы пререндерится без неё.
 * Сессию предоставляет AuthProvider в корневом layout.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}