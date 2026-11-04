"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";
import { AdminNavMenu } from "@/components/admin/nav-menu";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`/login?next=${callbackUrl}`);
    }
  }, [status, pathname, router]);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  return (
    <div>
      <AdminNavMenu />
      <main>{children}</main>
    </div>
  );
}