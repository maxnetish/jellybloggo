import { describe, expect, it } from "vitest";
import type { LoginRequest } from "./login-request";

describe("LoginRequest DTO", () => {
  it("parses valid login request from JSON", () => {
    const json = JSON.parse('{"login": "admin", "password": "secret123"}');

    const request: LoginRequest = {
      login: json.login,
      password: json.password,
    };

    expect(request.login).toBe("admin");
    expect(request.password).toBe("secret123");
  });

  it("handles empty login", () => {
    const json = JSON.parse('{"login": "", "password": "password"}');

    const request: LoginRequest = {
      login: json.login,
      password: json.password,
    };

    expect(request.login).toBe("");
  });

  it("roundtrip through JSON serialization", () => {
    const request: LoginRequest = {
      login: "testuser",
      password: "testpass",
    };

    const serialized = JSON.stringify(request);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(request);
  });
});