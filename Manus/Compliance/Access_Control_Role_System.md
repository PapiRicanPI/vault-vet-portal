# Access Control & Role System: 4-Level User Hierarchy

To protect whistleblower identity, preserve case integrity, and secure sensitive public records, **The Vault Investigates** and **TruthDrop.io** utilize a strict **4-level role-based access control (RBAC) system**.

---

## 🏛️ The 4-Level Role Hierarchy

```
                      ┌──────────────────┐
                      │    1. ADMIN      │  -> Full Settings, Database, & Roles
                      └────────┬─────────┘
                               ▼
                      ┌──────────────────┐
                      │   2. CUSTODIAN   │  -> Tip Review, Redaction, & Approval
                      └────────┬─────────┘
                               ▼
                      ┌──────────────────┐
                      │  3. RESEARCHER   │  -> Case Editing & Outreach Leads
                      └────────┬─────────┘
                               ▼
                      ┌──────────────────┐
                      │   4. OBSERVER    │  -> Read-Only Public Content
                      └──────────────────┘
```

---

## 📋 Role Access Matrix

The table below outlines the specific permissions assigned to each tier:

| Feature / Page | Observer | Researcher | Custodian | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Public Pages (`/`, `/tips`, `/cases`) | ✅ | ✅ | ✅ | ✅ |
| Vetting Dashboard (`/admin`) | ❌ | ❌ | ✅ | ✅ |
| Case Evidence Editing | ❌ | ✅ | ✅ | ✅ |
| Secure Tip Redaction & Approval | ❌ | ❌ | ✅ | ✅ |
| Database Migration / SQL Access | ❌ | ❌ | ❌ | ✅ |
| User Role Promotion / Demotion | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Security & Privacy Guardrails

### 1. Identity Protection (Anonymity)
*   **Pseudonyms Only**: Profile pages and team lists must only expose a user's chosen **pseudonym**, never their real name or email address, to other users.
*   **Admin Email**: The primary, pre-configured administrator email is `tainorican2n@gmail.com`. This email is tied to the main admin account.

### 2. No Public User Lists
*   The private list of users and their assigned roles is **strictly restricted to the Admin panel**. 
*   No public page should ever reveal, query, or leak this user list.

### 3. Identity Login Gate
*   All internal portal and admin paths (e.g., `/admin`, `/portal`, `/cases/internal`, `/vetting`) must be protected by an identity login gate (e.g., Cloudflare Access or our integrated OAuth2 server).
*   Public static pages (e.g., `/`, `/disclaimer`, `/volunteer`) must be visible to everyone without any login or identity prompt.

---

## 🛠️ Code Implementation Guidelines
When writing backend endpoints or client-side components, always enforce role checking at both levels:

### Frontend Route Guarding
```tsx
if (user.role !== 'admin' && user.role !== 'custodian') {
  return <Redirect to="/unauthorized" />;
}
```

### Backend Procedure Guarding (tRPC)
```typescript
// Enforce admin-only procedures
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin privileges required' });
  }
  return next();
});
```

---
*Next Step: See [[Architecture/System_Ecosystem_Map|System Ecosystem Blueprint]] for routing details.*
