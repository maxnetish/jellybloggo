"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavLink } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconUser,
  IconFilePencil,
} from "@tabler/icons-react";
import { UserInfo } from "@/components/user/user-info";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/profile", label: "Profile", icon: IconUser },
  { href: "/admin/filemanager", label: "File Manager", icon: IconFilePencil },
];

export function AdminNavMenu() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {adminLinks.map((link) => (
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