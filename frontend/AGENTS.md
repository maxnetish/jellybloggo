You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v21+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## SSR & Hydration

- SSR is enabled via `@angular/ssr`
- Hydration is automatic in Angular 17+ with SSR mode
- Use `TransferState` to pass server data to client and avoid duplicate HTTP requests
- Never access `window`/`document` directly in constructors or sync code — use `afterNextRender` or check `PLATFORM_ID` with `isPlatformBrowser`
- For HTTP in SSR context, use `provideHttpClient(withFetch())` for consistent fetch-based requests

## Backend Integration

- Backend API base URL and proxy are configured via environment files:
  - `src/environments/environment.ts` (dev): `apiUrl: '/api'`, `backendProxy: 'http://localhost:8080'`
  - `src/environments/environment.prod.ts` (prod): `apiUrl: '/api'`
- All API calls go through dedicated services encapsulating API logic
- Handle HTTP errors centrally (e.g., via interceptor)
- In development, Express server proxies `/api/*` to `environment.backendProxy` (default: `http://localhost:8080`)
- In production, nginx handles `/api/*` routing before requests reach Express

## Authentication

See `backend/internal/auth/README_UI.md` for API contract.

**Important**: Backend uses HTTP-only cookies for both `access_token` and `refresh_token`. No manual `Authorization: Bearer` header management is needed — cookies are sent automatically by the browser.

### Auth Flow

1. **Login**: `POST /api/auth/login` with `{ "login": "...", "password": "..." }`
   - Response: `{ "user": { "id", "login", "roles" } }`
   - `access_token` and `refresh_token` are set in HTTP-only cookies by the backend
   - No client-side token storage

2. **Protected Requests**: Cookies are sent automatically. No manual headers needed.

3. **Token Refresh**: Automatic transparent refresh by backend.
   - If `access_token` is invalid, backend uses `refresh_token` to generate new tokens.
   - New cookies are set in the response (token rotation).
   - Manual `POST /api/auth/refresh` available but rarely needed.

4. **Logout**: `POST /api/auth/logout` (cookies sent automatically)
   - Backend clears both cookies
   - No client-side cleanup needed

5. **Get Current User**: `GET /api/auth/user` (cookie sent automatically)
   - Response: `{ "user": {...} }` or `{ "user": null }`

### SSR (Server-Side Rendering)

- Express proxy **must forward** `Cookie` header from browser request to backend (`proxyReq.setHeader('Cookie', req.headers.cookie)`)
- Backend handles token refresh transparently — `authInterceptor` only captures `Set-Cookie` headers on 401 and forwards them via `REQUEST_CONTEXT` to Express
- Captured `Set-Cookie` headers are accumulated in `REQUEST_CONTEXT` and forwarded to the browser response by Express

### Auth Service Pattern

- `AuthApiService` with methods: `login`, `logout`, `getCurrentUser`
- `authInterceptor` — captures `Set-Cookie` headers on 401 in SSR and forwards to browser
- Backend `TransparentRefreshMiddleware` handles all token validation and refresh transparently

### Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Both tokens invalid, session expired | Backend refreshes automatically; if seen by UI, show login |
| 403 | Forbidden | Show "Access denied" message |
| 500 | Server error | Show generic error message |