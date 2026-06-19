/**
 * ResearcherDashboard — The authenticated researcher's personal workspace.
 * Features:
 *  - Bookmarked cases (add/remove)
 *  - Private case notes (per-case, auto-save)
 *  - Research Projects (named collections of case IDs)
 *  - Recently Viewed cases
 *  - Profile Edit (name, organization, geographic focus, expertise)
 *  - PDF Export (watermarked, chain-of-custody logged)
 */
import { useState, useEffect, useRef } from "react";
import { ResearchCalendar } from "@/components/ResearchCalendar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "bookmarks" | "notes" | "projects" | "recent" | "calendar" | "profile" | "export";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BookmarksTab() {
  const { data: bookmarks, isLoading, refetch } = trpc.researcher.getBookmarks.useQuery();
  const removeMutation = trpc.researcher.removeBookmark.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <LoadingSpinner />;
  if (!bookmarks?.length) return <EmptyState icon="🔖" title="No bookmarks yet" desc="Bookmark cases from the case database to track them here." />;

  return (
    <div className="space-y-3">
      {bookmarks.map((b) => (
        <div key={b.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-amber-700/50 transition-colors">
          <div>
            <p className="text-amber-400 font-mono text-sm font-semibold">{b.caseId}</p>
            <p className="text-zinc-300 text-sm mt-0.5">{b.caseTitle ?? "Untitled Case"}</p>
            <p className="text-zinc-600 text-xs mt-1">Bookmarked {formatDate(b.createdAt)}</p>
          </div>
          <button
            onClick={() => removeMutation.mutate({ caseId: b.caseId })}
            className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-3 py-1 rounded border border-zinc-700 hover:border-red-700"
            disabled={removeMutation.isPending}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function NotesTab() {
  const [caseId, setCaseId] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupQuery = trpc.researcher.getNote.useQuery(
    { caseId: caseId.trim() },
    { enabled: loaded && caseId.trim().length > 0 }
  );
  const saveMutation = trpc.researcher.saveNote.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  useEffect(() => {
    if (lookupQuery.data) {
      setNote(lookupQuery.data.note ?? "");
    }
  }, [lookupQuery.data]);

  const handleNoteChange = (val: string) => {
    setNote(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (caseId.trim()) saveMutation.mutate({ caseId: caseId.trim(), note: val });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-amber-400 font-semibold mb-4 text-sm uppercase tracking-wider">Case Notes</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Case ID</label>
            <input
              value={caseId}
              onChange={e => { setCaseId(e.target.value); setLoaded(false); setNote(""); }}
              onBlur={() => setLoaded(true)}
              placeholder="e.g. CASE-2024-001"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm font-mono focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Case Title (optional)</label>
            <input
              value={caseTitle}
              onChange={e => setCaseTitle(e.target.value)}
              placeholder="Short description"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>
        <label className="text-zinc-400 text-xs mb-1 block">Your Private Notes</label>
        <textarea
          value={note}
          onChange={e => handleNoteChange(e.target.value)}
          disabled={!caseId.trim()}
          rows={8}
          placeholder={caseId.trim() ? "Start typing — notes auto-save after 1.5 seconds..." : "Enter a Case ID above to start taking notes."}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 resize-none disabled:opacity-40"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-zinc-600 text-xs">Notes are private — only visible to you.</p>
          {saved && <p className="text-green-500 text-xs font-medium">✓ Saved</p>}
          {saveMutation.isPending && <p className="text-amber-500 text-xs">Saving...</p>}
        </div>
      </div>
    </div>
  );
}

function ProjectsTab() {
  const { data: projects, isLoading, refetch } = trpc.researcher.getProjects.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newCaseId, setNewCaseId] = useState("");

  const createMutation = trpc.researcher.createProject.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); setNewTitle(""); setNewDesc(""); },
  });
  const updateCasesMutation = trpc.researcher.updateProjectCases.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.researcher.deleteProject.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Research Projects</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs bg-amber-600 hover:bg-amber-500 text-black font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          + New Project
        </button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900 border border-amber-700/40 rounded-xl p-4 space-y-3">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Project title"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ title: newTitle, description: newDesc || undefined })}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-black text-sm font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="text-zinc-400 text-sm px-3 py-1.5 rounded-lg hover:text-zinc-200">Cancel</button>
          </div>
        </div>
      )}

      {!projects?.length && !showCreate && (
        <EmptyState icon="📁" title="No projects yet" desc="Create a project to group related cases together." />
      )}

      {projects?.map(p => (
        <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/50"
            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
          >
            <div>
              <p className="text-zinc-100 font-semibold text-sm">{p.title}</p>
              {p.description && <p className="text-zinc-500 text-xs mt-0.5">{p.description}</p>}
              <p className="text-zinc-600 text-xs mt-1">{(p.caseIds as string[]).length} case(s) · Created {formatDate(p.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); if (confirm("Delete this project?")) deleteMutation.mutate({ projectId: p.id }); }}
                className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded border border-zinc-700 hover:border-red-700 transition-colors"
              >
                Delete
              </button>
              <span className="text-zinc-500 text-xs">{expandedId === p.id ? "▲" : "▼"}</span>
            </div>
          </div>

          {expandedId === p.id && (
            <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(p.caseIds as string[]).map(cid => (
                  <span key={cid} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-xs font-mono text-amber-400">
                    {cid}
                    <button
                      onClick={() => updateCasesMutation.mutate({ projectId: p.id, caseIds: (p.caseIds as string[]).filter(c => c !== cid) })}
                      className="text-zinc-600 hover:text-red-400 ml-1"
                    >×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCaseId}
                  onChange={e => setNewCaseId(e.target.value)}
                  placeholder="Add Case ID (e.g. CASE-2024-001)"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-sm font-mono focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={() => {
                    if (!newCaseId.trim()) return;
                    const ids = p.caseIds as string[];
                    if (!ids.includes(newCaseId.trim())) {
                      updateCasesMutation.mutate({ projectId: p.id, caseIds: [...ids, newCaseId.trim()] });
                    }
                    setNewCaseId("");
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-black text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RecentTab() {
  const { data: recent, isLoading } = trpc.researcher.getRecentlyViewed.useQuery();
  const addBookmark = trpc.researcher.addBookmark.useMutation();

  if (isLoading) return <LoadingSpinner />;
  if (!recent?.length) return <EmptyState icon="🕐" title="No recent activity" desc="Cases you view will appear here." />;

  return (
    <div className="space-y-3">
      {recent.map((r) => (
        <div key={r.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-amber-700/50 transition-colors">
          <div>
            <p className="text-amber-400 font-mono text-sm font-semibold">{r.caseId}</p>
            <p className="text-zinc-300 text-sm mt-0.5">{r.caseTitle ?? "Untitled Case"}</p>
            <p className="text-zinc-600 text-xs mt-1">Viewed {formatDate(r.viewedAt)}</p>
          </div>
          <button
            onClick={() => addBookmark.mutate({ caseId: r.caseId, caseTitle: r.caseTitle ?? undefined })}
            className="text-zinc-500 hover:text-amber-400 transition-colors text-sm px-3 py-1 rounded border border-zinc-700 hover:border-amber-700"
            disabled={addBookmark.isPending}
          >
            🔖 Bookmark
          </button>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ user }: { user: { name?: string | null; email?: string | null } }) {
  const [name, setName] = useState(user.name ?? "");
  const [organization, setOrganization] = useState("");
  const [geoFocus, setGeoFocus] = useState("");
  const [expertise, setExpertise] = useState("");
  const [saved, setSaved] = useState(false);

  const updateMutation = trpc.researcher.updateProfile.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-amber-400 font-semibold mb-4 text-sm uppercase tracking-wider">Your Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Email</label>
            <input
              value={user.email ?? ""}
              disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-500 text-sm cursor-not-allowed"
            />
            <p className="text-zinc-600 text-xs mt-1">Email is managed by your login provider.</p>
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Organization / Affiliation</label>
            <input
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="e.g. Freelance, Reuters, University of Manila"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Geographic Focus</label>
            <input
              value={geoFocus}
              onChange={e => setGeoFocus(e.target.value)}
              placeholder="e.g. Philippines, Southeast Asia"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Subject Matter Expertise</label>
            <input
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              placeholder="e.g. Financial fraud, human trafficking, OSINT"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => updateMutation.mutate({
                name: name || undefined,
                organization: organization || undefined,
                geographicFocus: geoFocus || undefined,
                subjectMatterExpertise: expertise || undefined,
              })}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {updateMutation.isPending ? "Saving..." : "Save Profile"}
            </button>
            {saved && <span className="text-green-500 text-sm font-medium">✓ Profile updated</span>}
            {updateMutation.isError && <span className="text-red-400 text-sm">{updateMutation.error.message}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportTab({ user }: { user: { name?: string | null } }) {
  const [caseId, setCaseId] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [content, setContent] = useState("");
  const [alias, setAlias] = useState(user.name ?? "Researcher");
  const [result, setResult] = useState<{ documentId: string; fileUrl: string; exportedAt: string } | null>(null);

  const exportMutation = trpc.pdf.exportCase.useMutation({
    onSuccess: (data) => {
      setResult(data);
      window.open(data.fileUrl, "_blank");
    },
  });

  const { data: exportLogs } = trpc.pdf.listExportLogs.useQuery();

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-amber-400 font-semibold mb-1 text-sm uppercase tracking-wider">Export Case as Watermarked PDF</h3>
        <p className="text-zinc-500 text-xs mb-4">Every export is logged with a unique Document ID for chain-of-custody traceability.</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Case ID</label>
            <input value={caseId} onChange={e => setCaseId(e.target.value)} placeholder="CASE-2024-001"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm font-mono focus:outline-none focus:border-amber-600" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs mb-1 block">Case Title</label>
            <input value={caseTitle} onChange={e => setCaseTitle(e.target.value)} placeholder="Short title"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600" />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-zinc-400 text-xs mb-1 block">Your Alias (stamped in watermark)</label>
          <input value={alias} onChange={e => setAlias(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600" />
        </div>
        <div className="mb-4">
          <label className="text-zinc-400 text-xs mb-1 block">Case Content (one line per paragraph)</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
            placeholder="Paste or type the case content to include in the PDF..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-amber-600 resize-none" />
        </div>
        <button
          onClick={() => exportMutation.mutate({
            caseId: caseId.trim(),
            caseTitle: caseTitle.trim() || undefined,
            contentLines: content.split("\n").filter(l => l.trim()),
            researcherAlias: alias.trim(),
          })}
          disabled={!caseId.trim() || !content.trim() || exportMutation.isPending}
          className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          {exportMutation.isPending ? "Generating PDF..." : "⬇ Export Watermarked PDF"}
        </button>
        {exportMutation.isError && <p className="text-red-400 text-sm mt-2">{exportMutation.error.message}</p>}
        {result && (
          <div className="mt-4 bg-green-950/40 border border-green-800/50 rounded-lg p-3">
            <p className="text-green-400 text-sm font-semibold">✓ PDF Generated</p>
            <p className="text-zinc-400 text-xs mt-1">Document ID: <span className="font-mono text-amber-400">{result.documentId}</span></p>
            <p className="text-zinc-400 text-xs">Exported: {result.exportedAt}</p>
            <a href={result.fileUrl} target="_blank" rel="noreferrer"
              className="inline-block mt-2 text-amber-400 hover:text-amber-300 text-xs underline">
              Open PDF →
            </a>
          </div>
        )}
      </div>

      {exportLogs && exportLogs.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-amber-400 font-semibold mb-3 text-sm uppercase tracking-wider">Your Export History</h3>
          <div className="space-y-2">
            {exportLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                <div>
                  <span className="font-mono text-amber-400">{log.caseId}</span>
                  <span className="text-zinc-500 ml-2">{log.caseTitle ?? ""}</span>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 font-mono">{log.documentId.slice(0, 8)}…</p>
                  <p className="text-zinc-600">{formatDate(log.exportedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-zinc-300 font-semibold">{title}</p>
      <p className="text-zinc-600 text-sm mt-1 max-w-xs">{desc}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ResearcherDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("bookmarks");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "bookmarks", label: "Bookmarks", icon: "🔖" },
    { id: "notes", label: "Case Notes", icon: "📝" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "recent", label: "Recent", icon: "🕐" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "export", label: "PDF Export", icon: "⬇" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <p className="text-zinc-400 text-lg">Please log in to access your researcher workspace.</p>
        <a href="/admin/login" className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6 py-2.5 rounded-lg transition-colors">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1200 100%)", borderBottom: "1px solid #2a2000" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="text-zinc-600 hover:text-amber-400 text-sm transition-colors">← Home</Link>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400 text-sm">Researcher Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-amber-400">🔬 Research Workspace</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Welcome back, {user.name ?? user.email ?? "Researcher"}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-amber-900/30 border border-amber-700/40 rounded-full px-3 py-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-400 text-xs font-medium">Approved Researcher</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ background: "#111", borderBottom: "1px solid #222" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "bookmarks" && <BookmarksTab />}
        {activeTab === "notes" && <NotesTab />}
        {activeTab === "calendar" && <ResearchCalendar />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "recent" && <RecentTab />}
        {activeTab === "profile" && <ProfileTab user={user} />}
        {activeTab === "export" && <ExportTab user={user} />}
      </div>
    </div>
  );
}
