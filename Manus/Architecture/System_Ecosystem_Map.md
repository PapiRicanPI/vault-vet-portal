# System Ecosystem Blueprint: TruthDrop.io & The Vault

This document maps the architectural relationship and data flow between **TruthDrop.io** (the public, anonymous whistleblower intake) and **The Vault Investigates** (the secure, restricted vetting portal).

---

## 🗺️ Platform Ecosystem Architecture

```
[ Whistleblower / Public ]
           │
           ├────────► [ TruthDrop.io ] ──► (Secure, Anonymous Tip Submission Form)
           │
           └────────► [ The Vault (vet.thevaultinvestigates.cloud) ]
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
           [ Public Pages ]          [ Secure Admin Dashboard ]
           • Home Landing Page       • Tip Review & Redaction
           • Case Evidence Logs      • School Outreach Tracker
           • Resources & OSINT       • User Role Administration
```

---

## 🔄 Secure Data Flow & Intake Pipeline

The pipeline below details how a secure tip is submitted, vetted, and integrated into a public case file:

```
┌──────────────────────────────────┐
│ 1. Submitter uploads tip on      │
│    https://truthdrop.io/tips     │
└────────────────┬─────────────────┘
                 │ (Encrypted Payload)
                 ▼
┌──────────────────────────────────┐
│ 2. Payload is stored in secure   │
│    database (No submitter IP)    │
└────────────────┬─────────────────┘
                 │ (Triggers Notification)
                 ▼
┌──────────────────────────────────┐
│ 3. Custodian reviews tip on      │
│    https://vet.thevault.../admin │
└────────────────┬─────────────────┘
                 │ (Redaction & Verification)
                 ▼
┌──────────────────────────────────┐
│ 4. Approved data is linked to    │
│    public Case Log (/cases)      │
└──────────────────────────────────┘
```

---

## 🌐 Domain Routing & Access Control
To maintain separation of concerns and prevent "cross-contamination" of files or sessions:

*   **`truthdrop.io`**: Serves as the primary public entry point. It has its own landing page and does **not** redirect to a login gate. Only secure intake paths (`/tips`) are hosted here.
*   **`vet.thevaultinvestigates.cloud`**: Hosts the core vetting application. Public pages (Home, Cases, Resources, Volunteer) are visible to everyone. Only `/admin` and `/invite` trigger the OAuth identity login gate.

---

## 📁 Repository Directory Structure
The repository is structured as a **monorepo** with a clean division between client and server code:

```
vault-vet-portal/
├── client/              # React 19 + Tailwind 4 Frontend
│   ├── src/
│   │   ├── pages/       # Page-level components (Home, Admin, MediaScan, etc.)
│   │   ├── components/  # Reusable UI components (Map, Dialog, etc.)
│   │   ├── lib/         # Utility helpers (utils.ts)
│   │   └── App.tsx      # Routes & top-level layout
├── server/              # Node.js + Express + tRPC Backend
│   ├── routers.ts       # tRPC router definitions (mediaScan, deped, etc.)
│   └── db.ts            # Database helper functions & connections
├── drizzle/             # Database schemas & migration files
│   └── schema.ts        # Drizzle database table definitions
└── vercel.json          # Vercel deployment & rewrite configurations
```

---
*Next Step: See [[Architecture/Database_Schema_Spec|Database & Drizzle Schema Specification]].*
