import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
type EvidenceTier = "confirmed_violation" | "documented_evidence" | "under_investigation";
type InquiryStatus = "not_sent" | "sent" | "responded" | "no_reply" | "declined";
type Platform = "youtube" | "tiktok" | "facebook" | "instagram" | "other";

interface VloggerInquiry {
  id: number;
  creatorName: string;
  channelName: string | null;
  platform: Platform;
  subscriberCount: string | null;
  email: string | null;
  evidenceTier: EvidenceTier;
  violationDate: string | null;
  agency: string | null;
  violationSummary: string | null;
  startYear: string | null;
  estimatedRevenue: string | null;
  inquiryStatus: InquiryStatus;
  dateSent: Date | null;
  deadline: Date | null;
  sentLetterText: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Template generators ────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function generateLetter(inquiry: VloggerInquiry, today: Date, deadline: Date): string {
  const dateStr = formatDate(today);
  const deadlineStr = formatDate(deadline);
  const creator = inquiry.creatorName;
  const channel = inquiry.channelName || inquiry.creatorName;

  if (inquiry.evidenceTier === "confirmed_violation") {
    return `FORMAL INQUIRY — FOR THE RECORD
The Vault Investigates | ${dateStr}

To: ${creator} / ${channel}

This is a formal on-record inquiry from The Vault Investigates, an independent investigative journalism outlet. This inquiry will be published in full — along with your response or non-response — as part of our Seeds of Fire investigation into poverty exploitation content in the Philippines.

On ${inquiry.violationDate || "[VIOLATION DATE]"}, ${inquiry.agency || "[AGENCY]"} took the following documented action against you or your operation: ${inquiry.violationSummary || "[VIOLATION SUMMARY]"}. This is a matter of public record.

We are requesting your response to the following:
1. Are you currently registered with DSWD as required under Philippine law?
2. What is the total revenue — including YouTube ad revenue, Super Chats, and GCash donations — generated from your poverty content from ${inquiry.startYear || "[START YEAR]"} to present?
3. What documentation exists showing compensation paid to individuals and families you filmed?
4. What steps have you taken toward full legal compliance following ${inquiry.agency || "[AGENCY]"}'s action on ${inquiry.violationDate || "[VIOLATION DATE]"}?

Response deadline: ${deadlineStr}
Your response or non-response will be published in full.

The Vault Investigates
www.thevaultinvestigates.cloud
TruthDrop.io`;
  }

  if (inquiry.evidenceTier === "documented_evidence") {
    return `FORMAL INQUIRY — FOR THE RECORD
The Vault Investigates | ${dateStr}

To: ${creator} / ${channel}

This is a formal on-record inquiry from The Vault Investigates, an independent investigative journalism outlet. This inquiry will be published in full — along with your response or non-response — as part of our Seeds of Fire investigation into poverty exploitation content in the Philippines.

Your channel ${channel} has an estimated ${inquiry.subscriberCount || "[SUBSCRIBER COUNT]"} subscribers and generates revenue through YouTube ad impressions, Super Chats, and GCash donations solicited during livestreams featuring vulnerable individuals and minors in poverty situations.

Publicly available data from Social Blade and HypeAuditor estimates your monthly earnings from this content at ${inquiry.estimatedRevenue || "[ESTIMATED REVENUE]"}. The individuals filmed are not named as revenue beneficiaries in any public disclosure.

We are requesting your response to the following:
1. Are you registered with DSWD as required under Philippine law?
2. What is the actual total revenue from poverty content including all revenue streams?
3. What documentation exists showing compensation paid to individuals and families you filmed?
4. What consent process do you use before filming minors and vulnerable individuals?

Response deadline: ${deadlineStr}
Your response or non-response will be published in full.

The Vault Investigates
www.thevaultinvestigates.cloud
TruthDrop.io`;
  }

  // under_investigation (Tier 3)
  return `FORMAL INQUIRY — FOR THE RECORD
The Vault Investigates | ${dateStr}

To: ${creator} / ${channel}

This is a formal on-record inquiry from The Vault Investigates, an independent investigative journalism outlet. This inquiry will be published in full — along with your response or non-response — as part of our Seeds of Fire investigation into poverty exploitation content in the Philippines.

Your channel ${channel} has been identified as part of our investigation into content creators who film vulnerable individuals and minors in poverty situations while soliciting donations from viewers.

In the interest of accuracy and fairness we are offering you the opportunity to respond before publication.

We are requesting your response to the following:
1. Are you registered with DSWD as required under Philippine law?
2. Do you disclose what percentage of revenue and donations reaches the individuals you film?
3. What consent process do you use before filming minors and vulnerable individuals?
4. Is there any information you would like The Vault Investigates to consider before we publish?

Response deadline: ${deadlineStr}
Your response or non-response will be published in full.

The Vault Investigates
www.thevaultinvestigates.cloud
TruthDrop.io`;
}

function generateObsidianMd(inquiry: VloggerInquiry, letterText: string, today: Date, deadline: Date): string {
  const dateIso = today.toISOString().split("T")[0];
  const deadlineIso = deadline.toISOString().split("T")[0];
  const tierLabel = inquiry.evidenceTier === "confirmed_violation"
    ? "Confirmed Violation"
    : inquiry.evidenceTier === "documented_evidence"
    ? "Documented Evidence"
    : "Under Investigation";

  return `---
date: ${dateIso}
subject: Formal Inquiry — ${inquiry.creatorName}
status: Sent — Awaiting Response
deadline: ${deadlineIso}
tier: ${tierLabel}
---

${letterText}
`;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InquiryStatus }) {
  const map: Record<InquiryStatus, { label: string; color: string }> = {
    not_sent: { label: "Not Sent", color: "#6b7280" },
    sent: { label: "Sent", color: "#d4a017" },
    responded: { label: "Responded", color: "#22c55e" },
    no_reply: { label: "No Reply", color: "#ef4444" },
    declined: { label: "Declined", color: "#f97316" },
  };
  const { label, color } = map[status] || map.not_sent;
  return (
    <span style={{
      display: "inline-block",
      padding: "0.15rem 0.6rem",
      borderRadius: 4,
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: color + "22",
      color,
      border: `1px solid ${color}55`,
    }}>{label}</span>
  );
}

