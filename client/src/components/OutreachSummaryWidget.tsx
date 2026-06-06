import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────────────

type CampaignSummary = {
  school: {
    total: number;
    emailed: number;
    followUpSent: number;
    finalNudge: number;
    responded: number;
    overdue: number;
    dueSoon: number;
  };
  media: {
    total: number;
    sent: number;
    responded: number;
  };
  donors: {
    total: number;
    contacted: number;
    responded: number;
    followUpDue: number;
  };
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px", overflow: "hidden", width: "100%" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "4px",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "56px" }}>
      <span style={{ color, fontSize: "1.15rem", fontWeight: 700, fontFamily: "Cinzel, serif", lineHeight: 1 }}>{value}</span>
      <span style={{ color: "var(--vault-muted)", fontSize: "0.62rem", marginTop: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ─── Alert Badge ──────────────────────────────────────────────────────────────

function AlertBadge({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: "4px",
      padding: "0.2rem 0.55rem",
      fontSize: "0.68rem",
      color,
      fontWeight: 600,
    }}>
      <span style={{ fontSize: "0.7rem" }}>⚠</span>
      {count} {label}
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  title,
  icon,
  href,
  accentColor,
  progressValue,
  progressMax,
  progressLabel,
  pills,
  alerts,
  onClick,
}: {
  title: string;
  icon: string;
  href: string;
  accentColor: string;
  progressValue: number;
  progressMax: number;
  progressLabel: string;
  pills: { label: string; value: number; color: string }[];
  alerts: { count: number; label: string; color: string }[];
  onClick?: () => void;
}) {
  const pct = progressMax > 0 ? Math.round((progressValue / progressMax) * 100) : 0;

  return (
    <div style={{
      background: "var(--vault-surface)",
      border: `1px solid var(--vault-border)`,
      borderTop: `3px solid ${accentColor}`,
      borderRadius: "7px",
      padding: "1.1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.85rem",
      flex: "1 1 260px",
      minWidth: "220px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>{icon}</span>
          <span style={{ color: accentColor, fontFamily: "Cinzel, serif", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{title}</span>
        </div>
        {onClick ? (
          <button
            onClick={onClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--vault-muted)",
              fontSize: "0.68rem",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.03em",
            }}
          >
            View →
          </button>
        ) : (
          <Link href={href}>
            <span style={{ color: "var(--vault-muted)", fontSize: "0.68rem", cursor: "pointer", textDecoration: "underline", fontFamily: "Cinzel, serif", letterSpacing: "0.03em" }}>
              View →
            </span>
          </Link>
        )}
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ color: "var(--vault-muted)", fontSize: "0.68rem" }}>{progressLabel}</span>
          <span style={{ color: accentColor, fontSize: "0.68rem", fontWeight: 700 }}>{pct}%</span>
        </div>
        <ProgressBar value={progressValue} max={progressMax} color={accentColor} />
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        {pills.map(p => <Pill key={p.label} {...p} />)}
      </div>

      {/* Alerts */}
      {alerts.some(a => a.count > 0) && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {alerts.map(a => <AlertBadge key={a.label} {...a} />)}
        </div>
      )}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function OutreachSummaryWidget({ onSelectMediaOutreach }: { onSelectMediaOutreach?: () => void }) {
  const { data, isLoading, error } = trpc.campaigns.summary.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "1.5rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "7px" }}>
        <div style={{ color: "var(--vault-muted)", fontSize: "0.78rem", fontFamily: "Cinzel, serif", letterSpacing: "0.06em", textAlign: "center" }}>Loading campaign data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "1.5rem", background: "var(--vault-surface)", border: "1px solid var(--vault-border)", borderRadius: "7px" }}>
        <div style={{ color: "#ef4444", fontSize: "0.75rem", textAlign: "center" }}>Could not load campaign summary.</div>
      </div>
    );
  }

  const s = data as CampaignSummary;

  // Total engagement across all campaigns
  const totalContacts = s.school.total + s.media.total + s.donors.total;
  const totalReached = s.school.emailed + s.media.sent + s.donors.contacted;
  const totalResponded = s.school.responded + s.media.responded + s.donors.responded;
  const totalAlerts = s.school.overdue + s.school.dueSoon + s.donors.followUpDue;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
          📡 Outreach Campaigns
        </h3>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1 }}>{totalReached}</div>
            <div style={{ color: "var(--vault-muted)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reached</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#22c55e", fontFamily: "Cinzel, serif", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1 }}>{totalResponded}</div>
            <div style={{ color: "var(--vault-muted)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Responded</div>
          </div>
          {totalAlerts > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#ef4444", fontFamily: "Cinzel, serif", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1 }}>{totalAlerts}</div>
              <div style={{ color: "var(--vault-muted)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alerts</div>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "var(--vault-muted)", fontFamily: "Cinzel, serif", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1 }}>{totalContacts}</div>
            <div style={{ color: "var(--vault-muted)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
          </div>
        </div>
      </div>

      {/* Campaign cards */}
      <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
        {/* School Fellowship */}
        <CampaignCard
          title="School Fellowship"
          icon="🏫"
          href="/admin/campaigns"
          accentColor="var(--vault-gold)"
          progressValue={s.school.emailed}
          progressMax={s.school.total}
          progressLabel={`${s.school.emailed} of ${s.school.total} contacted`}
          pills={[
            { label: "Emailed", value: s.school.emailed, color: "var(--vault-gold)" },
            { label: "Follow-up", value: s.school.followUpSent, color: "#f59e0b" },
            { label: "Final Nudge", value: s.school.finalNudge, color: "#fb923c" },
            { label: "Responded", value: s.school.responded, color: "#22c55e" },
          ]}
          alerts={[
            { count: s.school.overdue, label: "overdue", color: "#ef4444" },
            { count: s.school.dueSoon, label: "due soon", color: "#f59e0b" },
          ]}
        />

        {/* Media Outreach */}
        <CampaignCard
          title="Media Outreach"
          icon="📰"
          href="/admin"
          accentColor="#60a5fa"
          progressValue={s.media.sent}
          progressMax={s.media.total}
          progressLabel={`${s.media.sent} of ${s.media.total} contacted`}
          pills={[
            { label: "Contacted", value: s.media.sent, color: "#60a5fa" },
            { label: "Responded", value: s.media.responded, color: "#22c55e" },
            { label: "Pending", value: s.media.total - s.media.sent, color: "var(--vault-muted)" },
          ]}
          alerts={[]}
          onClick={onSelectMediaOutreach}
        />

        {/* Donor Outreach */}
        <CampaignCard
          title="Donor Outreach"
          icon="💛"
          href="/admin/donors"
          accentColor="#f59e0b"
          progressValue={s.donors.contacted}
          progressMax={Math.max(s.donors.total, 1)}
          progressLabel={s.donors.total > 0 ? `${s.donors.contacted} of ${s.donors.total} contacted` : "No donors added yet"}
          pills={[
            { label: "Total", value: s.donors.total, color: "#f59e0b" },
            { label: "Contacted", value: s.donors.contacted, color: "#f59e0b" },
            { label: "Responded", value: s.donors.responded, color: "#22c55e" },
          ]}
          alerts={[
            { count: s.donors.followUpDue, label: "follow-up due", color: "#ef4444" },
          ]}
        />
      </div>
    </div>
  );
}
