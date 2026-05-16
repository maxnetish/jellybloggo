# Notes for UI Implementation

## Authentication Flow

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{ "login": "...", "password": "..." }
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "login": "admin", "roles": [...] }
}
```
- Save `access_token` in localStorage or memory
- Save `user` object
- `refresh_token` is stored in HTTP-only cookie automatically

---

### 2. Making Protected Requests
```javascript
// Add to all API calls
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

---

### 3. Handling Token Expiry
```javascript
// Interceptor example (Axios)
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh
      const refreshed = await refreshToken();
      if (!refreshed) {
        // Show login form
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);
```

---

### 4. Refresh Token
```http
POST /api/auth/refresh
Cookie: refresh_token=<http_only_cookie>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "login": "admin", "roles": [...] }
}
```

**Response (401):** Any 401 from `/auth/refresh` means the user must log in again.

---

### 5. Logout
```http
POST /api/auth/logout
Cookie: refresh_token=<http_only_cookie>
```
- Clears HTTP-only cookie on server
- Clear `access_token` and `user` from frontend storage

---

### 6. Get Current User
```http
GET /api/auth/user
Authorization: Bearer <access_token>
```

**Response (200 - logged in):**
```json
{ "user": { "id": 1, "login": "admin", "roles": [...] } }
```

**Response (200 - not logged in):**
```json
{ "user": null }
```

---

## Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Token expired or invalid | Call refresh, then login if fails |
| 403 | Forbidden | Show "Access denied" |
| 500 | Server error | Show error message |

---

## Security Notes

1. `access_token` is stored in client memory/localStorage - vulnerable to XSS
2. `refresh_token` is in HTTP-only cookie - protected from XSS
3. If refresh token is compromised, attacker can use it once, then it's invalidated
4. All sessions are invalidated when password is changed