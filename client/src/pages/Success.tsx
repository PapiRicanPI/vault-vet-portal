import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubmissionSummary {
  applicationId: number | null;
  displayName: string;
  email: string;
  organization: string | null;
  orgRole: string | null;
  investigationProject: string;
  geographicFocus: string;
  outputType: string;
  priorWorkCount: number;
  agreesToCredit: boolean;
  useOpSec: boolean;
  supportLink: string | null;
  submittedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: React.ReactNode;
  truncate?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-4 py-3"
      style={{ borderBottom: "1px solid var(--vault-border)" }}
    >
      <span
        className="text-xs tracking-wider uppercase flex-shrink-0 w-36"
        style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", paddingTop: "2px" }}
      >
        {label}
      </span>
      <span
        className={`text-sm flex-1 ${truncate ? "line-clamp-3" : ""}`}
        style={{ color: "var(--vault-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: "3px",
      }}
    >
      {children}
    </span>
  );
}

// ─── Processing Timeline ──────────────────────────────────────────────────────

function ProcessingTimeline() {
  const steps = [
    {
      icon: "📥",
      title: "Received",
      desc: "Your application has been securely logged",
      time: "Immediate",
      done: true,
    },
    {
      icon: "🤖",
      title: "AI Pre-screening",
      desc: "Automated scoring across 5 criteria (0–10 scale)",
      time: "Within minutes",
      done: true,
    },
    {
      icon: "👁",
      title: "Human Review",
      desc: "A member of The Vault vetting team reads your application",
      time: "1–3 business days",
      done: false,
    },
    {
      icon: "✉️",
      title: "Decision Notification",
      desc: "You receive an email with the outcome and next steps",
      time: "5–7 business days",
      done: false,
    },
  ];

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div
        className="absolute left-4 top-6 bottom-6"
        style={{ width: "1px", background: "var(--vault-border)", marginLeft: "-0.5px" }}
      />

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-start gap-4 pb-6 relative">
            {/* Step dot */}
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0 relative z-10 text-base"
              style={{
                background: step.done ? "rgba(201,168,76,0.15)" : "var(--vault-surface)",
                border: `1px solid ${step.done ? "var(--vault-gold-dim)" : "var(--vault-border)"}`,
                borderRadius: "50%",
              }}
            >
              {step.icon}
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-3 mb-0.5">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: step.done ? "var(--vault-text)" : "var(--vault-muted)",
                    fontFamily: "Cinzel, serif",
                    fontSize: "13px",
                  }}
                >
                  {step.title}
                </span>
                <span
                  className="text-xs px-2 py-0.5"
                  style={{
                    background: step.done ? "rgba(201,168,76,0.08)" : "transparent",
                    border: `1px solid ${step.done ? "rgba(201,168,76,0.25)" : "var(--vault-border)"}`,
                    color: step.done ? "var(--vault-gold)" : "var(--vault-muted)",
                    borderRadius: "2px",
                    fontFamily: "Cinzel, serif",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                  }}
                >
                  {step.time}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Success() {
  const [, navigate] = useLocation();
  const [summary, setSummary] = useState<SubmissionSummary | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("vault_submission_summary");
    if (raw) {
      try {
        setSummary(JSON.parse(raw));
        // Clear after reading so it doesn't persist on refresh
        sessionStorage.removeItem("vault_submission_summary");
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const submittedDate = summary?.submittedAt
    ? new Date(summary.submittedAt).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--vault-black)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--vault-border)" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030563274/8pjFw3h3P7WVQwFs3j6pN5/vault-logo_1d096394.png"
              alt="The Vault Investigates"
              className="h-10 w-auto object-contain"
            />
          </div>
          {summary?.applicationId && (
            <span className="text-xs" style={{ color: "var(--vault-muted)" }}>
              Application #{summary.applicationId}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Success banner */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 mb-5 border-2 rounded-full"
            style={{ borderColor: "var(--vault-gold)" }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M5 14 L11 20 L23 8"
                stroke="var(--vault-gold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1
            className="text-2xl md:text-3xl mb-2 tracking-wide"
            style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
          >
            Application Received
          </h1>

          <div
            className="w-20 h-px mx-auto my-4"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--vault-gold-dim), transparent)",
            }}
          />

          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--vault-muted)" }}>
            Your application has been securely received and will be reviewed by The Vault's
            vetting team. You will be notified at{" "}
            {summary ? (
              <strong style={{ color: "var(--vault-text)" }}>{summary.email}</strong>
            ) : (
              "the email you provided"
            )}
            .
          </p>

          {submittedDate && (
            <p className="text-xs mt-2" style={{ color: "var(--vault-muted)" }}>
              Submitted {submittedDate}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: Application Summary */}
          <div className="md:col-span-3">
            <div
              className="p-5 border"
              style={{
                background: "var(--vault-surface)",
                borderColor: "var(--vault-border)",
                borderRadius: "4px",
              }}
            >
              <h2
                className="text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
              >
                Application Summary
              </h2>

              {summary ? (
                <div>
                  <SummaryRow label="Name / Handle" value={summary.displayName} />
                  <SummaryRow label="Email" value={summary.email} />

                  {(summary.organization || summary.orgRole) && (
                    <SummaryRow
                      label="Organization"
                      value={
                        [summary.orgRole, summary.organization]
                          .filter(Boolean)
                          .join(" at ") || "—"
                      }
                    />
                  )}

                  <SummaryRow label="Geographic Focus" value={summary.geographicFocus} />
                  <SummaryRow label="Output Type" value={summary.outputType} />

                  <SummaryRow
                    label="Investigation"
                    value={summary.investigationProject}
                    truncate
                  />

                  {summary.priorWorkCount > 0 && (
                    <SummaryRow
                      label="Prior Work"
                      value={`${summary.priorWorkCount} sample${summary.priorWorkCount !== 1 ? "s" : ""} submitted`}
                    />
                  )}

                  {/* Flags row */}
                  <div className="flex flex-wrap gap-2 pt-3 mt-1">
                    {summary.agreesToCredit && (
                      <Badge color="#27ae60">✓ Attribution agreed</Badge>
                    )}
                    {summary.useOpSec && (
                      <Badge color="var(--vault-gold)">🔒 OpSec tools declared</Badge>
                    )}
                    {summary.supportLink && (
                      <Badge color="var(--vault-gold-dim)">♥ Support link provided</Badge>
                    )}
                  </div>
                </div>
              ) : (
                /* Fallback when sessionStorage was cleared (e.g. page refresh) */
                <p className="text-sm" style={{ color: "var(--vault-muted)" }}>
                  Your application has been submitted. Check your email for confirmation.
                </p>
              )}
            </div>
          </div>

          {/* Right: Processing Timeline */}
          <div className="md:col-span-2">
            <div
              className="p-5 border"
              style={{
                background: "var(--vault-surface)",
                borderColor: "var(--vault-border)",
                borderRadius: "4px",
              }}
            >
              <h2
                className="text-xs tracking-widest uppercase mb-5"
                style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
              >
                What Happens Next
              </h2>
              <ProcessingTimeline />

              {/* Average processing time callout */}
              <div
                className="mt-4 p-3 border text-center"
                style={{
                  background: "rgba(201,168,76,0.05)",
                  borderColor: "rgba(201,168,76,0.2)",
                  borderRadius: "3px",
                }}
              >
                <p
                  className="text-xs tracking-wider uppercase mb-1"
                  style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
                >
                  Average Processing Time
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
                >
                  5–7
                </p>
                <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
                  business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What to do while you wait */}
        <div
          className="mt-6 p-5 border"
          style={{
            background: "var(--vault-surface)",
            borderColor: "var(--vault-border)",
            borderRadius: "4px",
          }}
        >
          <h2
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
          >
            While You Wait
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📧",
                title: "Check Your Email",
                desc: "Watch for a message from The Vault team. Check your spam folder if you don't hear from us within 7 business days.",
              },
              {
                icon: "🔒",
                title: "Maintain OpSec",
                desc: "Continue using secure communications. Do not discuss your application on unsecured channels.",
              },
              {
                icon: "📋",
                title: "Prepare Your Work",
                desc: "Gather any additional documentation, published articles, or evidence that supports your investigation.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p
                    className="text-xs tracking-wider uppercase mb-1"
                    style={{ color: "var(--vault-text)", fontFamily: "Cinzel, serif" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--vault-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-xs tracking-wider uppercase px-5 py-2.5 border transition-colors"
            style={{
              borderColor: "var(--vault-border)",
              color: "var(--vault-muted)",
              fontFamily: "Cinzel, serif",
              borderRadius: "2px",
            }}
          >
            ← Return to Home
          </button>

          <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
            Questions?{" "}
            <a
              href="mailto:vault@thevault.watch"
              style={{ color: "var(--vault-gold-dim)" }}
            >
              Contact the vetting team
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-12 py-8 text-center"
        style={{ borderColor: "var(--vault-border)" }}
      >
        <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
          The Vault — Secure Investigative Database &nbsp;·&nbsp; All submissions are encrypted and confidential
        </p>
        <p className="text-xs mt-3" style={{ color: "var(--vault-muted)" }}>
          Have information to share?&nbsp;
          <a
            href="/tip"
            style={{
              color: "var(--vault-gold)",
              textDecoration: "none",
              opacity: 0.75,
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "1px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
          >
            Submit a tip securely
          </a>
        </p>
      </footer>
    </div>
  );
}
