# Poverty-Porn Leads Tracker: Discovery & Triage Workflow

This document outlines the operational workflow for discovering, triaging, and tracking poverty-porn creator leads inside the **Vetting Dashboard** (`/admin`).

---

## 🔍 The Discovery Phase
Our research team utilizes the **Creator Scan** tool (`/admin/creator-scan`) to identify channels, accounts, and creators engaged in exploitative "poverty-porn" content:

### Key Platforms & Search Vectors
*   **YouTube**: Search for vlogs targeting marginalized communities with sensationalist thumbnails or clickbait titles (e.g., "giving money to poor family in Manila").
*   **Google News**: Monitor local news reports on controversial vlogging incidents or formal regulatory inquiries.
*   **Reddit / Vimeo**: Track community threads exposing exploitative creators or platforms.

---

## 📋 Triage & Ingestion Pipeline

When a lead is discovered, follow this step-by-step triage workflow:

```
┌──────────────────────────────────┐
│ 1. Discover Lead via Search      │
│    (YouTube, Google News, etc.)  │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│ 2. Click "Save Lead" to Ingest   │
│    into `creator_scan_leads`     │
└────────────────┬─────────────────┘
                 │ (Assigned Status: 'lead')
                 ▼
┌──────────────────────────────────┐
│ 3. Researcher Reviews Evidence   │
│    & Adds Investigative Notes    │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│ 4. Update Status:                │
│    • 'verified' (Confirmed)      │
│    • 'archived' (No Violation)   │
└──────────────────────────────────┘
```

---

## 📊 The Leads Tracker Schema
All saved leads are compiled into the **Leads Tracker** table in the Admin panel. The table tracks:

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **Creator / Channel** | String | Name of the channel or individual creator. |
| **Platform** | Enum | Platform where the content is hosted (YouTube, TikTok, Facebook). |
| **Country / Region** | String | Location of the creator and the subjects being filmed. |
| **Discovery Source** | String | How the lead was found (e.g., YouTube Search, Reddit Thread). |
| **Status** | Dropdown | Current triage state: `Lead`, `Verified`, `Coded`, `Archived`. |
| **Notes** | Text | Short, actionable investigative notes or timestamps of interest. |

---

## 🛡️ Vetting & Safety Guidelines
*   **Do Not Contact**: Never contact a creator under investigation unless explicitly directed by the Admin.
*   **Anonymity of Subjects**: When taking screenshots or recording clips of exploitative content, ensure that the faces of children or vulnerable subjects are redacted or blurred before being linked to public case files.

---
*Next Step: See [[Workflows/Transactional_Email_System|Transactional Email System]].*
