# Manus Developer Onboarding: Strict Repository & Build Guidelines

This guide is **mandatory reading** for any AI agent (Manus) entering the **The Vault Vetting Portal** codebase. It contains strict technical rules to prevent regressions, ensure clean builds, and maintain database integrity.

---

## 🛑 The "No Reset" Commandment
Under no circumstances are you allowed to:
*   Rebuild pages from scratch unless explicitly requested.
*   Run destructive git commands like `git reset --hard` to previous major commits.
*   Assume a file is "missing" without checking the git history (`git log -S "filename"`) first.

If a feature appears to be missing on the live site but exists in previous commits, **you must restore it from the git history, not rewrite it.**

---

## 🛠️ Local Environment & Dependencies
The project is built on **React 19**, **Tailwind CSS 4**, **Drizzle ORM**, and **tRPC**. 

### 1. Initializing the Project
To begin working on the project, run:
```bash
# Clone the repository
git clone https://github.com/PapiRicanPI/vault-vet-portal.git
cd vault-vet-portal

# Install dependencies using pnpm
pnpm install
```

### 2. Database Migration & Schema Sync
If you modify `drizzle/schema.ts`, you must push the changes to the live database using `drizzle-kit`:
```bash
# Generate the migration files
pnpm run db:generate

# Push the schema changes directly to the live database
pnpm run db:push
```
> [!WARNING] Schema Safety
> Never run destructive SQL queries that delete existing tables or truncate columns. Always verify that `db:push` does not report data loss warnings before proceeding.

---

## 🧪 Build & Verification Checklist
Before committing any code or declaring a task complete, you **must** run the following verification suite locally in your sandbox:

```bash
# 1. Run TypeScript check to verify there are zero compile-time errors
pnpm run check

# 2. Compile the production build to ensure all static assets build correctly
pnpm run build
```

### Build Error Resolution Protocol
If the build fails:
1.  **Do not ignore it.** A failing build will cause the Vercel deployment to fail, resulting in a live 404.
2.  Analyze the exact TypeScript error and locate the file.
3.  If the error is due to a missing tRPC router procedure, check if the procedure was deleted from `server/routers.ts` in a previous commit and restore it.

---

## 🚀 Git & Deployment Workflow
We use a **Commit-to-Deploy** workflow integrated with Vercel. 

### 1. Clean Commit Protocol
Only commit files that are directly related to the task. Do not stage local log files or build artifacts.
```bash
# Check modified files
git status

# Stage only source files
git add client/src/ server/ drizzle/

# Commit with a clear, descriptive message
git commit -m "feat: [Feature Name] - Short description of change"
```

### 2. Push to Production
Pushing to the `main` branch automatically triggers a production build on Vercel:
```bash
git push origin main
```

---

## 📋 Common Pitfalls to Avoid
*   **Vite Server Proxy**: Do not rely on Vite's local development server proxy (`server.proxy`) for production routes. All API requests must route through tRPC.
*   **Asset Paths**: Do not store large images or media files inside the `client/public/` directory. All media assets must be uploaded to secure S3 storage, and referenced via cloud URLs.
*   **Role Enums**: Ensure that any user role checking aligns with the 4-level role system (`observer`, `researcher`, `custodian`, `admin`).

---
*Next Step: Proceed to [[Architecture/System_Ecosystem_Map|System Ecosystem Blueprint]] to understand the folder layout.*
