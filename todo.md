# The Vault Investigates -- Admin Portal v2.0

## Phase 1: Database Schema & Backend
- [x] Extend drizzle/schema.ts with all module tables
- [x] Run migration and apply SQL via webdev_execute_sql
- [x] Build server/db.ts query helpers for all modules
- [x] Build server/routers/ feature routers (split by module)

## Phase 2: Core Shell
- [x] Dark theme + brand colors in index.css
- [x] DashboardLayout with sidebar (all 10 module nav links)
- [x] Role-based access: Observer, Researcher, Custodian, Admin
- [x] App.tsx routes for all modules

## Phase 3: Module Pages
- [x] Vlogger Inquiries page (table, compose modal, deadline slider, audit trail, last template used)
- [x] School Outreach page (table, email template, follow-up, CSV import)
- [x] Media Outreach page (table, 4 templates, Day 1/2/3 follow-up)
- [x] Donor Outreach page (table, 4 templates, compose modal, pipeline)
- [x] DepEd Directory page (on-demand CSV import, searchable/filterable table)
- [x] Resources page /admin/resources (OSINT library: PH, PR, US)
- [x] Media Scan page /admin/media-scan (multi-source search, save lead, attach to case)
- [x] Media Downloads page (vetted-only, 500MB limit, audit log)
- [x] Access Tiers admin panel (configurable tiers, Ko-fi/BMC integration)
- [x] User Management page (portal role + download tier assignment)
- [x] Audit Log page (all outreach + download events)

## Phase 4: Integrations
- [x] Resend email integration (all outreach modules) -- key validated
- [x] DepEd CSV loader (on-demand, /home/ubuntu/deped_schools.csv)
- [x] Media Scan: Google News RSS, YouTube, Reddit, Google Web search
- [x] S3 file storage for media downloads
- [x] Ko-fi / Buy Me a Coffee tier webhook handler

## Phase 5: Tests & Deployment
- [x] 18 vitest tests passing (auth, access tiers, downloads, media scan, users, vlogger, DepEd)
- [x] TypeScript: 0 errors
- [x] Unicode cleanup across all TSX files
- [x] Save checkpoint
- [x] Publish and bind vet.thevaultinvestigates.cloud domain (user action required — site published at vaultvet-bw3bndkn.manus.space)

## Phase 6: Full Design Rebuild to Match Original
- [x] Replace index.css with original vault theme (--vault-black, --vault-gold, Cinzel + EB Garamond fonts)
- [x] Replace sidebar VaultLayout with original horizontal top-nav (THE VAULT ARCHIVIST branding)
- [x] Replace dashboard with original AdminDashboard horizontal tab structure
- [x] Pre-load real Media Outreach contacts (Dr. Jose Ramon G. Albert/PIDS, PCIJ, Rappler, VERA Files, CMFR, NUJP, CPJ, RSF)
- [x] Pre-load real School contacts (Elena C. Reyes, Carmelita T. Tabio, Mrs. Anita R. De Guzman, Sonny D. Valenzuela)
- [x] Add Weekly Ops, Focus Mode, Campaigns, Contacts Export, Volunteer Page routes
- [x] Set PapiRican as Admin role in database (role=admin, portalRole=Admin)
- [x] Run all 15 tests passing, TypeScript 0 errors, save checkpoint

## Phase 7: Bug Fixes & Backup
- [x] Fix "Could not load campaign summary" error (root cause: school_contacts wrong column names, now fixed)
- [x] Fix media_outreach_status column name — confirmed correct (mediaStatus column exists and matches schema)
- [x] Fix Vlogger Inquiries stuck on Loading — fixed vlogger_inquiries column names (vloggerPlatform, inquiryStatus, email, deadline, internalNotes)
- [x] GitHub backup: code is exportable via Settings > GitHub in Management UI (user action required to connect GitHub account)

## Phase 8: Final Restoration Tasks
- [x] Seed 10 original vlogger inquiries (Pugong Byahero, Kalingap RAB, Techram, Virgelyncares 2.0, KABUSINESS Official, The Hungry Syrian Wanderer, Val Santos Matubang + 3 more)
- [x] Update media outreach contact emails (jrgalbert@gmail.com for Dr. Albert, pcij@pcij.org, etc.)
- [x] Restore Creator Scan page with YouTube, Google News, Reddit, Vimeo multi-source search
- [x] Fix PDF encoding error (WinAnsi cannot encode arrow character U+2192)
- [x] Create creator_scan_leads table in DB and add tRPC scan/saveLead procedures
- [x] Build CreatorScan.tsx page (keyword chips, Run Scan, YouTube/Google News/Reddit/Vimeo, Save Lead, Saved Leads tab)
- [x] Restore Resources.tsx OSINT library page (PH/PR/US categories) for researchers
- [x] Add Creator Scan and Resources links to admin header nav, register routes in App.tsx

## Phase 9: May Sprint Backlog (from Project Log v1.1)

### Creator Scan Enhancements
- [ ] Weekly Monday auto-scan job (creatorScanJob.ts) — runs on schedule, auto-deduplicates by URL, sends owner notification summary to vaultinvestigates@protonmail.com
- [ ] "Promote to Inquiry" button on Creator Scan Saved Leads tab (visible for Lead/Verified status only) — confirmation modal with evidence tier selector, notes override, creates VloggerInquiry, marks lead as Coded
- [ ] Export Creator Scan leads to CSV (Download CSV button on Saved Leads tab)
- [ ] Add Country (creator) and Country (subjects) columns to Saved Leads table
- [ ] Add Discovery Source column to Saved Leads table

### Resources Page
- [ ] Verify Resources page is fully populated with all categories: OSINT, Philippine sources, PR sources, US sources, Forensics, Legal, OPSEC — currently has content but needs visual confirmation in browser

### Vlogger Inquiries Enhancements
- [ ] Deadline slider (7 / 14 / 21 days) in Compose modal
- [ ] Last Template Used column in Vlogger Inquiries table
- [ ] Outreach audit trail — auto-log timestamped note to internal notes on email send

### School Outreach Enhancements
- [ ] CSV bulk import for School Outreach contacts (instead of one-by-one manual entry)
- [ ] Horizontal scroll indicator on School Outreach table (animated gold arrow fades in when columns are hidden)

### Admin Dashboard Layout
- [ ] Widen main content wrapper from max-w-6xl to max-w-[1600px] to accommodate wide tables
- [ ] Fix actions column cutoff in School Outreach and Media Outreach tables (minWidth on tables and action cells)

### Known Issues to Monitor
- [ ] Scan all PDF templates for em-dash (—) characters that may cause WinAnsi encoding errors (same class of bug as the → fix)
