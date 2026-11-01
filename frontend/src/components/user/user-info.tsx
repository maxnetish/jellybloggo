"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export function UserInfo() {
  const { user } = useAuth();

  if (user) {
    const displayName = user.full_name || user.login;
    return (
      <button
        onClick={() => {
          /* TODO: logout action */
        }}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        {displayName}
      </button>
    );
  }

  return (
    <Link href="/login" className="text-sm text-blue-600 hover:underline">
      Login
    </Link>
  );
}