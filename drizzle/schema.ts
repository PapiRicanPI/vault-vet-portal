import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Vetting Applications Table
export const vettingApplications = mysqlTable("vetting_applications", {
  id: int("id").autoincrement().primaryKey(),

  // Section 1: Identity
  displayName: varchar("displayName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  profileUrl: text("profileUrl"),

  // Section 2: Organization
  organization: varchar("organization", { length: 255 }),
  orgRole: varchar("orgRole", { length: 255 }),
  orgWebsite: text("orgWebsite"),

  // Section 3: Prior Work (stored as JSON array of {title, url})
  priorWork: json("priorWork").$type<Array<{ title: string; url: string }>>(),

  // Section 4: Investigation Purpose
  investigationProject: text("investigationProject").notNull(),
  geographicFocus: varchar("geographicFocus", { length: 255 }).notNull(),
  outputType: varchar("outputType", { length: 100 }).notNull(),

  // Section 5: Support & Attribution
  supportLink: text("supportLink"),
  agreesToCredit: int("agreesToCredit").default(0).notNull(), // 0=no, 1=yes

  // Section 6: Safety & Risk Assessment
  underThreats: varchar("underThreats", { length: 50 }), // yes/no/prefer_not
  useOpSec: int("useOpSec").default(0), // 0=no, 1=yes
  opSecTools: text("opSecTools"), // comma-separated: vpn, encrypted_email, signal, etc.
  previouslyDoxxed: varchar("previouslyDoxxed", { length: 50 }), // yes/no/prefer_not
  emergencyContact: text("emergencyContact"),
  consentSafetyOutreach: int("consentSafetyOutreach").default(0),

  // Section 7: Terms
  agreesToTerms: int("agreesToTerms").default(0).notNull(),
  agreesToPrivacy: int("agreesToPrivacy").default(0).notNull(),

  // How they heard about The Vault
  referralSource: varchar("referralSource", { length: 255 }),
  willShareRawData: int("willShareRawData").default(0),

  // AI Scoring
  aiScore: int("aiScore"), // 0-10 total
  aiScoreIdentity: int("aiScoreIdentity"), // 0-2
  aiScoreOrganization: int("aiScoreOrganization"), // 0-2
  aiScorePurpose: int("aiScorePurpose"), // 0-2
  aiScoreSupport: int("aiScoreSupport"), // 0-2
  aiScoreRisk: int("aiScoreRisk"), // 0-2
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }), // approve/review/deny

  // Email Tracking
  lastEmailId: varchar("lastEmailId", { length: 64 }), // Resend email ID
  lastEmailType: varchar("lastEmailType", { length: 30 }), // approval/rejection/needs_info/confirmation
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  emailOpenedAt: timestamp("emailOpenedAt"), // set by Resend webhook

  // Admin
  status: mysqlEnum("status", ["pending", "approved", "rejected", "needs_info", "user_downgraded"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  assignedRole: varchar("assignedRole", { length: 50 }), // observer/researcher/custodian/admin
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VettingApplication = typeof vettingApplications.$inferSelect;
export type InsertVettingApplication = typeof vettingApplications.$inferInsert;

// Invitations Table
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  personalMessage: text("personalMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: int("sentBy"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  usedAt: timestamp("usedAt"),
});

export type Invitation = typeof invitations.$inferSelect;

// TruthDrop Researcher Accounts (login credentials for approved users on truthdrop.io)
export const researchers = mysqlTable("researchers", {
  id: int("id").autoincrement().primaryKey(),
  // Link back to the vetting application
  vettingId: int("vettingId"),
  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  alias: varchar("alias", { length: 100 }),
  country: varchar("country", { length: 100 }),
  bio: text("bio"),
  organization: varchar("organization", { length: 255 }),
  // Auth
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  // Role & badges
  role: mysqlEnum("role", ["observer", "researcher", "custodian", "admin"]).default("observer").notNull(),
  foundingInvestigator: int("foundingInvestigator").default(0).notNull(), // 0=no, 1=yes
  foundingInvestigatorYear: int("foundingInvestigatorYear"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type Researcher = typeof researchers.$inferSelect;
export type InsertResearcher = typeof researchers.$inferInsert;

// Researcher Bookmarks
export const researcherBookmarks = mysqlTable("researcher_bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  researcherId: int("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Researcher Notes (private, per-case)
export const researcherNotes = mysqlTable("researcher_notes", {
  id: int("id").autoincrement().primaryKey(),
  researcherId: int("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  note: text("note").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Researcher Projects
export const researcherProjects = mysqlTable("researcher_projects", {
  id: int("id").autoincrement().primaryKey(),
  researcherId: int("researcherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  caseIds: json("caseIds").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Researcher Recently Viewed
export const researcherRecentlyViewed = mysqlTable("researcher_recently_viewed", {
  id: int("id").autoincrement().primaryKey(),
  researcherId: int("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

// Confidential Tips (whistleblower submissions)
export const tips = mysqlTable("tips", {
  id: int("id").autoincrement().primaryKey(),
  // Submitter identity — all optional, truly anonymous submissions allowed
  pseudonym: varchar("pseudonym", { length: 100 }),
  burnerEmail: varchar("burnerEmail", { length: 320 }),
  // Tip content
  category: mysqlEnum("category", [
    "fraud",
    "misuse_of_funds",
    "false_claims",
    "identity",
    "network",
    "other",
  ]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  // File attachment (stored in S3 — bytes never in DB)
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  // Privacy: raw IP is NEVER stored — only a one-way SHA-256 hash for abuse prevention
  ipHash: varchar("ipHash", { length: 64 }),
  // Admin workflow
  status: mysqlEnum("status", ["new", "reviewing", "actioned", "closed"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("low").notNull(),
  adminNotes: text("adminNotes"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

// Export Logs — chain of custody record for every PDF exported from TruthDrop.io
// Admin-only. Never visible to researchers.
export const exportLogs = mysqlTable("export_logs", {
  id: int("id").autoincrement().primaryKey(),
  // Who exported
  researcherId: int("researcherId").notNull(),
  researcherAlias: varchar("researcherAlias", { length: 100 }).notNull(),
  // What was exported
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  // Unique document ID — stamped in watermark and logged here for traceability
  documentId: varchar("documentId", { length: 36 }).notNull().unique(), // UUID v4
  // S3 reference to the generated watermarked PDF
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  // Timestamp (UTC)
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type ExportLog = typeof exportLogs.$inferSelect;
export type InsertExportLog = typeof exportLogs.$inferInsert;

// Student Volunteer Applications — Manila High School Program
export const volunteerApplications = mysqlTable("volunteer_applications", {
  id: int("id").autoincrement().primaryKey(),
  // Personal Info
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  age: int("age").notNull(),
  // School Info
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  gradeLevel: varchar("gradeLevel", { length: 50 }).notNull(),
  strand: varchar("strand", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  // Role Applied For
  role: mysqlEnum("volunteerRole", [
    "osint_research_trainee",
    "data_verification_trainee",
    "digital_journalism_apprentice",
  ]).notNull(),
  // Teacher Recommendation
  teacherName: varchar("teacherName", { length: 255 }).notNull(),
  teacherEmail: varchar("teacherEmail", { length: 320 }).notNull(),
  teacherSubject: varchar("teacherSubject", { length: 100 }),
  // Application Essay
  whyApply: text("whyApply").notNull(),
  relevantExperience: text("relevantExperience"),
  availabilityHoursPerWeek: int("availabilityHoursPerWeek").notNull(),
  // Parental Consent (required for minors under 18)
  parentalConsentGiven: int("parentalConsentGiven").default(0).notNull(),
  parentName: varchar("parentName", { length: 255 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  // Terms
  agreesToTerms: int("agreesToTerms").default(0).notNull(),
  agreesToConfidentiality: int("agreesToConfidentiality").default(0).notNull(),
  // AI Scoring (0-10)
  aiScore: int("aiScore"),
  aiScoreMotivation: int("aiScoreMotivation"),
  aiScoreReliability: int("aiScoreReliability"),
  aiScoreSkillFit: int("aiScoreSkillFit"),
  aiScoreAvailability: int("aiScoreAvailability"),
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }),
  // Admin workflow
  status: mysqlEnum("volunteerStatus", ["pending", "approved", "rejected", "needs_info"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  // Certificate tracking
  hoursCompleted: int("hoursCompleted").default(0),
  contributionSummary: text("contributionSummary"),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  certificateFileUrl: varchar("certificateFileUrl", { length: 1000 }),
  certificateDocId: varchar("certificateDocId", { length: 20 }).unique(), // e.g. VTI-2026-0042
  // Privacy
  ipHash: varchar("ipHash", { length: 64 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type InsertVolunteerApplication = typeof volunteerApplications.$inferInsert;

// School Contacts Table — Manila principals for fellowship outreach
export const schoolContacts = mysqlTable("school_contacts", {
  id: int("id").autoincrement().primaryKey(),
  principalName: varchar("principalName", { length: 255 }).notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  status: mysqlEnum("schoolOutreachStatus", ["not_sent", "sent", "responded", "no_reply", "meeting"]).default("not_sent").notNull(),
  lastEmailedAt: timestamp("lastEmailedAt"),
  followUpDate: timestamp("followUpDate"),
  followUpSent: boolean("followUpSent").default(false).notNull(),
  followUpSentAt: timestamp("followUpSentAt"),
  replyNotes: text("replyNotes"),
  replyReceivedAt: timestamp("replyReceivedAt"),
  finalNudgeSent: boolean("finalNudgeSent").default(false).notNull(),
  finalNudgeSentAt: timestamp("finalNudgeSentAt"),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SchoolContact = typeof schoolContacts.$inferSelect;
export type InsertSchoolContact = typeof schoolContacts.$inferInsert;

// ── Weekly Ops Tasks — M-F discipline checklist for the owner ───────────────
export const weeklyOpsTasks = mysqlTable("weekly_ops_tasks", {
  id: int("id").autoincrement().primaryKey(),
  day: mysqlEnum("day", ["monday", "tuesday", "wednesday", "thursday", "friday"]).notNull(),
  block: mysqlEnum("block", ["vetting", "platform"]).notNull(), // vetting = morning, platform = afternoon
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(), // 1=shown, 0=hidden
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeeklyOpsTask = typeof weeklyOpsTasks.$inferSelect;
export type InsertWeeklyOpsTask = typeof weeklyOpsTasks.$inferInsert;

// Completions are keyed by (taskId, weekStart) so they auto-reset each Monday
export const weeklyOpsCompletions = mysqlTable("weekly_ops_completions", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // ISO date string: "2026-04-07"
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type WeeklyOpsCompletion = typeof weeklyOpsCompletions.$inferSelect;


// ── Focus Mode — Daily Operating System ─────────────────────────────────────
// One session per user per calendar day
export const focusSessions = mysqlTable("focus_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionDate: varchar("sessionDate", { length: 10 }).notNull(), // "2026-04-08"
  // Morning Devotion
  devotionVerseRef: varchar("devotionVerseRef", { length: 100 }),
  devotionVerseText: text("devotionVerseText"),
  devotionReflection: text("devotionReflection"),
  prayerText: text("prayerText"),
  devotionCompletedAt: timestamp("devotionCompletedAt"),
  // Session lifecycle
  sessionStartedAt: timestamp("sessionStartedAt"),
  sessionEndedAt: timestamp("sessionEndedAt"),
  totalMinutes: int("totalMinutes").default(0),
  // End-of-day summary
  endOfDayAnswer: text("endOfDayAnswer"),
  closingVerseRef: varchar("closingVerseRef", { length: 100 }),
  closingVerseText: text("closingVerseText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;

// Brain exercise log — one entry per interrupt completed
export const brainExerciseLogs = mysqlTable("brain_exercise_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  exerciseType: mysqlEnum("exerciseType", ["memory", "pattern", "word_association", "breathing", "gratitude"]).notNull(),
  prompt: text("prompt"),
  userResponse: text("userResponse"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type BrainExerciseLog = typeof brainExerciseLogs.$inferSelect;

// ── Research Calendar Events ─────────────────────────────────────────────────
export const researchEvents = mysqlTable("research_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "investigation",
    "interview",
    "deadline",
    "outreach",
    "review",
    "personal",
    "other",
  ]).default("other").notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(), // "2026-04-08"
  endDate: varchar("endDate", { length: 10 }).notNull(),     // "2026-04-08"
  startTime: varchar("startTime", { length: 5 }),            // "09:00" or null = all-day
  endTime: varchar("endTime", { length: 5 }),
  allDay: int("allDay").default(1).notNull(),                 // 1 = all-day
  caseRef: varchar("caseRef", { length: 255 }),               // optional case title/id reference
  completed: int("completed").default(0).notNull(),           // 0 = pending, 1 = done
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResearchEvent = typeof researchEvents.$inferSelect;
export type InsertResearchEvent = typeof researchEvents.$inferInsert;

// ── Media Outreach Status — persists sent/status/lastContactedAt for Top 10 contacts ─────────
// contactNum matches the hardcoded contact list (1-10) in AdminDashboard
export const mediaOutreachStatus = mysqlTable("media_outreach_status", {
  id: int("id").autoincrement().primaryKey(),
  contactNum: int("contactNum").notNull().unique(),
  status: mysqlEnum("mediaStatus", ["not_sent", "sent", "responded", "no_reply", "meeting"]).default("not_sent").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  responseNotes: text("responseNotes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MediaOutreachStatus = typeof mediaOutreachStatus.$inferSelect;
export type InsertMediaOutreachStatus = typeof mediaOutreachStatus.$inferInsert;

// ── Donor Contacts — Ko-fi, Buy Me a Coffee supporters and grant contacts ─────
export const donorContacts = mysqlTable("donor_contacts", {
  id: int("id").autoincrement().primaryKey(),
  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  handle: varchar("handle", { length: 255 }), // Ko-fi / BMAC username or social handle
  // Platform
  platform: mysqlEnum("donorPlatform", ["kofi", "buymeacoffee", "grant", "individual", "other"]).notNull(),
  // Tier / amount info
  tier: varchar("tier", { length: 100 }), // e.g. "Tier 3", "One-time", "Monthly"
  amountUSD: varchar("amountUSD", { length: 50 }), // stored as string to avoid float issues
  // Status
  status: mysqlEnum("donorStatus", ["new", "thanked", "follow_up_sent", "responded", "declined", "no_reply"]).default("new").notNull(),
  // Outreach tracking
  lastContactedAt: timestamp("lastContactedAt"),
  followUpDate: timestamp("followUpDate"),
  // Reply logging
  replyNotes: text("replyNotes"),
  replyReceivedAt: timestamp("replyReceivedAt"),
  // Internal notes
  internalNotes: text("internalNotes"),
  // Grant-specific fields
  grantOrg: varchar("grantOrg", { length: 255 }), // organization name for grant contacts
  grantDeadline: varchar("grantDeadline", { length: 10 }), // ISO date string "2026-06-30"
  grantAmount: varchar("grantAmount", { length: 100 }), // e.g. "$5,000 - $25,000"
  grantUrl: varchar("grantUrl", { length: 1000 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DonorContact = typeof donorContacts.$inferSelect;
export type InsertDonorContact = typeof donorContacts.$inferInsert;

// ── Vlogger Inquiries — Seeds of Fire formal inquiry tracker ─────────────────
export const vloggerInquiries = mysqlTable("vlogger_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  // Creator identity
  creatorName: varchar("creatorName", { length: 255 }).notNull(),
  channelName: varchar("channelName", { length: 255 }),
  platform: mysqlEnum("vloggerPlatform", ["youtube", "tiktok", "facebook", "instagram", "other"]).default("youtube").notNull(),
  subscriberCount: varchar("subscriberCount", { length: 100 }), // stored as string e.g. "1.2M"
  email: varchar("email", { length: 320 }),
  // Evidence tier
  evidenceTier: mysqlEnum("evidenceTier", ["confirmed_violation", "documented_evidence", "under_investigation"]).default("under_investigation").notNull(),
  // Tier 1 extra fields
  violationDate: varchar("violationDate", { length: 50 }),
  agency: varchar("agency", { length: 255 }),
  violationSummary: text("violationSummary"),
  startYear: varchar("startYear", { length: 10 }),
  // Tier 2 extra fields
  estimatedRevenue: varchar("estimatedRevenue", { length: 100 }),
  // Inquiry status
  inquiryStatus: mysqlEnum("inquiryStatus", ["not_sent", "sent", "responded", "no_reply", "declined"]).default("not_sent").notNull(),
  dateSent: timestamp("dateSent"),
  deadline: timestamp("deadline"),
  // Sent letter archive (full rendered text)
  sentLetterText: text("sentLetterText"),
  // Admin notes
  internalNotes: text("internalNotes"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VloggerInquiry = typeof vloggerInquiries.$inferSelect;
export type InsertVloggerInquiry = typeof vloggerInquiries.$inferInsert;

// ── Creator Scan Leads — saved leads from multi-source scans ──────────────────
export const creatorScanLeads = mysqlTable("creator_scan_leads", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["youtube", "google_news", "reddit", "vimeo"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  channelOrAuthor: varchar("channelOrAuthor", { length: 255 }),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 1000 }),
  publishedAt: varchar("publishedAt", { length: 100 }),
  keyword: varchar("keyword", { length: 255 }),
  leadStatus: mysqlEnum("leadStatus", ["new", "reviewing", "contacted", "archived"]).default("new").notNull(),
  notes: text("notes"),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreatorScanLead = typeof creatorScanLeads.$inferSelect;
export type InsertCreatorScanLead = typeof creatorScanLeads.$inferInsert;

// ── Media Scan Leads — saved leads from broader investigative news scans ───────
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
export type MediaLead = typeof mediaLeads.$inferSelect;
export type InsertMediaLead = typeof mediaLeads.$inferInsert;

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
export type DepedSchool = typeof depedSchools.$inferSelect;
export type InsertDepedSchool = typeof depedSchools.$inferInsert;
