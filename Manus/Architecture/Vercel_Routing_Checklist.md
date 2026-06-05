# Vercel Routing Checklist: Public vs. Admin-Protected Paths

This document outlines the strict routing rules, rewrites, and access controls implemented in `vercel.json` and `client/src/App.tsx`.

---

## 🚦 Routing Architecture & Rules

```
                       [ Incoming Web Traffic ]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Public Paths ]                                 [ Protected Paths ]
• / (Home)                                       • /admin (Dashboard)
• /tips (Intake Form)                            • /invite (User Invite)
• /volunteer (Recruitment)                                 │
• /cases (Public Logs)                                     ▼
                                                 [ OAuth Login Gate ]
                                                 • Admin Credentials
                                                 • Email Verification
```

---

## 📋 Vercel Routing Configuration (`vercel.json`)
To ensure that React's client-side routing works seamlessly on Vercel without triggering 404 errors on page refreshes, we implement the following rewrite rules:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/trpc/(.*)",
      "destination": "/api/trpc/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🛡️ Route Verification Checklist

Before deploying any routing modifications, verify the following access rules:

- [ ] **Public Landing Page (`/`)**: Must load immediately without prompting for login or authentication.
- [ ] **Secure Intake (`/tips`)**: Whistleblowers must be able to submit tips anonymously without requiring a user account.
- [ ] **Admin Portal (`/admin`)**: Accessing `/admin` must instantly redirect unauthenticated users to the OAuth login page.
- [ ] **Resources Directory (`/resources`)**: The OSINT resource list must be visible to public researchers without a login barrier.
- [ ] **Student Volunteer Page (`/volunteer`)**: Recruitment details must be fully public and free of any administrative tracking scripts.

---
*Next Step: See [[Compliance/Stripe_KoFi_Compliance_Guardrails|Stripe & Ko-fi Compliance Guardrails]].*
