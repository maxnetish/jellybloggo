import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { AuthProvider, useAuth, type LoginRequest } from "@/lib/auth";
import { UserInfo } from "./user-info";

/**
 * Regression test for the "stale UserInfo after login" bug.
 *
 * The provider lives in the root layout and must therefore survive client
 * navigation (the layout never remounts): a login action that updates the
 * provider state must be reflected by a UserInfo rendered "on another page"
 * — without any refetch and without a document reload.
 */

const mockUser = { id: "1", login: "admin", roles: ["admin"] };

/** Response stub matching the shape the auth service expects. */
function jsonResponse(ok: boolean, body?: unknown) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  };
}

/** Simulates navigation: UserInfo from "another page" inside the same provider. */
function SecondPageUserInfo() {
  return (
    <div data-testid="second-page">
      <UserInfo />
    </div>
  );
}

function PageSwitcher({ pages }: { pages: ReactNode[] }) {
  const [index, setIndex] = useState(0);
  return (
    <>
      {/* Exposes the provider's login action, as the real login page uses it */}
      <LoginTrigger />
      <button type="button" onClick={() => setIndex((i) => (i + 1) % pages.length)}>
        navigate
      </button>
      {pages[index]}
    </>
  );
}

function LoginTrigger() {
  const { login } = useAuth();
  return (
    <button
      type="button"
      onClick={() => login({ login: "admin", password: "secret" } satisfies LoginRequest)}
    >
      do-login
    </button>
  );
}

describe("UserInfo", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing while the session is loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <AuthProvider>
        <UserInfo />
      </AuthProvider>,
    );

    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("shows a login link when not authenticated", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, { user: null }));

    render(
      <AuthProvider>
        <UserInfo />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    });
  });

  it("shows the display name and logs out on click", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/auth/user") {
        return Promise.resolve(
          jsonResponse(true, { user: { ...mockUser, full_name: "Alice Smith" } }),
        );
      }
      // POST /api/auth/logout -> 204 no body
      return Promise.resolve({ ok: true, status: 204 });
    });

    render(
      <AuthProvider>
        <UserInfo />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Alice Smith" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Alice Smith" }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    });
  });

  it("prefers login over full_name for display", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, { user: mockUser }));

    render(
      <AuthProvider>
        <UserInfo />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
    });
  });

  it("reflects a login from the same provider across a simulated navigation", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/auth/user") {
        return Promise.resolve(jsonResponse(true, { user: null }));
      }
      // POST /api/auth/login returns the user (as the backend does)
      return Promise.resolve(jsonResponse(true, { user: mockUser }));
    });

    render(
      <AuthProvider>
        <PageSwitcher
          pages={[<UserInfo key="login-page" />, <SecondPageUserInfo key="home-page" />]}
        />
      </AuthProvider>,
    );

    // Page 1 ("login page"): anonymous
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    });
    const initialFetchCount = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/auth/user",
    ).length;
    expect(initialFetchCount).toBeGreaterThanOrEqual(1); // initial session load (StrictMode may double it)

    // Log in via the context action (exactly what the login page does)
    await user.click(screen.getByRole("button", { name: "do-login" }));

    // "Navigate" to page 2 ("home page") — same provider, no remount, no refetch
    await user.click(screen.getByRole("button", { name: "navigate" }));

    // UserInfo on the new page must show the user immediately
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    // Login and navigation did not trigger a session refetch
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/user")).toHaveLength(
      initialFetchCount,
    );
  });
});
