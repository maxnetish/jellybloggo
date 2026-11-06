"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavLink } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconUser,
  IconFilePencil,
  IconUsers,
} from "@tabler/icons-react";
import { UserInfo } from "@/components/user/user-info";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/api/user/dto";

interface AdminLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  requiredRole?: string;
}

const adminLinks: AdminLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/profile", label: "Profile", icon: IconUser },
  { href: "/admin/filemanager", label: "File Manager", icon: IconFilePencil },
  { href: "/admin/users", label: "Users", icon: IconUsers, requiredRole: UserRole.ADMIN },
];

function isLinkVisible(link: AdminLink, userRoles: string[] | undefined): boolean {
  if (!link.requiredRole) {
    return true;
  }
  return userRoles?.includes(link.requiredRole) ?? false;
}

export function AdminNavMenu() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleLinks = adminLinks.filter((link) =>
    isLinkVisible(link, user?.roles)
  );

  return (
    <header className="border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.href}
              component={Link}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size={16} stroke={1.5} />}
              active={pathname === link.href}
              variant="subtle"
              style={{ width: "auto" }}
            />
          ))}
        </div>
        <UserInfo />
      </div>
    </header>
  );
}