"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/api/auth";

/**
 * @internal
 */
interface AuthContextValue {
  user: User | null;
}

/**
 * @internal
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider props.
 */
export interface AuthProviderProps {
  /** Initial user data fetched on the server. Can be null if not authenticated. */
  user: User | null;
  children: ReactNode;
}

/**
 * Provides authentication context to child components.
 *
 * This is a Client Component that receives user data from a Server Component parent.
 * The user is fetched on the server during SSR and passed down as a prop.
 *
 * @example
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { cookies } from "next/headers";
 * import { AuthProvider } from "@/lib/auth";
 * import { getUser } from "@/lib/api/auth";
 *
 * export default async function RootLayout({ children }) {
 *   const cookieStore = cookies();
 *   const accessToken = cookieStore.get("access_token");
 *   const user = accessToken ? await getUser() : null;
 *
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AuthProvider user={user}>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ user, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the current authenticated user.
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * "use client";
 * import { useAuth } from "@/lib/auth";
 *
 * export function UserInfo() {
 *   const { user } = useAuth();
 *
 *   if (!user) {
 *     return <a href="/login">Login</a>;
 *   }
 *
 *   return <span>Hello, {user.login}!</span>;
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