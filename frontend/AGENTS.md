# AGENTS.md

You are an expert in TypeScript, React, Next.js, and scalable web application development.

## Node.js

- **Required version: v22+** (Vitest requires Node 22+)
- Use **nvm** to manage Node.js versions: `nvm use 22`
- **DO NOT install Node.js globally** or upgrade system Node — use nvm only

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Base UI (copy-paste approach, native HTML + Tailwind)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + React Testing Library

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use explicit return types for exported functions

## Next.js App Router

### Server Components vs Client Components

- **Server Components** (default): async/await, no hooks, no browser APIs
- **Client Components**: `'use client'` directive at top of file
- Prefer Server Components; add `'use client'` only when needed:
  - `useState`, `useEffect`, `useRef`
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (window, document)
  - Third-party libraries that need client-side rendering

### Routing

- File-based routing in `src/app/`
- Route groups with `(group)` folders (no URL segment)
- Dynamic segments: `[id]`, `[...slug]`
- `layout.tsx` — persists across route changes
- `page.tsx` — page content
- `loading.tsx` — loading skeleton
- `error.tsx` — error boundary

### Data Fetching

- Use `async/await` directly in Server Components
- Fetch in parallel with `Promise.all()`
- Use `unstable_noStore()` or `no-store` fetch option for user-specific data
- Use `revalidate` for cached data

## Components

- Components go in `src/components/`
- UI components (Base UI style) go in `src/components/ui/`
- Use `'use client'` only when necessary

## Base UI Components

Components are copy-pasted into the project using native HTML elements + Tailwind CSS.
No external component libraries (Radix, etc.) — only lightweight utils (`clsx`, `tailwind-merge`).

To add a component:
1. Create the component in `src/components/ui/<component-name>.tsx`
2. Use native HTML elements with Tailwind classes
3. Use `cn()` utility from `@/lib/utils` for class merging

Example:
```tsx
// src/components/ui/button.tsx
import { cn } from "@/lib/utils";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium...",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

## Backend Integration

Backend API base URL: `/api`

### Authentication

Backend uses HTTP-only cookies for authentication:
- `access_token` and `refresh_token` cookies
- Cookies are sent automatically by the browser

### Auth Flow

1. **Login**: `POST /api/auth/login` with `{ "login": "...", "password": "..." }`
2. **Protected Requests**: Cookies sent automatically
3. **Logout**: `POST /api/auth/logout`
4. **Get Current User**: `GET /api/auth/user`

### API Service Pattern

Create services in `src/lib/api/` to encapsulate API logic:

```typescript
// src/lib/api/auth.ts
async function login(data: { login: string; password: string }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}
```

## Environment

Development server: `http://localhost:3000`
Backend API: `http://localhost:8080`

## Running Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run tests in watch mode
npm run test:run  # Run tests once (CI mode)
```

## Testing

### Framework

- **Vitest** for unit/integration tests
- **React Testing Library** for component tests
- **jsdom** as test environment

### Writing Tests

Test files should be named `*.test.tsx` or `*.spec.tsx` and placed next to the code being tested.

```tsx
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Best Practices

- Test behavior, not implementation details
- Use `screen` queries for finding elements
- Use `userEvent` for user interactions (install separately: `npm install -D @testing-library/user-event`)
- Avoid testing internal state; test rendered output
- Keep tests close to the code they test (co-location)