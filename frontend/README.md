# Jellybloggo Frontend

React + Next.js frontend for Jellybloggo blog platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Components**: shadcn/ui
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
- API proxy is configured in `next.config.ts`

## Adding Components

```bash
# Add a shadcn/ui component
npx shadcn@latest add button

# This copies the component to src/components/ui/
```

## Testing

Uses Vitest + React Testing Library.

```bash
npm run test      # Watch mode
npm run test:run  # Single run
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)