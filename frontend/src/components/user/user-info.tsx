"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export function UserInfo() {
  const { user } = useAuth();

  if (user) {
    const displayName = user.full_name || user.login;

    // Logout через клиентский fetch: убирает cookies на бэкенде,
    // затем полная перезагрузка документа на "/".
    // window.location (а не router.push) нужен, чтобы сбросить
    // клиентское состояние React (AuthProvider) после logout.
    async function handleLogout() {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Полная перезагрузка документа (не router.push) — нужна для сброса
      // клиентского состояния (AuthProvider) после logout.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }

    return (
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
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
