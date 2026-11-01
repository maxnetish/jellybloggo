import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { LoginPage } from "./page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("renders login form with all elements", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByLabelText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("renders form inputs with correct attributes", () => {
    render(<LoginPage />);

    const loginInput = screen.getByLabelText("Login");
    expect(loginInput).toHaveAttribute("name", "login");
    expect(loginInput).toHaveAttribute("type", "text");
    expect(loginInput).toBeRequired();

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("name", "password");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toBeRequired();

    const submitButton = screen.getByRole("button", { name: "Login" });
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  it("has no error message initially", () => {
    render(<LoginPage />);

    expect(screen.queryByText("Invalid login or password")).not.toBeInTheDocument();
  });

  it("submit button is not disabled initially", () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: "Login" });
    expect(submitButton).not.toBeDisabled();
  });

  it("calls API on form submit", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { id: "1", login: "test" } }),
    });
    global.fetch = mockFetch;

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
        method: "POST",
        credentials: "include",
      }));
    });
  });

  it("shows error on failed login", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ code: "INVALID_CREDENTIALS", error: "invalid credentials" }),
    });
    global.fetch = mockFetch;

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "baduser");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login or password")).toBeInTheDocument();
    });
  });

  it("redirects on successful login", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { id: "1", login: "test" } }),
    });
    global.fetch = mockFetch;

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});