import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type SchoolContact = {
  id: number;
  principalName: string;
  schoolName: string;
  district: string;
  email: string;
  status: string;
  lastEmailedAt?: Date | string | null;
  followUpDate?: Date | string | null;
  followUpSent?: boolean | null;
  followUpSentAt?: Date | string | null;
  replyNotes?: string | null;
  replyReceivedAt?: Date | string | null;
};

type SequenceStage = {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SCHOOL_STAGES: SequenceStage[] = [
  { id: "not_sent",  label: "Not Contacted",  color: "var(--vault-muted)", bg: "rgba(148,163,184,0.06)", border: "var(--vault-border)", description: "Initial email not yet sent" },
  { id: "sent",      label: "Initial Sent",   color: "var(--vault-gold)",  bg: "rgba(212,175,55,0.07)",  border: "rgba(212,175,55,0.3)", description: "Fellowship email sent, awaiting follow-up window" },
  { id: "followup",  label: "Follow-up Due",  color: "#f59e0b",            bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.35)", description: "7-day follow-up window reached" },
  { id: "responded", label: "Responded",      color: "#22c55e",            bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.35)",  description: "Principal replied to outreach" },
  { id: "meeting",   label: "Meeting Set",    color: "#a78bfa",            bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.35)", description: "Call or meeting scheduled" },
  { id: "no_reply",  label: "No Reply",       color: "#ef4444",            bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.3)",   description: "No response after follow-up" },
];

const MEDIA_CONTACTS = [
  { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", priority: "Critical" },
  { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", priority: "Critical" },
  { num: 3, name: "Rappler", org: "Rappler", priority: "High" },
  { num: 4, name: "VERA Files", org: "VERA Files", priority: "High" },
  { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", priority: "High" },
  { num: 6, name: "National Union of Journalists of the Philippines", org: "NUJP", priority: "Medium" },
  { num: 7, name: "Committee to Protect Journalists", org: "CPJ", priority: "Medium" },
  { num: 8, name: "Reporters Without Borders", org: "RSF", priority: "Medium" },
  { num: 9, name: "DSWD", org: "DSWD", priority: "High" },
  { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", priority: "High" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSchoolStageId(sc: SchoolContact): string {
  if (sc.status === "responded") return "responded";
  if (sc.status === "meeting") return "meeting";
  if (sc.status === "no_reply") return "no_reply";
  if (sc.status === "sent") {
    if (sc.followUpSent) return "responded"; // treat follow-up sent as in-progress responded
    if (sc.followUpDate) {
      const now = new Date();
      const due = new Date(sc.followUpDate as string);
      if (due <= now) return "followup";
    }
    return "sent";
  }
  return "not_sent";
}

function priorityColor(p: string) {
  if (p === "Critical") return "#ef4444";
  if (p === "High") return "var(--vault-gold)";
  return "#94a3b8";
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: "1rem 1.25rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "6px", minWidth: "110px", textAlign: "center" }}>
      <div style={{ color, fontSize: "1.6rem", fontWeight: 700, fontFamily: "Cinzel, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", marginTop: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

// ─── School Campaign Board ────────────────────────────────────────────────────

function SchoolCampaignBoard({ contacts }: { contacts: SchoolContact[] }) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const byStage: Record<string, SchoolContact[]> = {};
  SCHOOL_STAGES.forEach(s => { byStage[s.id] = []; });
  contacts.forEach(sc => {
    const stage = getSchoolStageId(sc);
    if (byStage[stage]) byStage[stage].push(sc);
    else byStage["not_sent"].push(sc);
  });

  const totalSent = contacts.filter(sc => sc.status !== "not_sent").length;
  const totalResponded = contacts.filter(sc => sc.status === "responded" || sc.status === "meeting").length;
  const totalFollowUpDue = byStage["followup"].length;
  const totalMeeting = contacts.filter(sc => sc.status === "meeting").length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <StatCard label="Total Contacts" value={contacts.length} color="var(--vault-gold)" />
        <StatCard label="Emailed" value={totalSent} color="var(--vault-gold)" />
        <StatCard label="Follow-up Due" value={totalFollowUpDue} color="#f59e0b" />
        <StatCard label="Responded" value={totalResponded} color="#22c55e" />
        <StatCard label="Meetings" value={totalMeeting} color="#a78bfa" />
      </div>

      {/* Stage columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
        {SCHOOL_STAGES.map(stage => {
          const stageContacts = byStage[stage.id] ?? [];
          const isExpanded = expandedStage === stage.id;
          const preview = isExpanded ? stageContacts : stageContacts.slice(0, 3);
          return (
            <div key={stage.id} style={{ background: stage.bg, border: `1px solid ${stage.border}`, borderRadius: "6px", padding: "0.85rem", borderTop: `3px solid ${stage.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div>
                  <div style={{ color: stage.color, fontFamily: "Cinzel, serif", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{stage.label}</div>
                  <div style={{ color: "var(--vault-muted)", fontSize: "0.68rem", marginTop: "0.15rem" }}>{stage.description}</div>
                </div>
                <span style={{ background: `${stage.color}22`, color: stage.color, borderRadius: "10px", padding: "0.15rem 0.55rem", fontSize: "0.78rem", fontWeight: 700, fontFamily: "Cinzel, serif" }}>{stageContacts.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {preview.map(sc => (
                  <div key={sc.id} style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "0.5rem 0.6rem" }}>
                    <div style={{ color: "var(--vault-text)", fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2 }}>{sc.principalName}</div>
                    <div style={{ color: "var(--vault-muted)", fontSize: "0.68rem", marginTop: "0.15rem" }}>{sc.schoolName}</div>
                    {sc.replyNotes && (
                      <div style={{ color: stage.color, fontSize: "0.67rem", marginTop: "0.2rem", fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>"{sc.replyNotes}"</div>
                    )}
                    {stage.id === "followup" && sc.followUpDate && (
                      <div style={{ color: "#f59e0b", fontSize: "0.67rem", marginTop: "0.2rem" }}>
                        Due: {new Date(sc.followUpDate as string).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                ))}
                {stageContacts.length > 3 && (
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                    style={{ background: "none", border: `1px dashed ${stage.border}`, color: stage.color, borderRadius: "4px", padding: "0.3rem", fontSize: "0.7rem", cursor: "pointer", textAlign: "center" }}>
                    {isExpanded ? "Show less" : `+${stageContacts.length - 3} more`}
                  </button>
                )}
                {stageContacts.length === 0 && (
                  <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", textAlign: "center", padding: "0.5rem 0", fontStyle: "italic" }}>None yet</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Media Campaign Board ─────────────────────────────────────────────────────

function MediaCampaignBoard({ sentNums }: { sentNums: Set<number> }) {
  const sent = MEDIA_CONTACTS.filter(c => sentNums.has(c.num));
  const pending = MEDIA_CONTACTS.filter(c => !sentNums.has(c.num));

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <StatCard label="Total Contacts" value={MEDIA_CONTACTS.length} color="var(--vault-gold)" />
        <StatCard label="Emailed" value={sent.length} color="#22c55e" />
        <StatCard label="Pending" value={pending.length} color="#f59e0b" />
        <StatCard label="Critical" value={MEDIA_CONTACTS.filter(c => c.priority === "Critical").length} color="#ef4444" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Sent column */}
        <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "6px", padding: "0.85rem", borderTop: "3px solid #22c55e" }}>
          <div style={{ color: "#22c55e", fontFamily: "Cinzel, serif", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
            Emailed <span style={{ background: "rgba(34,197,94,0.15)", borderRadius: "10px", padding: "0.1rem 0.5rem", marginLeft: "0.35rem" }}>{sent.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {sent.map(c => (
              <div key={c.num} style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "0.5rem 0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ color: "#22c55e", fontSize: "0.72rem" }}>✓</span>
                  <div style={{ color: "var(--vault-text)", fontSize: "0.75rem", fontWeight: 600 }}>{c.org}</div>
                  <span style={{ marginLeft: "auto", color: priorityColor(c.priority), fontSize: "0.65rem", fontWeight: 700 }}>{c.priority}</span>
                </div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.68rem", marginTop: "0.1rem" }}>{c.name}</div>
              </div>
            ))}
            {sent.length === 0 && <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", textAlign: "center", padding: "0.5rem 0", fontStyle: "italic" }}>None yet</div>}
          </div>
        </div>
        {/* Pending column */}
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px", padding: "0.85rem", borderTop: "3px solid #f59e0b" }}>
          <div style={{ color: "#f59e0b", fontFamily: "Cinzel, serif", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.6rem" }}>
            Pending <span style={{ background: "rgba(245,158,11,0.15)", borderRadius: "10px", padding: "0.1rem 0.5rem", marginLeft: "0.35rem" }}>{pending.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {pending.map(c => (
              <div key={c.num} style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "0.5rem 0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ color: "var(--vault-text)", fontSize: "0.75rem", fontWeight: 600 }}>{c.org}</div>
                  <span style={{ marginLeft: "auto", color: priorityColor(c.priority), fontSize: "0.65rem", fontWeight: 700 }}>{c.priority}</span>
                </div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.68rem", marginTop: "0.1rem" }}>{c.name}</div>
              </div>
            ))}
            {pending.length === 0 && <div style={{ color: "#22c55e", fontSize: "0.72rem", textAlign: "center", padding: "0.5rem 0" }}>All contacts emailed!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Donor Campaign Placeholder ───────────────────────────────────────────────

function DonorCampaignBoard() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", background: "rgba(212,175,55,0.04)", border: "1px dashed var(--vault-border)", borderRadius: "6px" }}>
      <div style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", marginBottom: "0.5rem" }}>Donor Outreach Campaign</div>
      <div style={{ color: "var(--vault-muted)", fontSize: "0.82rem", maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>
        Donor outreach tracking is coming in the next session. This board will show Ko-fi supporters, potential grant contacts, and individual donor follow-up sequences — all in the same stage-based view as the School and Media campaigns.
      </div>
      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        {["Ko-fi Supporters", "Grant Contacts", "Individual Donors", "Corporate Partners"].map(label => (
          <span key={label} style={{ padding: "0.3rem 0.75rem", background: "rgba(212,175,55,0.07)", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.72rem" }}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignSequencer() {
  const { user, loading: authLoading } = useAuth();
  const [activeCampaign, setActiveCampaign] = useState<"school" | "media" | "donor">("school");
  const [mediaSentNums] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: schoolContacts, isLoading: schoolLoading } = trpc.schoolContacts.list.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { refetch: fetchExport } = trpc.campaigns.exportObsidian.useQuery(undefined, {
    enabled: false,
  });

  async function handleExportObsidian() {
    setExporting(true);
    try {
      const result = await fetchExport();
      if (result.data) {
        const blob = new Blob([result.data.markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Campaign data exported — open in Obsidian");
      }
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setExporting(false);
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--vault-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--vault-muted)", fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--vault-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", marginBottom: "1rem" }}>Admin Access Required</div>
          <a href={getLoginUrl()} style={{ color: "var(--vault-gold)", textDecoration: "underline", fontSize: "0.85rem" }}>Sign in</a>
        </div>
      </div>
    );
  }

  const campaigns = [
    { id: "school" as const, label: "School Fellowship", count: schoolContacts?.length ?? 0, activeCount: (schoolContacts ?? []).filter((sc: SchoolContact) => sc.status !== "not_sent").length },
    { id: "media" as const, label: "Media Outreach", count: MEDIA_CONTACTS.length, activeCount: mediaSentNums.size },
    { id: "donor" as const, label: "Donor Outreach", count: 0, activeCount: 0 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--vault-bg)", color: "var(--vault-text)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--vault-border)", background: "var(--vault-surface)", padding: "0 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <a href="/admin" style={{ color: "var(--vault-muted)", fontSize: "0.75rem", textDecoration: "none", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>← Admin</a>
            <span style={{ color: "var(--vault-border)" }}>|</span>
            <span style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.9rem", letterSpacing: "0.05em" }}>Campaign Sequencer</span>
          </div>
          <button
            onClick={handleExportObsidian}
            disabled={exporting}
            style={{
              background: exporting ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.4)",
              color: "var(--vault-gold)",
              borderRadius: "5px",
              padding: "0.4rem 0.9rem",
              fontSize: "0.75rem",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.04em",
              cursor: exporting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              opacity: exporting ? 0.7 : 1,
              transition: "background 0.2s",
            }}
          >
            {exporting ? "Exporting…" : "⬇ Export to Obsidian"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Campaign selector */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCampaign(c.id)}
              style={{
                padding: "0.65rem 1.25rem",
                background: activeCampaign === c.id ? "rgba(212,175,55,0.12)" : "var(--vault-surface)",
                border: `1px solid ${activeCampaign === c.id ? "var(--vault-gold)" : "var(--vault-border)"}`,
                color: activeCampaign === c.id ? "var(--vault-gold)" : "var(--vault-muted)",
                borderRadius: "6px",
                fontFamily: "Cinzel, serif",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.03em",
              }}>
              <span style={{ fontWeight: 700 }}>{c.label}</span>
              {c.count > 0 && (
                <span style={{ marginLeft: "0.6rem", fontSize: "0.72rem", opacity: 0.8 }}>
                  {c.activeCount}/{c.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Campaign board */}
        <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "8px", padding: "1.5rem" }}>
          {activeCampaign === "school" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>School Fellowship Campaign</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
                  Recruiting student volunteers through Manila school principals — 3-step sequence: Initial Email → 7-day Follow-up → Response Logging.
                  {schoolLoading && " Loading…"}
                </p>
              </div>
              <SchoolCampaignBoard contacts={(schoolContacts ?? []) as SchoolContact[]} />
            </>
          )}
          {activeCampaign === "media" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Media Outreach Campaign</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>
                  Sending the Seeds of Fire press release to 10 priority media contacts and institutions. Status tracked in the Outreach tab.
                </p>
              </div>
              <MediaCampaignBoard sentNums={mediaSentNums} />
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(212,175,55,0.05)", border: "1px solid var(--vault-border)", borderRadius: "4px" }}>
                <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}>
                  Tip: To update sent status for media contacts, use the <a href="/admin" style={{ color: "var(--vault-gold)", textDecoration: "underline" }}>Admin → Outreach tab</a>. The board above will sync automatically.
                </span>
              </div>
            </>
          )}
          {activeCampaign === "donor" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Donor Outreach Campaign</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>Track Ko-fi supporters, grant applications, and individual donor follow-up sequences.</p>
              </div>
              <DonorCampaignBoard />
            </>
          )}
        </div>

        {/* Today's Action Queue */}
        <div style={{ marginTop: "1.5rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "8px", padding: "1.5rem" }}>
          <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.9rem", margin: "0 0 1rem" }}>Today's Action Queue</h3>
          {schoolLoading ? (
            <div style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>Loading…</div>
          ) : (() => {
            const now = new Date();
            const overdueFollowUps = (schoolContacts ?? [] as SchoolContact[]).filter((sc: SchoolContact) => {
              if (sc.status !== "sent" || sc.followUpSent) return false;
              if (!sc.followUpDate) return false;
              return new Date(sc.followUpDate as string) <= now;
            });
            const dueSoon = (schoolContacts ?? [] as SchoolContact[]).filter((sc: SchoolContact) => {
              if (sc.status !== "sent" || sc.followUpSent) return false;
              if (!sc.followUpDate) return false;
              const due = new Date(sc.followUpDate as string);
              const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diff > 0 && diff <= 2;
            });
            const noFollowUpSet = (schoolContacts ?? [] as SchoolContact[]).filter((sc: SchoolContact) => sc.status === "sent" && !sc.followUpDate && !sc.followUpSent);

            if (overdueFollowUps.length === 0 && dueSoon.length === 0 && noFollowUpSet.length === 0) {
              return <div style={{ color: "#22c55e", fontSize: "0.82rem" }}>✓ No immediate actions needed. All follow-ups are on track.</div>;
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {overdueFollowUps.map((sc: SchoolContact) => (
                  <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.85rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "5px" }}>
                    <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>⚠</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "var(--vault-text)", fontSize: "0.8rem", fontWeight: 600 }}>{sc.principalName}</span>
                      <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}> — {sc.schoolName}</span>
                    </div>
                    <span style={{ color: "#ef4444", fontSize: "0.72rem", fontWeight: 700 }}>OVERDUE FOLLOW-UP</span>
                    <a href="/admin" style={{ color: "#ef4444", fontSize: "0.72rem", textDecoration: "underline" }}>Send now →</a>
                  </div>
                ))}
                {dueSoon.map((sc: SchoolContact) => (
                  <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.85rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "5px" }}>
                    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>⏰</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "var(--vault-text)", fontSize: "0.8rem", fontWeight: 600 }}>{sc.principalName}</span>
                      <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}> — {sc.schoolName}</span>
                    </div>
                    <span style={{ color: "#f59e0b", fontSize: "0.72rem" }}>
                      Due {new Date(sc.followUpDate as string).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                    <a href="/admin" style={{ color: "#f59e0b", fontSize: "0.72rem", textDecoration: "underline" }}>Send →</a>
                  </div>
                ))}
                {noFollowUpSet.map((sc: SchoolContact) => (
                  <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.85rem", background: "rgba(148,163,184,0.06)", border: "1px solid var(--vault-border)", borderRadius: "5px" }}>
                    <span style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>○</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "var(--vault-text)", fontSize: "0.8rem", fontWeight: 600 }}>{sc.principalName}</span>
                      <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}> — {sc.schoolName}</span>
                    </div>
                    <span style={{ color: "var(--vault-muted)", fontSize: "0.72rem" }}>No follow-up date set</span>
                    <a href="/admin" style={{ color: "var(--vault-gold)", fontSize: "0.72rem", textDecoration: "underline" }}>Set date →</a>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
