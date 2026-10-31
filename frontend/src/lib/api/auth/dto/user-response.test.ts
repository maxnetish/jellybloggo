import { describe, expect, it } from "vitest";
import type { User, UserResponse } from "./user-response";

describe("UserResponse DTO", () => {
  describe("User", () => {
    it("parses valid user from JSON", () => {
      const json = JSON.parse(
        '{"id": "1", "login": "admin", "roles": ["admin", "user"]}'
      );

      const user: User = {
        id: json.id,
        login: json.login,
        roles: json.roles,
      };

      expect(user.id).toBe("1");
      expect(user.login).toBe("admin");
      expect(user.roles).toEqual(["admin", "user"]);
    });

    it("handles user without roles", () => {
      const json = JSON.parse('{"id": "2", "login": "guest", "roles": []}');

      const user: User = {
        id: json.id,
        login: json.login,
        roles: json.roles,
      };

      expect(user.roles).toEqual([]);
    });

    it("roundtrip through JSON serialization", () => {
      const user: User = {
        id: "42",
        login: "testuser",
        roles: ["moderator"],
      };

      const serialized = JSON.stringify(user);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(user);
    });
  });

  describe("UserResponse", () => {
    it("parses response with user", () => {
      const json = JSON.parse(
        '{"user": {"id": "1", "login": "admin", "roles": ["admin"]}}'
      );

      const response: UserResponse = {
        user: json.user,
      };

      expect(response.user).not.toBeNull();
      expect(response.user?.login).toBe("admin");
    });

    it("parses response with null user (not authenticated)", () => {
      const json = JSON.parse('{"user": null}');

      const response: UserResponse = {
        user: json.user,
      };

      expect(response.user).toBeNull();
    });

    it("roundtrip for authenticated user", () => {
      const response: UserResponse = {
        user: {
          id: "1",
          login: "admin",
          roles: ["admin"],
        },
      };

      const serialized = JSON.stringify(response);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(response);
    });

    it("roundtrip for unauthenticated user", () => {
      const response: UserResponse = {
        user: null,
      };

      const serialized = JSON.stringify(response);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(response);
    });
  });
});