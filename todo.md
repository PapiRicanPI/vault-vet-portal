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
- [ ] Push project code to GitHub as permanent backup (requires user to connect GitHub in Settings > GitHub)
