import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { login, logout, getUser } from "./client";

describe("auth client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("calls POST /api/auth/login with correct params", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", login: "admin", roles: ["admin"] } }),
      });

      await login({ login: "admin", password: "secret" });

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: "admin", password: "secret" }),
        credentials: "include",
      });
    });

    it("returns user on success", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", login: "admin", roles: ["admin"] } }),
      });

      const user = await login({ login: "admin", password: "secret" });

      expect(user).toEqual({ id: "1", login: "admin", roles: ["admin"] });
    });

    it("throws error on non-ok response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(login({ login: "bad", password: "creds" })).rejects.toThrow(
        "Login failed: 401"
      );
    });

    it("throws error when user is missing in response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      });

      await expect(login({ login: "admin", password: "secret" })).rejects.toThrow(
        "Login response missing user"
      );
    });
  });

  describe("logout", () => {
    it("calls POST /api/auth/logout with correct params", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      await logout();

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });

    it("does not throw on success", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      await expect(logout()).resolves.toBeUndefined();
    });

    it("throws error on non-ok response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(logout()).rejects.toThrow("Logout failed: 500");
    });
  });

  describe("getUser", () => {
    it("calls GET /api/auth/user with correct params", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", login: "admin", roles: [] } }),
      });

      await getUser();

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/user", {
        method: "GET",
        credentials: "include",
      });
    });

    it("returns user when authenticated", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", login: "admin", roles: ["admin"] } }),
      });

      const user = await getUser();

      expect(user).toEqual({ id: "1", login: "admin", roles: ["admin"] });
    });

    it("returns null when user is not authenticated (user: null)", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      });

      const user = await getUser();

      expect(user).toBeNull();
    });

    it("returns null on non-ok response (401)", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const user = await getUser();

      expect(user).toBeNull();
    });

    it("does NOT throw on non-ok response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(getUser()).resolves.toBeNull();
    });
  });
});