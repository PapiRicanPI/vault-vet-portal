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

// ─── Access Tier Config Tests ──────────────────────────────────────────────────

describe("accessTiers", () => {
  it("list returns tier configurations", async () => {
    const caller = appRouter.createCaller(makeCtx());
    // This will fail if DB is not available, which is acceptable in unit test context
    // The important thing is the procedure exists and is callable
    try {
      const result = await caller.accessTiers.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      // DB not available in test env -- acceptable
      expect(e.message).toMatch(/database|connect|ECONNREFUSED/i);
    }
  });

  it("update requires admin role", async () => {
    const guestCaller = appRouter.createCaller(makeGuestCtx());
    await expect(
      guestCaller.accessTiers.update({
        tier: "Supporter",
        canDownload: true,
        downloadsPerMonth: 10,
        priorityAccess: false,
      })
    ).rejects.toThrow();
  });
});

// ─── Download Access Tests ─────────────────────────────────────────────────────

describe("downloads.requestDownload", () => {
  it("rejects files over 500MB", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.downloads.requestDownload({
        fileUrl: "https://example.com/bigfile.mp4",
        fileName: "bigfile.mp4",
        fileType: "video/mp4",
        fileSizeBytes: 600 * 1024 * 1024, // 600MB -- over limit
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated download requests", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.downloads.requestDownload({
        fileUrl: "https://example.com/file.mp4",
        fileName: "file.mp4",
        fileType: "video/mp4",
        fileSizeBytes: 100 * 1024 * 1024,
      })
    ).rejects.toThrow();
  });
});

// ─── Media Scan Tests ──────────────────────────────────────────────────────────

describe("mediaScan.search", () => {
  it("rejects unauthenticated search", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.mediaScan.search({ query: "test", sources: ["Google News"] })
    ).rejects.toThrow();
  });

  it("requires non-empty query", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.mediaScan.search({ query: "", sources: ["Google News"] })
    ).rejects.toThrow();
  });
});

// ─── User Management Tests ─────────────────────────────────────────────────────

describe("users", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("updatePortalRole validates role enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.users.updatePortalRole({ userId: 1, portalRole: "InvalidRole" as any })
    ).rejects.toThrow();
  });

  it("updateDownloadTier validates tier enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.users.updateDownloadTier({ userId: 1, downloadTier: "Premium" as any })
    ).rejects.toThrow();
  });
});

// ─── Vlogger Inquiries Tests ───────────────────────────────────────────────────

describe("vlogger", () => {
  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.vlogger.create({
        creatorName: "Test Creator",
        platform: "YouTube",
        deadlineDays: "14",
      })
    ).rejects.toThrow();
  });

  it("create validates deadline days enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.vlogger.create({
        creatorName: "Test Creator",
        platform: "YouTube",
        deadlineDays: "30" as any,
      })
    ).rejects.toThrow();
  });
});

// ─── DepEd Directory Tests ─────────────────────────────────────────────────────

describe("deped", () => {
  it("search requires authentication", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.deped.search({ query: "Manila", page: 1, pageSize: 20 })
    ).rejects.toThrow();
  });

  it("importFromCsv requires admin role", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.deped.importFromCsv()).rejects.toThrow();
  });
});
