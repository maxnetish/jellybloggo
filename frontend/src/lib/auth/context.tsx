"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginApi, logout as logoutApi, getUser } from "@/lib/api/auth/client";
import type { LoginRequest } from "@/lib/api/auth/dto";
import type { User } from "@/lib/api/auth/dto";

/**
 * Session state: user is being fetched, user is authenticated, or user is not.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * @internal
 */
interface AuthContextValue {
  /** Current user, null when not authenticated. */
  user: User | null;
  /** Session state. `loading` while the initial user fetch is in flight. */
  status: AuthStatus;
  /** Authenticates the user and updates the session. Throws ApiError on failure. */
  login: (data: LoginRequest) => Promise<void>;
  /** Logs the user out. Best-effort: session state is cleared even if the API call fails. */
  logout: () => Promise<void>;
}

/**
 * @internal
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides the authentication session to the client components.
 *
 * The provider owns the session state and exposes login/logout actions that
 * update it. State is fetched once from the backend after hydration; after
 * login/logout the state changes reactively — no page reloads needed.
 *
 * Place it once in the root layout: layouts persist across client-side
 * navigations, so the session survives route changes.
 *
 * @example
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { AuthProvider } from "@/lib/auth";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AuthProvider>{children}</AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Load the session once after hydration.
  // StrictMode-safe: the cleanup flag discards the result of the discarded
  // first effect run, instead of a ref-guard that suppresses it.
  useEffect(() => {
    let cancelled = false;

    getUser()
      .then((loaded) => {
        if (cancelled) return;
        setUser(loaded);
        setStatus(loaded ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const loggedInUser = await loginApi(data);
    setUser(loggedInUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    // Best-effort: if the API call fails (e.g. backend is down), still clear
    // the client-side session so the UI doesn't get stuck in "logged in".
    // The error is swallowed on purpose — a failed logout must not crash the UI.
    try {
      await logoutApi();
    } catch {
      // Session cookies remain until expiry in this case.
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the current auth session.
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * "use client";
 * import { useAuth } from "@/lib/auth";
 *
 * export function UserInfo() {
 *   const { user, status, logout } = useAuth();
 *
 *   if (status === "loading") return null;
 *   if (!user) return <Link href="/login">Login</Link>;
 *
 *   return <button onClick={logout}>{user.login}</button>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
