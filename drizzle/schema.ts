import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const vettingStatusEnum = pgEnum("vetting_status", [
  "pending",
  "approved",
  "rejected",
  "needs_info",
  "user_downgraded",
]);
export const researcherRoleEnum = pgEnum("researcher_role", [
  "observer",
  "researcher",
  "custodian",
  "admin",
]);
export const tipCategoryEnum = pgEnum("tip_category", [
  "fraud",
  "misuse_of_funds",
  "false_claims",
  "identity",
  "network",
  "other",
]);
export const tipStatusEnum = pgEnum("tip_status", ["new", "reviewing", "actioned", "closed"]);
export const tipPriorityEnum = pgEnum("tip_priority", ["low", "medium", "high"]);
export const volunteerRoleEnum = pgEnum("volunteer_role", [
  "osint_research_trainee",
  "data_verification_trainee",
  "digital_journalism_apprentice",
]);
export const volunteerStatusEnum = pgEnum("volunteer_status", [
  "pending",
  "approved",
  "rejected",
  "needs_info",
]);
export const schoolOutreachStatusEnum = pgEnum("school_outreach_status", [
  "not_sent",
  "sent",
  "responded",
  "no_reply",
  "meeting",
]);
export const weeklyOpsDayEnum = pgEnum("weekly_ops_day", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);
export const weeklyOpsBlockEnum = pgEnum("weekly_ops_block", ["vetting", "platform"]);
export const exerciseTypeEnum = pgEnum("exercise_type", [
  "memory",
  "pattern",
  "word_association",
  "breathing",
  "gratitude",
]);
export const eventCategoryEnum = pgEnum("event_category", [
  "investigation",
  "interview",
  "deadline",
  "outreach",
  "review",
  "personal",
  "other",
]);
export const mediaStatusEnum = pgEnum("media_status", [
  "not_sent",
  "sent",
  "responded",
  "no_reply",
  "meeting",
]);
export const donorPlatformEnum = pgEnum("donor_platform", [
  "kofi",
  "buymeacoffee",
  "grant",
  "individual",
  "other",
]);
export const donorStatusEnum = pgEnum("donor_status", [
  "new",
  "thanked",
  "follow_up_sent",
  "responded",
  "declined",
  "no_reply",
]);
export const vloggerPlatformEnum = pgEnum("vlogger_platform", [
  "youtube",
  "tiktok",
  "facebook",
  "instagram",
  "other",
]);
export const evidenceTierEnum = pgEnum("evidence_tier", [
  "confirmed_violation",
  "documented_evidence",
  "under_investigation",
]);
export const vloggerInquiryStatusEnum = pgEnum("vlogger_inquiry_status", [
  "not_sent",
  "sent",
  "responded",
  "no_reply",
  "declined",
]);
export const scanLeadSourceEnum = pgEnum("scan_lead_source", [
  "youtube",
  "google_news",
  "reddit",
  "vimeo",
]);
export const scanLeadStatusEnum = pgEnum("scan_lead_status", [
  "new",
  "reviewing",
  "contacted",
  "archived",
]);
export const mediaLeadSourceEnum = pgEnum("media_lead_source", [
  "Google News",
  "YouTube",
  "Reddit",
  "Google Web",
]);
export const mediaLeadRightsEnum = pgEnum("media_lead_rights", [
  "Unknown",
  "Free to Use",
  "Copyrighted",
  "Fair Use",
]);
export const mediaLeadStatusEnum = pgEnum("media_lead_status", [
  "Lead",
  "Verified",
  "Coded",
  "Archived",
]);

