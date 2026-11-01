import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserInfo } from "./user-info";
import { AuthProvider } from "@/lib/auth";

const mockUser = { id: "1", login: "admin", roles: ["admin"] };

/** Response stub matching the shape the auth service expects. */
function jsonResponse(ok: boolean, body?: unknown) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  };
}

describe("UserInfo", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  it("shows a skeleton while the session is loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <AuthProvider>
        <UserInfo />
      </AuthProvider>,
    );

    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
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
});
