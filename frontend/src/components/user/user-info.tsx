"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Auth widget: shows the logged-in user (click to logout) or a login link.
 * Reads the session from AuthProvider — no direct API calls here.
 */
export function UserInfo() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return <div className="h-5 w-20 animate-pulse rounded bg-zinc-200" />;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm text-blue-600 hover:underline">
        Login
      </Link>
    );
  }

  const displayName = user.full_name || user.login;

  return (
    <button
      type="button"
      onClick={() => logout()}
      className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
    >
      {displayName}
    </button>
  );
}
