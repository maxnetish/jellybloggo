"use client";

import Link from "next/link";
import { Menu } from "@mantine/core";
import { useAuth } from "@/lib/auth";

/**
 * Auth widget: shows the logged-in user with a dropdown menu or a login link.
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
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <button
          type="button"
          className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer outline-none"
        >
          {displayName}
        </button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item component={Link} href="/admin">
          Admin
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          component="button"
          onClick={() => logout()}
          color="red"
          className="w-full text-left"
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}