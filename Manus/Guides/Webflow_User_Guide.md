# Webflow Portal User Guide: Operating the Vetting Workspace

This guide is designed for **Researchers, Journalists, and Moderators** operating within the Webflow-Vercel workspace. It explains how to review tips, manage school outreach, and utilize the research tools.

---

## 🔐 Logging In & Access Tiers
Your access to the portal is determined by your assigned user role. When you log in via the portal, you will be assigned one of the following tiers:

| Role | Access Level | Permitted Actions |
| :--- | :--- | :--- |
| **Observer** | Read-Only | View public cases and resources; cannot edit or review tips. |
| **Researcher** | Case Work | View, edit, and link evidence to cases; manage outreach leads. |
| **Custodian** | Tip Moderator | Review incoming secure tips; redact sensitive data; approve/reject tips. |
| **Admin** | Full Access | Manage system settings, user roles, and database configurations. |

---

## 🔍 How to Use the Research Portals

### 1. Media Scan Portal (`/admin/media-scan`)
The Media Scan tool is a multi-source discovery engine used to track news reports, creator content, and archived clips:
*   **Running a Scan**: Enter keywords (e.g., "poverty exploitation Manila") and select your sources (Google News, YouTube, Reddit).
*   **Saving a Lead**: If a search result is relevant to an ongoing case, click **Save Lead**. This moves the result into the central database.
*   **Flagging for Review**: If a video or article contains potential violations, click **Flag for Review** to notify the Custodians.

### 2. DepEd School Directory (`/admin/deped-directory`)
This directory contains over 10,000 public high school records used for the **Manila High School Volunteer Program**:
*   **Filtering**: Filter schools by Region, Province, or District.
*   **Adding a Contact**: Select a school and click **+ Lead** to import it into your active School Fellowship outreach table.

---

## 📧 Managing Outreach Campaigns
The **School Fellowship** table in the Admin Dashboard is where we track communications with high school principals and coordinators:

### 1. Sending Automated Emails
*   To send an initial outreach email, locate the school in the table and click **Send EN** (English) or **Send TL** (Tagalog).
*   The system will automatically trigger a personalized email via Resend using our official branded address: `vaultinvestigates@protonmail.com`.

### 2. Logging Replies & Setting Follow-ups
*   When a school replies, click **+ Log Reply** to document their response.
*   Update their outreach status in the dropdown (e.g., *Sent / Replied / No Response / Declined*).
*   If they request more time, click **+ Set Follow-up** to schedule a reminder.

---

## 🛡️ Whistleblower Safety & Redaction Rules
As a Custodian or Researcher, **protecting the identity of our sources is our highest priority**:
1.  **Never** copy-paste raw whistleblower emails or names into public case files.
2.  Before publishing any leaked document, use the PDF viewer's redaction tool to black out names, locations, metadata, or unique identifying text.
3.  If a tip contains media files, ensure they are stored securely on our encrypted S3 bucket, never in public folders.

---
*Next Step: Read [[Compliance/Stripe_KoFi_Compliance_Guardrails|Stripe & Ko-fi Compliance Guardrails]].*
