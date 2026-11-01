# Jellybloggo Frontend

React + Next.js frontend for Jellybloggo blog platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Components**: Base UI (native HTML + Tailwind, copy-paste)
- **Language**: TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Development

- Frontend runs on http://localhost:3000
- Backend API should be running on http://localhost:8080
- API proxy is configured in `next.config.ts` (requests to `/api/*` are forwarded to backend)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx           # Home page
├── components/ui/          # Base UI components (Button, Card, Input, Label, etc.)
└── lib/
    ├── api/auth/           # Auth API client and DTOs
    │   ├── client.ts       # login(), logout(), getUser()
    │   └── dto/           # TypeScript DTOs with JSDoc
    ├── auth/              # Auth context and provider
    └── utils.ts           # cn() utility for Tailwind classes
```

## Components

UI components are built with native HTML elements + Tailwind CSS.
Components are copy-pasted into `src/components/ui/` — no external component libraries.

## Testing

Uses Vitest + React Testing Library.

```bash
npm run test      # Watch mode
npm run test:run  # Single run
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)