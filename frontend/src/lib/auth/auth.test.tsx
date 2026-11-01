import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { AuthProvider, useAuth } from "./context";
import { ApiError } from "@/lib/api/auth/errors";

const mockUser = { id: "1", login: "admin", roles: ["admin"] };

/** Helper consumer exposing context state and actions to the test. */
function TestConsumer() {
  const { user, status, login, logout } = useAuth();
  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);

  return (
    <div>
      <div data-testid="user-info">
        {user ? `Logged in as ${user.login}` : "Not logged in"}
      </div>
      <div data-testid="status">{status}</div>
      <button
        type="button"
        onClick={() =>
          login({ login: "admin", password: "secret" }).catch((err: unknown) =>
            setLoginErrorCode(err instanceof ApiError ? err.code : "UNKNOWN"),
          )
        }
      >
        do-login
      </button>
      {loginErrorCode && <div data-testid="login-error">{loginErrorCode}</div>}
      <button type="button" onClick={() => void logout()}>
        do-logout
      </button>
    </div>
  );
}

/** Response stub matching the shapes the auth service expects. */
function jsonResponse(ok: boolean, body?: unknown) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  };
}

describe("AuthProvider", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial session load", () => {
    it("transitions to authenticated when the user is returned", async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse(true, { user: mockUser })),
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      });
      expect(screen.getByTestId("user-info")).toHaveTextContent("Logged in as admin");
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/user", {
        method: "GET",
        credentials: "include",
      });
    });

    it("transitions to unauthenticated when the user is null", async () => {
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse(true, { user: null })),
      );

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
      });
      expect(screen.getByTestId("user-info")).toHaveTextContent("Not logged in");
    });

    it("transitions to unauthenticated when the user fetch fails", async () => {
      fetchMock.mockImplementation(() => Promise.reject(new TypeError("network error")));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
      });
      expect(screen.getByTestId("user-info")).toHaveTextContent("Not logged in");
    });

    it("fires exactly ONE /api/auth/user request under StrictMode double mount", async () => {
      // StrictMode mount → unmount → mount runs this effect twice; the
      // in-flight request ref must deduplicate them into a single fetch.
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse(true, { user: mockUser })),
      );

      render(
        <StrictMode>
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        </StrictMode>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      });

      const userRequests = fetchMock.mock.calls.filter(
        ([url]) => url === "/api/auth/user",
      );
      expect(userRequests).toHaveLength(1);
      expect(screen.getByTestId("user-info")).toHaveTextContent("Logged in as admin");
    });
  });

  describe("login action", () => {
    it("updates the session after successful login", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementation((url: string) => {
        if (url === "/api/auth/user") {
          return Promise.resolve(jsonResponse(true, { user: null }));
        }
        // POST /api/auth/login
        return Promise.resolve(jsonResponse(true, { user: mockUser }));
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
      });

      await user.click(screen.getByRole("button", { name: "do-login" }));

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent("Logged in as admin");
      });
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });

    it("propagates the error and keeps the session anonymous on failure", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementation((url: string) => {
        if (url === "/api/auth/user") {
          return Promise.resolve(jsonResponse(true, { user: null }));
        }
        // POST /api/auth/login -> 401
        return Promise.resolve(
          jsonResponse(false, { error: "invalid credentials", code: "INVALID_CREDENTIALS" }),
        );
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
      });

      await user.click(screen.getByRole("button", { name: "do-login" }));

      await waitFor(() => {
        expect(screen.getByTestId("login-error")).toHaveTextContent("INVALID_CREDENTIALS");
      });
      expect(screen.getByTestId("user-info")).toHaveTextContent("Not logged in");
    });
  });

  describe("logout action", () => {
    it("clears the session after logout", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementation((url: string) => {
        if (url === "/api/auth/user") {
          return Promise.resolve(jsonResponse(true, { user: mockUser }));
        }
        // POST /api/auth/logout -> 204 no body
        return Promise.resolve({ ok: true, status: 204 });
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      });

      await user.click(screen.getByRole("button", { name: "do-logout" }));

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent("Not logged in");
      });
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });

    it("clears the session even when the logout API call fails", async () => {
      const user = userEvent.setup();
      fetchMock.mockImplementation((url: string) => {
        if (url === "/api/auth/user") {
          return Promise.resolve(jsonResponse(true, { user: mockUser }));
        }
        // POST /api/auth/logout -> 500
        return Promise.resolve({ ok: false, status: 500 });
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      });

      await user.click(screen.getByRole("button", { name: "do-logout" }));

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent("Not logged in");
      });
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
  });

  describe("useAuth", () => {
    it("throws error when used outside of AuthProvider", () => {
      function TestConsumerNoProvider() {
        useAuth();
        return null;
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumerNoProvider />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});
