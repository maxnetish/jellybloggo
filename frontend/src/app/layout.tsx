/**
 * Layout — корневой макет приложения. Server Component.
 *
 * AuthProvider (client component) подключается на страницах, которым нужна
 * сессия: при cacheComponents клиентский state в корневом layout сделал бы
 * все страницы блокирующими для пререндера (CLIENT_HOOK_DYNAMIC).
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jellybloggo",
  description: "A blog application",
};

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
