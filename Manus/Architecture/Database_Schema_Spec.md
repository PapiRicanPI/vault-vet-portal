# Database & Drizzle Schema Specification

This document details the live MySQL database tables, schemas, and fields configured via **Drizzle ORM** in `drizzle/schema.ts` for the platform ecosystem.

---

## 📊 Live Database Tables Overview

The platform database consists of several core tables designed to handle secure tips, volunteer applications, outreach leads, and system configurations:

| Table Name (MySQL) | Drizzle Export | Purpose | Key Fields |
| :--- | :--- | :--- | :--- |
| `media_leads` | `mediaLeads` | Tracks media scan results and leads | `id`, `title`, `url`, `source`, `status`, `notes` |
| `deped_schools` | `depedSchools` | Over 10,000 public high school records | `id`, `schoolId`, `schoolName`, `region`, `province` |
| `school_contacts` | `schoolContacts` | School fellowship outreach campaigns | `id`, `schoolName`, `email`, `status`, `lastEmailedAt` |
| `creator_scan_leads` | `creatorScanLeads` | Poverty-porn creator scan leads | `id`, `creatorName`, `platform`, `status`, `notes` |
| `tips` | `tips` | Whistleblower tip submissions | `id`, `title`, `content`, `status`, `submittedAt` |
| `users` | `users` | Registered portal users | `id`, `email`, `role`, `pseudonym` |

---

## 🛠️ Schema Definitions (Drizzle ORM)

### 1. `mediaLeads` (Media Scan Portal)
```typescript
export const mediaLeads = mysqlTable("media_leads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  source: varchar("source", { length: 255 }).notNull(), // e.g., 'Google News', 'YouTube'
  status: varchar("status", { length: 50 }).notNull().default("lead"), // 'lead', 'verified', 'archived'
  notes: text("notes"),
  country: varchar("country", { length: 100 }),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. `depedSchools` (DepEd School Directory)
```typescript
export const depedSchools = mysqlTable("deped_schools", {
  id: serial("id").primaryKey(),
  schoolId: varchar("school_id", { length: 50 }).notNull().unique(),
  schoolName: varchar("school_name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  municipality: varchar("municipality", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  division: varchar("division", { length: 100 }),
  email: varchar("email", { length: 255 }),
  principalName: varchar("principal_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 3. `schoolContacts` (School Fellowship Outreach)
```typescript
export const schoolContacts = mysqlTable("school_contacts", {
  id: serial("id").primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  principalName: varchar("principal_name", { length: 255 }),
  district: varchar("district", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default("new"), // 'new', 'sent', 'replied', 'no_response'
  lastEmailedAt: timestamp("last_emailed_at"),
  replyNotes: text("reply_notes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 🔄 Running Schema Updates & Syncs
If you need to make changes to the database structure:
1.  Edit `/home/ubuntu/vault-vet-portal/drizzle/schema.ts` to add or modify fields.
2.  Generate migration files: `pnpm run db:generate`.
3.  Apply changes: `pnpm run db:push`.

---
*Next Step: See [[Architecture/Vercel_Routing_Checklist|Vercel Routing Checklist]].*
