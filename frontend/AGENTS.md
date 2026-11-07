# AGENTS.md

You are an expert in TypeScript, React, Next.js, and scalable web application development.

## Node.js

- **Required version: v22+** (Vitest requires Node 22+)
- Use **nvm** to manage Node.js versions: `nvm use 22`
- **DO NOT install Node.js globally** or upgrade system Node — use nvm only

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19
- **Styling**: Tailwind CSS 4 + Mantine component library
- **Components**: Mantine UI (import from `@mantine/core`)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + React Testing Library

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use explicit return types for exported functions
- **Quotes**: use single quotes in JS/TS (`'foo'`), double quotes only in JSX/HTML attributes (`<div className="foo">`)
- **Function parameters**: if a function has more than one parameter, use named spread style:
  ```typescript
  // Good: named spread
  async function listUsers({ query = {}, cookieHeader = null }: ListUsersOptions)
  
  // Bad: positional arguments
  async function listUsers(query: ListUsersQuery, cookieHeader: string)
  ```

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

### URL Parameters as Filter/Pagination State

When implementing search, filters, or pagination where URL params serve as state (not navigation between pages):

**✅ Correct pattern:**
```tsx
import { useRouter } from 'next/navigation';

function FilterComponent() {
  const router = useRouter();
  
  function updateUrl(newParams: URLSearchParams) {
    const newUrl = `/path?${newParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    router.refresh();
  }
}
```

**❌ Do NOT use `router.push()` for this:**
- `router.push()` triggers Next.js PPR prefetch for multiple URL variants
- Results in duplicate RSC requests when params are added/removed
- `router.replace()` has the same issue

**Why this works:**
- `window.history.pushState` — native browser API, no Next.js prefetch
- `router.refresh()` — explicitly re-renders Server Components with new searchParams

**When to use which:**
| Scenario | Approach |
|----------|----------|
| Navigation to a new page | `router.push()` or `<Link>` |
| Changing filters/pagination on current page | `history.pushState` + `router.refresh()` |
| Deep links that need prefetch | `router.push()` (acceptable tradeoff) |

## Components

- Components go in `src/components/`
- UI components go in `src/components/ui/`
- Use `'use client'` only when necessary

## Mantine UI

Use Mantine components from `@mantine/core`. Import only what you need.

```tsx
import { Menu, Button, TextInput } from "@mantine/core";
```

### Adding MantineProvider

MantineProvider is already set up in `src/components/providers/MantineProvider.tsx`.
Wrap any new client components that need Mantine hooks with it.

### Common Components

- **Menu** — dropdown menus
- **Button** — buttons with variants
- **TextInput, NumberInput** — form inputs
- **Textarea** — multiline text input
- **Select, Combobox** — select/dropdown components
- **Modal, Drawer** — overlays
- **Tabs** — tabbed navigation

### Styling

Use Mantine's `className` for custom Tailwind classes alongside Mantine's `c` or `style` props.
Prefer Mantine's built-in styling props (color, size, variant) over custom CSS when possible.

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

### DTO Organization

Each DTO (Data Transfer Object) must be in its own file. Group related DTOs in a directory:

```
src/lib/api/user/dto/
├── index.ts
├── user.ts        # User interface
├── user-role.ts   # UserRole const
└── user.dto.ts    # Other user-related DTOs
```

Export all DTOs from the directory's `index.ts`.

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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
