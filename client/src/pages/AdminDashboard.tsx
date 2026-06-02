import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { toast } from "sonner";
import OutreachSummaryWidget from "../components/OutreachSummaryWidget";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Application {
  id: number;
  displayName: string;
  email: string;
  profileUrl?: string | null;
  organization?: string | null;
  orgRole?: string | null;
  orgWebsite?: string | null;
  priorWork?: any;
  investigationProject: string;
  geographicFocus: string;
  outputType: string;
  supportLink?: string | null;
  agreesToCredit: number;
  underThreats?: string | null;
  useOpSec: number;
  opSecTools?: string | null;
  previouslyDoxxed?: string | null;
  emergencyContact?: string | null;
  consentSafetyOutreach: number;
  referralSource?: string | null;
  willShareRawData: number;
  agreesToTerms: number;
  agreesToPrivacy: number;
  status: string;
  aiScore?: number | null;
  aiScoreIdentity?: number | null;
  aiScoreOrganization?: number | null;
  aiScorePurpose?: number | null;
  aiScoreSupport?: number | null;
  aiScoreRisk?: number | null;
  aiRationale?: string | null;
  aiRecommendation?: string | null;
  adminNotes?: string | null;
  assignedRole?: string | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  lastEmailId?: string | null;
  lastEmailType?: string | null;
  lastEmailSentAt?: Date | null;
  emailOpenedAt?: Date | null;
  createdAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span style={{ color: "var(--vault-muted)", fontSize: "12px" }}>Pending</span>;
  const color = score >= 7 ? "#27ae60" : score >= 4 ? "#e67e22" : "#c0392b";
  const label = score >= 7 ? "Approve" : score >= 4 ? "Review" : "Reject";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold"
      style={{ background: `${color}20`, color, borderRadius: "3px", border: `1px solid ${color}40` }}
    >
      {score}/10 — {label}
    </span>
  );
}

function EmailOpenBadge({ app }: { app: Application }) {
  if (!app.lastEmailType) {
    return <span style={{ color: "var(--vault-muted)", fontSize: "11px" }}>—</span>;
  }
  const typeLabel: Record<string, string> = {
    approved: "Approval",
    rejected: "Rejection",
    needs_info: "Info Req",
    confirmation: "Confirm",
    reengagement: "Re-engage",
  };
  const label = typeLabel[app.lastEmailType] ?? app.lastEmailType;
  if (app.emailOpenedAt) {
    return (
      <span
        title={`Opened: ${new Date(app.emailOpenedAt).toLocaleString()}`}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
        style={{ background: "#27ae6020", color: "#27ae60", borderRadius: "3px", border: "1px solid #27ae6040" }}
      >
        ✉ {label} — Opened
      </span>
    );
  }
  return (
    <span
      title={app.lastEmailSentAt ? `Sent: ${new Date(app.lastEmailSentAt).toLocaleString()}` : "Sent"}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
      style={{ background: "#7a706020", color: "var(--vault-muted)", borderRadius: "3px", border: "1px solid var(--vault-border)" }}
    >
      ✉ {label} — Sent
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "#7a7060", label: "Pending" },
    approved: { color: "#27ae60", label: "Approved" },
    rejected: { color: "#c0392b", label: "Rejected" },
    needs_info: { color: "#e67e22", label: "Needs Info" },
    user_downgraded: { color: "#94a3b8", label: "Downgraded" },
  };
  const s = map[status] ?? { color: "#7a7060", label: status };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs"
      style={{ background: `${s.color}20`, color: s.color, borderRadius: "3px", border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  );
}

function ScoreBar({ label, score }: { label: string; score: number | null | undefined }) {
  const val = score ?? 0;
  const color = val >= 2 ? "#27ae60" : val >= 1 ? "#e67e22" : "#c0392b";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-36 flex-shrink-0" style={{ color: "var(--vault-muted)" }}>{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-5 h-5 flex items-center justify-center text-xs font-bold"
            style={{
              background: i <= val ? color : "var(--vault-border)",
              color: i <= val ? "#050505" : "var(--vault-muted)",
              borderRadius: "2px",
            }}
          >
            {i}
          </div>
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {val}/2
      </span>
    </div>
  );
}

// ─── Application Detail Modal ─────────────────────────────────────────────────

