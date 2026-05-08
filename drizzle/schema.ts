import {
  bigint,
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Portal-level role (Observer | Researcher | Custodian | Admin)
  portalRole: mysqlEnum("portalRole", ["Observer", "Researcher", "Custodian", "Admin"]).default("Observer").notNull(),
  // Download tier for media access
  downloadTier: mysqlEnum("downloadTier", ["Free", "Supporter", "Investigator"]).default("Free").notNull(),
  downloadsUsedThisMonth: int("downloadsUsedThisMonth").default(0).notNull(),
  tierResetAt: timestamp("tierResetAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── VLOGGER INQUIRIES ────────────────────────────────────────────────────────
export const vloggerInquiries = mysqlTable("vlogger_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  creatorName: varchar("creatorName", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  channelUrl: text("channelUrl"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  status: mysqlEnum("status", ["Pending", "Sent", "Responded", "Archived"]).default("Pending").notNull(),
  deadlineDays: mysqlEnum("deadlineDays", ["7", "14", "21"]).default("14").notNull(),
  deadlineAt: timestamp("deadlineAt"),
  lastTemplateUsed: varchar("lastTemplateUsed", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vloggerAuditLog = mysqlTable("vlogger_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  inquiryId: int("inquiryId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  templateUsed: varchar("templateUsed", { length: 128 }),
  performedBy: varchar("performedBy", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SCHOOL OUTREACH ──────────────────────────────────────────────────────────
export const schoolContacts = mysqlTable("school_contacts", {
  id: int("id").autoincrement().primaryKey(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  principalName: varchar("principalName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  region: varchar("region", { length: 128 }),
  province: varchar("province", { length: 128 }),
  municipality: varchar("municipality", { length: 128 }),
  status: mysqlEnum("status", ["Pending", "Sent", "Follow-up Sent", "Responded", "Archived"]).default("Pending").notNull(),
  lastTemplateUsed: varchar("lastTemplateUsed", { length: 128 }),
  followUpCount: int("followUpCount").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── MEDIA OUTREACH ───────────────────────────────────────────────────────────
export const mediaContacts = mysqlTable("media_contacts", {
  id: int("id").autoincrement().primaryKey(),
  orgName: varchar("orgName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  country: varchar("country", { length: 128 }),
  territory: mysqlEnum("territory", ["Philippines", "Puerto Rico", "United States", "Other"]).default("Philippines").notNull(),
  status: mysqlEnum("status", ["Pending", "Sent", "Responded", "Archived"]).default("Pending").notNull(),
  daySequence: mysqlEnum("daySequence", ["Day 1", "Day 2", "Day 3", "Complete"]).default("Day 1").notNull(),
  lastTemplateUsed: varchar("lastTemplateUsed", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── DONOR OUTREACH ───────────────────────────────────────────────────────────
export const donorContacts = mysqlTable("donor_contacts", {
  id: int("id").autoincrement().primaryKey(),
  donorName: varchar("donorName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  platform: varchar("platform", { length: 64 }),
  donationAmount: float("donationAmount"),
  territory: mysqlEnum("territory", ["Philippines", "Puerto Rico", "United States", "Other"]).default("United States").notNull(),
  status: mysqlEnum("status", ["Pending", "Sent", "Responded", "Archived"]).default("Pending").notNull(),
  lastTemplateUsed: varchar("lastTemplateUsed", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── DEPED DIRECTORY ──────────────────────────────────────────────────────────
export const depedSchools = mysqlTable("deped_schools", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: varchar("schoolId", { length: 64 }),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  region: varchar("region", { length: 128 }),
  province: varchar("province", { length: 128 }),
  municipality: varchar("municipality", { length: 128 }),
  programs: text("programs"),
  tvlSpecializations: text("tvlSpecializations"),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
});

// ─── MEDIA SCAN LEADS ─────────────────────────────────────────────────────────
export const mediaLeads = mysqlTable("media_leads", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: mysqlEnum("source", ["Google News", "YouTube", "Reddit", "Google Web"]).notNull(),
  platform: varchar("platform", { length: 64 }),
  publishedAt: timestamp("publishedAt"),
  snippet: text("snippet"),
  rightsStatus: mysqlEnum("rightsStatus", ["Unknown", "Free to Use", "Copyrighted", "Fair Use"]).default("Unknown").notNull(),
  status: mysqlEnum("status", ["Lead", "Verified", "Coded", "Archived"]).default("Lead").notNull(),
  caseRef: varchar("caseRef", { length: 128 }),
  notes: text("notes"),
  savedBy: varchar("savedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── MEDIA DOWNLOADS ──────────────────────────────────────────────────────────
export const mediaDownloads = mysqlTable("media_downloads", {
  id: int("id").autoincrement().primaryKey(),
  researcherId: int("researcherId").notNull(),
  researcherName: varchar("researcherName", { length: 255 }),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey"),
  fileName: varchar("fileName", { length: 255 }),
  fileType: varchar("fileType", { length: 64 }),
  fileSizeBytes: bigint("fileSizeBytes", { mode: "number" }),
  downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
});

// ─── ACCESS TIER CONFIG ───────────────────────────────────────────────────────
export const accessTierConfig = mysqlTable("access_tier_config", {
  id: int("id").autoincrement().primaryKey(),
  tier: mysqlEnum("tier", ["Free", "Supporter", "Investigator"]).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  downloadsPerMonth: int("downloadsPerMonth").default(0).notNull(), // 0 = unlimited
  canSearch: boolean("canSearch").default(true).notNull(),
  canSave: boolean("canSave").default(true).notNull(),
  canDownload: boolean("canDownload").default(false).notNull(),
  priorityAccess: boolean("priorityAccess").default(false).notNull(),
  kofiTier: varchar("kofiTier", { length: 128 }),
  bmcTier: varchar("bmcTier", { length: 128 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── OUTREACH AUDIT LOG (shared) ──────────────────────────────────────────────
export const outreachAuditLog = mysqlTable("outreach_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  module: mysqlEnum("module", ["Vlogger", "School", "Media", "Donor"]).notNull(),
  contactId: int("contactId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  templateUsed: varchar("templateUsed", { length: 128 }),
  performedBy: varchar("performedBy", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
