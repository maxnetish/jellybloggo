"use client";

/**
 * Layout — корневой макет приложения.
 * Клиентский компонент, так как auth загружается клиентским fetch.
 */

import { Geist, Geist_Mono } from "next/font/google";
import { UserLoader } from "@/components/auth/user-loader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UserLoader>{children}</UserLoader>
      </body>
    </html>
  );
}