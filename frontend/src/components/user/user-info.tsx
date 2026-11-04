"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer outline-none">
        {displayName}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLinkItem render={<Link href="/admin" />} closeOnClick>
          Admin
        </DropdownMenuLinkItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          closeOnClick
          className="text-red-600"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}