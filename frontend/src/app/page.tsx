/**
 * Page — это страница по адресу "/".
 * Файл называется page.tsx, потому что это route для "/".
 *
 * В Next.js App Router:
 * - page.tsx — содержимое страницы
 * - layout.tsx — общая обёртка (header, footer, etc.)
 *
 * Это Server Component (по умолчанию). Нет 'use client' — значит:
 * ✓ Можно использовать async/await для fetch данных
 * ✓ Нельзя использовать useState, useEffect, onClick
 * ✓ Код выполняется на сервере, HTML отдаётся готовым
 */

import { UserInfo } from "@/components/user";

/**
 * Каждый page.tsx экспортирует компонент по умолчанию (default export).
 * Next.js использует его как содержимое route.
 */
export default function Home() {
  return (
    /*
     * <main> — семантический тег для основного содержимого.
     * className — Tailwind CSS классы (вместо обычного CSS).
     * Этот синтаксис работает потому что tailwind настроен в проекте.
     */
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      {/* UserInfo widget — Client Component, показывает login/logout */}
      <div className='absolute top-4 right-4'>
        <UserInfo />
      </div>

      {/* <h1> — заголовок первого уровня */}
      <h1 className='text-4xl font-bold'>Hello World!</h1>

      {/* <p> — параграф. mt-4 = margin-top: 1rem */}
      <p className='mt-4 text-zinc-600'>Next.js is working</p>
    </main>
  );
}

/*
 * Tailwind классы, использованные здесь:
 *
 * flex          — display: flex
 * min-h-screen  — min-height: 100vh
 * flex-col      — flex-direction: column
 * items-center  — align-items: center
 * justify-center — justify-content: center
 * p-24          — padding: 6rem (96px)
 *
 * absolute      — позиционирование
 * top-4         — top: 1rem
 * right-4       — right: 1rem
 *
 * text-4xl      — font-size: 2.25rem
 * font-bold     — font-weight: 700
 * mt-4          — margin-top: 1rem
 * text-zinc-600 — цвет текста (серый)
 */