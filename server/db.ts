import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  donorContacts,
  exportLogs,
  invitations,
  mediaOutreachStatus,
  researcherBookmarks,
  researcherNotes,
  researcherProjects,
  researcherRecentlyViewed,
  schoolContacts,
  tips,
  users,
  vettingApplications,
  vloggerInquiries,
  volunteerApplications,
  creatorScanLeads,
  mediaLeads,
  depedSchools,
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

// ─── VETTING APPLICATIONS ─────────────────────────────────────────────────────
export async function createApplication(data: typeof vettingApplications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(vettingApplications).values(data);
}

export async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vettingApplications).orderBy(desc(vettingApplications.createdAt));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vettingApplications).where(eq(vettingApplications.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateApplication(id: number, data: Partial<typeof vettingApplications.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vettingApplications).set(data).where(eq(vettingApplications.id, id));
}

export async function deleteApplication(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vettingApplications).where(eq(vettingApplications.id, id));
}

export async function updateApplicationEmailTracking(id: number, emailId: string, emailType: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(vettingApplications).set({
    lastEmailId: emailId,
    lastEmailType: emailType,
    lastEmailSentAt: new Date(),
  }).where(eq(vettingApplications.id, id));
}

export async function getPublicStats() {
  const db = await getDb();
  if (!db) return { total: 0, approved: 0, pending: 0, approvedResearchers: 0, tipsReceived: 0, countriesRepresented: 0 };
  const [totalResult, approvedResult, pendingResult, tipsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(vettingApplications),
    db.select({ count: sql<number>`count(*)` }).from(vettingApplications).where(eq(vettingApplications.status, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(vettingApplications).where(eq(vettingApplications.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(tips),
  ]);
  const approvedCount = Number(approvedResult[0]?.count ?? 0);
  return {
    total: Number(totalResult[0]?.count ?? 0),
    approved: approvedCount,
    pending: Number(pendingResult[0]?.count ?? 0),
    approvedResearchers: approvedCount,
    tipsReceived: Number(tipsResult[0]?.count ?? 0),
    countriesRepresented: 0, // not tracked separately
  };
}

export async function getActivityStats() {
  const db = await getDb();
  if (!db) return { recentApplications: [], recentTips: [], activeThisWeek: 0, activeThisMonth: 0, neverLoggedIn: 0, inactiveOver14Days: 0, applicantsWithLogin: [] };
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const fourteenDaysAgo = new Date(now - 14 * 86400000);
  const thirtyDaysAgo = new Date(now - 30 * 86400000);
  const [recentApplications, recentTips, allApproved] = await Promise.all([
    db.select().from(vettingApplications).orderBy(desc(vettingApplications.createdAt)).limit(10),
    db.select().from(tips).orderBy(desc(tips.createdAt)).limit(10),
    db.select().from(vettingApplications).where(eq(vettingApplications.status, "approved")),
  ]);
  // Build applicantsWithLogin array — currently no separate login tracking table,
  // so we approximate using the application's updatedAt as a proxy
  const applicantsWithLogin = allApproved.map((a) => ({
    id: a.id,
    hasAccount: true,
    lastSignedIn: a.updatedAt ?? null,
  }));
  const activeThisWeek = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) >= sevenDaysAgo).length;
  const activeThisMonth = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) >= thirtyDaysAgo).length;
  const neverLoggedIn = applicantsWithLogin.filter((a) => !a.hasAccount).length;
  const inactiveOver14Days = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) < fourteenDaysAgo).length;
  return { recentApplications, recentTips, activeThisWeek, activeThisMonth, neverLoggedIn, inactiveOver14Days, applicantsWithLogin };
}

// ─── INVITATIONS ──────────────────────────────────────────────────────────────
export async function createInvitation(email: string, token: string, personalMessage: string | null, sentBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(invitations).values({ email, token, personalMessage, sentBy });
}

// ─── TIPS ─────────────────────────────────────────────────────────────────────
export async function createTip(data: typeof tips.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tips).values(data);
}

export async function getAllTips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tips).orderBy(desc(tips.createdAt));
}

export async function getTipById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tips).where(eq(tips.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateTip(id: number, data: Partial<typeof tips.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tips).set(data).where(eq(tips.id, id));
}

export async function deleteTip(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tips).where(eq(tips.id, id));
}

// ─── EXPORT LOGS ──────────────────────────────────────────────────────────────
export async function createExportLog(data: typeof exportLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(exportLogs).values(data);
}

export async function getAllExportLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exportLogs).orderBy(desc(exportLogs.exportedAt));
}

// ─── VOLUNTEER APPLICATIONS ───────────────────────────────────────────────────
export async function createVolunteerApplication(data: typeof volunteerApplications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(volunteerApplications).values(data);
}

export async function getAllVolunteerApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(volunteerApplications).orderBy(desc(volunteerApplications.createdAt));
}

export async function getVolunteerApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(volunteerApplications).where(eq(volunteerApplications.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateVolunteerApplication(id: number, data: Partial<typeof volunteerApplications.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(volunteerApplications).set(data).where(eq(volunteerApplications.id, id));
}

export async function getVolunteerByDocId(docId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(volunteerApplications).where(eq(volunteerApplications.certificateDocId, docId)).limit(1);
  return result[0] ?? null;
}

// ─── SCHOOL CONTACTS ──────────────────────────────────────────────────────────
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

// ─── MEDIA OUTREACH STATUS ────────────────────────────────────────────────────
export async function getMediaOutreachStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaOutreachStatus).orderBy(mediaOutreachStatus.contactNum);
}

