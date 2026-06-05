# Manus Operations Center: The Vault & TruthDrop.io

Welcome to the **Manus Operations Center** for the **The Vault Investigates** and **TruthDrop.io** ecosystem. 

This directory serves as the **definitive source of truth, operational guardrails, and architectural blueprint** for all AI agents (Manus) collaborating on this platform. It has been specifically formatted for **Obsidian** to enable seamless searching, linking, and local documentation management.

---

## 🧭 How to Onboard a New Manus Agent
Whenever you initialize a new session with a Manus agent, **your very first message must include these instructions**:
> [!IMPORTANT] Onboarding Protocol
> "I am attaching my local **Manus Operations Center** folder. Before writing any code or making modifications:
> 1. Read `Manus_Operations_Index.md` to understand the system overview.
> 2. Read `Guides/Manus_Developer_Onboarding.md` for strict repository, build, and deployment guidelines.
> 3. Read `Compliance/Stripe_KoFi_Compliance_Guardrails.md` to prevent any compliance violations.
> 4. Pull the latest code directly from my GitHub repository: `https://github.com/PapiRicanPI/vault-vet-portal.git` and work ONLY on top of the main branch."

---

## 🗂️ Operations Directory Map

Use the links below to navigate the operational files:

### 1. 🚀 Developer Guides
*   [[Guides/Manus_Developer_Onboarding|Manus Developer Onboarding]]: Git workflows, build verification, database migrations, and how to prevent "back to square one" regressions.
*   [[Guides/Webflow_Admin_Guide|Webflow Portal Admin Guide]]: Admin instructions for managing the Webflow portal integration, tracking upgrades, and platform features.
*   [[Guides/Webflow_User_Guide|Webflow Portal User Guide]]: User-facing guide for researchers and team members operating within the Webflow-Vercel environment.

### 2. 🏛️ System Architecture
*   [[Architecture/System_Ecosystem_Map|System Ecosystem Blueprint]]: The relationship between TruthDrop.io (anonymous intake) and The Vault Investigates (restricted vetting portal).
*   [[Architecture/Database_Schema_Spec|Database & Drizzle Schema]]: Current live tables (`media_leads`, `deped_schools`, `creator_scan_leads`, etc.) and field definitions.
*   [[Architecture/Vercel_Routing_Checklist|Vercel Routing Checklist]]: Strict mapping of public vs. admin-protected paths.

### 3. 🛡️ Compliance & Safety
*   [[Compliance/Stripe_KoFi_Compliance_Guardrails|Stripe & Ko-fi Compliance Guardrails]]: Mandatory rules regarding "donations" vs. "tips/support" to protect our merchant processing accounts.
*   [[Compliance/Access_Control_Role_System|Access Control & Role System]]: Detailed specification of the 4-level user role system (Observer, Researcher, Custodian, Admin).

### 4. 🔄 Workflows & Guides
*   [[Workflows/Poverty_Porn_Leads_Tracker|Poverty-Porn Leads Tracker]]: Triage and ingestion workflow for media and creator leads.
*   [[Workflows/Transactional_Email_System|Transactional Email System]]: Automated vetting notifications using the built-in Resend integration.

---

## 🛡️ Strict Operational Commandments for Manus
All AI agents executing tasks in this repository must strictly adhere to these four core rules:
1.  **NEVER Rebuild from Scratch**: Always pull from `origin main` and edit incrementally.
2.  **NEVER Use the Word "Donation"**: All fundraising copy must use "tips" or "support."
3.  **DO NOT Break Existing Tables**: Any schema change must go through Drizzle migration pushes.
4.  **No Direct Deployments**: Let the user review local builds and commit to main to trigger Vercel CI/CD.

---
*Created and maintained by Manus AI for The Vault Investigates.*
