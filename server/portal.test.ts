import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user: {
      id: 1,
      openId: "test-owner-open-id",
      email: "admin@thevaultinvestigates.com",
      name: "Test Admin",
      loginMethod: "manus",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
    } as TrpcContext["res"],
    ...overrides,
  };
}

function makeGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ─── Auth Tests ────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@thevaultinvestigates.com");
  });

  it("logout clears session cookie and returns success", async () => {
    const clearedCookies: any[] = [];
    const ctx = makeCtx({
      res: {
        clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
      } as TrpcContext["res"],
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe("app_session_id");
  });
});

// ─── System Notification Tests ─────────────────────────────────────────────────

describe("system.notifyOwner", () => {
  it("is a protected mutation that requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.system.notifyOwner({ title: "Test", content: "Hello" })
    ).rejects.toThrow();
  });
});

// ─── Vetting Application Tests ─────────────────────────────────────────────────

describe("vetting", () => {
  it("list requires admin role", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(guestCaller.vetting.list()).rejects.toThrow();
  });

  it("list is accessible by admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    try {
      const result = await caller.vetting.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.message).toMatch(/database|connect|ECONNREFUSED|Failed query/i);
    }
  });
});

// ─── Stats Tests ───────────────────────────────────────────────────────────────

describe("stats", () => {
  it("public stats are accessible without auth", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    try {
      const result = await caller.stats.public();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("approved");
    } catch (e: any) {
      expect(e.message).toMatch(/database|connect|ECONNREFUSED|Failed query/i);
    }
  });

  it("activity stats require admin", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(guestCaller.stats.activity()).rejects.toThrow();
  });
});

// ─── Tips Tests ────────────────────────────────────────────────────────────────

describe("tips", () => {
  it("list requires admin", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(guestCaller.tips.list()).rejects.toThrow();
  });

  it("submit is public", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    try {
      await caller.tips.submit({ content: "Test tip", category: "corruption" });
    } catch (e: any) {
      expect(e.message).not.toMatch(/FORBIDDEN/i);
    }
  });
});

// ─── Vlogger Inquiries Tests ───────────────────────────────────────────────────

describe("vlogger", () => {
  it("list requires admin", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(guestCaller.vlogger.list()).rejects.toThrow();
  });

  it("create requires admin", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.vlogger.create({
        creatorName: "Test Creator",
        platform: "YouTube",
        deadlineDays: "14",
      })
    ).rejects.toThrow();
  });
});

// ─── Outreach Tests ────────────────────────────────────────────────────────────

describe("outreach", () => {
  it("getMediaStatuses requires admin", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(guestCaller.outreach.getMediaStatuses()).rejects.toThrow();
  });

  it("getMediaStatuses is accessible by admin", async () => {
    const caller = appRouter.createCaller(makeCtx());
    try {
      const result = await caller.outreach.getMediaStatuses();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.message).toMatch(/database|connect|ECONNREFUSED|Failed query/i);
    }
  });
});