export async function upsertMediaOutreachStatus(
  contactNum: number,
  status: string,
  lastContactedAt?: Date,
  responseNotes?: string
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (lastContactedAt) updateData.lastContactedAt = lastContactedAt;
  if (responseNotes !== undefined) updateData.responseNotes = responseNotes;
  await db.insert(mediaOutreachStatus)
    .values({ contactNum, status: status as any, lastContactedAt: lastContactedAt ?? null, responseNotes: responseNotes ?? null })
    .onDuplicateKeyUpdate({ set: updateData });
}

// ─── DONOR CONTACTS ───────────────────────────────────────────────────────────
export async function getDonorContacts(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(donorContacts).where(eq(donorContacts.status, status as any)).orderBy(desc(donorContacts.createdAt));
  }
  return db.select().from(donorContacts).orderBy(desc(donorContacts.createdAt));
}

export async function getDonorContactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(donorContacts).where(eq(donorContacts.id, id)).limit(1);
  return result[0] ?? null;
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

export async function deleteDonorContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(donorContacts).where(eq(donorContacts.id, id));
}

// ─── VLOGGER INQUIRIES ────────────────────────────────────────────────────────
export async function getAllVloggerInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vloggerInquiries).orderBy(desc(vloggerInquiries.createdAt));
}

export async function getVloggerInquiryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vloggerInquiries).where(eq(vloggerInquiries.id, id)).limit(1);
  return result[0] ?? null;
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

export async function deleteVloggerInquiry(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vloggerInquiries).where(eq(vloggerInquiries.id, id));
}

// ─── RESEARCHER BOOKMARKS ─────────────────────────────────────────────────────
export async function getBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherBookmarks).where(eq(researcherBookmarks.researcherId, userId)).orderBy(desc(researcherBookmarks.createdAt));
}

export async function addBookmark(userId: number, caseId: string, caseTitle?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(researcherBookmarks).values({ researcherId: userId, caseId, caseTitle: caseTitle ?? null }).onDuplicateKeyUpdate({ set: { caseTitle: caseTitle ?? null } });
}

export async function removeBookmark(userId: number, caseId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherBookmarks).where(and(eq(researcherBookmarks.researcherId, userId), eq(researcherBookmarks.caseId, caseId)));
}

// ─── RESEARCHER NOTES ─────────────────────────────────────────────────────────
export async function getNoteForCase(userId: number, caseId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(researcherNotes).where(and(eq(researcherNotes.researcherId, userId), eq(researcherNotes.caseId, caseId))).limit(1);
  return result[0] ?? null;
}

export async function upsertNote(userId: number, caseId: string, note: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(researcherNotes).values({ researcherId: userId, caseId, note }).onDuplicateKeyUpdate({ set: { note } });
}

// ─── RESEARCHER PROJECTS ──────────────────────────────────────────────────────
export async function getProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherProjects).where(eq(researcherProjects.researcherId, userId)).orderBy(desc(researcherProjects.updatedAt));
}

export async function createProject(userId: number, title: string, description?: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(researcherProjects).values({ researcherId: userId, title, description: description ?? null });
  return (result as any)[0]?.insertId ?? (result as any).insertId ?? null;
}

export async function updateProjectCases(projectId: number, userId: number, caseIds: string[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(researcherProjects).set({ caseIds }).where(and(eq(researcherProjects.id, projectId), eq(researcherProjects.researcherId, userId)));
}

export async function deleteProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherProjects).where(and(eq(researcherProjects.id, projectId), eq(researcherProjects.researcherId, userId)));
}

// ─── RESEARCHER RECENTLY VIEWED ───────────────────────────────────────────────
export async function recordRecentlyViewed(userId: number, caseId: string, caseTitle?: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherRecentlyViewed).where(and(eq(researcherRecentlyViewed.researcherId, userId), eq(researcherRecentlyViewed.caseId, caseId)));
  await db.insert(researcherRecentlyViewed).values({ researcherId: userId, caseId, caseTitle: caseTitle ?? null });
  // Keep only last 20
  const rows = await db.select({ id: researcherRecentlyViewed.id }).from(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.researcherId, userId)).orderBy(desc(researcherRecentlyViewed.viewedAt)).limit(100);
  if (rows.length > 20) {
    const toDelete = rows.slice(20).map((r) => r.id);
    for (const id of toDelete) {
      await db.delete(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.id, id));
    }
  }
}

export async function getRecentlyViewed(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.researcherId, userId)).orderBy(desc(researcherRecentlyViewed.viewedAt)).limit(20);
}

// ─── CREATOR SCAN LEADS ───────────────────────────────────────────────────────
export async function getAllScanLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creatorScanLeads).orderBy(desc(creatorScanLeads.savedAt));
}

export async function saveScanLead(data: typeof creatorScanLeads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(creatorScanLeads).values(data);
  return result;
}

export async function updateScanLeadStatus(id: number, leadStatus: string, notes?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(creatorScanLeads).set({ leadStatus: leadStatus as any, ...(notes !== undefined ? { notes } : {}) }).where(eq(creatorScanLeads.id, id));
}

export async function deleteScanLead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(creatorScanLeads).where(eq(creatorScanLeads.id, id));
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
