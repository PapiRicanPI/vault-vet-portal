import { pgTable, pgEnum, serial, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const vettingApplications = pgTable("vetting_applications", {
  id: serial("id").primaryKey(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  profileUrl: text("profileUrl"),
  organization: varchar("organization", { length: 255 }),
  investigationProject: text("investigationProject").notNull(),
  geographicFocus: varchar("geographicFocus", { length: 255 }).notNull(),
  outputType: varchar("outputType", { length: 100 }).notNull(),
  agreesToCredit: integer("agreesToCredit").default(0).notNull(),
  agreesToTerms: integer("agreesToTerms").default(0).notNull(),
  agreesToPrivacy: integer("agreesToPrivacy").default(0).notNull(),
  aiScore: integer("aiScore"),
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  assignedRole: varchar("assignedRole", { length: 50 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: integer("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  personalMessage: text("personalMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  sentBy: integer("sentBy"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  usedAt: timestamp("usedAt"),
});

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  pseudonym: varchar("pseudonym", { length: 100 }),
  burnerEmail: varchar("burnerEmail", { length: 320 }),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  ipHash: varchar("ipHash", { length: 64 }),
  status: varchar("status", { length: 50 }).default("new").notNull(),
  priority: varchar("priority", { length: 20 }).default("low").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const volunteerApplications = pgTable("volunteer_applications", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  age: integer("age").notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  gradeLevel: varchar("gradeLevel", { length: 50 }).notNull(),
  strand: varchar("strand", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
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
  aiRationale: text("aiRationale"),
  aiRecommendation: varchar("aiRecommendation", { length: 20 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  hoursCompleted: integer("hoursCompleted").default(0),
  certificateDocId: varchar("certificateDocId", { length: 20 }).unique(),
  ipHash: varchar("ipHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const schoolContacts = pgTable("school_contacts", {
  id: serial("id").primaryKey(),
  principalName: varchar("principalName", { length: 255 }).notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 50 }).default("not_sent").notNull(),
  lastEmailedAt: timestamp("lastEmailedAt"),
  followUpDate: timestamp("followUpDate"),
  followUpSent: boolean("followUpSent").default(false).notNull(),
  replyNotes: text("replyNotes"),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const donorContacts = pgTable("donor_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  platform: varchar("platform", { length: 50 }).notNull(),
  tier: varchar("tier", { length: 100 }),
  status: varchar("status", { length: 50 }).default("new").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  replyNotes: text("replyNotes"),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const vloggerInquiries = pgTable("vlogger_inquiries", {
  id: serial("id").primaryKey(),
  creatorName: varchar("creatorName", { length: 255 }).notNull(),
  channelName: varchar("channelName", { length: 255 }),
  platform: varchar("platform", { length: 50 }).default("youtube").notNull(),
  subscriberCount: varchar("subscriberCount", { length: 100 }),
  email: varchar("email", { length: 320 }),
  evidenceTier: varchar("evidenceTier", { length: 50 }).default("under_investigation").notNull(),
  inquiryStatus: varchar("inquiryStatus", { length: 50 }).default("not_sent").notNull(),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const mediaOutreachStatus = pgTable("media_outreach_status", {
  id: serial("id").primaryKey(),
  contactNum: integer("contactNum").notNull().unique(),
  status: varchar("status", { length: 50 }).default("not_sent").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  responseNotes: text("responseNotes"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const exportLogs = pgTable("export_logs", {
  id: serial("id").primaryKey(),
  researcherId: integer("researcherId").notNull(),
  researcherAlias: varchar("researcherAlias", { length: 100 }).notNull(),
  caseId: varchar("caseId", { length: 100 }).notNull(),
  caseTitle: varchar("caseTitle", { length: 500 }),
  documentId: varchar("documentId", { length: 36 }).notNull().unique(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type VettingApplication = typeof vettingApplications.$inferSelect;
export type VolunteerApplication = typeof volunteerApplications.$inferSelect;
export type Tip = typeof tips.$inferSelect;
