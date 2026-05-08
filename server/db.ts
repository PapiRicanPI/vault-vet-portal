import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  accessTierConfig,
  depedSchools,
  donorContacts,
  mediaContacts,
  mediaDownloads,
  mediaLeads,
  outreachAuditLog,
  schoolContacts,
  users,
  vloggerAuditLog,
  vloggerInquiries,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserPortalRole(userId: number, portalRole: "Observer" | "Researcher" | "Custodian" | "Admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ portalRole }).where(eq(users.id, userId));
}

export async function updateUserDownloadTier(userId: number, downloadTier: "Free" | "Supporter" | "Investigator") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ downloadTier }).where(eq(users.id, userId));
}

// ─── VLOGGER INQUIRIES ────────────────────────────────────────────────────────
export async function getVloggerInquiries(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(vloggerInquiries).where(eq(vloggerInquiries.status, status as any)).orderBy(desc(vloggerInquiries.createdAt));
  }
  return db.select().from(vloggerInquiries).orderBy(desc(vloggerInquiries.createdAt));
}

export async function createVloggerInquiry(data: typeof vloggerInquiries.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vloggerInquiries).values(data);
}

export async function updateVloggerInquiry(id: number, data: Partial<typeof vloggerInquiries.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vloggerInquiries).set(data).where(eq(vloggerInquiries.id, id));
}

export async function getVloggerAuditLog(inquiryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vloggerAuditLog).where(eq(vloggerAuditLog.inquiryId, inquiryId)).orderBy(desc(vloggerAuditLog.createdAt));
}

export async function addVloggerAuditEntry(data: typeof vloggerAuditLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vloggerAuditLog).values(data);
}

// ─── SCHOOL OUTREACH ──────────────────────────────────────────────────────────
export async function getSchoolContacts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(schoolContacts).where(eq(schoolContacts.status, status as any)).orderBy(desc(schoolContacts.createdAt));
  }
  return db.select().from(schoolContacts).orderBy(desc(schoolContacts.createdAt));
}

export async function createSchoolContact(data: typeof schoolContacts.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schoolContacts).values(data);
}

export async function updateSchoolContact(id: number, data: Partial<typeof schoolContacts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schoolContacts).set(data).where(eq(schoolContacts.id, id));
}

export async function bulkInsertSchoolContacts(rows: (typeof schoolContacts.$inferInsert)[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return 0;
  const chunks = [];
  for (let i = 0; i < rows.length; i += 100) chunks.push(rows.slice(i, i + 100));
  for (const chunk of chunks) await db.insert(schoolContacts).values(chunk);
  return rows.length;
}

// ─── MEDIA OUTREACH ───────────────────────────────────────────────────────────
export async function getMediaContacts(territory?: string) {
  const db = await getDb();
  if (!db) return [];
  if (territory) {
    return db.select().from(mediaContacts).where(eq(mediaContacts.territory, territory as any)).orderBy(desc(mediaContacts.createdAt));
  }
  return db.select().from(mediaContacts).orderBy(desc(mediaContacts.createdAt));
}

export async function createMediaContact(data: typeof mediaContacts.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(mediaContacts).values(data);
}

export async function updateMediaContact(id: number, data: Partial<typeof mediaContacts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(mediaContacts).set(data).where(eq(mediaContacts.id, id));
}

// ─── DONOR OUTREACH ───────────────────────────────────────────────────────────
export async function getDonorContacts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(donorContacts).where(eq(donorContacts.status, status as any)).orderBy(desc(donorContacts.createdAt));
  }
  return db.select().from(donorContacts).orderBy(desc(donorContacts.createdAt));
}

export async function createDonorContact(data: typeof donorContacts.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(donorContacts).values(data);
}

export async function updateDonorContact(id: number, data: Partial<typeof donorContacts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(donorContacts).set(data).where(eq(donorContacts.id, id));
}

