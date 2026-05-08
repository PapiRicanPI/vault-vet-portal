import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// ── PDF generation using jsPDF (loaded from CDN via dynamic import) ──────────
async function generatePdf(contacts: any[], exportedAt: string) {
  // Build a simple HTML string and use the browser's print-to-PDF capability
  const categories = ["Vlogger", "Donor", "School Contact", "Media Outreach"];
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>The Vault Investigates — Contacts Export ${exportedAt}</title>
<style>
  body { font-family: Georgia, serif; font-size: 11px; color: #111; margin: 32px; }
  h1 { font-size: 18px; border-bottom: 2px solid #b8960c; padding-bottom: 6px; }
  h2 { font-size: 13px; margin-top: 24px; background: #f5f0e0; padding: 4px 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
  th { background: #222; color: #fff; padding: 4px 6px; text-align: left; }
  td { border-bottom: 1px solid #ddd; padding: 3px 6px; }
  tr:nth-child(even) td { background: #fafafa; }
  .footer { margin-top: 32px; font-size: 9px; color: #888; border-top: 1px solid #ccc; padding-top: 8px; }
</style>
</head>
<body>
<h1>The Vault Investigates — Contacts Export</h1>
<p><strong>Exported:</strong> ${exportedAt} &nbsp;|&nbsp; <strong>Total contacts:</strong> ${contacts.length}</p>
${categories.map(cat => {
  const group = contacts.filter((c: any) => c.category === cat);
  return `<h2>${cat}s (${group.length})</h2>
<table>
<tr><th>ID</th><th>Name</th><th>Organisation</th><th>Email</th><th>Phone</th><th>Platform</th><th>Status</th><th>Date Added</th></tr>
${group.length === 0 ? '<tr><td colspan="8"><em>No contacts in this category.</em></td></tr>' :
  group.map((c: any) => `<tr><td>${c.id}</td><td>${c.name || "—"}</td><td>${c.organisation || "—"}</td><td>${c.email || "—"}</td><td>${c.phone || "—"}</td><td>${c.platform || "—"}</td><td>${c.status}</td><td>${c.dateAdded || "—"}</td></tr>`).join("")}
</table>`;
}).join("")}
<div class="footer">The Vault Investigates · Contacts Export · ${exportedAt}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ── Download helper ───────────────────────────────────────────────────────────
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Category badge colours ────────────────────────────────────────────────────
const CATEGORY_COLOURS: Record<string, string> = {
  Vlogger: "bg-red-900/60 text-red-200 border-red-700",
  Donor: "bg-yellow-900/60 text-yellow-200 border-yellow-700",
  "School Contact": "bg-blue-900/60 text-blue-200 border-blue-700",
  "Media Outreach": "bg-green-900/60 text-green-200 border-green-700",
};

const STATUS_COLOURS: Record<string, string> = {
  not_sent: "bg-zinc-700 text-zinc-300",
  sent: "bg-blue-800 text-blue-200",
  responded: "bg-green-800 text-green-200",
  no_reply: "bg-orange-800 text-orange-200",
  declined: "bg-red-800 text-red-200",
  new: "bg-zinc-700 text-zinc-300",
  thanked: "bg-green-800 text-green-200",
  follow_up_sent: "bg-blue-800 text-blue-200",
  meeting: "bg-purple-800 text-purple-200",
};

export default function ContactsExport() {
  const { data, isLoading, error } = trpc.contacts.exportAll.useQuery();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Vlogger", "Donor", "School Contact", "Media Outreach"];

  const filtered = data?.contacts.filter(
    (c) => activeCategory === "All" || c.category === activeCategory
  ) ?? [];

  function handleDownloadCsv() {
    if (!data) return;
    downloadBlob(data.csv, `${data.filename}.csv`, "text/csv;charset=utf-8;");
    toast.success("CSV downloaded", { description: `${data.filename}.csv — ready to import into Beekeeper` });
  }

  function handleDownloadMd() {
    if (!data) return;
    downloadBlob(data.markdown, `${data.filename}.md`, "text/markdown;charset=utf-8;");
    toast.success("Markdown downloaded", { description: `${data.filename}.md` });
  }

  async function handleDownloadPdf() {
    if (!data) return;
    await generatePdf(data.contacts, data.exportedAt);
    toast.success("PDF ready", { description: "Use your browser's Print → Save as PDF to save the file." });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 text-sm animate-pulse">Loading contacts…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-sm">Error loading contacts: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-amber-400 tracking-tight">Contacts Export</h1>
        <p className="text-zinc-400 text-sm">
          All contacts across Vloggers, Donors, School Contacts, and Media Outreach.
          Export as CSV (Beekeeper-compatible), Markdown, or PDF.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-white">{data?.totalCount ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-0.5">Total Contacts</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-red-800">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-red-300">{data?.categoryCounts.vloggers ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-0.5">Vloggers</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-yellow-800">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-yellow-300">{data?.categoryCounts.donors ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-0.5">Donors</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-blue-800">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-blue-300">{data?.categoryCounts.schools ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-0.5">School Contacts</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-green-800">
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-300">{data?.categoryCounts.media ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-0.5">Media Outreach</div>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <Card className="bg-zinc-900 border-amber-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-400 text-sm font-semibold uppercase tracking-widest">
            Download Exports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={handleDownloadCsv}
            className="bg-green-700 hover:bg-green-600 text-white font-semibold"
            disabled={!data}
          >
            ↓ Download CSV
            <span className="ml-2 text-xs opacity-70">Beekeeper-compatible</span>
          </Button>
          <Button
            onClick={handleDownloadMd}
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold"
            disabled={!data}
          >
            ↓ Download .md
            <span className="ml-2 text-xs opacity-70">Obsidian-ready</span>
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="bg-amber-700 hover:bg-amber-600 text-white font-semibold"
            disabled={!data}
          >
            ↓ Export PDF
            <span className="ml-2 text-xs opacity-70">Print / Save as PDF</span>
          </Button>
        </CardContent>
      </Card>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              activeCategory === cat
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-amber-600 hover:text-amber-400"
            }`}
          >
            {cat}
            {cat !== "All" && data && (
              <span className="ml-1.5 opacity-60">
                ({data.contacts.filter((c) => c.category === cat).length})
              </span>
            )}
            {cat === "All" && data && (
              <span className="ml-1.5 opacity-60">({data.totalCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Contacts table */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/60">
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">ID</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Organisation</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Phone</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Platform</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-semibold">Date Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-zinc-500 py-12">
                      No contacts in this category.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-zinc-500 font-mono">{c.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLOURS[c.category] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white font-medium">{c.name || "—"}</td>
                      <td className="px-4 py-2.5 text-zinc-300">{c.organisation || "—"}</td>
                      <td className="px-4 py-2.5">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-amber-400 hover:underline">
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">{c.phone || "—"}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{c.platform || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLOURS[c.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500">{c.dateAdded || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-600">
        Exported at: {data?.exportedAt} · The Vault Investigates
      </p>
    </div>
  );
}
