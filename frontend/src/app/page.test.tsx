import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Home from "./page";
import { AuthProvider } from "@/lib/auth";

/** Response stub matching the shape the auth service expects. */
function jsonResponse(ok: boolean, body?: unknown) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  };
}

describe("Home", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders hello world heading", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, { user: null }));

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello World!");
    expect(screen.getByText("Next.js is working")).toBeInTheDocument();
  });

  it("shows a login link when not authenticated", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, { user: null }));

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    });
  });

  it("shows the username button when authenticated", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, { user: { id: "1", login: "admin", roles: [] } }),
    );

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
  });
});
