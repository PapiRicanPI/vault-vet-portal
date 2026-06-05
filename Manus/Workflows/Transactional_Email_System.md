# Transactional Email System: Automated Vetting Notifications

This document outlines the architecture and workflows for sending automated transactional emails to volunteers, researchers, and administrators.

---

## 📧 Email Architecture Overview
To maintain professional branding, keep costs low, and avoid complex SMTP credential management, the platform utilizes the **built-in Resend integration**:

*   **Sender Display Name**: `The Vault Investigates` or `TheVaultArchivist`
*   **Official Sender Address**: `vaultinvestigates@protonmail.com`
*   **Service Provider**: Resend (API-driven transactional delivery)

---

## 🔄 Automated Notification Workflows

The system triggers automated emails based on specific admin actions within the **Vetting Dashboard** (`/admin`):

```
                       [ Admin Action on /admin ]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  [ Application Approved ]   [ Application Rejected ]  [ Needs More Info ]
         │                         │                         │
         ▼                         ▼                         ▼
   (Trigger Email)           (Trigger Email)           (Trigger Email)
   "Welcome to the Vault"    "Application Status"      "Clarification Request"
```

### 1. Application Approval (Welcome Email)
*   **Trigger**: Admin changes applicant status to `Approved`.
*   **Template Content**: Welcomes the applicant to the research team, provides a link to register their pseudonym, and attaches the strict **Non-Disclosure Agreement (NDA)**.

### 2. Application Rejection
*   **Trigger**: Admin changes applicant status to `Rejected`.
*   **Template Content**: Polite notification indicating that we are unable to move forward with their application at this time.

### 3. Needs More Info
*   **Trigger**: Admin changes applicant status to `Needs Info`.
*   **Template Content**: Requests specific clarifications or additional verification documents from the applicant.

---

## 🛠️ Code Implementation (Backend)
Transactional emails are sent programmatically via the tRPC routers using our helper functions in `server/db.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVettingEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: "The Vault Investigates <vaultinvestigates@protonmail.com>",
      to: [to],
      subject: subject,
      html: html,
    });
    console.log(`[Email Sent] Success: ${to}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error);
  }
}
```

---
*Next Step: See [[Guides/Manus_Developer_Onboarding|Manus Developer Onboarding]] to review the build checks.*
