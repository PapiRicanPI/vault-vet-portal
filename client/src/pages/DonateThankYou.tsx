/**
 * DonateThankYou.tsx — Thank You for Supporting the Investigation
 */

import { Link } from "wouter";

const gold = "rgba(180,150,50,1)";
const cream = "rgba(240,230,200,0.92)";

export default function DonateThankYou() {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: cream, fontFamily: "'EB Garamond', Georgia, serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(180,150,50,0.15)", padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/">
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.78rem", letterSpacing: "0.18em", color: "rgba(180,150,50,0.7)", cursor: "pointer", textTransform: "uppercase" }}>
            ← The Vault Investigates
          </span>
        </Link>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "5rem 2rem 4rem", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>🛡️</div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(1.4rem, 4vw, 2rem)",
          fontWeight: 400,
          letterSpacing: "0.12em",
          color: gold,
          marginBottom: "1rem",
          lineHeight: 1.3,
        }}>
          Thank You for Supporting<br />the Investigation
        </h1>

        {/* Divider */}
        <div style={{ width: "48px", height: "1px", background: gold, margin: "0 auto 2rem", opacity: 0.5 }} />

        {/* Message */}
        <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(240,230,200,0.75)", marginBottom: "1.5rem" }}>
          Your support goes directly toward keeping this investigation running — secure infrastructure, public records requests, and the tools that protect sources.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(240,230,200,0.55)", marginBottom: "2.5rem" }}>
          This work is funded entirely by readers like you. No corporate backing. No advertisers. Just people who believe accountability journalism matters.
        </p>

        {/* What happens next */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(180,150,50,0.15)", borderRadius: "6px", padding: "1.75rem", marginBottom: "2.5rem", textAlign: "left" }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.2em", color: gold, textTransform: "uppercase", marginBottom: "1.1rem" }}>
            What Happens Next
          </p>
          {[
            "Your payment is processed securely by the platform you chose.",
            "Funds are applied directly to infrastructure and investigation costs.",
            "Founding Patrons ($60/year) will be acknowledged in our annual transparency report.",
            "You can submit a tip at any time — your support does not affect tip confidentiality.",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: i < 3 ? "0.85rem" : 0 }}>
              <span style={{ color: gold, flexShrink: 0, marginTop: "0.15rem" }}>›</span>
              <p style={{ fontSize: "0.82rem", color: "rgba(240,230,200,0.6)", lineHeight: 1.65, margin: 0 }}>{item}</p>
            </div>
          ))}
        </div>

        {/* Share prompt */}
        <p style={{ fontSize: "0.82rem", color: "rgba(240,230,200,0.45)", marginBottom: "1.25rem" }}>
          Know someone who cares about accountability journalism? Share this page.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "3rem" }}>
          <a
            href={`https://twitter.com/intent/tweet?text=I%20just%20supported%20The%20Vault%20Investigates%20%E2%80%94%20independent%20journalism%20exposing%20poverty%20fraud.%20Reader-supported%2C%20no%20corporate%20backing.&url=${encodeURIComponent("https://vet.thevaultinvestigates.cloud/donate")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,150,50,0.2)", borderRadius: "4px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "rgba(240,230,200,0.7)", textDecoration: "none", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}
          >
            𝕏 Share on X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://vet.thevaultinvestigates.cloud/donate")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,150,50,0.2)", borderRadius: "4px", padding: "0.55rem 1rem", fontSize: "0.75rem", color: "rgba(240,230,200,0.7)", textDecoration: "none", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}
          >
            f Share on Facebook
          </a>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
          <Link href="/">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(180,150,50,0.65)", cursor: "pointer", textDecoration: "none", borderBottom: "1px solid rgba(180,150,50,0.25)", paddingBottom: "1px" }}>
              Return Home
            </span>
          </Link>
          <Link href="/tip">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(180,150,50,0.65)", cursor: "pointer", textDecoration: "none", borderBottom: "1px solid rgba(180,150,50,0.25)", paddingBottom: "1px" }}>
              Submit a Tip
            </span>
          </Link>
          <Link href="/apply">
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(180,150,50,0.65)", cursor: "pointer", textDecoration: "none", borderBottom: "1px solid rgba(180,150,50,0.25)", paddingBottom: "1px" }}>
              Apply for Access
            </span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(180,150,50,0.1)", padding: "1.5rem 2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", color: "rgba(240,230,200,0.28)", margin: 0 }}>
          The Vault Investigates — Exposing How Poverty Is Exploited ·{" "}
          <Link href="/donate"><span style={{ color: "rgba(180,150,50,0.5)", cursor: "pointer" }}>Support the Work</span></Link>
        </p>
      </footer>
    </div>
  );
}
