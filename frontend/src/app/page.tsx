/**
 * Page — это страница по адресу "/".
 * Сессию предоставляет AuthProvider в корневом layout; UserInfo
 * читает её через useAuth() и обновляется реактивно (логин/логаут
 * отражаются сразу, без перезагрузки страницы).
 */

import { UserInfo } from "@/components/user";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute top-4 right-4">
        <UserInfo />
      </div>
      <h1 className="text-4xl font-bold">Hello World!</h1>
      <p className="mt-4 text-zinc-600">Next.js is working</p>
    </main>
  );
}
