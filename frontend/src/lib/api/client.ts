/**
 * API client utilities for making HTTP requests.
 *
 * Provides base URL resolution and fetch options for both client-side
 * (through Next.js proxy) and server-side (direct backend) requests.
 */

/** Get base URL for API calls. Uses backend URL for SSR, relative path for client. */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use relative path (proxied by next.config.ts)
    return "";
  }
  // Server-side: use backend directly
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

/** Common fetch options with credentials */
const defaultOptions: RequestInit = {
  credentials: "include",
};

/** Create fetch options with optional server-side cookies. */
export function createFetchOptions(serverCookies?: string): RequestInit {
  const options: RequestInit = { ...defaultOptions };

  if (serverCookies && typeof window === "undefined") {
    // Server-side: need to pass cookies manually
    options.headers = {
      Cookie: serverCookies,
    };
  }

  return options;
}