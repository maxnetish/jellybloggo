"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/filemanager", label: "File Manager" },
];

export function AdminNavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {adminLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink render={<Link href={link.href} />} className={navigationMenuTriggerStyle()}>
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}