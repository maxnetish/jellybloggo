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

### 3. Transparent Token Refresh

The backend automatically refreshes expired `access_token` before executing the handler. This is transparent to the UI — no explicit refresh call needed.

**How it works:**
1. Request arrives with `access_token` cookie
2. Backend validates token — if invalid/expired, tries `refresh_token` cookie
3. If `refresh_token` is valid, backend generates new `access_token` (and rotates `refresh_token`)
4. New cookies are set in the response
5. Original handler executes with valid user context

**Edge case — both tokens invalid:**
- No auth context injected — handler receives request without `userID`
- Handler decides what to return (401, 403, or public data)

**Response will include:**
- `Set-Cookie: access_token=...; HttpOnly; ...`
- `Set-Cookie: refresh_token=...; HttpOnly; ...` (rotated)

---

### 4. Manual Refresh (optional)
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

### Proxy Configuration
Express (or nginx) must forward cookies from browser request to backend:
```javascript
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
    }
  }
}));
```

### Handling Set-Cookie in SSR
When backend refreshes tokens, `Set-Cookie` headers must be forwarded to the browser response.

In Angular SSR, capture cookies from `HttpErrorResponse.headers.getAll('set-cookie')` on 401, save to `REQUEST_CONTEXT`, and let Express forward them.

For Express + Angular SSR, accumulate cookies and set them on the final response:
```javascript
const requestContext = { setCookies: [] };

angularApp.handle(req, requestContext).then(async (response) => {
  // ... render response
  if (requestContext.setCookies.length > 0) {
    res.setHeader('set-cookie', requestContext.setCookies);
  }
  await writeResponseToNodeResponse(response, res);
});
```

---

## Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Both tokens invalid, session expired | Handled transparently by backend; if UI sees 401, show login |
| 403 | Forbidden | Show "Access denied" |
| 500 | Server error | Show error message |

---

## Security Notes

1. Both `access_token` and `refresh_token` are in HTTP-only cookies - protected from XSS
2. `SameSite=Lax` - protection against CSRF for same-site requests
3. `Secure=true` in production (HTTPS) - set `SECURE_COOKIES=true` env var
4. Refresh token rotation - old refresh token is invalidated after use
5. All sessions are invalidated when password is changed