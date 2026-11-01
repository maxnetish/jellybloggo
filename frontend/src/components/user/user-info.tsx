"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Auth widget: shows the logged-in user (click to logout) or a login link.
 * Reads the session from AuthProvider — no direct API calls here.
 * Renders nothing while the session is not yet resolved.
 */
export function UserInfo() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return null;
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