// ─── DEPED DIRECTORY ──────────────────────────────────────────────────────────
export async function getDepedSchoolCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(depedSchools);
  return Number(result[0]?.count ?? 0);
}

export async function searchDepedSchools(query: string, region?: string, province?: string, page = 1, pageSize = 50) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };
  const conditions = [];
  if (query) conditions.push(like(depedSchools.schoolName, `%${query}%`));
  if (region) conditions.push(eq(depedSchools.region, region));
  if (province) conditions.push(eq(depedSchools.province, province));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    db.select().from(depedSchools).where(where).limit(pageSize).offset((page - 1) * pageSize).orderBy(depedSchools.schoolName),
    db.select({ count: sql<number>`count(*)` }).from(depedSchools).where(where),
  ]);
  return { rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function bulkInsertDepedSchools(rows: (typeof depedSchools.$inferInsert)[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return 0;
  // Clear existing and re-import
  await db.delete(depedSchools);
  const chunks = [];
  for (let i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));
  for (const chunk of chunks) await db.insert(depedSchools).values(chunk);
  return rows.length;
}

export async function getDepedRegions() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ region: depedSchools.region }).from(depedSchools).orderBy(depedSchools.region);
  return result.map((r) => r.region).filter(Boolean) as string[];
}

export async function getDepedProvinces(region?: string) {
  const db = await getDb();
  if (!db) return [];
  const q = db.selectDistinct({ province: depedSchools.province }).from(depedSchools);
  if (region) q.where(eq(depedSchools.region, region));
  const result = await q.orderBy(depedSchools.province);
  return result.map((r) => r.province).filter(Boolean) as string[];
}

// ─── MEDIA SCAN LEADS ─────────────────────────────────────────────────────────
export async function getMediaLeads(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(mediaLeads).where(eq(mediaLeads.status, status as any)).orderBy(desc(mediaLeads.createdAt));
  }
  return db.select().from(mediaLeads).orderBy(desc(mediaLeads.createdAt));
}

export async function createMediaLead(data: typeof mediaLeads.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(mediaLeads).values(data);
}

export async function updateMediaLead(id: number, data: Partial<typeof mediaLeads.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(mediaLeads).set(data).where(eq(mediaLeads.id, id));
}

// ─── MEDIA DOWNLOADS ──────────────────────────────────────────────────────────
export async function logMediaDownload(data: typeof mediaDownloads.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(mediaDownloads).values(data);
}

export async function getMediaDownloadLog(researcherId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (researcherId) {
    return db.select().from(mediaDownloads).where(eq(mediaDownloads.researcherId, researcherId)).orderBy(desc(mediaDownloads.downloadedAt));
  }
  return db.select().from(mediaDownloads).orderBy(desc(mediaDownloads.downloadedAt));
}

export async function getMonthlyDownloadCount(researcherId: number) {
  const db = await getDb();
  if (!db) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(mediaDownloads)
    .where(and(eq(mediaDownloads.researcherId, researcherId), sql`${mediaDownloads.downloadedAt} >= ${startOfMonth}`));
  return Number(result[0]?.count ?? 0);
}

// ─── ACCESS TIER CONFIG ───────────────────────────────────────────────────────
export async function getAccessTierConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessTierConfig).orderBy(accessTierConfig.tier);
}

export async function updateAccessTierConfig(tier: string, data: Partial<typeof accessTierConfig.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessTierConfig).set(data).where(eq(accessTierConfig.tier, tier as any));
}

// ─── OUTREACH AUDIT LOG ───────────────────────────────────────────────────────
export async function addOutreachAuditEntry(data: typeof outreachAuditLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(outreachAuditLog).values(data);
}

export async function getOutreachAuditLog(module?: string, contactId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (module) conditions.push(eq(outreachAuditLog.module, module as any));
  if (contactId) conditions.push(eq(outreachAuditLog.contactId, contactId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(outreachAuditLog).where(where).orderBy(desc(outreachAuditLog.createdAt));
}
