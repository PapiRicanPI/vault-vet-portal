import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: publicStats } = trpc.stats.public.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache 5 minutes — no need to hammer the DB
  });
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (token) {
      setInviteToken(token);
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--vault-black)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--vault-border)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030563274/8pjFw3h3P7WVQwFs3j6pN5/vault-logo_1d096394.png"
              alt="The Vault Investigates"
              className="h-10 w-auto object-contain"
            />
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="/receipts"
              className="text-xs tracking-wider uppercase transition-colors hover:opacity-80"
              style={{
                color: "var(--vault-muted)",
                fontFamily: "Cinzel, serif",
              }}
            >
              Receipts
            </a>
            <button
              onClick={() => navigate("/admin")}
              className="text-xs tracking-wider uppercase px-3 py-1.5 border transition-colors"
              style={{
                borderColor: "var(--vault-border)",
                color: "var(--vault-muted)",
                fontFamily: "Cinzel, serif",
              }}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      {/* Support Strip — above the fold */}
      <div
        style={{
          background: "linear-gradient(90deg, #0a0900 0%, #1a1400 50%, #0a0900 100%)",
          borderBottom: "1px solid #2a2010",
          padding: "12px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{
            color: "#c9a84c",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 3,
            fontFamily: "Cinzel, serif",
            whiteSpace: "nowrap",
          }}>
            Support the Work
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="https://gofund.me/3a4e564d5"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#00b964",
                color: "#fff",
                padding: "6px 16px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              ❤ GoFundMe
            </a>
            <a
              href="https://buymeacoffee.com/thevaultinvestigates"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#FFDD00",
                color: "#000",
                padding: "6px 16px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              ☕ Buy Me a Coffee
            </a>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent("Support The Vault Investigates — independent journalism exposing how poverty is exploited. Every contribution keeps this work alive.")}&url=${encodeURIComponent("https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                color: "#c9a84c",
                padding: "6px 14px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                border: "1px solid #2a2010",
                transition: "opacity 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.borderColor = "#c9a84c"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "#2a2010"; }}
            >
              𝕏 Share
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#1877F2",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              f Share
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Support The Vault Investigates — independent journalism exposing how poverty is exploited. Every contribution keeps this work alive. " + "https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#25D366",
                color: "#fff",
                padding: "6px 14px",
                borderRadius: 4,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero logo */}
        <div className="text-center mb-12">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030563274/8pjFw3h3P7WVQwFs3j6pN5/vault-logo_1d096394.png"
            alt="The Vault Investigates — Exposing How Poverty Is Exploited"
            className="mx-auto mb-4 vault-hero-logo"
            style={{ maxWidth: "420px", width: "100%", borderRadius: "4px" }}
          />
          <div
            className="w-24 h-px mx-auto mt-4"
            style={{ background: "linear-gradient(90deg, transparent, var(--vault-gold-dim), transparent)" }}
          />
        </div>

        {/* Invitation banner */}
        {inviteToken && (
          <div
            className="mb-8 px-5 py-4 border text-sm"
            style={{
              background: "rgba(201, 168, 76, 0.06)",
              borderColor: "var(--vault-gold-dim)",
              borderRadius: "4px",
              color: "var(--vault-text)",
            }}
          >
            <span style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", fontSize: "11px", letterSpacing: "0.1em" }}>
              INVITATION RECEIVED
            </span>
            <p className="mt-1 text-sm" style={{ color: "var(--vault-muted)" }}>
              You have been personally invited to apply for access to The Vault investigative database.
              Your application will be reviewed by our vetting team.
            </p>
          </div>
        )}

        {/* Description */}
        <div
          className="mb-10 p-6 border"
          style={{
            background: "var(--vault-surface)",
            borderColor: "var(--vault-border)",
            borderRadius: "4px",
          }}
        >
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: "var(--vault-text)", fontFamily: "EB Garamond, serif", fontSize: "17px" }}
          >
            The Vault is a restricted investigative database maintained for verified journalists,
            researchers, and whistleblowers working on matters of public interest. Access is granted
            through a careful vetting process to protect both the integrity of the data and the
            safety of those who use it.
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--vault-muted)", fontFamily: "EB Garamond, serif", fontSize: "15px" }}
          >
            This application is anonymous-friendly. You may use a pseudonym or handle in place of
            your legal name. Your safety is our priority — we understand the risks inherent in
            investigative work.
          </p>
        </div>

        {/* Platform Activity Counter */}
        {publicStats && (publicStats.approvedResearchers > 0 || publicStats.tipsReceived > 0) && (
          <div
            className="mb-10 p-5 border"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.04) 0%, var(--vault-surface) 100%)",
              borderColor: "var(--vault-gold-dim)",
              borderRadius: "4px",
            }}
          >
            <div
              className="text-xs tracking-widest uppercase mb-4 text-center"
              style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif", letterSpacing: "0.15em" }}
            >
              Platform Activity
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--vault-gold)", fontFamily: "Cinzel, serif", lineHeight: 1 }}>
                  {publicStats.approvedResearchers}
                </div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--vault-muted)", marginTop: "0.4rem", fontFamily: "Cinzel, serif" }}>
                  Vetted Researchers
                </div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--vault-gold)", fontFamily: "Cinzel, serif", lineHeight: 1 }}>
                  {publicStats.countriesRepresented || "—"}
                </div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--vault-muted)", marginTop: "0.4rem", fontFamily: "Cinzel, serif" }}>
                  Countries Represented
                </div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--vault-gold)", fontFamily: "Cinzel, serif", lineHeight: 1 }}>
                  {publicStats.tipsReceived}
                </div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--vault-muted)", marginTop: "0.4rem", fontFamily: "Cinzel, serif" }}>
                  Tips Received
                </div>
              </div>
            </div>
            <p style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--vault-muted)", marginTop: "0.75rem", fontStyle: "italic" }}>
              All researchers are individually vetted. No PII is ever displayed publicly.
            </p>
          </div>
        )}

        {/* What to expect */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: "🔒",
              title: "Anonymous-Friendly",
              desc: "Use a pseudonym or handle. No legal name required.",
            },
            {
              icon: "⚖️",
              title: "Careful Review",
              desc: "Applications are reviewed by our team within 5–7 business days.",
            },
            {
              icon: "🛡️",
              title: "Safety First",
              desc: "We take operational security seriously. Your data is protected.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-4 border text-center"
              style={{
                background: "var(--vault-surface)",
                borderColor: "var(--vault-border)",
                borderRadius: "4px",
              }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3
                className="text-xs tracking-wider uppercase mb-2"
                style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
              >
                {item.title}
              </h3>
              <p className="text-xs" style={{ color: "var(--vault-muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Application sections overview */}
        <div
          className="mb-10 p-5 border"
          style={{
            background: "var(--vault-surface)",
            borderColor: "var(--vault-border)",
            borderRadius: "4px",
          }}
        >
          <h3
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: "var(--vault-gold)", fontFamily: "Cinzel, serif" }}
          >
            Application Sections
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              "I. Identity & Contact",
              "II. Organization",
              "III. Prior Work",
              "IV. Investigation Purpose",
              "V. Support & Attribution",
              "VI. Safety & Risk",
              "VII. Terms & Consent",
            ].map((section) => (
              <div
                key={section}
                className="text-xs py-1.5 px-2"
                style={{ color: "var(--vault-muted)", borderLeft: "2px solid var(--vault-border)" }}
              >
                {section}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate(inviteToken ? `/apply?invite=${inviteToken}` : "/apply")}
            className="inline-block px-10 py-4 text-sm tracking-widest uppercase transition-all hover:scale-[1.02]"
            style={{
              background: "var(--vault-gold)",
              color: "#050505",
              fontFamily: "Cinzel, serif",
              fontWeight: "600",
              borderRadius: "2px",
            }}
          >
            Begin Application
          </button>
          <p className="mt-4 text-xs" style={{ color: "var(--vault-muted)" }}>
            Estimated completion time: 10–15 minutes
          </p>
        </div>
      </main>

      {/* Support CTA Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d0c08 0%, #120f06 50%, #0d0c08 100%)",
          borderTop: "1px solid #2a2010",
          borderBottom: "1px solid #2a2010",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Eyebrow */}
          <p style={{
            color: "#e5c97e",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 4,
            margin: "0 0 14px",
            fontFamily: "Cinzel, serif",
          }}>
            Support Independent Investigative Journalism
          </p>

          {/* Headline */}
          <h2 style={{
            color: "#fff",
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: "normal",
            fontFamily: "Cinzel, serif",
            margin: "0 0 14px",
            lineHeight: 1.3,
          }}>
            This work is reader-supported.
          </h2>

          {/* Body */}
          <p style={{
            color: "#aaa",
            fontSize: 15,
            lineHeight: 1.8,
            margin: "0 0 32px",
            fontFamily: "EB Garamond, serif",
          }}>
            The Vault Investigates is an independent, reader-supported project with no corporate
            backing. Every contribution and tip — no matter the size — directly funds server costs,
            secure infrastructure, and the time it takes to do this work right.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {/* GoFundMe */}
            <a
              href="https://gofund.me/3a4e564d5"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#00b964",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              </svg>
              Support on GoFundMe
            </a>

            {/* Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com/thevaultinvestigates"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#FFDD00",
                color: "#000",
                padding: "14px 28px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ fontSize: 18 }}>☕</span>
              Buy Me a Coffee
            </a>

            {/* Share on X/Twitter */}
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent("Support The Vault Investigates — independent journalism exposing how poverty is exploited. Every contribution keeps this work alive.")}&url=${encodeURIComponent("https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                color: "#c9a84c",
                padding: "14px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
                border: "1px solid #2a2010",
                transition: "opacity 0.2s, transform 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = "#c9a84c"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#2a2010"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on 𝕏
            </a>

            {/* Share on Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#1877F2",
                color: "#fff",
                padding: "14px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Share on Facebook
            </a>

            {/* Share on WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Support The Vault Investigates — independent journalism exposing how poverty is exploited. Every contribution keeps this work alive. https://gofund.me/3a4e564d5")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#25D366",
                color: "#fff",
                padding: "14px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 13,
                fontWeight: "bold",
                letterSpacing: 1,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </a>
          </div>

          {/* Reassurance line */}
          <p style={{
            color: "#444",
            fontSize: 12,
            margin: "20px 0 0",
            fontStyle: "italic",
          }}>
            Contributions go directly to the investigation. No middlemen. No corporate sponsors.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="border-t mt-16 py-8 text-center"
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
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <a
            href="/donate"
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
            Support the work
          </a>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <a
            href="/volunteer"
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
            Volunteer — Manila Students
          </a>
        </p>
      </footer>
    </div>
  );
}
