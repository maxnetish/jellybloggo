import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./context";

// Helper component to test useAuth
function TestConsumer() {
  const { user } = useAuth();
  return (
    <div data-testid="user-info">
      {user ? `Logged in as ${user.login}` : "Not logged in"}
    </div>
  );
}

// Helper component that throws to verify useAuth throws without provider
function TestConsumerNoProvider() {
  useAuth();
  return null;
}

describe("AuthProvider", () => {
  describe("useAuth", () => {
    it("returns user from context when provided", () => {
      render(
        <AuthProvider user={{ id: "1", login: "admin", roles: ["admin"] }}>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "Logged in as admin"
      );
    });

    it("returns null user from context when not authenticated", () => {
      render(
        <AuthProvider user={null}>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "Not logged in"
      );
    });

    it("throws error when used outside of AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumerNoProvider />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });

    it("provides user with all roles", () => {
      function RoleDisplay() {
        const { user } = useAuth();
        return (
          <div data-testid="roles">
            {user?.roles.join(", ") || "no roles"}
          </div>
        );
      }

      render(
        <AuthProvider
          user={{ id: "2", login: "moderator", roles: ["moderator", "user"] }}
        >
          <RoleDisplay />
        </AuthProvider>
      );

      expect(screen.getByTestId("roles")).toHaveTextContent(
        "moderator, user"
      );
    });
  });
});