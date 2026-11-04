"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  /** Session state. `loading` only until the session is first resolved. */
  status: AuthStatus;
  /** Authenticates the user and updates the session. Throws ApiError on failure. */
  login: (data: LoginRequest) => Promise<void>;
  /** Logs the user out. Best-effort: session state is cleared even if the API call fails. */
  logout: () => Promise<void>;
  /** Updates the user data in the session (e.g., after profile update). */
  updateUser: (user: User) => void;
}

/**
 * @internal
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides the authentication session to the client components.
 *
 * The provider owns the session state and exposes login/logout actions that
 * update it reactively. Mount it ONCE in the root layout: the layout persists
 * across client-side navigations, so the session survives route changes and
 * login/logout are instantly reflected on every page — without page reloads
 * and without depending on router-cache freshness.
 *
 * The initial session is resolved with a single client fetch after hydration.
 * (A server-side bootstrap was tried and removed: with per-page SSR session
 * reads, the widget's correctness depended on the freshness of cached RSC
 * payloads, which broke after client-side login. A root-layout SSR read is
 * possible but would make every route fully dynamic under cacheComponents.)
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

  // Resolve the session once after hydration.
  //
  // React StrictMode (enabled by default in Next.js dev) mounts → unmounts →
  // mounts every component, firing this effect twice. The in-flight request
  // is kept in a ref WITHOUT clearing it in the effect cleanup: the second
  // run must reuse the first run's request instead of firing a duplicate.
  // That is safe — the ref lives on the provider instance, so a real remount
  // of AuthProvider naturally starts fresh (nothing is cached globally).
  const userRequestRef = useRef<Promise<User | null> | null>(null);

  useEffect(() => {
    let cancelled = false;

    userRequestRef.current ??= getUser();
    const request = userRequestRef.current;

    request
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

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, updateUser }),
    [user, status, login, logout, updateUser],
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
