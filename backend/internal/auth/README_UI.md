# Notes for UI Implementation

## Authentication Flow

All tokens are stored in HTTP-only cookies for security. The browser automatically sends cookies with each request.

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{ "login": "...", "password": "..." }
```

**Response (200):**
```json
{ "user": { "id": "1", "login": "admin", "roles": [...] } }
```

- `access_token` is set in HTTP-only cookie (expires in 15 min by default)
- `refresh_token` is set in HTTP-only cookie (expires in 7 days by default)

---

### 2. Making Protected Requests
```javascript
// Cookies are sent automatically by the browser
fetch('/api/protected-endpoint')
```

No manual header management needed. Both tokens are sent automatically via cookies.

---

### 3. Handling Token Expiry
```javascript
// Interceptor example (Angular HttpClient)
intercept(req, next) {
  return next.handle(req).pipe(
    catchError(error => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return this.refreshAndRetry(req, next);
      }
      return throwError(() => error);
    })
  );
}
```

---

### 4. Refresh Token
```http
POST /api/auth/refresh
Cookie: refresh_token=<http_only_cookie>
```

**Response (200):**
```json
{ "user": { "id": "1", "login": "admin", "roles": [...] } }
```

- New `access_token` cookie is set automatically
- New `refresh_token` cookie is set automatically (rotation)

**Response (401):** Session expired. User must log in again.

---

### 5. Logout
```http
POST /api/auth/logout
Cookie: refresh_token=<http_only_cookie>, access_token=<http_only_cookie>
```

- Both cookies are cleared on the server
- No client-side cleanup needed

---

### 6. Get Current User
```http
GET /api/auth/user
Cookie: access_token=<http_only_cookie>
```

**Response (200 - logged in):**
```json
{ "user": { "id": "1", "login": "admin", "roles": [...] } }
```

**Response (200 - not logged in):**
```json
{ "user": null }
```

---

## SSR (Server-Side Rendering) Notes

When using SSR (e.g., Angular Universal, Next.js):

1. **Proxy must forward cookies** from browser request to backend
2. Example for Express proxy:
```javascript
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
    }
  }
}));
```

---

## Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Token expired or invalid | Call refresh, then redirect to login if fails |
| 403 | Forbidden | Show "Access denied" |
| 500 | Server error | Show error message |

---

## Security Notes

1. Both `access_token` and `refresh_token` are in HTTP-only cookies - protected from XSS
2. `SameSite=Lax` - protection against CSRF for same-site requests
3. `Secure=true` in production (HTTPS) - set `SECURE_COOKIES=true` env var
4. Refresh token rotation - old refresh token is invalidated after use
5. All sessions are invalidated when password is changed
