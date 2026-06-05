# Webflow Portal Admin Guide: Integration, Upgrades & Features

This guide is designed for the **System Administrator** and **The Vault Archivist** to manage the Webflow-Vercel integration, track system upgrades, and administer platform-level features.

---

## 🏛️ Webflow-Vercel Integration Architecture
The platform utilizes a **hybrid architecture** where the public marketing and landing pages can be managed in **Webflow** for design flexibility, while the secure application portals, databases, and admin tools run on **Vercel**.

```
  [ Webflow (Public CMS) ]             [ Vercel (React Portal) ]
  • Public Landing Page                • /admin (Vetting Dashboard)
  • Public Articles & News             • /tips (Secure Intake Form)
  • General Disclaimers                • /apply (Volunteer App)
            │                                     │
            └───────────────┬─────────────────────┘
                            ▼
                [ Cloudflare / DNS Routing ]
                • truthdrop.io (Main Site)
                • vet.thevaultinvestigates.cloud
```

### Route Redirects & Rewrites
To prevent "cross-contamination" or broken paths, Vercel is configured to handle rewrites cleanly. The routing is managed in `vercel.json`:
*   All public static assets are served directly.
*   All tRPC API requests are routed to the backend server.
*   All client-side React routes are rewritten to `/index.html` to allow React Router to handle page transitions.

---

## ⚙️ Administrative Features & Management

### 1. User Role Management
Admins have the authority to manage user roles within the system. This is done via the **Vetting Dashboard** (`/admin` under the User Management tab):
*   **Designated Admin Email**: `tainorican2n@gmail.com`
*   **Role Promotion**: Admins can view a list of registered users and promote/demote them between the four roles (`observer`, `researcher`, `custodian`, `admin`).
*   **Security Guardrail**: To protect the identity of our team, the user list is **never** exposed on any public-facing page.

### 2. Secure Intake & Hardening
The tip submission system (`/tips`) is hardened against spam and data leakage:
*   **IP Masking**: No submitter IP addresses are recorded in the database.
*   **File Attachment Sanitization**: Metadata (EXIF data) is stripped from uploaded files to protect whistleblower identity.

---

## 📈 Tracking System Upgrades & Checklist
When planning future upgrades, the administrator must follow this sequence:

### Phase 1: Beta Freeze (Current State)
*   **Goal**: Maintain 100% stability.
*   **Rule**: No new feature additions or refactors are permitted during this phase. Only critical bug fixes (e.g., broken email notifications or access-tier bugs) should be deployed.

### Phase 2: Post-Beta Feature Roadmap
Once the beta testing phase is confirmed stable, the following features are prioritized for development:
- [ ] **Watermark Architecture**: Automated cryptographic watermarking of leaked documents.
- [ ] **Lightweight CRM Enhancements**: Adding tag filters for outreach campaigns.
- [ ] **Resend Multilingual Templates**: Adding Tagalog (TL) translations for automated volunteer emails.

---

## 🚨 Disaster Recovery & Rollbacks
If a deployment causes a critical regression on the live site:
1.  **Do not panic.**
2.  Open your Vercel Dashboard.
3.  Locate the **vault-vet-portal** project.
4.  Find the previous stable deployment (e.g., Commit `270babb` - Compliance terminology update).
5.  Click the **Three Dots (...)** next to that deployment and select **Promote to Production**. This rolls back the live site instantly without touching the repository code.

---
*Next Step: See [[Guides/Webflow_User_Guide|Webflow Portal User Guide]] for team member instructions.*
