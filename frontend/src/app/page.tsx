/**
 * Page — это страница по адресу "/".
 * UserInfo уже отрисовывается в layout через UserLoader.
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Hello World!</h1>
      <p className="mt-4 text-zinc-600">Next.js is working</p>
    </main>
  );
}