"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";
import { AdminNavMenu } from "@/components/admin/nav-menu";
import { UserRole } from "@/lib/api/user/dto";

// Role requirements for admin sub-pages
const pageRoleRequirements: Record<string, string> = {
  "/admin/users": UserRole.ADMIN,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname);
      router.replace(`/login?next=${callbackUrl}`);
      return;
    }

    // Check role requirements only after auth status is resolved
    if (status === "authenticated") {
      const requiredRole = pageRoleRequirements[pathname];
      if (requiredRole && !user?.roles.includes(requiredRole)) {
        router.replace("/admin/dashboard");
      }
    }
  }, [status, pathname, router, user]);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  // Final role check after auth is resolved
  const requiredRole = pageRoleRequirements[pathname];
  if (requiredRole && !user?.roles.includes(requiredRole)) {
    router.replace("/admin/dashboard");
    return null;
  }

  return (
    <div>
      <AdminNavMenu />
      <main>{children}</main>
    </div>
  );
}