/**
 * exportMarkdown.ts — Client-side Markdown export utility for NotebookLM integration.
 * Formats saved leads and research notes into structured .md files optimized for
 * Google NotebookLM ingestion.
 *
 * No new dependencies required — uses native Blob + URL.createObjectURL.
 */

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Creator Scan Leads Export ─────────────────────────────────────────────────

interface CreatorLead {
  id: number;
  source: string;
  title: string;
  url: string;
  channelOrAuthor?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  keyword?: string | null;
  leadStatus: string;
  notes?: string | null;
  savedAt?: string | Date | null;
}

export function exportCreatorScanLeads(leads: CreatorLead[]): void {
  if (!leads.length) {
    downloadMarkdown(
      `[VAULT-EXPORT] Creator Scan Leads - ${today()}.md`,
      `# [VAULT-EXPORT] Creator Scan Leads - ${today()}\n\nNo records to export.\n`
    );
    return;
  }

  const lines: string[] = [
    `# [VAULT-EXPORT] Creator Scan Leads - ${today()}`,
    "",
    `> Exported from The Vault Investigates — Creator Scan (Poverty-Porn Vlogger Scanner)`,
    `> Total leads: ${leads.length}`,
    "",
    "---",
    "",
  ];

  leads.forEach((lead, i) => {
    lines.push(`## Lead ${i + 1}: ${lead.title}`);
    lines.push("");
    lines.push(`- **Source:** ${lead.source}`);
    lines.push(`- **URL:** ${lead.url}`);
    if (lead.channelOrAuthor) lines.push(`- **Channel/Author:** ${lead.channelOrAuthor}`);
    if (lead.keyword) lines.push(`- **Search Keyword:** ${lead.keyword}`);
    if (lead.publishedAt) lines.push(`- **Published:** ${lead.publishedAt}`);
    lines.push(`- **Status:** ${lead.leadStatus}`);
    if (lead.savedAt) lines.push(`- **Saved:** ${new Date(lead.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    if (lead.description) {
      lines.push(`- **Description:** ${lead.description}`);
    }
    if (lead.notes) {
      lines.push("");
      lines.push(`**Notes:**`);
      lines.push(`> ${lead.notes}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  downloadMarkdown(`[VAULT-EXPORT] Creator Scan Leads - ${today()}.md`, lines.join("\n"));
}

// ─── Media Scan Leads Export ───────────────────────────────────────────────────

interface MediaLead {
  id: number;
  title: string;
  url: string;
  source: string;
  platform?: string | null;
  publishedAt?: string | Date | null;
  snippet?: string | null;
  rightsStatus?: string | null;
  status?: string | null;
  caseRef?: string | null;
  notes?: string | null;
  savedBy?: string | null;
  createdAt?: string | Date | null;
}

export function exportMediaScanLeads(leads: MediaLead[]): void {
  if (!leads.length) {
    downloadMarkdown(
      `[VAULT-EXPORT] Media Scan Leads - ${today()}.md`,
      `# [VAULT-EXPORT] Media Scan Leads - ${today()}\n\nNo records to export.\n`
    );
    return;
  }

  const lines: string[] = [
    `# [VAULT-EXPORT] Media Scan Leads - ${today()}`,
    "",
    `> Exported from The Vault Investigates — Media Scan (Google News / YouTube / Reddit / Google Web)`,
    `> Total leads: ${leads.length}`,
    "",
    "---",
    "",
  ];

  leads.forEach((lead, i) => {
    lines.push(`## Lead ${i + 1}: ${lead.title}`);
    lines.push("");
    lines.push(`- **Source:** ${lead.source}`);
    lines.push(`- **URL:** ${lead.url}`);
    if (lead.platform) lines.push(`- **Platform:** ${lead.platform}`);
    if (lead.publishedAt) lines.push(`- **Published:** ${new Date(lead.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    if (lead.status) lines.push(`- **Status:** ${lead.status}`);
    if (lead.rightsStatus) lines.push(`- **Rights:** ${lead.rightsStatus}`);
    if (lead.caseRef) lines.push(`- **Case Reference:** ${lead.caseRef}`);
    if (lead.savedBy) lines.push(`- **Saved By:** ${lead.savedBy}`);
    if (lead.createdAt) lines.push(`- **Date Saved:** ${new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
    if (lead.snippet) {
      lines.push("");
      lines.push(`**Snippet:**`);
      lines.push(`> ${lead.snippet}`);
    }
    if (lead.notes) {
      lines.push("");
      lines.push(`**Notes:**`);
      lines.push(`> ${lead.notes}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  downloadMarkdown(`[VAULT-EXPORT] Media Scan Leads - ${today()}.md`, lines.join("\n"));
}

// ─── Researcher Project Notes Export ───────────────────────────────────────────

interface ProjectNote {
  caseId: string;
  note: string;
}

interface ProjectExportData {
  title: string;
  description?: string | null;
  caseIds: string[];
  notes: ProjectNote[];
}

export function exportProjectNotes(project: ProjectExportData): void {
  const lines: string[] = [
    `# [VAULT-EXPORT] Project Notes: ${project.title} - ${today()}`,
    "",
    `> Exported from The Vault Investigates — Researcher Dashboard`,
    "",
  ];

  if (project.description) {
    lines.push(`**Project Description:** ${project.description}`);
    lines.push("");
  }

  lines.push(`**Cases in project:** ${project.caseIds.length}`);
  lines.push(`**Cases with notes:** ${project.notes.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (!project.notes.length) {
    lines.push("No notes recorded for cases in this project.");
    lines.push("");
  } else {
    project.notes.forEach((n, i) => {
      lines.push(`## Case: ${n.caseId}`);
      lines.push("");
      lines.push(n.note);
      lines.push("");
      if (i < project.notes.length - 1) {
        lines.push("---");
        lines.push("");
      }
    });
  }

  const safeTitle = project.title.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 50);
  downloadMarkdown(`[VAULT-EXPORT] ${safeTitle} Notes - ${today()}.md`, lines.join("\n"));
}
