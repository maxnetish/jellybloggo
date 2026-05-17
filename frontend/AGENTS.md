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

- Backend API base URL is configured via environment files:
  - `src/environments/environment.ts` (dev): `apiUrl: 'http://localhost:8080/api'`
  - `src/environments/environment.prod.ts` (prod): `apiUrl: '/api'` (nginx proxies to backend)
- All API calls go through dedicated services encapsulating API logic
- Handle HTTP errors centrally (e.g., via interceptor)
- In development, Express server proxies `/api/*` to `BACKEND_URL` env or `http://localhost:8080`

## Authentication

See `backend/internal/auth/README_UI.md` for API contract.

### Auth Flow

1. **Login**: `POST /api/auth/login` with `{ "login": "...", "password": "..." }`
   - Response: `{ "access_token": "...", "user": { "id", "login", "roles" } }`
   - Store `access_token` in memory/localStorage
   - `refresh_token` stored in HTTP-only cookie automatically

2. **Protected Requests**: Include header `Authorization: Bearer <access_token>`

3. **Token Refresh**: `POST /api/auth/refresh` (cookie sent automatically)
   - If 401, show login form

4. **Logout**: `POST /api/auth/logout` (cookie sent automatically)
   - Clear `access_token` and user from frontend storage

5. **Get Current User**: `GET /api/auth/user` with Bearer token
   - Response: `{ "user": {...} }` or `{ "user": null }`

### Auth Service Pattern

- Create `AuthService` with methods: `login`, `logout`, `refresh`, `getCurrentUser`
- Store token in memory (preferred) or localStorage
- Create `tokenInterceptor` (functional interceptor) to attach Bearer header automatically
- Handle 401 responses globally to trigger refresh flow

### Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Token expired/invalid | Attempt refresh, redirect to login if failed |
| 403 | Forbidden | Show "Access denied" message |
| 500 | Server error | Show generic error message |