// ── Users ────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Vetting Applications ────────────────────────────────────────────────
export const vettingApplications = pgTable("vetting_applications", {
  id: serial("id").primaryKey(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  profileUrl: text("profileUrl"),
  organization: varchar("organization", { length: 255 }),
  orgRole: varchar("orgRole", { length: 255 }),
  orgWebsite: text("orgWebsite"),
  priorWork: json("priorWork").$type<Array<{ title: string; url: string }>>(),
  investigationProject: text("investigationProject").notNull(),
  geographicFocus: varchar("geographicFocus", { length: 255 }).notNull(),
  outputType: varchar("outputType", { length: 100 }).notNull(),
  supportLink: text("supportLink"),
  agreesToCredit: integer("agreesToCredit").default(0).notNull(),
  underThreats: varchar("underThreats", { length: 50 }),
  useOpSec: integer("useOpSec").default(0),
  opSecTools: text("opSecTools"),
  previouslyDoxxed: varchar("previouslyDoxxed", { length: 50 }),
  emergencyContact: text("emergencyContact"),
  consentSafetyOutreach: integer("consentSafetyOutreach").default(0),
  agreesToTerms: integer("agreesToTerms").default(0).notNull(),
  agreesToPrivacy: integer("agreesToPrivacy").default(0).notNull(),
  referralSource: varchar("referralSource", { length: 255 }),
  willShareRawData: integer("willShareRawData").default(0),
  aiScore: integer("aiScore"),
  aiScoreIdentity: integer("aiScoreIdentity"),
  aiScoreOrganization: integer("aiScoreOrganization"),
  aiScorePurpose: integer("aiScorePurpose"),
  aiScoreSupport: integer("aiScoreSupport"),
  aiScoreRisk: integer("aiScoreRisk"),
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }),
  lastEmailId: varchar("lastEmailId", { length: 64 }),
  lastEmailType: varchar("lastEmailType", { length: 30 }),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  emailOpenedAt: timestamp("emailOpenedAt"),
  status: vettingStatusEnum("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  assignedRole: varchar("assignedRole", { length: 50 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: integer("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VettingApplication = typeof vettingApplications.$inferSelect;
export type InsertVettingApplication = typeof vettingApplications.$inferInsert;

// ── Invitations ──────────────────────────────────────────────────────────
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  personalMessage: text("personalMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: integer("sentBy"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  usedAt: timestamp("usedAt"),
});
export type Invitation = typeof invitations.$inferSelect;

// ── Researchers (TruthDrop login accounts) ──────────────────────────────
export const researchers = pgTable("researchers", {
  id: serial("id").primaryKey(),
  vettingId: integer("vettingId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  alias: varchar("alias", { length: 100 }),
  country: varchar("country", { length: 100 }),
  bio: text("bio"),
  organization: varchar("organization", { length: 255 }),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: researcherRoleEnum("role").default("observer").notNull(),
  foundingInvestigator: integer("foundingInvestigator").default(0).notNull(),
  foundingInvestigatorYear: integer("foundingInvestigatorYear"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});
export type Researcher = typeof researchers.$inferSelect;
export type InsertResearcher = typeof researchers.$inferInsert;

// ── Researcher Bookmarks ────────────────────────────────────────────────
export const researcherBookmarks = pgTable("researcher_bookmarks", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Researcher Notes ─────────────────────────────────────────────────────
export const researcherNotes = pgTable("researcher_notes", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  note: text("note").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Researcher Projects ──────────────────────────────────────────────────
export const researcherProjects = pgTable("researcher_projects", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  caseIds: json("caseIds").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── Researcher Recently Viewed ───────────────────────────────────────────
export const researcherRecentlyViewed = pgTable("researcher_recently_viewed", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

// ── Tips ──────────────────────────────────────────────────────────────────
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  pseudonym: varchar("pseudonym", { length: 100 }),
  burnerEmail: varchar("burnerEmail", { length: 320 }),
  category: tipCategoryEnum("category").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  ipHash: varchar("ipHash", { length: 64 }),
  status: tipStatusEnum("status").default("new").notNull(),
  priority: tipPriorityEnum("priority").default("low").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

// ── Export Logs ───────────────────────────────────────────────────────────
export const exportLogs = pgTable("export_logs", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  researcherAlias: varchar("researcherAlias", { length: 100 }).notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  documentId: varchar("documentId", { length: 36 }).notNull().unique(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});
export type ExportLog = typeof exportLogs.$inferSelect;
export type InsertExportLog = typeof exportLogs.$inferInsert;

// ── Volunteer Applications ──────────────────────────────────────────────
export const volunteerApplications = pgTable("volunteer_applications", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  age: integer("age").notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  gradeLevel: varchar("gradeLevel", { length: 50 }).notNull(),
  strand: varchar("strand", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  role: volunteerRoleEnum("volunteerRole").notNull(),
  teacherName: varchar("teacherName", { length: 255 }).notNull(),
  teacherEmail: varchar("teacherEmail", { length: 320 }).notNull(),
  teacherSubject: varchar("teacherSubject", { length: 100 }),
  whyApply: text("whyApply").notNull(),
  relevantExperience: text("relevantExperience"),
  availabilityHoursPerWeek: integer("availabilityHoursPerWeek").notNull(),
  parentalConsentGiven: integer("parentalConsentGiven").default(0).notNull(),
  parentName: varchar("parentName", { length: 255 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  agreesToTerms: integer("agreesToTerms").default(0).notNull(),
  agreesToConfidentiality: integer("agreesToConfidentiality").default(0).notNull(),
  aiScore: integer("aiScore"),
  aiScoreMotivation: integer("aiScoreMotivation"),
  aiScoreReliability: integer("aiScoreReliability"),
  aiScoreSkillFit: integer("aiScoreSkillFit"),
  aiScoreAvailability: integer("aiScoreAvailability"),
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }),
  status: volunteerStatusEnum("volunteerStatus").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  hoursCompleted: integer("hoursCompleted").default(0),
  contributionSummary: text("contributionSummary"),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  certificateFileUrl: varchar("certificateFileUrl", { length: 1000 }),
  certificateDocId: varchar("certificateDocId", { length: 20 }).unique(),
  ipHash: varchar("ipHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type InsertVolunteerApplication = typeof volunteerApplications.$inferInsert;

// ── School Contacts ───────────────────────────────────────────────────────
export const schoolContacts = pgTable("school_contacts", {
  id: serial("id").primaryKey(),
  principalName: varchar("principalName", { length: 255 }).notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  status: schoolOutreachStatusEnum("schoolOutreachStatus").default("not_sent").notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SchoolContact = typeof schoolContacts.$inferSelect;
export type InsertSchoolContact = typeof schoolContacts.$inferInsert;

// ── Weekly Ops Tasks ──────────────────────────────────────────────────────
export const weeklyOpsTasks = pgTable("weekly_ops_tasks", {
  id: serial("id").primaryKey(),
  day: weeklyOpsDayEnum("day").notNull(),
  block: weeklyOpsBlockEnum("block").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeeklyOpsTask = typeof weeklyOpsTasks.$inferSelect;
export type InsertWeeklyOpsTask = typeof weeklyOpsTasks.$inferInsert;

export const weeklyOpsCompletions = pgTable("weekly_ops_completions", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type WeeklyOpsCompletion = typeof weeklyOpsCompletions.$inferSelect;

// ── Focus Mode ────────────────────────────────────────────────────────────
export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
  devotionVerseRef: varchar("devotionVerseRef", { length: 100 }),
  devotionVerseText: text("devotionVerseText"),
  devotionReflection: text("devotionReflection"),
  prayerText: text("prayerText"),
  devotionCompletedAt: timestamp("devotionCompletedAt"),
  sessionStartedAt: timestamp("sessionStartedAt"),
  sessionEndedAt: timestamp("sessionEndedAt"),
  totalMinutes: integer("totalMinutes").default(0),
  endOfDayAnswer: text("endOfDayAnswer"),
  closingVerseRef: varchar("closingVerseRef", { length: 100 }),
  closingVerseText: text("closingVerseText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;

export const brainExerciseLogs = pgTable("brain_exercise_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  exerciseType: exerciseTypeEnum("exerciseType").notNull(),
  prompt: text("prompt"),
  userResponse: text("userResponse"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type BrainExerciseLog = typeof brainExerciseLogs.$inferSelect;

// ── Research Calendar Events ─────────────────────────────────────────────
export const researchEvents = pgTable("research_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: eventCategoryEnum("category").default("other").notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  allDay: integer("allDay").default(1).notNull(),
  caseRef: varchar("caseRef", { length: 255 }),
  completed: integer("completed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ResearchEvent = typeof researchEvents.$inferSelect;
export type InsertResearchEvent = typeof researchEvents.$inferInsert;

// ── Media Outreach Status ─────────────────────────────────────────────────
export const mediaOutreachStatus = pgTable("media_outreach_status", {
  id: serial("id").primaryKey(),
  contactNum: integer("contactNum").notNull().unique(),
  status: mediaStatusEnum("mediaStatus").default("not_sent").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  responseNotes: text("responseNotes"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MediaOutreachStatus = typeof mediaOutreachStatus.$inferSelect;
export type InsertMediaOutreachStatus = typeof mediaOutreachStatus.$inferInsert;

// ── Donor Contacts ─────────────────────────────────────────────────────────
export const donorContacts = pgTable("donor_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  handle: varchar("handle", { length: 255 }),
  platform: donorPlatformEnum("donorPlatform").notNull(),
  tier: varchar("tier", { length: 100 }),
  amountUSD: varchar("amountUSD", { length: 50 }),
  status: donorStatusEnum("donorStatus").default("new").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  followUpDate: timestamp("followUpDate"),
  replyNotes: text("replyNotes"),
  replyReceivedAt: timestamp("replyReceivedAt"),
  internalNotes: text("internalNotes"),
  grantOrg: varchar("grantOrg", { length: 255 }),
  grantDeadline: varchar("grantDeadline", { length: 10 }),
  grantAmount: varchar("grantAmount", { length: 100 }),
  grantUrl: varchar("grantUrl", { length: 1000 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type DonorContact = typeof donorContacts.$inferSelect;
export type InsertDonorContact = typeof donorContacts.$inferInsert;

// ── Vlogger Inquiries ──────────────────────────────────────────────────────
export const vloggerInquiries = pgTable("vlogger_inquiries", {
  id: serial("id").primaryKey(),
  creatorName: varchar("creatorName", { length: 255 }).notNull(),
  channelName: varchar("channelName", { length: 255 }),
  platform: vloggerPlatformEnum("vloggerPlatform").default("youtube").notNull(),
  subscriberCount: varchar("subscriberCount", { length: 100 }),
  email: varchar("email", { length: 320 }),
  evidenceTier: evidenceTierEnum("evidenceTier").default("under_investigation").notNull(),
  violationDate: varchar("violationDate", { length: 50 }),
  agency: varchar("agency", { length: 255 }),
  violationSummary: text("violationSummary"),
  startYear: varchar("startYear", { length: 10 }),
  estimatedRevenue: varchar("estimatedRevenue", { length: 100 }),
  inquiryStatus: vloggerInquiryStatusEnum("inquiryStatus").default("not_sent").notNull(),
  dateSent: timestamp("dateSent"),
  deadline: timestamp("deadline"),
  sentLetterText: text("sentLetterText"),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type VloggerInquiry = typeof vloggerInquiries.$inferSelect;
export type InsertVloggerInquiry = typeof vloggerInquiries.$inferInsert;

// ── Creator Scan Leads ─────────────────────────────────────────────────────
export const creatorScanLeads = pgTable("creator_scan_leads", {
  id: serial("id").primaryKey(),
  source: scanLeadSourceEnum("source").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  channelOrAuthor: varchar("channelOrAuthor", { length: 255 }),
  description: text("description"),
  thumbnail: varchar("thumbnail", { length: 1000 }),
  publishedAt: varchar("publishedAt", { length: 100 }),
  keyword: varchar("keyword", { length: 255 }),
  leadStatus: scanLeadStatusEnum("leadStatus").default("new").notNull(),
  notes: text("notes"),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CreatorScanLead = typeof creatorScanLeads.$inferSelect;
export type InsertCreatorScanLead = typeof creatorScanLeads.$inferInsert;

// ── Media Scan Leads ───────────────────────────────────────────────────────
export const mediaLeads = pgTable("media_leads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: mediaLeadSourceEnum("source").notNull(),
  platform: varchar("platform", { length: 64 }),
  publishedAt: timestamp("publishedAt"),
  snippet: text("snippet"),
  rightsStatus: mediaLeadRightsEnum("rightsStatus").default("Unknown").notNull(),
  status: mediaLeadStatusEnum("status").default("Lead").notNull(),
  caseRef: varchar("caseRef", { length: 128 }),
  notes: text("notes"),
  savedBy: varchar("savedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MediaLead = typeof mediaLeads.$inferSelect;
export type InsertMediaLead = typeof mediaLeads.$inferInsert;

// ── DepEd Directory ────────────────────────────────────────────────────────
export const depedSchools = pgTable("deped_schools", {
  id: serial("id").primaryKey(),
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
