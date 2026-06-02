/**
 * Donate.tsx — Support the Investigation (Rephrased for Compliance)
 * Professional support page for The Vault Investigates / TruthDrop.io
 */

import { useState } from "react";
import { Link } from "wouter";

const KOFI_URL = "https://ko-fi.com/thevaultinvestigates";
const BMC_URL = "https://buymeacoffee.com/thevaultinvestigates";
const PAYPAL_ANNUAL_URL = "https://www.paypal.com/ncp/payment/JH4X7243NJMRE";

interface Tier {
  id: string;
  amount: string;
  label: string;
  description: string;
  impact: string;
  url: string;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: "source",
    amount: "$10",
    label: "Source Protection",
    description: "One-time · via Ko-fi",
    impact: "Keeps the secure tip line running — encrypted submissions, zero logging, safe for whistleblowers.",
    url: KOFI_URL,
  },
  {
    id: "field",
    amount: "$25",
    label: "Field Support",
    description: "One-time · via Ko-fi",
    impact: "Funds one complete case file — FOIA requests, database access, and document verification.",
    url: KOFI_URL,
  },
  {
    id: "investigator",
    amount: "$50",
    label: "Investigator",
    description: "One-time · via Buy Me a Coffee",
    impact: "Sustains one month of active research — server costs, secure infrastructure, and investigative tools.",
    url: BMC_URL,
    badge: "Most Impactful",
  },
  {
    id: "patron",
    amount: "$60",
    label: "Founding Patron",
    description: "Annual · via PayPal",
    impact: "Sustains the full investigation for a year. Founding Patrons are acknowledged in our annual transparency report.",
    url: PAYPAL_ANNUAL_URL,
    badge: "Annual",
  },
];

const SECONDARY = [
  { label: "Ko-fi", url: KOFI_URL },
  { label: "Buy Me a Coffee", url: BMC_URL },
  { label: "PayPal", url: PAYPAL_ANNUAL_URL },
];

const gold = "var(--vault-gold, #b49632)";
const cream = "var(--vault-cream, #f0e6c8)";
const black = "var(--vault-black, #050505)";