function TierBadge({ tier }: { tier: EvidenceTier }) {
  const map: Record<EvidenceTier, { label: string; color: string }> = {
    confirmed_violation: { label: "Confirmed Violation", color: "#ef4444" },
    documented_evidence: { label: "Documented Evidence", color: "#f97316" },
    under_investigation: { label: "Under Investigation", color: "#6b7280" },
  };
  const { label, color } = map[tier] || map.under_investigation;
  return (
    <span style={{
      display: "inline-block",
      padding: "0.15rem 0.6rem",
      borderRadius: 4,
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: color + "22",
      color,
      border: `1px solid ${color}55`,
    }}>{label}</span>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({ inquiry, onClose, onSaved }: {
  inquiry: VloggerInquiry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    creatorName: inquiry.creatorName,
    channelName: inquiry.channelName || "",
    platform: inquiry.platform,
    subscriberCount: inquiry.subscriberCount || "",
    email: inquiry.email || "",
    evidenceTier: inquiry.evidenceTier,
    violationDate: inquiry.violationDate || "",
    agency: inquiry.agency || "",
    violationSummary: inquiry.violationSummary || "",
    startYear: inquiry.startYear || "",
    estimatedRevenue: inquiry.estimatedRevenue || "",
    inquiryStatus: inquiry.inquiryStatus,
    internalNotes: inquiry.internalNotes || "",
  });

  const updateMutation = trpc.vloggerInquiries.update.useMutation({
    onSuccess: () => { toast.success("Saved"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 4,
    padding: "0.4rem 0.6rem",
    color: "#e5e7eb",
    fontSize: "0.82rem",
    marginBottom: "0.5rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.2rem",
    fontFamily: "Cinzel, serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: "1px solid #333", borderRadius: 8,
        padding: "1.5rem", width: "min(600px, 95vw)", maxHeight: "90vh",
        overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", marginBottom: "1rem" }}>
          Edit — {inquiry.creatorName}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label style={labelStyle}>Creator Name</label>
            <input style={inputStyle} value={form.creatorName} onChange={e => setForm(f => ({ ...f, creatorName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Channel Name</label>
            <input style={inputStyle} value={form.channelName} onChange={e => setForm(f => ({ ...f, channelName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Platform</label>
            <select style={inputStyle} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Subscriber Count</label>
            <input style={inputStyle} value={form.subscriberCount} onChange={e => setForm(f => ({ ...f, subscriberCount: e.target.value }))} placeholder="e.g. 1.2M" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Evidence Tier</label>
            <select style={inputStyle} value={form.evidenceTier} onChange={e => setForm(f => ({ ...f, evidenceTier: e.target.value as EvidenceTier }))}>
              <option value="confirmed_violation">Tier 1 — Confirmed Violation</option>
              <option value="documented_evidence">Tier 2 — Documented Evidence</option>
              <option value="under_investigation">Tier 3 — Under Investigation</option>
            </select>
          </div>
        </div>

        {form.evidenceTier === "confirmed_violation" && (
          <>
            <label style={labelStyle}>Violation Date</label>
            <input style={inputStyle} value={form.violationDate} onChange={e => setForm(f => ({ ...f, violationDate: e.target.value }))} placeholder="e.g. March 15, 2025" />
            <label style={labelStyle}>Agency</label>
            <input style={inputStyle} value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} placeholder="e.g. DSWD Region III" />
            <label style={labelStyle}>Violation Summary</label>
            <textarea style={{ ...inputStyle, height: 80 }} value={form.violationSummary} onChange={e => setForm(f => ({ ...f, violationSummary: e.target.value }))} />
            <label style={labelStyle}>Start Year</label>
            <input style={inputStyle} value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} placeholder="e.g. 2021" />
          </>
        )}

        {form.evidenceTier === "documented_evidence" && (
          <>
            <label style={labelStyle}>Estimated Monthly Revenue</label>
            <input style={inputStyle} value={form.estimatedRevenue} onChange={e => setForm(f => ({ ...f, estimatedRevenue: e.target.value }))} placeholder="e.g. ₱50,000–₱120,000/month" />
          </>
        )}

        <label style={labelStyle}>Inquiry Status</label>
        <select style={inputStyle} value={form.inquiryStatus} onChange={e => setForm(f => ({ ...f, inquiryStatus: e.target.value as InquiryStatus }))}>
          <option value="not_sent">Not Sent</option>
          <option value="sent">Sent</option>
          <option value="responded">Responded</option>
          <option value="no_reply">No Reply</option>
          <option value="declined">Declined</option>
        </select>

        <label style={labelStyle}>Internal Notes</label>
        <textarea style={{ ...inputStyle, height: 60 }} value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} />

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            onClick={() => updateMutation.mutate({ id: inquiry.id, ...form })}
            disabled={updateMutation.isPending}
            style={{
              background: "var(--vault-gold)", color: "#000", border: "none",
              borderRadius: 4, padding: "0.5rem 1.2rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} style={{
            background: "none", color: "#9ca3af", border: "1px solid #333",
            borderRadius: 4, padding: "0.5rem 1.2rem", fontFamily: "Cinzel, serif",
            fontSize: "0.8rem", cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Send Modal ─────────────────────────────────────────────────────────────────
function SendModal({ inquiry, onClose, onSent }: {
  inquiry: VloggerInquiry;
  onClose: () => void;
  onSent: () => void;
}) {
  const today = new Date();
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 7);

  const [letterText, setLetterText] = useState(() => generateLetter(inquiry, today, deadline));

  const sendMutation = trpc.vloggerInquiries.sendInquiry.useMutation({
    onSuccess: (data) => {
      if (data.emailError) {
        toast.error(`Archived but email failed: ${data.emailError}`);
      } else if (data.emailId) {
        toast.success(`Inquiry sent via email and archived (id: ${data.emailId})`);
      } else {
        toast.success("Inquiry marked as sent and archived");
      }
      onSent();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleDownload() {
    const mdContent = generateObsidianMd(inquiry, letterText, today, deadline);
    const dateIso = today.toISOString().split("T")[0];
    const safeName = inquiry.creatorName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${dateIso}-Inquiry-${safeName}.md`;
    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSend() {
    sendMutation.mutate({
      id: inquiry.id,
      letterText,
      deadline: deadline.toISOString(),
      sendEmail: false,
    });
  }

  function handleSendEmail() {
    sendMutation.mutate({
      id: inquiry.id,
      letterText,
      deadline: deadline.toISOString(),
      sendEmail: true,
    });
  }

  const hasEmail = !!inquiry.email;

  const tierLabel = inquiry.evidenceTier === "confirmed_violation"
    ? "Tier 1 — Confirmed Violation"
    : inquiry.evidenceTier === "documented_evidence"
    ? "Tier 2 — Documented Evidence"
    : "Tier 3 — Under Investigation";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#0d0d0d", border: "1px solid var(--vault-gold)", borderRadius: 8,
        padding: "1.5rem", width: "min(720px, 96vw)", maxHeight: "92vh",
        overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>
              Compose Inquiry — {inquiry.creatorName}
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.78rem", margin: "0.25rem 0 0" }}>
              {tierLabel} · Deadline: {formatDate(deadline)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        <textarea
          value={letterText}
          onChange={e => setLetterText(e.target.value)}
          style={{
            width: "100%",
            height: 420,
            background: "#111",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "0.75rem",
            color: "#e5e7eb",
            fontSize: "0.82rem",
            fontFamily: "monospace",
            lineHeight: 1.6,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.75rem" }}>
          Edit the letter above before sending. All changes are saved to the archive.
        </div>

        {/* Email status indicator */}
        {!hasEmail && (
          <div style={{
            marginTop: "0.75rem", padding: "0.5rem 0.75rem",
            background: "#1a1200", border: "1px solid #4a3800",
            borderRadius: 4, color: "#d97706", fontSize: "0.75rem",
          }}>
            ⚠ No email on file for this creator — edit the row to add one before sending via email.
          </div>
        )}
        {hasEmail && (
          <div style={{
            marginTop: "0.75rem", padding: "0.5rem 0.75rem",
            background: "#001a0a", border: "1px solid #004a1a",
            borderRadius: 4, color: "#4ade80", fontSize: "0.75rem",
          }}>
            ✓ Email on file: <strong>{inquiry.email}</strong> — ready to send via Resend.
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleDownload}
            style={{
              background: "none", color: "var(--vault-gold)",
              border: "1px solid var(--vault-gold)", borderRadius: 4,
              padding: "0.5rem 1.2rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            ↓ Download .md
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sendMutation.isPending || !hasEmail}
            title={!hasEmail ? "Add an email address to this creator first" : "Send via Resend and archive"}
            style={{
              background: hasEmail ? "#16a34a" : "#1a2a1a",
              color: hasEmail ? "#fff" : "#4b5563",
              border: hasEmail ? "none" : "1px solid #2a3a2a",
              borderRadius: 4, padding: "0.5rem 1.4rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem",
              cursor: hasEmail ? "pointer" : "not-allowed",
            }}
          >
            {sendMutation.isPending ? "Sending…" : "✉ Send Email + Archive"}
          </button>
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending}
            style={{
              background: "var(--vault-gold)", color: "#000", border: "none",
              borderRadius: 4, padding: "0.5rem 1.4rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            {sendMutation.isPending ? "Saving…" : "Mark as Sent + Archive"}
          </button>
          <button onClick={onClose} style={{
            background: "none", color: "#9ca3af", border: "1px solid #333",
            borderRadius: 4, padding: "0.5rem 1.2rem", fontFamily: "Cinzel, serif",
            fontSize: "0.8rem", cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Archive Modal ──────────────────────────────────────────────────────────────
function ArchiveModal({ inquiry, onClose }: { inquiry: VloggerInquiry; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#0d0d0d", border: "1px solid #333", borderRadius: 8,
        padding: "1.5rem", width: "min(680px, 96vw)", maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0 }}>
            Archived Letter — {inquiry.creatorName}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>
        {inquiry.dateSent && (
          <p style={{ color: "#9ca3af", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
            Sent: {formatDate(new Date(inquiry.dateSent))} · Deadline: {inquiry.deadline ? formatDate(new Date(inquiry.deadline)) : "—"}
          </p>
        )}
        <pre style={{
          background: "#111", border: "1px solid #222", borderRadius: 4,
          padding: "1rem", color: "#e5e7eb", fontSize: "0.8rem",
          fontFamily: "monospace", lineHeight: 1.6, whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {inquiry.sentLetterText || "No letter archived."}
        </pre>
        {inquiry.sentLetterText && (
          <button
            onClick={() => {
              const today = inquiry.dateSent ? new Date(inquiry.dateSent) : new Date();
              const deadline = inquiry.deadline ? new Date(inquiry.deadline) : new Date();
              const mdContent = generateObsidianMd(inquiry, inquiry.sentLetterText!, today, deadline);
              const dateIso = today.toISOString().split("T")[0];
              const safeName = inquiry.creatorName.replace(/[^a-zA-Z0-9]/g, "_");
              const filename = `${dateIso}-Inquiry-${safeName}.md`;
              const blob = new Blob([mdContent], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = filename; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              marginTop: "1rem", background: "none", color: "var(--vault-gold)",
              border: "1px solid var(--vault-gold)", borderRadius: 4,
              padding: "0.4rem 1rem", fontFamily: "Cinzel, serif",
              fontSize: "0.78rem", cursor: "pointer",
            }}
          >
            ↓ Re-download .md
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add Creator Modal ──────────────────────────────────────────────────────────
function AddCreatorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    creatorName: "",
    channelName: "",
    platform: "youtube" as Platform,
    subscriberCount: "",
    email: "",
    evidenceTier: "under_investigation" as EvidenceTier,
  });

  const createMutation = trpc.vloggerInquiries.create.useMutation({
    onSuccess: () => { toast.success("Creator added"); onAdded(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#1a1a1a", border: "1px solid #333",
    borderRadius: 4, padding: "0.4rem 0.6rem", color: "#e5e7eb",
    fontSize: "0.82rem", marginBottom: "0.5rem",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: "0.2rem", fontFamily: "Cinzel, serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#111", border: "1px solid #333", borderRadius: 8,
        padding: "1.5rem", width: "min(500px, 95vw)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", marginBottom: "1rem" }}>
          Add Creator
        </h2>
        <label style={labelStyle}>Creator Name *</label>
        <input style={inputStyle} value={form.creatorName} onChange={e => setForm(f => ({ ...f, creatorName: e.target.value }))} />
        <label style={labelStyle}>Channel Name</label>
        <input style={inputStyle} value={form.channelName} onChange={e => setForm(f => ({ ...f, channelName: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div>
            <label style={labelStyle}>Platform</label>
            <select style={inputStyle} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Subscriber Count</label>
            <input style={inputStyle} value={form.subscriberCount} onChange={e => setForm(f => ({ ...f, subscriberCount: e.target.value }))} placeholder="e.g. 1.2M" />
          </div>
        </div>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <label style={labelStyle}>Evidence Tier</label>
        <select style={inputStyle} value={form.evidenceTier} onChange={e => setForm(f => ({ ...f, evidenceTier: e.target.value as EvidenceTier }))}>
          <option value="confirmed_violation">Tier 1 — Confirmed Violation</option>
          <option value="documented_evidence">Tier 2 — Documented Evidence</option>
          <option value="under_investigation">Tier 3 — Under Investigation</option>
        </select>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.creatorName || createMutation.isPending}
            style={{
              background: "var(--vault-gold)", color: "#000", border: "none",
              borderRadius: 4, padding: "0.5rem 1.2rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            {createMutation.isPending ? "Adding…" : "Add Creator"}
          </button>
          <button onClick={onClose} style={{
            background: "none", color: "#9ca3af", border: "1px solid #333",
            borderRadius: 4, padding: "0.5rem 1.2rem", fontFamily: "Cinzel, serif",
            fontSize: "0.8rem", cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VloggerInquiries() {
  const { data: inquiries, refetch } = trpc.vloggerInquiries.list.useQuery();
  const deleteMutation = trpc.vloggerInquiries.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [sendTarget, setSendTarget] = useState<VloggerInquiry | null>(null);
  const [editTarget, setEditTarget] = useState<VloggerInquiry | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<VloggerInquiry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const platformLabel: Record<Platform, string> = {
    youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook",
    instagram: "Instagram", other: "Other",
  };

  const thStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    textAlign: "left",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#9ca3af",
    fontFamily: "Cinzel, serif",
    borderBottom: "1px solid #222",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    fontSize: "0.8rem",
    color: "#e5e7eb",
    borderBottom: "1px solid #1a1a1a",
    verticalAlign: "middle",
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    background: "none",
    border: `1px solid ${color}55`,
    color,
    borderRadius: 4,
    padding: "0.2rem 0.6rem",
    fontSize: "0.72rem",
    fontFamily: "Cinzel, serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--vault-black, #050505)", color: "#e5e7eb" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <a href="/admin" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.8rem", fontFamily: "Cinzel, serif" }}>
          ← Admin
        </a>
        <span style={{ color: "#333" }}>|</span>
        <h1 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1rem", margin: 0, letterSpacing: "0.08em" }}>
          VLOGGER INQUIRIES — Seeds of Fire
        </h1>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        {/* Stats row */}
        {inquiries && (
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              { label: "Total", value: inquiries.length, color: "#9ca3af" },
              { label: "Not Sent", value: inquiries.filter((i: VloggerInquiry) => i.inquiryStatus === "not_sent").length, color: "#6b7280" },
              { label: "Sent", value: inquiries.filter((i: VloggerInquiry) => i.inquiryStatus === "sent").length, color: "#d4a017" },
              { label: "Responded", value: inquiries.filter((i: VloggerInquiry) => i.inquiryStatus === "responded").length, color: "#22c55e" },
              { label: "No Reply", value: inquiries.filter((i: VloggerInquiry) => i.inquiryStatus === "no_reply").length, color: "#ef4444" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#111", border: "1px solid #222", borderRadius: 6,
                padding: "0.6rem 1rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: stat.color, fontFamily: "Cinzel, serif" }}>{stat.value}</div>
                <div style={{ fontSize: "0.68rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add button */}
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: "var(--vault-gold)", color: "#000", border: "none",
              borderRadius: 4, padding: "0.5rem 1.2rem", fontWeight: 700,
              fontFamily: "Cinzel, serif", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            + Add Creator
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["Creator Name", "Channel", "Platform", "Subscribers", "Evidence Tier", "Email", "Status", "Date Sent", "Deadline", "Actions"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!inquiries && (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "#6b7280" }}>Loading…</td></tr>
              )}
              {inquiries && inquiries.length === 0 && (
                <tr><td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "#6b7280" }}>No creators in roster.</td></tr>
              )}
              {inquiries && (inquiries as VloggerInquiry[]).map((inquiry) => (
                <tr key={inquiry.id} style={{ transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{inquiry.creatorName}</td>
                  <td style={tdStyle}>{inquiry.channelName || "—"}</td>
                  <td style={tdStyle}>{platformLabel[inquiry.platform]}</td>
                  <td style={tdStyle}>{inquiry.subscriberCount || "—"}</td>
                  <td style={tdStyle}><TierBadge tier={inquiry.evidenceTier} /></td>
                  <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inquiry.email || "—"}
                  </td>
                  <td style={tdStyle}><StatusBadge status={inquiry.inquiryStatus} /></td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {inquiry.dateSent ? formatDate(new Date(inquiry.dateSent)) : "—"}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {inquiry.deadline ? formatDate(new Date(inquiry.deadline)) : "—"}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {inquiry.inquiryStatus === "not_sent" && (
                        <button style={btnStyle("#d4a017")} onClick={() => setSendTarget(inquiry)}>
                          Compose
                        </button>
                      )}
                      {inquiry.sentLetterText && (
                        <button style={btnStyle("#6b7280")} onClick={() => setArchiveTarget(inquiry)}>
                          Archive
                        </button>
                      )}
                      <button style={btnStyle("#9ca3af")} onClick={() => setEditTarget(inquiry)}>
                        Edit
                      </button>
                      <button
                        style={btnStyle("#ef4444")}
                        onClick={() => {
                          if (confirm(`Delete ${inquiry.creatorName}?`)) {
                            deleteMutation.mutate({ id: inquiry.id });
                          }
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: "#4b5563", fontSize: "0.72rem", marginTop: "1rem" }}>
          "Compose" generates the tier-appropriate letter with auto-filled fields. "Mark as Sent + Archive" saves the letter to the database. "↓ Download .md" saves the Obsidian-ready file to your Downloads folder — drag it into your vault.
        </p>
      </div>

      {/* Modals */}
      {sendTarget && (
        <SendModal
          inquiry={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={() => { refetch(); setSendTarget(null); }}
        />
      )}
      {editTarget && (
        <EditModal
          inquiry={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { refetch(); setEditTarget(null); }}
        />
      )}
      {archiveTarget && (
        <ArchiveModal
          inquiry={archiveTarget}
          onClose={() => setArchiveTarget(null)}
        />
      )}
      {showAdd && (
        <AddCreatorModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { refetch(); setShowAdd(false); }}
        />
      )}
    </div>
  );
}
