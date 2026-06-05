import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "fraud", label: "Fraud / Fabricated Records" },
  { value: "misuse_of_funds", label: "Misuse of Funds / Aid Diversion" },
  { value: "false_claims", label: "False Claims / Manufactured Poverty" },
  { value: "identity", label: "Identity / Background Concerns" },
  { value: "network", label: "Network / Coordinated Activity" },
  { value: "other", label: "Other" },
] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0d1117",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  padding: "0.625rem 0.75rem",
  color: "#ddd",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
};

export default function SubmitTip() {
  const [pseudonym, setPseudonym] = useState("");
  const [burnerEmail, setBurnerEmail] = useState("");
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submitMutation = trpc.tips.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setFormError(err.message || "Submission failed. Please try again."),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileError("");
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_BYTES) {
      setFileError("File exceeds 10 MB limit. Please compress or split the document.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const allowed = [
      "application/pdf", "image/jpeg", "image/png", "image/gif", "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setFileError("Unsupported file type. Accepted: PDF, JPG, PNG, GIF, TXT, DOC, DOCX.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!category) { setFormError("Please select a category."); return; }
    if (subject.trim().length < 5) { setFormError("Subject must be at least 5 characters."); return; }
    if (message.trim().length < 20) { setFormError("Message must be at least 20 characters."); return; }

    let fileBase64: string | undefined;
    let fileName: string | undefined;
    let fileMime: string | undefined;

    if (file) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      fileBase64 = btoa(binary);
      fileName = file.name;
      fileMime = file.type;
    }

    submitMutation.mutate({
      pseudonym: pseudonym.trim() || undefined,
      burnerEmail: burnerEmail.trim() || undefined,
      category: category as "fraud" | "misuse_of_funds" | "false_claims" | "identity" | "network" | "other",
      subject: subject.trim(),
      message: message.trim(),
      fileBase64,
      fileName,
      fileMime,
    });
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</div>
          <h1 style={{ color: "#c9a84c", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
            Tip Received Securely
          </h1>
          <p style={{ color: "#aaa", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Your submission has been received. No confirmation email will be sent — this is intentional to protect your identity.
          </p>
          <p style={{ color: "#888", fontSize: "0.9rem", lineHeight: 1.7 }}>
            If you provided a contact method and we need to follow up, we will reach out through your preferred channel. You may now close this tab.
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/" style={{ color: "#c9a84c", textDecoration: "none", fontSize: "0.9rem" }}>
              ← Return to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem" }}>
            ← The Vault Investigates
          </Link>
          <h1 style={{ color: "#c9a84c", fontSize: "1.75rem", fontWeight: 700, margin: "1rem 0 0.25rem" }}>
            Submit a Confidential Tip
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>The Vault Investigates / TruthDrop.io</p>
        </div>

        {/* Security Instructions */}
        <div style={{
          background: "#0d1117",
          border: "1px solid #2a2a2a",
          borderLeft: "3px solid #c9a84c",
          borderRadius: "6px",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
        }}>
          <h2 style={{ color: "#c9a84c", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Before You Submit — Security Instructions
          </h2>
          <ul style={{ color: "#aaa", fontSize: "0.875rem", lineHeight: 1.8, paddingLeft: "1.25rem", margin: 0 }}>
            <li>
              <strong style={{ color: "#ddd" }}>
                <a href="https://www.torproject.org/download/" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c", textDecoration: "underline", textDecorationColor: "rgba(201,168,76,0.4)" }}>Tor Browser</a>
                {" "}or a VPN
              </strong>{" "}is recommended for high-risk submissions — this form is HTTPS-encrypted, but your ISP can see that you visited this site. Download Tor Browser free at{" "}
              <a href="https://www.torproject.org" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c", textDecoration: "underline", textDecorationColor: "rgba(201,168,76,0.4)" }}>torproject.org</a>.
            </li>
            <li>
              <strong style={{ color: "#ddd" }}>Do not use your real name or work email.</strong> The pseudonym and contact fields below are optional. Leave them blank for full anonymity.
            </li>
            <li>
              <strong style={{ color: "#ddd" }}>Strip metadata from documents</strong> before uploading. PDFs and images often contain author name, GPS coordinates, and device identifiers. Use MAT2 or ExifTool to clean files.
            </li>
            <li>
              <strong style={{ color: "#ddd" }}>Your IP address is never stored.</strong> Only a one-way cryptographic hash is kept for abuse prevention — it cannot be reversed to identify you.
            </li>
            <li>
              <strong style={{ color: "#ddd" }}>No confirmation email will be sent.</strong> This is intentional. A confirmation email creates a paper trail.
            </li>
            <li>
              <strong style={{ color: "#ddd" }}>For secure follow-up contact,</strong> use a Signal number or a ProtonMail address created over Tor.
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Optional identity */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ color: "#ccc", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Optional — Contact Information
            </h3>
            <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "1rem" }}>
              Both fields are completely optional. Leave blank to submit anonymously.
            </p>
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  Pseudonym <span style={{ color: "#555" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={pseudonym}
                  onChange={e => setPseudonym(e.target.value)}
                  placeholder="e.g. Concerned Insider"
                  maxLength={100}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  Burner / Secure Email <span style={{ color: "#555" }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={burnerEmail}
                  onChange={e => setBurnerEmail(e.target.value)}
                  placeholder="e.g. anon@protonmail.com"
                  maxLength={320}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
              Category <span style={{ color: "#c9a84c" }}>*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— Select a category —</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
              Subject <span style={{ color: "#c9a84c" }}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of the tip"
              minLength={5}
              maxLength={500}
              required
              style={inputStyle}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
              Message <span style={{ color: "#c9a84c" }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe what you know. Include names, dates, locations, and any specific evidence you have observed."
              minLength={20}
              maxLength={10000}
              required
              rows={10}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.25rem", textAlign: "right" }}>
              {message.length} / 10,000
            </div>
          </div>

          {/* File upload */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
              Supporting Document <span style={{ color: "#555" }}>(optional — max 10 MB)</span>
            </label>
            <p style={{ color: "#555", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
              Accepted: PDF, JPG, PNG, GIF, TXT, DOC, DOCX. Strip metadata before uploading.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
              onChange={handleFileChange}
              style={{ color: "#aaa", fontSize: "0.85rem" }}
            />
            {file && (
              <div style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
            {fileError && (
              <div style={{ color: "#e05252", fontSize: "0.8rem", marginTop: "0.4rem" }}>{fileError}</div>
            )}
          </div>

          {formError && (
            <div style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: "4px", padding: "0.75rem 1rem", color: "#e05252", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: submitMutation.isPending ? "#555" : "#c9a84c",
              color: "#050505",
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: submitMutation.isPending ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitMutation.isPending ? "Submitting securely…" : "Submit Tip Securely"}
          </button>

          <p style={{ color: "#444", fontSize: "0.75rem", textAlign: "center", marginTop: "1rem", lineHeight: 1.6 }}>
            This form is encrypted in transit (HTTPS). Your IP address is never stored. No tracking scripts are loaded on this page.
          </p>
        </form>
      </div>

      {/* Support Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d0c08 0%, #120f06 50%, #0d0c08 100%)",
          borderTop: "1px solid #2a2010",
          padding: "40px 24px",
          textAlign: "center",
          marginTop: "2rem",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{
            color: "#e5c97e",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 4,
            margin: "0 0 12px",
            fontFamily: "Cinzel, serif",
          }}>
            Support Independent Investigative Journalism
          </p>
          <h3 style={{
            color: "#fff",
            fontSize: "clamp(16px, 3vw, 22px)",
            fontWeight: "normal",
            fontFamily: "Cinzel, serif",
            margin: "0 0 10px",
            lineHeight: 1.4,
          }}>
            Your tip matters. Support our independent research.
          </h3>
          <p style={{
            color: "#888",
            fontSize: 14,
            lineHeight: 1.8,
            margin: "0 0 24px",
            fontFamily: "EB Garamond, serif",
          }}>
            The Vault Investigates is reader-supported.
            If you find this research valuable, consider supporting our independent infrastructure.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://gofund.me/3a4e564d5"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#00b964",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 0.5,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              ❤ Support on GoFundMe
            </a>
            <a
              href="https://buymeacoffee.com/thevaultinvestigates"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#FFDD00",
                color: "#000",
                padding: "12px 24px",
                borderRadius: 6,
                textDecoration: "none",
                fontFamily: "Cinzel, serif",
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 0.5,
                transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              ☕ Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
