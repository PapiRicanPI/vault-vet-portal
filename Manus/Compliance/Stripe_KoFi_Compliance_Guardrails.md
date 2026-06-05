# Stripe & Ko-fi Compliance Guardrails: Terminology & Fundraising Rules

This document outlines the **strict legal and financial guardrails** regarding fundraising terminology on **The Vault Investigates** and **TruthDrop.io** platforms. 

To prevent merchant account suspension, frozen funds, or legal liabilities, all copywriters, developers, and AI agents **must** adhere to these rules without exception.

---

## 🛑 The Core Compliance Rule: "No Donations"
Under financial regulations, the word **"donation"** is a legally protected term. It is strictly reserved for registered non-profit organizations (such as 501(c)(3) charities in the US or registered NGOs in the Philippines).

Standard individual or business merchant accounts (such as our Stripe and Ko-fi accounts) **are not legally authorized to collect "donations."** Doing so triggers automated compliance flags for potential tax evasion or unauthorized charitable solicitation.

### Permitted Terminology
Stripe and Ko-fi **fully permit** independent journalists, writers, and content creators to accept contributions framed as:
*   **Tips / Micro-tips**
*   **Support / Reader Support**
*   **Subscriptions / Supporter Tiers**
*   **Sponsorships**

---

## 📋 Forbidden vs. Required Vocabulary
Use the table below to review all text, buttons, and headers on the platform:

| Forbidden Terms (Suspendable) | Required Replacements (Compliant) |
| :--- | :--- |
| `Donate` / `Donations` | `Tip` / `Support` / `Contribute` |
| `Donate to the Investigation` | `Support Independent Journalism` |
| `Charity` / `Charitable` | `Independent Initiative` / `Public Interest` |
| `Fundraiser` / `Fundraising` | `Platform Infrastructure Support` |
| `Tax-deductible` | `Reader-supported / Independent` |

---

## 🖥️ Code-Level Implementation Guardrails

### 1. Public-Facing Buttons
All buttons leading to payment gateways (such as Ko-fi or GoFundMe) must be labeled as **"Support"** or **"Tip"**:
```tsx
// ❌ Bad (Triggers Compliance Flag)
<button>Donate to Our Work</button>

// ✅ Good (Fully Compliant)
<button>Support Our Research</button>
<button>Tip the Archivist</button>
```

### 2. Student Volunteer Pages (`/volunteer`)
To maintain a professional and highly compliant student recruitment environment:
*   **Never** place direct fundraising buttons (like "Buy Me a Coffee" or "GoFundMe") on pages designed for high school student recruitment.
*   Instead, frame the page purely around educational and research opportunities. Any support mention should link back to a central `/about` or `/about-us` page.

---

## 📝 Pre-approved Stripe Compliance Response
If Stripe flags your account or requests additional information regarding your business, submit the following pre-approved, highly compliant statement:

```text
I am an independent investigative journalist and content creator. I publish public-interest reporting, articles, and investigative case studies focused on digital ethics, media accountability, and social issues at https://truthdrop.io.

The payments processed through my account (via Ko-fi) are micro-tips and supporter subscriptions from readers who wish to support my independent writing, research, and content creation. They are not charitable donations. 

To ensure full compliance with Stripe's guidelines, I have reviewed my public pages and updated all terminology. I have removed any references to "donations" and rephrased them strictly as "tips" or "support for independent journalism."
```

---
*Next Step: See [[Compliance/Access_Control_Role_System|Access Control & Role System]] for security rules.*
