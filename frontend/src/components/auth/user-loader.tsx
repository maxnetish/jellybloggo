"use client";

import { useEffect, useRef, useState } from "react";
import { AuthProvider } from "@/lib/auth";
import type { User } from "@/lib/api/user/dto";
import { UserInfo } from "@/components/user";

/**
 * Loads user data client-side and provides it to AuthProvider.
 * Uses useEffect to fetch user after hydration.
 */
export function UserLoader({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchedRef = useRef(false);

  useEffect(() => {
    // React StrictMode в dev-режиме вызывает useEffect дважды.
    // useRef-флаг гарантирует, что fetch выполнится только один раз.
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Fetch user client-side - cookies are sent automatically
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        setUser(data?.user || null);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  return (
    <AuthProvider user={user}>
      {/* Render UserInfo only after loading to avoid flash */}
      {!isLoading && <UserInfo />}
      {children}
    </AuthProvider>
  );
}

/**
 * Skeleton shown while user data is loading
 */
export function UserInfoSkeleton() {
  return <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />;
}