export default function Donate() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleTierClick = (tier: Tier) => {
    setSelectedTier(tier.id);
    window.open(tier.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ minHeight: "100vh", background: black, color: cream, fontFamily: "'Georgia', serif" }}>

      {/* Navigation */}
      <nav style={{ borderBottom: "1px solid rgba(180,150,50,0.2)", padding: "1rem 2rem", display: "flex", alignItems: "center" }}>
        <Link href="/">
          <span style={{ color: gold, fontFamily: "'Cinzel', serif", fontSize: "0.82rem", letterSpacing: "0.1em", cursor: "pointer", opacity: 0.8 }}>
            ← The Vault Investigates
          </span>
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 2rem 2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.28em", color: gold, textTransform: "uppercase", marginBottom: "1.25rem" }}>
          Independent Investigative Journalism
        </p>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(1.8rem, 4vw, 2.7rem)", fontWeight: 700, color: cream, lineHeight: 1.2, marginBottom: "1.5rem" }}>
          Support the Work That<br />Power Doesn't Want Done
        </h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(240,230,200,0.72)", maxWidth: "560px", margin: "0 auto 1rem" }}>
          The Vault Investigates is an independent, reader-supported project documenting how poverty is
          exploited — from fraudulent benefit schemes to institutional neglect. No advertisers.
          No corporate backers. No agenda except the truth.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(240,230,200,0.48)", maxWidth: "520px", margin: "0 auto 3rem" }}>
          Your tips and support fund secure infrastructure for whistleblowers, FOIA requests,
          database access, and the time it takes to verify every claim before publication.
        </p>
        <div style={{ width: "50px", height: "1px", background: gold, margin: "0 auto 3rem", opacity: 0.45 }} />
      </div>

      {/* Tier Cards */}
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "0 2rem 3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: "1.2rem" }}>
        {TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => handleTierClick(tier)}
              style={{
                background: isSelected ? "rgba(180,150,50,0.10)" : "rgba(255,255,255,0.025)",
                border: isSelected ? "1px solid rgba(180,150,50,0.55)" : "1px solid rgba(180,150,50,0.16)",
                borderRadius: "6px",
                padding: "1.75rem 1.4rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                position: "relative",
                color: "inherit",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.border = "1px solid rgba(180,150,50,0.5)";
                el.style.background = "rgba(180,150,50,0.07)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                if (!isSelected) {
                  el.style.border = "1px solid rgba(180,150,50,0.16)";
                  el.style.background = "rgba(255,255,255,0.025)";
                }
              }}
            >
              {tier.badge && (
                <span style={{ position: "absolute", top: "-10px", right: "14px", background: gold, color: "#050505", fontSize: "0.58rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", padding: "2px 10px", borderRadius: "20px", textTransform: "uppercase", fontWeight: 700 }}>
                  {tier.badge}
                </span>
              )}
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "2rem", fontWeight: 700, color: gold, marginBottom: "0.2rem", lineHeight: 1 }}>{tier.amount}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.82rem", letterSpacing: "0.05em", color: cream, marginBottom: "0.2rem" }}>{tier.label}</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(240,230,200,0.38)", marginBottom: "1rem", fontStyle: "italic" }}>{tier.description}</div>
              <div style={{ height: "1px", background: "rgba(180,150,50,0.18)", marginBottom: "1rem" }} />
              <p style={{ fontSize: "0.78rem", lineHeight: 1.65, color: "rgba(240,230,200,0.62)", margin: 0 }}>{tier.impact}</p>
              <div style={{ marginTop: "1.25rem", fontSize: "0.72rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: gold, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                Support at {tier.amount} <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* About the Investigator */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <div style={{ borderLeft: "2px solid rgba(180,150,50,0.35)", paddingLeft: "1.5rem" }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.2em", color: gold, textTransform: "uppercase", marginBottom: "1rem" }}>
            About the Investigator
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.85, color: "rgba(240,230,200,0.68)", marginBottom: "1rem" }}>
            This investigation is run by one person. There is no newsroom, no grant funding,
            no editorial budget. Every dollar spent on servers, databases, FOIA fees, and
            secure infrastructure comes out of a Social Security check and VA Disability benefit.
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.85, color: "rgba(240,230,200,0.68)", marginBottom: "1rem" }}>
            I am not asking for charity. I am asking you to support journalism that the people
            being investigated would prefer did not exist. The cases in this database represent
            real harm to real people — and they deserve a record that does not disappear.
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.85, color: "rgba(240,230,200,0.68)", margin: 0 }}>
            If you have ever been failed by a system that was supposed to protect you,
            this work is for you. If you can afford to help keep it running, I am grateful.
          </p>
        </div>
      </div>

      {/* How Funds Are Used */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 3rem" }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.22em", color: gold, textTransform: "uppercase", marginBottom: "1.25rem", textAlign: "center" }}>
          Where Your Support Goes
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {[
            { pct: "40%", label: "Secure Infrastructure", detail: "Encrypted servers, tip line hosting, S3 storage, and database costs" },
            { pct: "30%", label: "FOIA & Records", detail: "Public records requests, court document fees, and database subscriptions" },
            { pct: "20%", label: "Research Tools", detail: "Investigative software, document verification, and case management" },
            { pct: "10%", label: "Operations", detail: "Domain, email security, and essential administrative costs" },
          ].map((item) => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,150,50,0.12)", borderRadius: "6px", padding: "1.1rem 1rem" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.5rem", fontWeight: 700, color: gold, marginBottom: "0.3rem" }}>{item.pct}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.05em", color: "rgba(240,230,200,0.85)", marginBottom: "0.5rem" }}>{item.label}</div>
              <p style={{ fontSize: "0.72rem", color: "rgba(240,230,200,0.45)", lineHeight: 1.55, margin: 0 }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social Share */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.22em", color: gold, textTransform: "uppercase", marginBottom: "1rem" }}>
          Help Spread the Word
        </p>
        <p style={{ fontSize: "0.8rem", color: "rgba(240,230,200,0.45)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
          Sharing this page costs nothing and reaches people who might care about this work.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href={`https://twitter.com/intent/tweet?text=Support%20independent%20investigative%20journalism%20exposing%20poverty%20fraud.%20Reader-supported%2C%20no%20corporate%20backing.&url=${encodeURIComponent("https://vet.thevaultinvestigates.cloud/donate")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,150,50,0.2)", borderRadius: "4px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "rgba(240,230,200,0.7)", textDecoration: "none", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(180,150,50,0.1)"; (e.currentTarget as HTMLAnchorElement).style.color = cream; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,230,200,0.7)"; }}
          >
            𝕏 Share on X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://vet.thevaultinvestigates.cloud/donate")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,150,50,0.2)", borderRadius: "4px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "rgba(240,230,200,0.7)", textDecoration: "none", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(180,150,50,0.1)"; (e.currentTarget as HTMLAnchorElement).style.color = cream; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,230,200,0.7)"; }}
          >
            f Share on Facebook
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText("https://vet.thevaultinvestigates.cloud/donate");
              const btn = document.getElementById("copy-btn");
              if (btn) { btn.textContent = "✓ Copied!"; setTimeout(() => { btn.textContent = "⧉ Copy Link"; }, 2000); }
            }}
            id="copy-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,150,50,0.2)", borderRadius: "4px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "rgba(240,230,200,0.7)", cursor: "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", transition: "all 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(180,150,50,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = cream; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,230,200,0.7)"; }}
          >
            ⧉ Copy Link
          </button>
        </div>
      </div>

      {/* Secondary links */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "rgba(240,230,200,0.35)", marginBottom: "1rem", fontStyle: "italic" }}>
          All platforms accepted — choose what works for you
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {SECONDARY.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.76rem", color: "rgba(240,230,200,0.45)", textDecoration: "none", borderBottom: "1px solid rgba(240,230,200,0.18)", paddingBottom: "1px", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(240,230,200,0.85)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,230,200,0.45)")}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* Trust signals */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 2rem", borderTop: "1px solid rgba(180,150,50,0.1)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1.5rem", textAlign: "center" }}>
        {[
          { icon: "🔒", label: "Secure Payments", detail: "All transactions processed securely by trusted payment platforms" },
          { icon: "📋", label: "Transparent Use", detail: "Funds go directly to infrastructure and investigation costs" },
          { icon: "🛡️", label: "No Corporate Backing", detail: "100% reader-supported — no advertisers, no conflicts of interest" },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{item.icon}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.08em", color: gold, marginBottom: "0.4rem" }}>{item.label}</div>
            <p style={{ fontSize: "0.73rem", color: "rgba(240,230,200,0.42)", lineHeight: 1.55, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(180,150,50,0.1)", padding: "1.5rem 2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", color: "rgba(240,230,200,0.28)", margin: 0 }}>
          The Vault Investigates — Exposing How Poverty Is Exploited ·{" "}
          <Link href="/"><span style={{ color: "rgba(180,150,50,0.5)", cursor: "pointer" }}>Home</span></Link>{" "}
          ·{" "}
          <Link href="/tip"><span style={{ color: "rgba(180,150,50,0.5)", cursor: "pointer" }}>Submit a Tip</span></Link>
        </p>
      </footer>
    </div>
  );
}
