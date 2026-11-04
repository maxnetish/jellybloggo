/**
 * Layout — корневой макет приложения. Server Component.
 *
 * AuthProvider (client component) монтируется здесь один раз: layout
 * сохраняется при клиентской навигации, поэтому сессия не сбрасывается
 * при переходах между страницами, а login/logout мгновенно отражаются
 * в UI на любом роуте.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { MantineProviders } from "@/components/providers/MantineProvider";
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
      <body className="min-h-full flex flex-col">
        <MantineProviders>
          <AuthProvider>{children}</AuthProvider>
        </MantineProviders>
      </body>
    </html>
  );
}
