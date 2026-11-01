/**
 * Page — это страница по адресу "/".
 * UserInfo рендерится на странице и берёт сессию из AuthProvider.
 */

import { AuthProvider } from "@/lib/auth";
import { UserInfo } from "@/components/user";

export default function Home() {
  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="absolute top-4 right-4">
          <UserInfo />
        </div>
        <h1 className="text-4xl font-bold">Hello World!</h1>
        <p className="mt-4 text-zinc-600">Next.js is working</p>
      </main>
    </AuthProvider>
  );
}
