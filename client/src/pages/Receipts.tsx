// /receipts — Public Records Repository
// Deployed exactly as provided by the user. Do not modify this file.

const receiptsHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipts — The Vault Investigates</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --text-primary: #1a1a18;
    --text-secondary: #5F5E5A;
    --text-tertiary: #888780;
    --bg-primary: #ffffff;
    --bg-secondary: #F7F6F2;
    --bg-tertiary: #F1EFE8;
    --border-light: rgba(26,26,24,0.12);
    --border-mid: rgba(26,26,24,0.22);
    --red-bg: #FCEBEB;
    --red-text: #A32D2D;
    --blue-bg: #E6F1FB;
    --blue-text: #185FA5;
    --gray-bg: #F1EFE8;
    --gray-text: #5F5E5A;
    --radius-md: 8px;
    --radius-lg: 12px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --text-primary: #E8E6DF;
      --text-secondary: #B4B2A9;
      --text-tertiary: #888780;
      --bg-primary: #1C1C1A;
      --bg-secondary: #242422;
      --bg-tertiary: #2C2C2A;
      --border-light: rgba(232,230,223,0.10);
      --border-mid: rgba(232,230,223,0.20);
      --red-bg: #501313;
      --red-text: #F09595;
      --blue-bg: #042C53;
      --blue-text: #85B7EB;
      --gray-bg: #2C2C2A;
      --gray-text: #B4B2A9;
    }
  }

  body {
    font-family: 'Source Serif 4', Georgia, serif;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    min-height: 100vh;
    padding: 3rem 1.5rem;
  }

  .page {
    max-width: 780px;
    margin: 0 auto;
  }

  /* Masthead */
  .masthead {
    border-bottom: 2px solid var(--text-primary);
    padding-bottom: 1.25rem;
    margin-bottom: 2.5rem;
  }

  .masthead-eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 0.6rem;
  }

  .masthead-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 42px;
    font-weight: 700;
    line-height: 1.05;
    margin-bottom: 0.6rem;
  }

  .masthead-sub {
    font-size: 14px;
    color: var(--text-secondary);
    font-style: italic;
    line-height: 1.65;
  }

  /* Section labels */
  .section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 2.5rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 0.5px solid var(--border-light);
  }

  /* Case cards */
  .case-card {
    background: var(--bg-primary);
    border: 0.5px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
  }

  .case-card.confirmed { border-left: 3px solid var(--red-text); }
  .case-card.inquiry   { border-left: 3px solid var(--blue-text); }
  .case-card.pending   { border-left: 3px solid var(--text-tertiary); opacity: 0.72; }

  .case-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .case-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  }

  .badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .badge-confirmed { background: var(--red-bg);  color: var(--red-text); }
  .badge-inquiry   { background: var(--blue-bg); color: var(--blue-text); }
  .badge-pending   { background: var(--gray-bg); color: var(--gray-text); }

  .case-meta {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.5rem;
  }

  .case-desc {
    font-size: 14px;
    color: var(--text-secondary);
    font-style: italic;
    line-height: 1.65;
    margin-bottom: 1rem;
  }

  /* Violations list */
  .violations {
    margin-bottom: 1rem;
    border-top: 0.5px solid var(--border-light);
  }

  .v-row {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding: 5px 0;
    border-bottom: 0.5px solid var(--border-light);
    font-size: 13px;
    line-height: 1.5;
  }

  .v-num {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: var(--text-tertiary);
    min-width: 20px;
    flex-shrink: 0;
  }

  /* Buttons */
  .btn-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 7px 14px;
    border-radius: 4px;
    border: 0.5px solid var(--border-mid);
    background: var(--bg-secondary);
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    display: inline-block;
    transition: background 0.15s;
  }

  .btn:hover { background: var(--bg-tertiary); }

  .btn-primary {
    background: var(--text-primary);
    color: var(--bg-primary);
    border-color: var(--text-primary);
  }

  .btn-primary:hover { opacity: 0.82; background: var(--text-primary); }

  /* Coming soon cards */
  .coming-card {
    background: var(--bg-secondary);
    border: 0.5px dashed var(--border-mid);
    border-radius: var(--radius-lg);
    padding: 1rem 1.5rem;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .coming-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 16px;
    color: var(--text-secondary);
  }

  .coming-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  /* Tip box */
  .tip-box {
    margin-top: 2.5rem;
    border: 0.5px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    background: var(--bg-secondary);
  }

  .tip-box-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .tip-box-text {
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-primary);
  }

  .tip-box-text a {
    color: var(--text-primary);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
  }

  /* Footer */
  .footer {
    margin-top: 3rem;
    padding-top: 1.25rem;
    border-top: 0.5px solid var(--border-light);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-tertiary);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .footer a { color: var(--text-tertiary); text-decoration: none; }
  .footer a:hover { color: var(--text-secondary); }

  @media (max-width: 600px) {
    .masthead-title { font-size: 32px; }
    .case-header { flex-direction: column; gap: 0.5rem; }
    .coming-card { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="masthead">
    <div class="masthead-eyebrow">The Vault Investigates — Public Records Repository</div>
    <div class="masthead-title">Receipts</div>
    <div class="masthead-sub">
      Public records, confirmed violations, case files, and source documentation.<br>
      All documents are redacted to protect sources. Last updated: April 11, 2026.
    </div>
  </div>

  <!-- ACTIVE CASE FILES -->
  <div class="section-label">Seeds of Fire Series — Active Case Files</div>

  <div class="case-card confirmed">
    <div class="case-header">
      <div class="case-title">BenchTV — DSWD Confirmed Violation</div>
      <span class="badge badge-confirmed">Confirmed violation</span>
    </div>
    <div class="case-meta">
      <span>Creator: Benjie Perillo</span>
      <span>Action date: Jan 29, 2026</span>
      <span>Agency: DSWD Standards Bureau</span>
      <span>Location: San Pedro, Laguna</span>
    </div>
    <div class="case-desc">
      Unlicensed shelter shut down by DSWD. 12 individuals found including 2 minors and persons with disabilities. Operating without license since 2020 despite DSWD warning in 2022.
    </div>
    <div class="violations">
      <div class="v-row"><span class="v-num">01</span> No Certificate of Registration and License to Operate</div>
      <div class="v-row"><span class="v-num">02</span> No professional social workers on staff</div>
      <div class="v-row"><span class="v-num">03</span> No case folders or medical records</div>
      <div class="v-row"><span class="v-num">04</span> No safety certifications</div>
      <div class="v-row"><span class="v-num">05</span> Privacy violations — Data Privacy Act</div>
      <div class="v-row"><span class="v-num">06</span> Magna Carta for Persons with Disabilities violations</div>
      <div class="v-row"><span class="v-num">07</span> Operating unlicensed since 2020 — warned 2022, never complied</div>
    </div>
    <div class="btn-row">
      <a class="btn btn-primary" href="https://github.com/PapiRicanPI/the-vault-investigates-receipts/blob/main/PovertyPorn/BENCHTV-CASE-FILE.md" target="_blank">Download case file</a>
      <a class="btn" href="https://www.dswd.gov.ph/dswd-shuts-down-unlicensed-care-facility-owned-by-vlogger-bench-tv/" target="_blank">DSWD source</a>
      <a class="btn" href="https://open.substack.com/pub/povertypimpslayer/p/seeds-of-fire-part-iii" target="_blank">Seeds of Fire Part III</a>
    </div>
  </div>

  <!-- FORMAL INQUIRIES -->
  <div class="section-label">Formal Inquiries — Pending Response</div>

  <div class="case-card inquiry">
    <div class="case-header">
      <div class="case-title">DSWD — Records Request</div>
      <span class="badge badge-inquiry">Awaiting response</span>
    </div>
    <div class="case-meta">
      <span>Submitted: April 2026</span>
      <span>Agency: DSWD</span>
    </div>
    <div class="case-desc">
      Formal request for list of all registered organizations and individuals authorized to solicit donations involving children in the Philippines, 2020–2025. Response or non-response will be published in full.
    </div>
  </div>

  <div class="case-card inquiry">
    <div class="case-header">
      <div class="case-title">BenchTV — Formal Inquiry</div>
      <span class="badge badge-inquiry">Sent — Awaiting Response</span>
    </div>
    <div class="case-meta">
      <span>Subject: Benjie Perillo / BenchTV</span>
      <span>Sent: April 11, 2026 · Deadline: April 18, 2026</span>
    </div>
    <div class="case-desc">
      On-record demand for DSWD registration status, total revenue disclosure from poverty content, and documentation of compensation paid to subjects filmed.
    </div>
  </div>

  <div class="case-card inquiry">
    <div class="case-header">
      <div class="case-title">Ivana Alawi — Formal Inquiry</div>
      <span class="badge badge-inquiry">Sent — Awaiting Response</span>
    </div>
    <div class="case-meta">
      <span>Subject: Ivana Alawi</span>
      <span>Sent: April 11, 2026 · Deadline: April 18, 2026</span>
    </div>
    <div class="case-desc">
      On-record demand for disclosure of revenue generated from poverty content, DSWD compliance status, and documentation of compensation to filmed subjects.
    </div>
  </div>

  <!-- COMING -->
  <div class="section-label">Coming — Parts IV–VI</div>

  <div class="coming-card">
    <div class="coming-title">Part IV — The Catholic Machine</div>
    <div class="coming-tag">Case file incoming</div>
  </div>
  <div class="coming-card">
    <div class="coming-title">Part V — The Regulators</div>
    <div class="coming-tag">Filing in progress</div>
  </div>
  <div class="coming-card">
    <div class="coming-title">Part VI — The Reckoning</div>
    <div class="coming-tag">Filing in progress</div>
  </div>

  <!-- TIP BOX -->
  <div class="tip-box">
    <div class="tip-box-label">Submit receipts</div>
    <div class="tip-box-text">
      Have documents, screenshots, or evidence related to this investigation? Submit securely and anonymously.<br><br>
      <a href="https://truthdrop.io" target="_blank">TruthDrop.io</a> — encrypted, anonymous, no metadata retained.
    </div>
  </div>

  <!-- SUBMIT EVIDENCE CTA -->
  <div style="text-align:center; padding: 40px 24px 20px; border-top: 1px solid #2a2010; margin-top: 40px;">
    <a href="https://truthdrop.io" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#1a1400; border:1px solid #c9a84c; color:#c9a84c; font-family:'Cinzel',serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; text-decoration:none; padding:14px 32px; transition:background 0.2s;">Submit evidence anonymously</a>
    <div style="margin-top:10px; color:#6b5c3e; font-size:11px; letter-spacing:1px; font-family:'EB Garamond',serif;">Encrypted · Anonymous · No metadata retained · Powered by TruthDrop.io</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>© 2026 The Vault Investigates</span>
    <span>
      <a href="https://thevaultinvestigates.cloud">thevaultinvestigates.cloud</a> &nbsp;·&nbsp;
      <a href="https://open.substack.com/pub/povertypimpslayer" target="_blank">Substack</a> &nbsp;·&nbsp;
      <a href="https://github.com/PapiRicanPI/the-vault-investigates-receipts" target="_blank">GitHub</a>
    </span>
  </div>

</div>
</body>
</html>`;

export default function Receipts() {
  return (
    <div
      style={{ all: "unset", display: "block" }}
      dangerouslySetInnerHTML={{ __html: receiptsHTML }}
    />
  );
}