function ApplicationModal({
  app,
  onClose,
  onRefresh,
}: {
  app: Application;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(app.adminNotes ?? "");
  const [assignedRole, setAssignedRole] = useState(app.assignedRole ?? "");
  const [infoMessage, setInfoMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "safety" | "scoring">("overview");

  const utils = trpc.useUtils();

  const updateStatus = trpc.vetting.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Application updated");
      utils.vetting.list.invalidate();
      onRefresh();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateNotes = trpc.vetting.updateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved"),
    onError: (err) => toast.error(err.message),
  });

  const rescore = trpc.vetting.rescore.useMutation({
    onSuccess: () => {
      toast.success("Re-scored successfully");
      utils.vetting.list.invalidate();
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteApp = trpc.vetting.delete.useMutation({
    onSuccess: () => {
      toast.success("Application deleted");
      utils.vetting.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const priorWork = Array.isArray(app.priorWork)
    ? app.priorWork
    : typeof app.priorWork === "string"
    ? JSON.parse(app.priorWork || "[]")
    : [];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Investigation" },
    { id: "safety", label: "Safety" },
    { id: "scoring", label: "AI Score" },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--vault-surface)",
          border: "1px solid var(--vault-border)",
          borderRadius: "6px",
        }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "var(--vault-surface)", borderColor: "var(--vault-border)" }}
        >
          <div>
            <h2
              className="text-base tracking-wide"
              style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
            >
              {app.displayName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--vault-muted)" }}>
              {app.email} &nbsp;·&nbsp; #{app.id} &nbsp;·&nbsp;{" "}
              {new Date(app.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={app.status} />
            <ScoreBadge score={app.aiScore} />
            <EmailOpenBadge app={app} />
            <button
              onClick={onClose}
              className="text-xl leading-none"
              style={{ color: "var(--vault-muted)" }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--vault-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-3 text-xs tracking-wider uppercase transition-colors"
              style={{
                fontFamily: "Cinzel, serif",
                color: activeTab === tab.id ? "var(--vault-gold)" : "var(--vault-muted)",
                borderBottom: activeTab === tab.id ? "2px solid var(--vault-gold)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Organization" value={app.organization} />
                <Field label="Role" value={app.orgRole} />
                <Field label="Geographic Focus" value={app.geographicFocus} />
                <Field label="Output Type" value={app.outputType} />
                <Field label="Referral Source" value={app.referralSource} />
                <Field label="Support Link" value={app.supportLink} isLink />
              </div>

              {app.profileUrl && (
                <Field label="Profile URL" value={app.profileUrl} isLink />
              )}

              {priorWork.length > 0 && (
                <div>
                  <p className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                    Prior Work
                  </p>
                  <div className="space-y-2">
                    {priorWork.map((pw: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span style={{ color: "var(--vault-text)" }}>{pw.title || "Untitled"}</span>
                        {pw.url && (
                          <a
                            href={pw.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs"
                            style={{ color: "var(--vault-gold)" }}
                          >
                            → Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-xs" style={{ color: "var(--vault-muted)" }}>
                <span>Credits: {app.agreesToCredit ? "✓ Agreed" : "✗ No"}</span>
                <span>Data Share: {app.willShareRawData ? "✓ Willing" : "✗ No"}</span>
              </div>
            </div>
          )}

          {/* Investigation Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                  Investigation Description
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--vault-text)", fontFamily: "EB Garamond, serif", fontSize: "16px" }}>
                  {app.investigationProject}
                </p>
              </div>
            </div>
          )}

          {/* Safety Tab */}
          {activeTab === "safety" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Under Threats" value={app.underThreats} />
                <Field label="Previously Doxxed" value={app.previouslyDoxxed} />
                <Field label="Uses OpSec" value={app.useOpSec ? "Yes" : "No"} />
                <Field label="Safety Outreach Consent" value={app.consentSafetyOutreach ? "Yes" : "No"} />
              </div>
              {app.opSecTools && <Field label="OpSec Tools" value={app.opSecTools} />}
              {app.emergencyContact && (
                <div
                  className="p-3 border text-sm"
                  style={{ borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.05)", borderRadius: "3px" }}
                >
                  <p className="text-xs tracking-wider uppercase mb-1" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                    Emergency Contact (Confidential)
                  </p>
                  <p style={{ color: "var(--vault-text)" }}>{app.emergencyContact}</p>
                </div>
              )}
            </div>
          )}

          {/* AI Scoring Tab */}
          {activeTab === "scoring" && (
            <div className="space-y-5">
              {app.aiScore != null ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs tracking-wider uppercase mb-1" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                        Total AI Score
                      </p>
                      <ScoreBadge score={app.aiScore} />
                    </div>
                    <button
                      onClick={() => rescore.mutate({ id: app.id })}
                      disabled={rescore.isPending}
                      className="text-xs px-3 py-2 border transition-colors"
                      style={{ borderColor: "var(--vault-border)", color: "var(--vault-muted)", borderRadius: "3px" }}
                    >
                      {rescore.isPending ? "Scoring..." : "Re-score"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <ScoreBar label="Identity & Email" score={app.aiScoreIdentity} />
                    <ScoreBar label="Organization" score={app.aiScoreOrganization} />
                    <ScoreBar label="Purpose & Use" score={app.aiScorePurpose} />
                    <ScoreBar label="Support/Reciprocity" score={app.aiScoreSupport} />
                    <ScoreBar label="Risk / Red Flags" score={app.aiScoreRisk} />
                  </div>

                  {app.aiRecommendation && (
                    <div>
                      <p className="text-xs tracking-wider uppercase mb-1" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                        AI Recommendation
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "var(--vault-text)" }}>
                        {app.aiRecommendation}
                      </p>
                    </div>
                  )}

                  {app.aiRationale && (
                    <div>
                      <p className="text-xs tracking-wider uppercase mb-1" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
                        AI Rationale
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--vault-muted)" }}>
                        {app.aiRationale}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm mb-4" style={{ color: "var(--vault-muted)" }}>
                    AI scoring is pending or not yet completed.
                  </p>
                  <button
                    onClick={() => rescore.mutate({ id: app.id })}
                    disabled={rescore.isPending}
                    className="px-5 py-2.5 text-xs tracking-wider uppercase"
                    style={{
                      background: "var(--vault-gold)",
                      color: "#050505",
                      fontFamily: "Cinzel, serif",
                      borderRadius: "3px",
                    }}
                  >
                    {rescore.isPending ? "Scoring..." : "Run AI Score"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin Notes */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--vault-border)" }}>
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
              Admin Notes
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this application..."
              className="w-full px-3 py-2 text-sm resize-y"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--vault-border)",
                borderRadius: "3px",
                color: "var(--vault-text)",
                outline: "none",
              }}
            />
            <button
              onClick={() => updateNotes.mutate({ id: app.id, adminNotes })}
              disabled={updateNotes.isPending}
              className="mt-2 text-xs px-3 py-1.5 border transition-colors"
              style={{ borderColor: "var(--vault-border)", color: "var(--vault-muted)", borderRadius: "3px" }}
            >
              Save Notes
            </button>
          </div>

          {/* Role assignment */}
          <div className="mt-4">
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
              Assign Role (on approval)
            </p>
            <select
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{
                background: "rgba(0,0,0,0.85)",
                border: "1px solid var(--vault-border)",
                borderRadius: "3px",
                color: assignedRole ? "var(--vault-text)" : "var(--vault-muted)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>Select a role...</option>
              <option value="custodian">Custodian — Full database management &amp; moderation</option>
              <option value="researcher">Researcher — Read &amp; contribute to case records</option>
              <option value="user">User — Read-only access to the database</option>
            </select>
            <p className="mt-1.5 text-xs" style={{ color: "var(--vault-muted)" }}>
              {assignedRole === "custodian" && "Custodians can manage cases, review tips, and moderate content."}
              {assignedRole === "researcher" && "Researchers can read all records and submit case evidence."}
              {assignedRole === "user" && "Users have read-only access to the Vault database."}
            </p>
          </div>

          {/* Public Records Scan */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--vault-border)" }}>
            <p className="text-xs tracking-wider uppercase mb-3" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
              Public Records Scan
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                {
                  label: "DOJ PACER",
                  title: "Search federal court records on PACER",
                  url: `https://pcl.uscourts.gov/pcl/pages/search/findParty.jsf`,
                  icon: "⚖",
                  color: "#c0392b",
                },
                {
                  label: "Google (Name)",
                  title: "Google search for applicant name",
                  url: `https://www.google.com/search?q=${encodeURIComponent(`"${app.displayName}"`)}&tbs=qdr:y`,
                  icon: "🔍",
                  color: "#4285f4",
                },
                {
                  label: "Google (Org)",
                  title: "Google search for organization",
                  url: app.organization
                    ? `https://www.google.com/search?q=${encodeURIComponent(`"${app.organization}"`)}&tbs=qdr:y`
                    : null,
                  icon: "🏢",
                  color: "#4285f4",
                },
                {
                  label: "LinkedIn",
                  title: "Search LinkedIn for applicant",
                  url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(app.displayName)}`,
                  icon: "in",
                  color: "#0077b5",
                },
                {
                  label: "OpenCorporates",
                  title: "Search OpenCorporates for organization",
                  url: app.organization
                    ? `https://opencorporates.com/companies?q=${encodeURIComponent(app.organization)}&action=go`
                    : null,
                  icon: "🏛",
                  color: "#e67e22",
                },
                {
                  label: "ICIJ Offshore",
                  title: "Search ICIJ Offshore Leaks database",
                  url: `https://offshoreleaks.icij.org/search?q=${encodeURIComponent(app.displayName)}&e=&c=&j=`,
                  icon: "💰",
                  color: "#8e44ad",
                },
                {
                  label: "WHOIS (Site)",
                  title: "WHOIS lookup for organization website",
                  url: app.orgWebsite
                    ? `https://www.whois.com/whois/${encodeURIComponent(app.orgWebsite.replace(/https?:\/\//, "").split("/")[0])}`
                    : null,
                  icon: "🌐",
                  color: "#27ae60",
                },
                {
                  label: "Twitter/X",
                  title: "Search X/Twitter for applicant",
                  url: `https://x.com/search?q=${encodeURIComponent(`"${app.displayName}"`)}&f=user`,
                  icon: "𝕏",
                  color: "#1da1f2",
                },
              ] as { label: string; title: string; url: string | null; icon: string; color: string }[]).map((scan) =>
                scan.url ? (
                  <a
                    key={scan.label}
                    href={scan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={scan.title}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase transition-opacity hover:opacity-80"
                    style={{
                      background: `${scan.color}18`,
                      border: `1px solid ${scan.color}50`,
                      color: scan.color,
                      borderRadius: "3px",
                      fontFamily: "Cinzel, serif",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>{scan.icon}</span>
                    {scan.label}
                  </a>
                ) : (
                  <span
                    key={scan.label}
                    title={`${scan.title} — no data available`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase opacity-30 cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--vault-border)",
                      color: "var(--vault-muted)",
                      borderRadius: "3px",
                      fontFamily: "Cinzel, serif",
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>{scan.icon}</span>
                    {scan.label}
                  </span>
                )
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--vault-muted)", opacity: 0.6 }}>
              Grayed-out buttons require organization or website data from the applicant.
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() =>
                updateStatus.mutate({
                  id: app.id,
                  status: "approved",
                  adminNotes,
                  assignedRole,
                })
              }
              disabled={updateStatus.isPending}
              className="flex-1 py-2.5 text-xs tracking-wider uppercase font-semibold"
              style={{
                background: "#27ae60",
                color: "#fff",
                fontFamily: "Cinzel, serif",
                borderRadius: "3px",
                minWidth: "100px",
              }}
            >
              Approve
            </button>
            <button
              onClick={() =>
                updateStatus.mutate({
                  id: app.id,
                  status: "needs_info",
                  adminNotes,
                  infoMessage,
                })
              }
              disabled={updateStatus.isPending}
              className="flex-1 py-2.5 text-xs tracking-wider uppercase font-semibold"
              style={{
                background: "#e67e22",
                color: "#fff",
                fontFamily: "Cinzel, serif",
                borderRadius: "3px",
                minWidth: "100px",
              }}
            >
              Needs Info
            </button>
            <button
              onClick={() =>
                updateStatus.mutate({
                  id: app.id,
                  status: "rejected",
                  adminNotes,
                })
              }
              disabled={updateStatus.isPending}
              className="flex-1 py-2.5 text-xs tracking-wider uppercase font-semibold"
              style={{
                background: "#c0392b",
                color: "#fff",
                fontFamily: "Cinzel, serif",
                borderRadius: "3px",
                minWidth: "100px",
              }}
            >
              Reject
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this application permanently?")) {
                  deleteApp.mutate({ id: app.id });
                }
              }}
              disabled={deleteApp.isPending}
              className="py-2.5 px-4 text-xs tracking-wider uppercase"
              style={{
                border: "1px solid rgba(192,57,43,0.4)",
                color: "#c0392b",
                fontFamily: "Cinzel, serif",
                borderRadius: "3px",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  isLink,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  return (
    <div>
      <p className="text-xs tracking-wider uppercase mb-1" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
        {label}
      </p>
      {value ? (
        isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
            style={{ color: "var(--vault-gold-light)" }}
          >
            {value}
          </a>
        ) : (
          <p className="text-sm" style={{ color: "var(--vault-text)" }}>{value}</p>
        )
      ) : (
        <p className="text-sm" style={{ color: "var(--vault-muted)" }}>—</p>
      )}
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const DEFAULT_INVITE_MESSAGE =
    "You have been personally selected to apply for access to The Vault — a secure, vetted investigative database documenting poverty fraud cases from 1970 to present. This invitation is confidential. Please do not share it. Click the link below to submit your application.";
  const [message, setMessage] = useState(DEFAULT_INVITE_MESSAGE);

  // Parse and add emails from the input field
  const addEmails = () => {
    const parsed = emailInput
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@") && !emails.includes(e));
    if (parsed.length > 0) {
      setEmails((prev) => [...prev, ...parsed]);
      setEmailInput("");
    }
  };

  const removeEmail = (addr: string) => setEmails((prev) => prev.filter((e) => e !== addr));

  const sendInvite = trpc.vetting.sendInvitation.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} invitation${data.count === 1 ? "" : "s"} sent successfully`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md p-6"
        style={{
          background: "var(--vault-surface)",
          border: "1px solid var(--vault-border)",
          borderRadius: "6px",
        }}
      >
        <h3
          className="text-base tracking-wide mb-5"
          style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
        >
          Send Application Invitation
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-wider uppercase mb-1.5" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
              Email Addresses <span style={{ color: "#e74c3c" }}>*</span>
              <span style={{ color: "var(--vault-muted)", fontSize: "11px", textTransform: "none", letterSpacing: "0", marginLeft: "6px" }}>(separate multiple with comma or Enter)</span>
            </label>
            {/* Email tags */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {emails.map((addr) => (
                  <span
                    key={addr}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs"
                    style={{ background: "rgba(229,201,126,0.15)", border: "1px solid var(--vault-gold)", borderRadius: "3px", color: "var(--vault-gold)" }}
                  >
                    {addr}
                    <button
                      type="button"
                      onClick={() => removeEmail(addr)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vault-muted)", lineHeight: 1, padding: 0, marginLeft: "2px" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addEmails();
                }
              }}
              onBlur={addEmails}
              placeholder={emails.length === 0 ? "reporter@nytimes.com, jane@propublica.org" : "Add another email..."}
              className="w-full px-3 py-2.5 text-sm"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--vault-border)",
                borderRadius: "3px",
                color: "var(--vault-text)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider uppercase mb-1.5" style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}>
              Personal Message <span style={{ color: "var(--vault-muted)", fontSize: "11px", textTransform: "none", letterSpacing: "0" }}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to the invitation email..."
              rows={5}
              className="w-full px-3 py-2.5 text-sm resize-y"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--vault-border)",
                borderRadius: "3px",
                color: "var(--vault-text)",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setMessage(DEFAULT_INVITE_MESSAGE)}
              className="mt-1 text-xs"
              style={{ color: "var(--vault-muted)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Reset to default
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              const allEmails = [...emails];
              // Also add anything still typed in the input box
              const extra = emailInput.split(/[,;\n]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@") && !allEmails.includes(e));
              const finalEmails = [...allEmails, ...extra];
              if (finalEmails.length === 0) return;
              sendInvite.mutate({
                emails: finalEmails,
                personalMessage: message || undefined,
                origin: window.location.origin,
              });
            }}
            disabled={(emails.length === 0 && !emailInput.includes("@")) || sendInvite.isPending}
            className="flex-1 py-2.5 text-xs tracking-wider uppercase font-semibold disabled:opacity-50"
            style={{
              background: "var(--vault-gold)",
              color: "#050505",
              fontFamily: "Cinzel, serif",
              borderRadius: "3px",
            }}
          >
            {sendInvite.isPending ? "Sending..." : "Send Invitation"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs tracking-wider uppercase border"
            style={{
              borderColor: "var(--vault-border)",
              color: "var(--vault-muted)",
              fontFamily: "Cinzel, serif",
              borderRadius: "3px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// // ─── DepEd School Search Box ──────────────────────────────────────────────

interface DepEdSchoolResult {
  id: string;
  name: string;
  principal: string;
  principalTitle: string;
  district: string;
  city: string;
  address: string;
  phone: string;
  email: string;
}

function SchoolSearchBox({ onSelect }: { onSelect: (school: DepEdSchoolResult) => void }) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: results, isFetching } = trpc.outreach.searchSchools.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  return (
    <div style={{ position: "relative", marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search by school name, principal, or district…"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          style={{ flex: 1, padding: "0.45rem 0.7rem", background: "var(--vault-surface)", border: "1px solid var(--vault-gold)", color: "var(--vault-text)", borderRadius: "4px", fontSize: "0.82rem", outline: "none" }}
        />
        {isFetching && <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}>Searching…</span>}
        {query && <button onClick={() => { setQuery(""); setShowResults(false); }} style={{ background: "none", border: "none", color: "var(--vault-muted)", cursor: "pointer", fontSize: "1rem", padding: "0 0.25rem" }}>×</button>}
      </div>
      {showResults && query.length >= 2 && results && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "4px", marginTop: "2px", maxHeight: "260px", overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
          {results.map((school: DepEdSchoolResult) => (
            <button
              key={school.id}
              onClick={() => { onSelect(school); setQuery(""); setShowResults(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.9rem", background: "none", border: "none", borderBottom: "1px solid var(--vault-border)", cursor: "pointer", color: "var(--vault-text)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--vault-gold)" }}>{school.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--vault-muted)", marginTop: "0.15rem" }}>{school.principal} • {school.district}, {school.city}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--vault-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>{school.email}</div>
            </button>
          ))}
        </div>
      )}
      {showResults && query.length >= 2 && results && results.length === 0 && !isFetching && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "4px", marginTop: "2px", padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.8rem" }}>
          No schools found. Add manually below.
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"applications" | "tips" | "volunteers" | "outreach">("applications");
  const [selectedTip, setSelectedTip] = useState<any | null>(null);
  const [tipStatusFilter, setTipStatusFilter] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState<string>("all");
   // Media outreach status — loaded from DB so it persists across page refreshes
  const { data: mediaStatusData, refetch: refetchMediaStatuses } = trpc.outreach.getMediaStatuses.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const mediaStatusMap = Object.fromEntries((mediaStatusData ?? []).map(s => [s.contactNum, s]));
  const updateMediaStatusMutation = trpc.outreach.updateMediaStatus.useMutation({
    onSuccess: () => { refetchMediaStatuses(); },
    onError: (err) => toast.error(err.message),
  });;

  const { data: tips, refetch: refetchTips } = trpc.tips.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateTipMutation = trpc.tips.updateStatus.useMutation({
    onSuccess: () => { refetchTips(); },
  });

  const deleteTipMutation = trpc.tips.delete.useMutation({
    onSuccess: () => { setSelectedTip(null); refetchTips(); },
  });

  const { data: applications, isLoading, refetch } = trpc.vetting.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const { data: activityStats } = trpc.stats.activity.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    refetchInterval: 60_000, // refresh every minute
  });
  const { data: volunteers, refetch: refetchVolunteers } = trpc.volunteer.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const updateVolunteerStatusMutation = trpc.volunteer.updateStatus.useMutation({
    onSuccess: () => { refetchVolunteers(); toast.success("Status updated"); },
  });
  const updateVolunteerHoursMutation = trpc.volunteer.updateHours.useMutation({
    onSuccess: () => { refetchVolunteers(); toast.success("Hours updated"); },
  });
  const generateCertificateMutation = trpc.volunteer.generateCertificate.useMutation({
    onSuccess: (data) => {
      // Open the PDF in a new tab for download
      window.open(data.url, "_blank");
      toast.success("Certificate generated — opening PDF");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendReengagementMutation = trpc.vetting.sendReengagement.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Re-engagement email sent");
    },
    onError: (err) => toast.error(err.message),
  });

  const downgradeToUserMutation = trpc.vetting.downgradeToUser.useMutation({
    onSuccess: () => {
      refetch();
      setConfirmDowngradeId(null);
      toast.success("User downgraded to basic access");
    },
    onError: (err) => toast.error(err.message),
  });

  const [confirmDowngradeId, setConfirmDowngradeId] = useState<number | null>(null);

  // School contacts
  const { data: schoolContactsList, refetch: refetchSchoolContacts } = trpc.schoolContacts.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const addSchoolContactMutation = trpc.schoolContacts.add.useMutation({
    onSuccess: () => { refetchSchoolContacts(); setShowAddSchoolForm(false); setNewSchool({ principalName: "", schoolName: "", district: "", email: "", phone: "", notes: "" }); toast.success("Contact added"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteSchoolContactMutation = trpc.schoolContacts.delete.useMutation({
    onSuccess: () => { refetchSchoolContacts(); toast.success("Contact removed"); },
    onError: (err) => toast.error(err.message),
  });
  const updateSchoolStatusMutation = trpc.schoolContacts.updateStatus.useMutation({
    onSuccess: () => refetchSchoolContacts(),
    onError: (err) => toast.error(err.message),
  });
  const sendFellowshipEmailMutation = trpc.schoolContacts.sendFellowshipEmail.useMutation({
    onSuccess: () => { refetchSchoolContacts(); toast.success("Fellowship email sent via Resend"); },
    onError: (err) => toast.error(err.message),
  });
  const sendPressReleaseMutation = trpc.outreach.sendPressRelease.useMutation({
    onSuccess: () => {
      refetchMediaStatuses();
      setMediaEmailPreview(null);
      toast.success("Press release sent via Resend");
    },
    onError: (err) => toast.error(err.message),
  });
  const [mediaEmailPreview, setMediaEmailPreview] = useState<{
    num: number; name: string; org: string; email: string;
    subject: string; personalNote: string; dayGroup: number; isDSWD?: boolean;
  } | null>(null);
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false);
  const [newSchool, setNewSchool] = useState({ principalName: "", schoolName: "", district: "", email: "", phone: "", notes: "" });

  // Bulk send state
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<Set<number>>(new Set());
  const [skipAlreadySent, setSkipAlreadySent] = useState(true);
  const [bulkLang, setBulkLang] = useState<"en" | "tl">("en");
  const [bulkSendResult, setBulkSendResult] = useState<{
    results: Array<{ id: number; name: string; school: string; email: string; success: boolean; skipped: boolean; error?: string }>;
    sent: number; skipped: number; failed: number;
  } | null>(null);

  const sendBulkFellowshipMutation = trpc.schoolContacts.sendBulkFellowshipEmail.useMutation({
    onSuccess: (data) => {
      refetchSchoolContacts();
      setSelectedSchoolIds(new Set());
      setBulkSendResult(data);
      if (data.failed === 0) {
        toast.success(`Sent ${data.sent} email${data.sent !== 1 ? "s" : ""}${data.skipped > 0 ? `, skipped ${data.skipped} already sent` : ""}`);
      } else {
        toast.error(`${data.failed} email${data.failed !== 1 ? "s" : ""} failed — see results`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Follow-up state ──────────────────────────────────────────────────────
  const [followUpPreviewContact, setFollowUpPreviewContact] = useState<{
    id: number; principalName: string; schoolName: string; email: string;
  } | null>(null);
  const sendFollowUpEmailMutation = trpc.schoolContacts.sendFollowUpEmail.useMutation({
    onSuccess: () => {
      refetchSchoolContacts();
      setFollowUpPreviewContact(null);
      toast.success("Follow-up email sent!");
    },
    onError: (err) => toast.error(err.message),
  });
   const setFollowUpDateMutation = trpc.schoolContacts.setFollowUpDate.useMutation({
    onSuccess: () => { refetchSchoolContacts(); toast.success("Follow-up date set (7 days from today)"); },
    onError: (err) => toast.error(err.message),
  });
  // ── Reply logging state
  const [replyModalContact, setReplyModalContact] = useState<{ id: number; principalName: string; schoolName: string } | null>(null);
  const [replyStatus, setReplyStatus] = useState<"responded" | "no_reply" | "meeting">("responded");
  const [replyNotesText, setReplyNotesText] = useState("");
  const logReplyMutation = trpc.schoolContacts.logReply.useMutation({
    onSuccess: () => {
      refetchSchoolContacts();
      setReplyModalContact(null);
      setReplyNotesText("");
      toast.success("Reply logged");
    },
    onError: (err) => toast.error(err.message),
  });
  // ── Final Nudge state
  const [finalNudgeContact, setFinalNudgeContact] = useState<{ id: number; principalName: string; schoolName: string; email: string } | null>(null);
  const sendFinalNudgeMutation = trpc.schoolContacts.sendFinalNudge.useMutation({
    onSuccess: () => {
      refetchSchoolContacts();
      setFinalNudgeContact(null);
      toast.success("Final nudge email sent!");
    },
    onError: (err) => toast.error(err.message),
  });
  // ── Internal notes state
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editingNotesText, setEditingNotesText] = useState("");
  const updateNotesMutation = trpc.schoolContacts.updateNotes.useMutation({
    onSuccess: () => {
      refetchSchoolContacts();
      setEditingNotesId(null);
      toast.success("Notes saved");
    },
    onError: (err) => toast.error(err.message),
  });
  function getFollowUpBadge(sc: { followUpDate?: Date | string | null; followUpSent?: boolean | null }) {
    if (sc.followUpSent) return { label: "✓ Follow-up Sent", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "#22c55e" };
    if (!sc.followUpDate) return null;
    const now = new Date();
    const due = new Date(sc.followUpDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: "⚠ Overdue", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "#ef4444" };
    if (diffDays <= 2) return { label: `Due in ${diffDays}d`, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b" };
    return { label: `Follow-up ${due.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "#475569" };
  }

  const toggleSchoolSelect = (id: number) => {
    setSelectedSchoolIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const all = schoolContactsList ?? [];
    if (selectedSchoolIds.size === all.length) {
      setSelectedSchoolIds(new Set());
    } else {
      setSelectedSchoolIds(new Set(all.map(sc => sc.id)));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--vault-black)" }}>
        <div className="text-sm" style={{ color: "var(--vault-muted)" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--vault-black)" }}>
        <h2
          className="text-xl mb-4 tracking-wide"
          style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
        >
          Admin Access Required
        </h2>
        <a
          href={getLoginUrl()}
          className="px-8 py-3 text-sm tracking-wider uppercase"
          style={{
            background: "var(--vault-gold)",
            color: "#050505",
            fontFamily: "Cinzel, serif",
            borderRadius: "2px",
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--vault-black)" }}>
        <h2
          className="text-xl mb-2 tracking-wide"
          style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
        >
          Access Denied
        </h2>
        <p className="text-sm" style={{ color: "var(--vault-muted)" }}>
          You do not have admin privileges.
        </p>
      </div>
    );
  }

  const apps = (applications as Application[]) ?? [];

  const filtered = apps.filter((app) => {
    const matchStatus = filterStatus === "all" || app.status === filterStatus;
    const matchSearch =
      !searchQuery ||
      app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.organization ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
    needs_info: apps.filter((a) => a.status === "needs_info").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--vault-black)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--vault-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030563274/8pjFw3h3P7WVQwFs3j6pN5/vault-logo_1d096394.png"
              alt="The Vault Investigates"
              className="h-10 w-auto object-contain"
            />
            <span className="text-xs ml-3" style={{ color: "var(--vault-muted)", fontFamily: "Cinzel, serif" }}>
              / Admin Vetting Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInvite(true)}
              className="text-xs px-4 py-2 tracking-wider uppercase"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid var(--vault-gold-dim)",
                color: "var(--vault-gold)",
                fontFamily: "Cinzel, serif",
                borderRadius: "3px",
              }}
            >
              + Invite Applicant
            </button>
            <span className="text-xs" style={{ color: "var(--vault-muted)" }}>
              {user.name}
            </span>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div style={{ borderBottom: "1px solid var(--vault-border)", background: "var(--vault-surface)", overflowX: "auto" }}>
        <div className="max-w-6xl mx-auto px-6" style={{ display: "flex", gap: "0", flexWrap: "wrap", minWidth: "max-content" }}>
          {(["applications", "tips", "volunteers", "outreach"] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontFamily: "Cinzel, serif",
                background: "none",
                border: "none",
                borderBottom: activeView === view ? "2px solid var(--vault-gold)" : "2px solid transparent",
                color: activeView === view ? "var(--vault-gold)" : "var(--vault-muted)",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {view === "applications"
                ? "Vetting Applications"
                : view === "tips"
                ? `Confidential Tips${tips && tips.length > 0 ? ` (${tips.filter((t: any) => t.status === "new").length} new)` : ""}`
                : view === "volunteers"
                ? `Student Volunteers${volunteers && volunteers.length > 0 ? ` (${(volunteers as any[]).filter((v) => v.status === "pending").length} pending)` : ""}`
                : "Media Outreach"}
            </button>
          ))}
          <a
            href="/admin/vlogger-inquiries"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            🔥 Vlogger Inquiries
          </a>
          <a
            href="/admin/contacts-export"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            📋 Contacts Export
          </a>
          <a
            href="/admin/weekly-ops"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            ⚡ Weekly Ops
          </a>
          <a
            href="/admin/focus"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#d4a017")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            🎯 Focus Mode
          </a>
          <a
            href="/admin/campaigns"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            📋 Campaigns
          </a>
          <a
            href="/admin/donors"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            💛 Donors
          </a>
          <a
            href="/admin/creator-scan"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            🔍 Creator Scan
          </a>
          <a
            href="/admin/resources"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Cinzel, serif",
              background: "none",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--vault-muted)",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--vault-gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--vault-muted)")}
          >
            📚 Resources
          </a>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Outreach Campaign Summary Widget — always visible at top of dashboard */}
        <div style={{ marginBottom: "2rem" }}>
          <OutreachSummaryWidget />
        </div>
        {activeView === "tips" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Confidential Tips</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>Admin-only. Never visible to researchers or the public.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["all", "new", "reviewing", "actioned", "closed"].map(s => (
                  <button
                    key={s}
                    onClick={() => setTipStatusFilter(s)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                      background: tipStatusFilter === s ? "rgba(201,168,76,0.15)" : "var(--vault-surface)",
                      border: `1px solid ${tipStatusFilter === s ? "var(--vault-gold-dim)" : "var(--vault-border)"}`,
                      color: tipStatusFilter === s ? "var(--vault-gold)" : "var(--vault-muted)",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
            {!tips || tips.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--vault-muted)", fontSize: "0.875rem", border: "1px solid var(--vault-border)", borderRadius: "4px", background: "var(--vault-surface)" }}>
                No tips received yet. Share the tip form URL with sources.
              </div>
            ) : (
              <div style={{ border: "1px solid var(--vault-border)", borderRadius: "4px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(201,168,76,0.05)", borderBottom: "1px solid var(--vault-border)" }}>
                      {["#", "Category", "Subject", "Pseudonym", "Status", "Priority", "Received", ""].map(h => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tips as any[]).filter((t: any) => tipStatusFilter === "all" || t.status === tipStatusFilter).map((tip: any, i: number) => (
                      <tr
                        key={tip.id}
                        style={{ borderBottom: "1px solid var(--vault-border)", cursor: "pointer", transition: "background 0.15s" }}
                        onClick={() => setSelectedTip(tip)}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "0.75rem 1rem", color: "var(--vault-muted)", fontSize: "0.75rem" }}>{i + 1}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--vault-text)", fontSize: "0.8rem" }}>{tip.category.replace(/_/g, " ")}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--vault-text)", fontSize: "0.85rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tip.subject}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--vault-muted)", fontSize: "0.8rem" }}>{tip.pseudonym || <em>Anonymous</em>}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.7rem", textTransform: "capitalize", background: tip.status === "new" ? "rgba(39,174,96,0.15)" : "rgba(201,168,76,0.1)", color: tip.status === "new" ? "#27ae60" : "var(--vault-gold)" }}>{tip.status}</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "3px", fontSize: "0.7rem", textTransform: "capitalize", background: tip.priority === "high" ? "rgba(192,57,43,0.15)" : "rgba(0,0,0,0.2)", color: tip.priority === "high" ? "#e05252" : "var(--vault-muted)" }}>{tip.priority || "low"}</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--vault-muted)", fontSize: "0.75rem" }}>{new Date(tip.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <button style={{ color: "var(--vault-gold)", border: "1px solid var(--vault-gold-dim)", background: "none", padding: "0.2rem 0.6rem", borderRadius: "2px", fontSize: "0.75rem", cursor: "pointer" }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeView === "applications" && (
        <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { key: "all", label: "Total", color: "var(--vault-gold)" },
            { key: "pending", label: "Pending", color: "var(--vault-muted)" },
            { key: "approved", label: "Approved", color: "#27ae60" },
            { key: "needs_info", label: "Needs Info", color: "#e67e22" },
            { key: "rejected", label: "Rejected", color: "#c0392b" },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilterStatus(stat.key)}
              className="p-4 border text-center transition-colors"
              style={{
                background: filterStatus === stat.key ? "rgba(201,168,76,0.08)" : "var(--vault-surface)",
                borderColor: filterStatus === stat.key ? "var(--vault-gold-dim)" : "var(--vault-border)",
                borderRadius: "4px",
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: stat.color, fontFamily: "Cinzel, serif" }}>
                {counts[stat.key as keyof typeof counts]}
              </div>
              <div className="text-xs tracking-wider uppercase" style={{ color: "var(--vault-muted)", fontFamily: "Cinzel, serif" }}>
                {stat.label}
              </div>
            </button>
          ))}
        </div>

        {/* Activity Summary Panel */}
        {activityStats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Active This Week", value: activityStats.activeThisWeek, color: "#27ae60", hint: "Logged in within 7 days" },
              { label: "Active This Month", value: activityStats.activeThisMonth, color: "#60a5fa", hint: "Logged in within 30 days" },
              { label: "Never Logged In", value: activityStats.neverLoggedIn, color: "#e67e22", hint: "Approved but no account yet" },
              { label: "Inactive 14+ Days", value: activityStats.inactiveOver14Days, color: "#f87171", hint: "Has account, not seen in 2 weeks" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "4px", padding: "0.875rem 1rem" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, fontFamily: "Cinzel, serif", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", marginTop: "0.3rem" }}>{s.label}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--vault-muted)", marginTop: "0.2rem" }}>{s.hint}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or organization..."
            className="w-full max-w-md px-4 py-2.5 text-sm"
            style={{
              background: "var(--vault-surface)",
              border: "1px solid var(--vault-border)",
              borderRadius: "3px",
              color: "var(--vault-text)",
              outline: "none",
            }}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--vault-muted)" }}>Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 border"
            style={{ borderColor: "var(--vault-border)", borderRadius: "4px", background: "var(--vault-surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--vault-muted)" }}>
              {apps.length === 0 ? "No applications yet." : "No applications match your filters."}
            </p>
          </div>
        ) : (
          <div
            className="border overflow-hidden"
            style={{ borderColor: "var(--vault-border)", borderRadius: "4px" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(201,168,76,0.05)", borderBottom: "1px solid var(--vault-border)" }}>
                  {["#", "Applicant", "Organization", "Output", "Score", "Status", "Email", "Last Login", "Date", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs tracking-wider uppercase"
                      style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--vault-border)" : "none",
                    }}
                    onClick={() => setSelectedApp(app)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vault-muted)" }}>
                      {app.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: "var(--vault-text)" }}>
                        {app.displayName}
                      </div>
                      <div className="text-xs" style={{ color: "var(--vault-muted)" }}>
                        {app.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--vault-muted)" }}>
                      {app.organization ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vault-muted)" }}>
                      {app.outputType.split(" ")[0]}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={app.aiScore} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3">
                      <EmailOpenBadge app={app} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vault-muted)", whiteSpace: "nowrap" }}>
                      {(() => {
                        const enriched = activityStats?.applicantsWithLogin?.find((a: any) => a.id === app.id);
                        if (!enriched?.hasAccount) return <span style={{ color: "#e67e22", fontSize: "0.7rem" }}>Never</span>;
                        if (!enriched.lastSignedIn) return <span style={{ color: "var(--vault-muted)" }}>—</span>;
                        const d = new Date(enriched.lastSignedIn);
                        const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
                        const color = daysAgo <= 7 ? "#27ae60" : daysAgo <= 14 ? "#60a5fa" : daysAgo <= 30 ? "#e67e22" : "#f87171";
                        return <span style={{ color }} title={d.toLocaleString()}>{daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--vault-muted)" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="text-xs px-2 py-1"
                          style={{ color: "var(--vault-gold)", border: "1px solid var(--vault-gold-dim)", borderRadius: "2px", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          Review
                        </button>
                        {app.status === "approved" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendReengagementMutation.mutate({ id: app.id });
                              }}
                              disabled={sendReengagementMutation.isPending}
                              title="Send 14-day re-engagement notice"
                              className="text-xs px-2 py-1"
                              style={{ color: "#60a5fa", border: "1px solid rgba(96,165,250,0.35)", borderRadius: "2px", background: "rgba(96,165,250,0.08)", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {sendReengagementMutation.isPending ? "Sending..." : "✉ Re-engage"}
                            </button>
                            {confirmDowngradeId === app.id ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downgradeToUserMutation.mutate({ id: app.id });
                                  }}
                                  disabled={downgradeToUserMutation.isPending}
                                  title="Confirm downgrade to basic user"
                                  className="text-xs px-2 py-1"
                                  style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.5)", borderRadius: "2px", background: "rgba(248,113,113,0.12)", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}
                                >
                                  {downgradeToUserMutation.isPending ? "Downgrading..." : "Confirm"}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDowngradeId(null); }}
                                  className="text-xs px-2 py-1"
                                  style={{ color: "var(--vault-muted)", border: "1px solid var(--vault-border)", borderRadius: "2px", background: "none", cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDowngradeId(app.id);
                                }}
                                title="Downgrade to basic user (removes researcher privileges)"
                                className="text-xs px-2 py-1"
                                style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "2px", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                ↓ Downgrade
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}

        {/* Volunteer Applications View */}
        {activeView === "volunteers" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Student Volunteer Applications</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>Manila High School Program — Certificate of Accomplishment</p>
              </div>
              <a href="/volunteer" target="_blank" style={{ background: "var(--vault-gold)", color: "#050505", padding: "0.5rem 1rem", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", textDecoration: "none" }}>
                View Program Page →
              </a>
            </div>

            {/* Status filter */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {["all", "pending", "approved", "rejected", "needs_info"].map(s => (
                <button
                  key={s}
                  onClick={() => setVolunteerStatusFilter(s)}
                  style={{
                    padding: "0.3rem 0.75rem", fontSize: "0.75rem", borderRadius: "3px", cursor: "pointer",
                    background: volunteerStatusFilter === s ? "rgba(201,168,76,0.15)" : "var(--vault-surface)",
                    border: volunteerStatusFilter === s ? "1px solid var(--vault-gold-dim)" : "1px solid var(--vault-border)",
                    color: volunteerStatusFilter === s ? "var(--vault-gold)" : "var(--vault-muted)",
                    fontFamily: "Cinzel, serif", textTransform: "uppercase" as const, letterSpacing: "0.05em",
                  }}
                >
                  {s === "all" ? `All (${volunteers?.length ?? 0})` : s === "needs_info" ? "Needs Info" : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== "all" && volunteers ? ` (${(volunteers as any[]).filter(v => v.status === s).length})` : ""}
                </button>
              ))}
            </div>

            {!volunteers || volunteers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "var(--vault-muted)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🎓</div>
                <p style={{ fontFamily: "Cinzel, serif" }}>No volunteer applications yet.</p>
                <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Share the program page to start receiving applications.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--vault-border)" }}>
                      {["Name", "School / City", "Role", "Grade", "AI Score", "Status", "Applied", "Actions"].map(h => (
                        <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(volunteers as any[])
                      .filter(v => volunteerStatusFilter === "all" || v.status === volunteerStatusFilter)
                      .map((v: any) => (
                        <tr key={v.id} style={{ borderBottom: "1px solid var(--vault-border)", cursor: "pointer" }} onClick={() => setSelectedVolunteer(v)}>
                          <td style={{ padding: "0.75rem", color: "var(--vault-text)" }}>{v.fullName}</td>
                          <td style={{ padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.8rem" }}>{v.schoolName}<br /><span style={{ fontSize: "0.75rem" }}>{v.city}</span></td>
                          <td style={{ padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.75rem" }}>{v.role.replace(/_/g, " ")}</td>
                          <td style={{ padding: "0.75rem", color: "var(--vault-muted)" }}>{v.gradeLevel}</td>
                          <td style={{ padding: "0.75rem" }}>
                            {v.aiScore != null ? (
                              <span style={{ color: v.aiScore >= 7 ? "#27ae60" : v.aiScore >= 4 ? "#e67e22" : "#c0392b", fontWeight: 600 }}>{v.aiScore}/10</span>
                            ) : <span style={{ color: "var(--vault-muted)" }}>—</span>}
                          </td>
                          <td style={{ padding: "0.75rem" }}><StatusBadge status={v.status} /></td>
                          <td style={{ padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.75rem" }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <select
                                value={v.status}
                                onClick={e => e.stopPropagation()}
                                onChange={e => updateVolunteerStatusMutation.mutate({ id: v.id, status: e.target.value as any })}
                                style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", padding: "0.25rem 0.5rem", borderRadius: "3px", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                                <option value="needs_info">Needs Info</option>
                              </select>
                              {v.status === "approved" && (
                                <button
                                  onClick={e => { e.stopPropagation(); generateCertificateMutation.mutate({ id: v.id }); }}
                                  disabled={generateCertificateMutation.isPending}
                                  title="Generate Certificate of Accomplishment"
                                  style={{ background: "rgba(201,168,76,0.15)", border: "1px solid var(--vault-gold-dim)", color: "var(--vault-gold)", padding: "0.25rem 0.5rem", borderRadius: "3px", fontSize: "0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  {generateCertificateMutation.isPending ? "Generating..." : "📜 Certificate"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === "outreach" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Media Outreach — Top 10 Authorities</h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>Send the press release directly via Resend. Each contact receives a personalized HTML email from <strong style={{ color: "var(--vault-gold)" }}>editor@vet.thevaultinvestigates.cloud</strong>. Status updates automatically after sending.</p>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--vault-border)" }}>
                    {["#", "Name / Organization", "Role", "Email", "Priority", "Last Contacted", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", dayGroup: 1, role: "Senior Research Fellow, Poverty & Statistics", email: "jrgalbert@gmail.com", priority: "Critical", subject: "Independent Investigation into YouTube Monetization of Filipino Poverty — Seeking Your Perspective", personalNote: "Your published work on household vulnerability and poverty measurement in the Philippines is directly relevant to what we have documented. We believe the patterns in Seeds of Fire are consistent with the macro data you have analyzed, and we would value your expert perspective." },
                    { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", dayGroup: 1, role: "Investigative journalism institution", email: "pcij@pcij.org", priority: "Critical", subject: "Seeds of Fire — Independent Investigation into YouTube Monetization of Filipino Poverty | Press Release", personalNote: "PCIJ has long set the standard for investigative journalism in the Philippines. We are reaching out as fellow practitioners who believe this investigation into the monetization of Filipino poverty by foreign content creators deserves the attention of the broader journalism community." },
                    { num: 3, name: "Rappler", org: "Rappler", dayGroup: 2, role: "Independent digital news, Philippines", email: "newsdesk@rappler.com", priority: "High", subject: "Independent Investigation: Foreign YouTubers Monetizing Filipino Poverty Without DSWD Registration", personalNote: "We are an independent investigative outlet documenting how foreign content creators monetize Filipino poverty on YouTube without DSWD registration. We believe this is a story with significant public interest implications." },
                    { num: 4, name: "VERA Files", org: "VERA Files", dayGroup: 2, role: "Nonprofit investigative & fact-checking media", email: "newsroom@verafiles.org", priority: "High", subject: "Press Release — Seeds of Fire: Documenting YouTube Monetization of Filipino Poverty", personalNote: "VERA Files' commitment to fact-based investigative journalism aligns directly with our work. We are documenting a pattern of foreign content creators monetizing Filipino poverty on YouTube and would welcome your attention to this investigation." },
                    { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", dayGroup: 3, role: "Press freedom monitoring, Philippines", email: "staff@cmfr-phil.org", priority: "High", subject: "Press Release — Independent Investigation & Student Fellowship Program | The Vault Investigates", personalNote: "We are launching both an investigation into YouTube exploitation of Filipino poverty and a civic journalism fellowship for Manila students. We believe CMFR's work in press freedom monitoring makes you an important voice for what we are building." },
                    { num: 6, name: "National Union of Journalists (NUJP)", org: "NUJP", dayGroup: 3, role: "Journalist safety & press freedom", email: "secretariat@nujp.org", priority: "High", subject: "Press Release — Secure Tip System & Civic Journalism Fellowship | The Vault Investigates", personalNote: "We have built a hardened source protection platform for Philippine investigative journalism and are launching a student fellowship program. We believe NUJP's mission to protect journalists and support press freedom makes this work directly relevant to your community." },
                    { num: 7, name: "Committee to Protect Journalists", org: "CPJ", dayGroup: 4, role: "International press freedom", email: "press@cpj.org", priority: "Medium", subject: "Press Release — Hardened Source Protection Platform Launched for Philippine Investigative Journalism", personalNote: "We have launched a source protection platform designed specifically for investigative journalism in the Philippines, with encrypted tip submission and vetted researcher access. We believe CPJ's global mandate makes this infrastructure relevant to your documentation of press conditions in Southeast Asia." },
                    { num: 8, name: "Reporters Without Borders", org: "RSF", dayGroup: 4, role: "International press freedom", email: "secretariat@rsf.org", priority: "Medium", subject: "Press Release — Source Protection Platform & Investigation into Media Exploitation of Filipino Poverty", personalNote: "We are an independent investigative outlet that has built source protection infrastructure for Philippine journalism and is documenting the monetization of Filipino poverty by foreign content creators. We believe RSF's press freedom index work makes this investigation and platform relevant to your global monitoring." },
                    { num: 9, name: "DSWD Media Desk", org: "DSWD", dayGroup: 5, isDSWD: true, role: "Philippine government social welfare", email: "inquiry@dswd.gov.ph", priority: "Medium", subject: "Press Release — Investigation into Foreign YouTube Creators Operating Without DSWD Registration", personalNote: "Our investigation has documented foreign content creators operating in Filipino communities and monetizing poverty-related content on YouTube without DSWD registration or social welfare compliance. We are bringing this to your attention as the agency with regulatory oversight of social welfare activities in the Philippines." },
                    { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", dayGroup: 5, isDSWD: false, role: "Major national broadsheet", email: "feedback@inquirer.com.ph", priority: "Medium", subject: "Press Release — Manila Students Earn Investigative Journalism Credentials Through Civic Fellowship Program", personalNote: "We are launching a civic journalism fellowship for Manila high school and university students, offering real investigative research experience, a verified certificate, and mentorship from working journalists. We believe this student program is a story your education and civic affairs desks would find relevant." },
                  ].map((contact) => (
                    <tr key={contact.num}
                      style={{ borderBottom: "1px solid var(--vault-border)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "0.75rem", color: "var(--vault-muted)" }}>{contact.num}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ color: "var(--vault-text)", fontWeight: 600 }}>{contact.name}</div>
                        <div style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}>{contact.org}</div>
                      </td>
                      <td style={{ padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.78rem", maxWidth: "180px" }}>{contact.role}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <a href={`mailto:${contact.email}?subject=${encodeURIComponent(contact.subject)}`}
                          style={{ color: "var(--vault-gold)", fontSize: "0.82rem", textDecoration: "none" }}>
                          {contact.email}
                        </a>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          background: contact.priority === "Critical" ? "rgba(220,38,38,0.15)" : contact.priority === "High" ? "rgba(212,175,55,0.15)" : "rgba(100,100,100,0.15)",
                          color: contact.priority === "Critical" ? "#ef4444" : contact.priority === "High" ? "var(--vault-gold)" : "var(--vault-muted)",
                        }}>{contact.priority}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {mediaStatusMap[contact.num]?.lastContactedAt
                          ? <span style={{ color: "#22c55e", fontSize: "0.78rem", fontWeight: 600 }}>{new Date(mediaStatusMap[contact.num].lastContactedAt!).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                          : <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>Never</span>}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {(() => {
                          const currentStatus = mediaStatusMap[contact.num]?.status ?? "not_sent";
                          return (
                            <select
                              value={currentStatus}
                              onChange={e => updateMediaStatusMutation.mutate({ contactNum: contact.num, status: e.target.value as any })}
                              style={{
                                background: "var(--vault-surface)",
                                border: "1px solid var(--vault-border)",
                                color: currentStatus === "responded" ? "#22c55e" : currentStatus === "sent" ? "var(--vault-gold)" : currentStatus === "no_reply" ? "#ef4444" : currentStatus === "meeting" ? "#a78bfa" : "var(--vault-muted)",
                                borderRadius: "4px",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}>
                              <option value="not_sent">Not Sent</option>
                              <option value="sent">✓ Sent</option>
                              <option value="responded">✓ Responded</option>
                              <option value="no_reply">✗ No Reply</option>
                              <option value="meeting">★ Meeting Set</option>
                            </select>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {(() => {
                          const isSent = mediaStatusMap[contact.num]?.status === "sent";
                          const dayLabels: Record<number, string> = { 1: "Day 1", 2: "Day 2", 3: "Day 3", 4: "Day 4", 5: "Day 5" };
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ fontSize: "0.68rem", color: "#888", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>
                                {dayLabels[contact.dayGroup] ?? ""}
                              </span>
                              <button
                                disabled={isSent || sendPressReleaseMutation.isPending}
                                onClick={() => !isSent && setMediaEmailPreview({
                                  num: contact.num,
                                  name: contact.name,
                                  org: contact.org,
                                  email: contact.email,
                                  subject: contact.subject,
                                  personalNote: contact.personalNote,
                                  dayGroup: contact.dayGroup,
                                  isDSWD: (contact as any).isDSWD,
                                })}
                                style={{
                                  display: "inline-block",
                                  padding: "0.35rem 0.85rem",
                                  background: isSent ? "rgba(34,197,94,0.1)" : "rgba(212,175,55,0.1)",
                                  border: `1px solid ${isSent ? "#22c55e" : "var(--vault-gold)"}`,
                                  color: isSent ? "#22c55e" : "var(--vault-gold)",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  fontFamily: "Cinzel, serif",
                                  letterSpacing: "0.03em",
                                  cursor: isSent ? "default" : "pointer",
                                  opacity: sendPressReleaseMutation.isPending ? 0.6 : 1,
                                }}>
                                {isSent ? "✓ Sent" : sendPressReleaseMutation.isPending ? "Sending..." : "Preview & Send"}
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "rgba(212,175,55,0.05)", border: "1px solid var(--vault-border)", borderRadius: "6px" }}>
              <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em" }}>📋 DAY-BY-DAY SEND GUIDE</span>
                <span style={{ color: "var(--vault-muted)", fontSize: "0.72rem" }}>— Follow this sequence for maximum impact. Wait 24 hrs between days.</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {[
                  { day: "Day 1", contacts: "PIDS + PCIJ", tip: "Lead with your strongest academic + journalism credibility. These two set the tone for the entire campaign.", color: "#ef4444" },
                  { day: "Day 2", contacts: "Rappler + VERA Files", tip: "Digital-first outlets. Keep subject lines short and punchy. Rappler responds to exclusives — mention you are offering first look.", color: "var(--vault-gold)" },
                  { day: "Day 3", contacts: "CMFR + NUJP", tip: "Press freedom angle. Lead with the source protection platform and the fellowship program — both are directly in their mandate.", color: "#a78bfa" },
                  { day: "Day 4", contacts: "CPJ + RSF", tip: "International orgs. Use the global angle — foreign creators exploiting local poverty. Mention the encrypted tip system prominently.", color: "#60a5fa" },
                  { day: "Day 5", contacts: "DSWD + Inquirer", tip: "Government + broadsheet. DSWD: lead with the registration violation angle. Inquirer: pitch the student fellowship as a human interest story.", color: "#22c55e" },
                ].map(d => (
                  <div key={d.day} style={{ padding: "0.75rem", background: "var(--vault-surface)", border: `1px solid ${d.color}33`, borderRadius: "6px", borderLeft: `3px solid ${d.color}` }}>
                    <div style={{ color: d.color, fontFamily: "Cinzel, serif", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.25rem" }}>{d.day}</div>
                    <div style={{ color: "var(--vault-text)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.3rem" }}>{d.contacts}</div>
                    <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", lineHeight: 1.4 }}>{d.tip}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem", marginTop: "0.75rem", marginBottom: 0 }}>
                Emails send directly via Resend from <strong style={{ color: "var(--vault-gold)" }}>editor@vet.thevaultinvestigates.cloud</strong>. Follow up on non-replies after 5 business days.
              </p>
            </div>

            {/* School Outreach Section */}
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", marginBottom: "0.25rem" }}>School Outreach — Manila Principals</h2>
                  <p style={{ color: "var(--vault-muted)", fontSize: "0.8rem" }}>Send the fellowship recruitment email to school principals. Principals receive the student volunteer program overview, not the press release.</p>
                </div>
                <button
                  onClick={() => setShowAddSchoolForm(prev => !prev)}
                  style={{ padding: "0.4rem 1rem", background: "rgba(212,175,55,0.1)", border: "1px solid var(--vault-gold)", color: "var(--vault-gold)", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "Cinzel, serif", cursor: "pointer" }}>
                  {showAddSchoolForm ? "Cancel" : "+ Add Contact"}
                </button>
              </div>

              {showAddSchoolForm && (
                <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(212,175,55,0.04)", border: "1px solid var(--vault-border)", borderRadius: "6px" }}>
                  <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.85rem", marginBottom: "0.75rem" }}>Search DepEd Directory</h3>
                  <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>Search by school name, principal, or district to pre-fill the form below.</p>
                  <SchoolSearchBox onSelect={(school) => setNewSchool({ principalName: school.principal, schoolName: school.name, district: `${school.district}, ${school.city}`, email: school.email, phone: school.phone, notes: `${school.principalTitle} — ${school.address}` })} />
                  <div style={{ borderTop: "1px solid var(--vault-border)", margin: "1rem 0" }} />
                  <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.85rem", marginBottom: "1rem" }}>Add School Contact</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {([
                      { key: "principalName", label: "Principal / Contact Name", required: true },
                      { key: "schoolName", label: "School Name", required: true },
                      { key: "district", label: "District", required: true },
                      { key: "email", label: "Email", required: true },
                      { key: "phone", label: "Phone (optional)", required: false },
                    ] as const).map(field => (
                      <div key={field.key}>
                        <label style={{ display: "block", color: "var(--vault-muted)", fontSize: "0.72rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</label>
                        <input
                          type={field.key === "email" ? "email" : "text"}
                          value={newSchool[field.key]}
                          onChange={e => setNewSchool(prev => ({ ...prev, [field.key]: e.target.value }))}
                          style={{ width: "100%", padding: "0.4rem 0.6rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", borderRadius: "4px", fontSize: "0.82rem" }}
                        />
                      </div>
                    ))}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", color: "var(--vault-muted)", fontSize: "0.72rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes (optional)</label>
                      <textarea
                        value={newSchool.notes}
                        onChange={e => setNewSchool(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        style={{ width: "100%", padding: "0.4rem 0.6rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", borderRadius: "4px", fontSize: "0.82rem", resize: "vertical" }}
                      />
                    </div>
                  </div>
                  <button
                    disabled={addSchoolContactMutation.isPending || !newSchool.principalName || !newSchool.schoolName || !newSchool.district || !newSchool.email}
                    onClick={() => addSchoolContactMutation.mutate(newSchool)}
                    style={{ marginTop: "1rem", padding: "0.4rem 1.2rem", background: "rgba(212,175,55,0.15)", border: "1px solid var(--vault-gold)", color: "var(--vault-gold)", borderRadius: "4px", fontSize: "0.78rem", fontFamily: "Cinzel, serif", cursor: "pointer", opacity: addSchoolContactMutation.isPending ? 0.6 : 1 }}>
                    {addSchoolContactMutation.isPending ? "Saving..." : "Save Contact"}
                  </button>
                </div>
              )}

              {/* Bulk action toolbar — appears when 1+ rows selected */}
              {selectedSchoolIds.size > 0 && (
                <div style={{ marginBottom: "0.75rem", padding: "0.65rem 1rem", background: "rgba(212,175,55,0.08)", border: "1px solid var(--vault-gold-dim)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.8rem", fontWeight: 600 }}>
                    {selectedSchoolIds.size} selected
                  </span>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--vault-muted)", fontSize: "0.75rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={skipAlreadySent}
                      onChange={e => setSkipAlreadySent(e.target.checked)}
                      style={{ accentColor: "var(--vault-gold)", cursor: "pointer" }}
                    />
                    Skip already-sent
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}>Language:</span>
                    <select
                      value={bulkLang}
                      onChange={e => setBulkLang(e.target.value as "en" | "tl")}
                      style={{ background: "var(--vault-black)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", borderRadius: "4px", padding: "0.2rem 0.4rem", fontSize: "0.75rem", cursor: "pointer" }}>
                      <option value="en">English (EN)</option>
                      <option value="tl">Tagalog (TL)</option>
                    </select>
                  </div>
                  <button
                    disabled={sendBulkFellowshipMutation.isPending}
                    onClick={() => {
                      if (!confirm(`Send fellowship email to ${selectedSchoolIds.size} principal${selectedSchoolIds.size !== 1 ? "s" : ""} in ${bulkLang === "en" ? "English" : "Tagalog"}?`)) return;
                      sendBulkFellowshipMutation.mutate({ ids: Array.from(selectedSchoolIds), skipAlreadySent, lang: bulkLang });
                    }}
                    style={{ padding: "0.35rem 1rem", background: "var(--vault-gold)", border: "none", color: "#050505", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "Cinzel, serif", fontWeight: 700, cursor: sendBulkFellowshipMutation.isPending ? "not-allowed" : "pointer", opacity: sendBulkFellowshipMutation.isPending ? 0.6 : 1 }}>
                    {sendBulkFellowshipMutation.isPending ? "Sending…" : `✉ Send to ${selectedSchoolIds.size}`}
                  </button>
                  <button
                    onClick={() => setSelectedSchoolIds(new Set())}
                    style={{ padding: "0.35rem 0.75rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>
                    Clear
                  </button>
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--vault-border)" }}>
                      <th style={{ padding: "0.6rem 0.5rem", width: "36px" }}>
                        <input
                          type="checkbox"
                          title="Select all"
                          checked={(schoolContactsList ?? []).length > 0 && selectedSchoolIds.size === (schoolContactsList ?? []).length}
                          onChange={toggleSelectAll}
                          style={{ accentColor: "var(--vault-gold)", cursor: "pointer", width: "14px", height: "14px" }}
                        />
                      </th>
                      {["Principal / Contact", "School", "District", "Email", "Last Contacted", "Follow-up", "Reply", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(schoolContactsList ?? []).length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "1.5rem", textAlign: "center", color: "var(--vault-muted)", fontSize: "0.8rem" }}>No school contacts yet. Click + Add Contact to add a principal.</td></tr>
                    )}
                    {(schoolContactsList ?? []).map((sc) => (
                      <tr key={sc.id}
                        style={{ borderBottom: "1px solid var(--vault-border)", transition: "background 0.15s", background: selectedSchoolIds.has(sc.id) ? "rgba(212,175,55,0.07)" : "transparent" }}
                        onMouseEnter={e => { if (!selectedSchoolIds.has(sc.id)) e.currentTarget.style.background = "rgba(212,175,55,0.04)"; }}
                        onMouseLeave={e => { if (!selectedSchoolIds.has(sc.id)) e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "0.5rem 0.5rem", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedSchoolIds.has(sc.id)}
                            onChange={() => toggleSchoolSelect(sc.id)}
                            style={{ accentColor: "var(--vault-gold)", cursor: "pointer", width: "14px", height: "14px" }}
                          />
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ color: "var(--vault-text)", fontWeight: 600 }}>{sc.principalName}</div>
                          {sc.notes && <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", marginTop: "0.2rem", maxWidth: "200px" }}>{sc.notes}</div>}
                        </td>
                        <td style={{ padding: "0.75rem", color: "var(--vault-text)" }}>{sc.schoolName}</td>
                        <td style={{ padding: "0.75rem", color: "var(--vault-muted)", fontSize: "0.78rem" }}>{sc.district}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ color: "var(--vault-gold)", fontSize: "0.82rem" }}>{sc.email}</span>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {sc.lastEmailedAt
                            ? <span style={{ color: "#22c55e", fontSize: "0.78rem", fontWeight: 600 }}>{new Date(sc.lastEmailedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                            : <span style={{ color: "var(--vault-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>Never</span>}
                        </td>
                        {/* Follow-up badge column */}
                        <td style={{ padding: "0.75rem", minWidth: "120px" }}>
                          {(() => {
                            const badge = getFollowUpBadge(sc);
                            if (!badge) {
                              return sc.status === "sent" ? (
                                <button
                                  onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 7);
                                    setFollowUpDateMutation.mutate({ id: sc.id, followUpDate: d.toISOString() });
                                  }}
                                  style={{ padding: "0.2rem 0.5rem", background: "rgba(148,163,184,0.08)", border: "1px solid #475569", color: "#94a3b8", borderRadius: "4px", fontSize: "0.68rem", cursor: "pointer" }}
                                  title="Set 7-day follow-up date">
                                  + Set Follow-up
                                </button>
                              ) : <span style={{ color: "var(--vault-muted)", fontSize: "0.72rem" }}>—</span>;
                            }
                            return (
                              <span style={{ display: "inline-block", padding: "0.2rem 0.55rem", background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </td>
                        {/* Reply notes column */}
                        <td style={{ padding: "0.75rem", maxWidth: "160px" }}>
                          {sc.replyNotes ? (
                            <div>
                              <div style={{ color: sc.status === "meeting" ? "#a78bfa" : sc.status === "responded" ? "#22c55e" : "var(--vault-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.2rem" }}>
                                {sc.status === "meeting" ? "★ Meeting" : sc.status === "responded" ? "✓ Replied" : "✗ No Reply"}
                                {sc.replyReceivedAt && <span style={{ color: "var(--vault-muted)", fontWeight: 400, marginLeft: "0.3rem" }}>· {new Date(sc.replyReceivedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>}
                              </div>
                              <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{sc.replyNotes}</div>
                              <button onClick={() => { setReplyModalContact({ id: sc.id, principalName: sc.principalName, schoolName: sc.schoolName }); setReplyStatus(sc.status as any); setReplyNotesText(sc.replyNotes ?? ""); }} style={{ marginTop: "0.25rem", background: "none", border: "none", color: "var(--vault-gold)", fontSize: "0.68rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}>Edit</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setReplyModalContact({ id: sc.id, principalName: sc.principalName, schoolName: sc.schoolName }); setReplyStatus("responded"); setReplyNotesText(""); }}
                              style={{ padding: "0.25rem 0.6rem", background: "rgba(148,163,184,0.08)", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                              + Log Reply
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <select
                            value={sc.status}
                            onChange={e => updateSchoolStatusMutation.mutate({ id: sc.id, status: e.target.value as any })}
                            style={{
                              background: "var(--vault-surface)",
                              border: "1px solid var(--vault-border)",
                              color: sc.status === "responded" ? "#22c55e" : sc.status === "sent" ? "var(--vault-gold)" : sc.status === "no_reply" ? "#ef4444" : sc.status === "meeting" ? "#a78bfa" : "var(--vault-muted)",
                              borderRadius: "4px",
                              padding: "0.3rem 0.5rem",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}>
                            <option value="not_sent">Not Sent</option>
                            <option value="sent">✓ Sent</option>
                            <option value="responded">✓ Responded</option>
                            <option value="no_reply">✗ No Reply</option>
                            <option value="meeting">★ Meeting Set</option>
                          </select>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {sc.status !== "sent" ? (
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                <button
                                  disabled={sendFellowshipEmailMutation.isPending}
                                  onClick={() => sendFellowshipEmailMutation.mutate({ id: sc.id, lang: "en" })}
                                  style={{ flex: 1, padding: "0.3rem 0.5rem", background: "rgba(212,175,55,0.1)", border: "1px solid var(--vault-gold)", color: "var(--vault-gold)", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Cinzel, serif", whiteSpace: "nowrap" }}>
                                  Send EN
                                </button>
                                <button
                                  disabled={sendFellowshipEmailMutation.isPending}
                                  onClick={() => sendFellowshipEmailMutation.mutate({ id: sc.id, lang: "tl" })}
                                  style={{ flex: 1, padding: "0.3rem 0.5rem", background: "rgba(255,87,34,0.1)", border: "1px solid #ff5722", color: "#ff5722", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Cinzel, serif", whiteSpace: "nowrap" }}>
                                  Send TL
                                </button>
                              </div>
                            ) : (
                              <button
                                disabled
                                style={{ padding: "0.3rem 0.7rem", background: "rgba(34,197,94,0.1)", border: "1px solid #22c55e", color: "#22c55e", borderRadius: "4px", fontSize: "0.72rem", cursor: "default", fontFamily: "Cinzel, serif", whiteSpace: "nowrap" }}>
                                ✓ Initial Sent
                              </button>
                            )}
                            {sc.status === "sent" && !sc.followUpSent && sc.followUpDate && (() => {
                              const due = new Date(sc.followUpDate);
                              const diffDays = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays <= 2) {
                                return (
                                  <button
                                    onClick={() => setFollowUpPreviewContact({ id: sc.id, principalName: sc.principalName, schoolName: sc.schoolName, email: sc.email })}
                                    style={{ padding: "0.3rem 0.7rem", background: diffDays <= 0 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${diffDays <= 0 ? "#ef4444" : "#f59e0b"}`, color: diffDays <= 0 ? "#ef4444" : "#f59e0b", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Cinzel, serif", whiteSpace: "nowrap" }}>
                                    {diffDays <= 0 ? "⚠ Send Follow-up" : "Send Follow-up"}
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            {/* Final Nudge button — show after follow-up sent, contact still not responded */}
                            {sc.followUpSent && !sc.finalNudgeSent && (sc.status === "sent" || sc.status === "no_reply") && (
                              <button
                                onClick={() => setFinalNudgeContact({ id: sc.id, principalName: sc.principalName, schoolName: sc.schoolName, email: sc.email })}
                                style={{ padding: "0.3rem 0.7rem", background: "rgba(139,92,246,0.12)", border: "1px solid #7c3aed", color: "#a78bfa", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontFamily: "Cinzel, serif", whiteSpace: "nowrap" }}>
                                📬 Final Nudge
                              </button>
                            )}
                            {sc.finalNudgeSent && (
                              <span style={{ fontSize: "0.68rem", color: "#a78bfa", padding: "0.2rem 0" }}>✓ Final Nudge Sent</span>
                            )}
                            {/* Internal Notes inline editor */}
                            {editingNotesId === sc.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <textarea
                                  value={editingNotesText}
                                  onChange={e => setEditingNotesText(e.target.value)}
                                  rows={3}
                                  style={{ background: "var(--vault-black)", border: "1px solid var(--vault-gold)", color: "var(--vault-text)", borderRadius: "4px", padding: "0.3rem", fontSize: "0.72rem", resize: "vertical", width: "100%" }}
                                  placeholder="Internal notes..."
                                />
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <button
                                    disabled={updateNotesMutation.isPending}
                                    onClick={() => updateNotesMutation.mutate({ id: sc.id, internalNotes: editingNotesText })}
                                    style={{ padding: "0.2rem 0.5rem", background: "var(--vault-gold)", border: "none", color: "#050505", borderRadius: "3px", fontSize: "0.68rem", cursor: "pointer", fontWeight: 700 }}>
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingNotesId(null)}
                                    style={{ padding: "0.2rem 0.5rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "3px", fontSize: "0.68rem", cursor: "pointer" }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingNotesId(sc.id); setEditingNotesText(sc.internalNotes ?? ""); }}
                                style={{ padding: "0.2rem 0.5rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "3px", fontSize: "0.68rem", cursor: "pointer", textAlign: "left" }}>
                                {sc.internalNotes ? `📝 ${sc.internalNotes.slice(0, 20)}${sc.internalNotes.length > 20 ? "…" : ""}` : "+ Add Notes"}
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm(`Remove ${sc.schoolName}?`)) deleteSchoolContactMutation.mutate({ id: sc.id }); }}
                              style={{ padding: "0.2rem 0.5rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#ef4444", borderRadius: "4px", fontSize: "0.68rem", cursor: "pointer", alignSelf: "flex-start" }}>
                              ✕ Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Follow-up Email Preview Modal */}
      {followUpPreviewContact && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFollowUpPreviewContact(null); }}
        >
          <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "6px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--vault-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Follow-up Email Preview</h3>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>To: {followUpPreviewContact.principalName} — {followUpPreviewContact.schoolName}</p>
              </div>
              <button onClick={() => setFollowUpPreviewContact(null)} style={{ background: "none", border: "none", color: "var(--vault-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {/* Email preview */}
            <div style={{ padding: "1.5rem" }}>
              <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                <div style={{ borderBottom: "2px solid #e5c97e", paddingBottom: "1rem", marginBottom: "1rem", textAlign: "center" }}>
                  <p style={{ color: "#e5c97e", fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 4px" }}>The Vault Investigates</p>
                  <h4 style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: "normal", fontSize: "1.1rem", margin: 0 }}>A Second Word, {followUpPreviewContact.principalName}</h4>
                </div>
                <p style={{ color: "#ccc", lineHeight: 1.8, fontSize: "0.82rem", margin: "0 0 12px" }}>Dear Principal {followUpPreviewContact.principalName},</p>
                <p style={{ color: "#ccc", lineHeight: 1.8, fontSize: "0.82rem", margin: "0 0 12px" }}>I wrote to you a week ago about the <strong style={{ color: "#e5c97e" }}>Civic Journalism Fellowship</strong> — a no-cost program that gives senior students at <strong style={{ color: "#fff" }}>{followUpPreviewContact.schoolName}</strong> the chance to do real investigative research on issues that affect their own communities.</p>
                <div style={{ background: "#1a1a1a", borderLeft: "3px solid #e5c97e", padding: "12px 16px", margin: "12px 0" }}>
                  <p style={{ color: "#e5c97e", fontSize: "0.7rem", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 8px" }}>What the Fellowship Offers</p>
                  <ul style={{ color: "#ccc", fontSize: "0.8rem", lineHeight: 1.8, margin: 0, paddingLeft: "16px" }}>
                    <li>Structured mentorship in investigative journalism methods</li>
                    <li>Real case research on poverty, governance, and accountability</li>
                    <li>A signed Certificate of Accomplishment (verifiable online)</li>
                    <li>Zero cost to the school — fully remote and flexible</li>
                  </ul>
                </div>
                <p style={{ color: "#ccc", lineHeight: 1.8, fontSize: "0.82rem", margin: "12px 0" }}>If this is not the right time, I completely understand. A simple reply — even just "not now" — would be appreciated.</p>
                <p style={{ color: "#e5c97e", fontSize: "0.85rem", margin: "16px 0 0" }}>The Vault Investigates</p>
              </div>
              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setFollowUpPreviewContact(null)}
                  style={{ padding: "0.5rem 1.25rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  disabled={sendFollowUpEmailMutation.isPending}
                  onClick={() => sendFollowUpEmailMutation.mutate({ id: followUpPreviewContact.id })}
                  style={{ padding: "0.5rem 1.5rem", background: "var(--vault-gold)", border: "none", color: "#050505", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", fontWeight: 700, cursor: sendFollowUpEmailMutation.isPending ? "not-allowed" : "pointer", opacity: sendFollowUpEmailMutation.isPending ? 0.6 : 1 }}>
                  {sendFollowUpEmailMutation.isPending ? "Sending…" : "✉ Send Follow-up Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Log Modal */}
      {replyModalContact && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setReplyModalContact(null); }}
        >
          <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "6px", width: "100%", maxWidth: "480px" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--vault-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Log Reply</h3>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>{replyModalContact.principalName} — {replyModalContact.schoolName}</p>
              </div>
              <button onClick={() => setReplyModalContact(null)} style={{ background: "none", border: "none", color: "var(--vault-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Response Type</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["responded", "no_reply", "meeting"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setReplyStatus(s)}
                      style={{ padding: "0.4rem 0.85rem", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "Cinzel, serif", cursor: "pointer", border: `1px solid ${replyStatus === s ? (s === "meeting" ? "#a78bfa" : s === "responded" ? "#22c55e" : "#ef4444") : "var(--vault-border)"}`, background: replyStatus === s ? (s === "meeting" ? "rgba(167,139,250,0.12)" : s === "responded" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "transparent", color: replyStatus === s ? (s === "meeting" ? "#a78bfa" : s === "responded" ? "#22c55e" : "#ef4444") : "var(--vault-muted)" }}>
                      {s === "responded" ? "✓ Responded" : s === "no_reply" ? "✗ No Reply" : "★ Meeting Set"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Notes <span style={{ color: "var(--vault-border)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(what did they say?)</span></div>
                <textarea
                  value={replyNotesText}
                  onChange={e => setReplyNotesText(e.target.value)}
                  rows={4}
                  placeholder={replyStatus === "meeting" ? "e.g. Principal agreed to a call on April 15 at 2pm..." : replyStatus === "responded" ? "e.g. Principal asked for more info about the program..." : "e.g. No response after 7 days, will try again..."}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", padding: "0.6rem 0.75rem", borderRadius: "4px", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setReplyModalContact(null)} style={{ padding: "0.5rem 1.25rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                <button
                  disabled={logReplyMutation.isPending}
                  onClick={() => logReplyMutation.mutate({ id: replyModalContact.id, status: replyStatus, replyNotes: replyNotesText || undefined })}
                  style={{ padding: "0.5rem 1.25rem", background: "var(--vault-gold)", border: "none", color: "#050505", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", fontWeight: 700, cursor: logReplyMutation.isPending ? "not-allowed" : "pointer", opacity: logReplyMutation.isPending ? 0.6 : 1 }}>
                  {logReplyMutation.isPending ? "Saving..." : "Save Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final Nudge Confirmation Modal */}
      {finalNudgeContact && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFinalNudgeContact(null); }}
        >
          <div style={{ background: "var(--vault-surface)", border: "1px solid #7c3aed", borderRadius: "6px", width: "100%", maxWidth: "480px" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--vault-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ color: "#a78bfa", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Send Final Nudge</h3>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem", margin: "4px 0 0" }}>To: {finalNudgeContact.principalName} — {finalNudgeContact.schoolName}</p>
              </div>
              <button onClick={() => setFinalNudgeContact(null)} style={{ background: "none", border: "none", color: "var(--vault-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "var(--vault-text)", fontSize: "0.85rem", lineHeight: 1.7, margin: "0 0 1rem" }}>
                This is the <strong style={{ color: "#a78bfa" }}>14-day final outreach email</strong>. It is the last email in the sequence for this contact.
              </p>
              <p style={{ color: "var(--vault-muted)", fontSize: "0.8rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                Subject: <em>Final Invitation: Civic Journalism Fellowship for {finalNudgeContact.schoolName} Students</em>
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setFinalNudgeContact(null)}
                  style={{ padding: "0.5rem 1.25rem", background: "none", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  disabled={sendFinalNudgeMutation.isPending}
                  onClick={() => sendFinalNudgeMutation.mutate({ id: finalNudgeContact.id })}
                  style={{ padding: "0.5rem 1.5rem", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", fontWeight: 700, cursor: sendFinalNudgeMutation.isPending ? "not-allowed" : "pointer", opacity: sendFinalNudgeMutation.isPending ? 0.6 : 1 }}>
                  {sendFinalNudgeMutation.isPending ? "Sending…" : "📬 Send Final Nudge"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Media Email Preview Modal */}
      {mediaEmailPreview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setMediaEmailPreview(null); }}
        >
          <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "6px", width: "100%", maxWidth: "600px", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--vault-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Email Preview — Day {mediaEmailPreview.dayGroup}</h3>
                <p style={{ color: "#888", fontSize: "0.78rem", margin: "4px 0 0" }}>To: {mediaEmailPreview.name} &lt;{mediaEmailPreview.email}&gt;</p>
              </div>
              <button onClick={() => setMediaEmailPreview(null)} style={{ background: "none", border: "none", color: "var(--vault-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "1rem 1.5rem" }}>
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "4px" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#888", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>Subject</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--vault-text)" }}>{mediaEmailPreview.subject}</p>
              </div>
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(212,175,55,0.03)", border: "1px solid var(--vault-border)", borderRadius: "4px" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#888", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>Day {mediaEmailPreview.dayGroup} Template Angle</p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--vault-muted)", lineHeight: 1.6 }}>
                  {mediaEmailPreview.dayGroup === 1 && "Academic + journalism credibility lead. Positions PIDS/PCIJ as the first and most credible recipients of this investigation."}
                  {mediaEmailPreview.dayGroup === 2 && "Digital-first, exclusive first-look pitch. Short, punchy. Rappler and VERA Files receive an exclusive offer before other digital outlets."}
                  {mediaEmailPreview.dayGroup === 3 && "Press freedom angle. Leads with the source protection platform and the fellowship program — both are directly in CMFR/NUJP's mandate."}
                  {mediaEmailPreview.dayGroup === 4 && "Global angle. Foreign creators exploiting local poverty. Encrypted tip system prominently featured for CPJ/RSF's international monitoring work."}
                  {mediaEmailPreview.dayGroup === 5 && (mediaEmailPreview.isDSWD ? "Registration violation angle for DSWD — frames the foreign creators as operating outside social welfare compliance." : "Human interest story for Inquirer — Manila students doing real investigative journalism through the fellowship program.")}
                </p>
              </div>
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(212,175,55,0.03)", border: "1px solid var(--vault-border)", borderRadius: "4px" }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#888", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>Personal Note (included in email)</p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--vault-text)", lineHeight: 1.6 }}>{mediaEmailPreview.personalNote}</p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                <button
                  onClick={() => setMediaEmailPreview(null)}
                  style={{ padding: "0.5rem 1.25rem", background: "transparent", border: "1px solid var(--vault-border)", color: "var(--vault-muted)", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  disabled={sendPressReleaseMutation.isPending}
                  onClick={() => sendPressReleaseMutation.mutate({
                    contactNum: mediaEmailPreview.num,
                    recipientEmail: mediaEmailPreview.email,
                    contactName: mediaEmailPreview.name,
                    orgName: mediaEmailPreview.org,
                    subject: mediaEmailPreview.subject,
                    personalNote: mediaEmailPreview.personalNote,
                  })}
                  style={{ padding: "0.5rem 1.5rem", background: "linear-gradient(135deg,#b8960c,#d4af37)", border: "none", color: "#000", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "Cinzel, serif", fontWeight: 700, cursor: sendPressReleaseMutation.isPending ? "not-allowed" : "pointer", opacity: sendPressReleaseMutation.isPending ? 0.6 : 1 }}>
                  {sendPressReleaseMutation.isPending ? "Sending…" : "✉ Confirm & Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Send Result Modal */}
      {bulkSendResult && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setBulkSendResult(null); }}
        >
          <div style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "6px", width: "100%", maxWidth: "560px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--vault-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>Bulk Send Results</h3>
              <button onClick={() => setBulkSendResult(null)} style={{ background: "none", border: "none", color: "var(--vault-muted)", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "1rem 1.5rem" }}>
              {/* Summary row */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22c55e" }}>{bulkSendResult.sent}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--vault-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sent</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#94a3b8" }}>{bulkSendResult.skipped}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--vault-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skipped</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: bulkSendResult.failed > 0 ? "#ef4444" : "var(--vault-muted)" }}>{bulkSendResult.failed}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--vault-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Failed</div>
                </div>
              </div>
              {/* Per-contact rows */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--vault-border)" }}>
                    {["Principal", "School", "Result"].map(h => (
                      <th key={h} style={{ padding: "0.4rem 0.5rem", textAlign: "left", color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkSendResult.results.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--vault-border)" }}>
                      <td style={{ padding: "0.5rem", color: "var(--vault-text)" }}>{r.name}</td>
                      <td style={{ padding: "0.5rem", color: "var(--vault-muted)", fontSize: "0.75rem" }}>{r.school}</td>
                      <td style={{ padding: "0.5rem" }}>
                        {r.skipped
                          ? <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>⊘ Skipped (already sent)</span>
                          : r.success
                          ? <span style={{ color: "#22c55e", fontSize: "0.75rem" }}>✓ Sent</span>
                          : <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>✗ {r.error ?? "Failed"}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid var(--vault-border)", textAlign: "right" }}>
              <button
                onClick={() => setBulkSendResult(null)}
                style={{ padding: "0.4rem 1.2rem", background: "rgba(212,175,55,0.1)", border: "1px solid var(--vault-gold)", color: "var(--vault-gold)", borderRadius: "4px", fontSize: "0.78rem", fontFamily: "Cinzel, serif", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Modals */}
      {selectedApp && (
        <ApplicationModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onRefresh={() => refetch()}
        />
      )}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Tip detail modal */}
      {selectedTip && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "1rem",
          }}
          onClick={() => setSelectedTip(null)}
        >
          <div
            style={{
              background: "var(--vault-surface)", border: "1px solid var(--vault-border)",
              borderRadius: "6px", maxWidth: "700px", width: "100%",
              maxHeight: "90vh", overflowY: "auto", padding: "2rem",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", marginBottom: "0.25rem" }}>
                  {selectedTip.subject}
                </h2>
                <p style={{ color: "var(--vault-muted)", fontSize: "0.75rem" }}>
                  {selectedTip.category.replace(/_/g, " ")} · Received {new Date(selectedTip.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedTip(null)} style={{ color: "var(--vault-muted)", background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Pseudonym</div>
                <div style={{ color: "var(--vault-text)", fontSize: "0.875rem" }}>{selectedTip.pseudonym || <em style={{ color: "var(--vault-muted)" }}>Anonymous</em>}</div>
              </div>
              <div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Burner Email</div>
                <div style={{ color: "var(--vault-text)", fontSize: "0.875rem" }}>{selectedTip.burnerEmail || <em style={{ color: "var(--vault-muted)" }}>Not provided</em>}</div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Message</div>
              <div style={{ color: "var(--vault-text)", fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "4px", border: "1px solid var(--vault-border)" }}>
                {selectedTip.message}
              </div>
            </div>

            {selectedTip.fileUrl && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Attachment</div>
                <a
                  href={selectedTip.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--vault-gold)", fontSize: "0.875rem" }}
                >
                  📎 {selectedTip.fileName || "Download attachment"}
                </a>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Status</div>
                <select
                  value={selectedTip.status}
                  onChange={e => {
                    updateTipMutation.mutate({ id: selectedTip.id, status: e.target.value as any });
                    setSelectedTip({ ...selectedTip, status: e.target.value });
                  }}
                  style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", padding: "0.4rem 0.6rem", borderRadius: "3px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="actioned">Actioned</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Priority</div>
                <select
                  value={selectedTip.priority || "low"}
                  onChange={e => {
                    updateTipMutation.mutate({ id: selectedTip.id, priority: e.target.value as any });
                    setSelectedTip({ ...selectedTip, priority: e.target.value });
                  }}
                  style={{ background: "var(--vault-surface)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", padding: "0.4rem 0.6rem", borderRadius: "3px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ color: "var(--vault-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Admin Notes (private)</div>
              <textarea
                defaultValue={selectedTip.adminNotes || ""}
                rows={4}
                onBlur={e => updateTipMutation.mutate({ id: selectedTip.id, adminNotes: e.target.value })}
                placeholder="Internal notes — never shown to the tipster"
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--vault-border)", color: "var(--vault-text)", padding: "0.6rem 0.75rem", borderRadius: "4px", fontSize: "0.85rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  if (confirm("Permanently delete this tip? This cannot be undone.")) {
                    deleteTipMutation.mutate({ id: selectedTip.id });
                  }
                }}
                style={{ background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: "#e05252", padding: "0.5rem 1rem", borderRadius: "3px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Delete Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
