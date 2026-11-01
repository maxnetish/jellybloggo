import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { ApiError } from "@/lib/api/auth/errors";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the auth context — the page consumes the session, not the API layer
const mockLogin = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ login: mockLogin }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("calls auth context login on form submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        login: "testuser",
        password: "password123",
      });
    });
  });

  it("redirects to next page on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows error on invalid credentials", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(
      new ApiError("invalid credentials", "INVALID_CREDENTIALS", 401),
    );

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "baduser");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login or password")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error on unexpected failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new TypeError("network error"));

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Login"), "testuser");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Network error. Please try again.")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
