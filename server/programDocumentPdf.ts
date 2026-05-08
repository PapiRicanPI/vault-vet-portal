/**
 * programDocumentPdf.ts
 * Generates watermarked PDFs for public-facing program documents:
 *   - Parental Consent Form
 *   - Research Confidentiality Agreement
 *   - Sample Research Task
 *
 * Each PDF gets:
 *   - Dark background, gold border frame
 *   - Dense diagonal watermark: "THE VAULT INVESTIGATES · OFFICIAL DOCUMENT · <docId>"
 *   - Unique Document ID (VTI-DOC-YYYY-XXXX) visible in header and in watermark
 *   - QR code linking to /verify?id=<docId>
 *   - Verification footer
 *   - Uploaded to S3 and URL returned
 */
import { PDFDocument, rgb, StandardFonts, degrees, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { storagePut } from "./storage";

// ─── Colors ───────────────────────────────────────────────────────────────
const DARK_BG   = rgb(0.039, 0.031, 0.024);
const GOLD      = rgb(0.898, 0.784, 0.478);
const GOLD_DIM  = rgb(0.784, 0.659, 0.298);
const WHITE     = rgb(1, 1, 1);
const LIGHT_GRAY = rgb(0.75, 0.75, 0.75);
const MID_GRAY  = rgb(0.50, 0.50, 0.50);

// ─── Document types ────────────────────────────────────────────────────────
export type ProgramDocType =
  | "consent_form"
  | "confidentiality_agreement"
  | "sample_research_task"
  | "program_summary";

const DOC_LABELS: Record<ProgramDocType, string> = {
  consent_form: "Parental / Guardian Consent Form",
  confidentiality_agreement: "Research Confidentiality Agreement",
  sample_research_task: "Sample Research Task — OSINT Research Trainee",
  program_summary: "Program Summary",
};

const DOC_SUBTITLES: Record<ProgramDocType, string> = {
  consent_form: "Civic Journalism Fellowship Program · The Vault Investigates",
  confidentiality_agreement: "Civic Journalism Fellowship Program · The Vault Investigates",
  sample_research_task: "Civic Journalism Fellowship Program · The Vault Investigates",
  program_summary: "Civic Journalism Fellowship Program · The Vault Investigates",
};

// ─── ID generator ─────────────────────────────────────────────────────────
let _seq = Math.floor(Math.random() * 9000) + 1000;
function generateDocId(): string {
  const year = new Date().getFullYear();
  return `VTI-DOC-${year}-${String(_seq++).padStart(4, "0")}`;
}

// ─── Watermark layer ──────────────────────────────────────────────────────
async function drawWatermark(
  page: PDFPage,
  font: PDFFont,
  docId: string
): Promise<void> {
  const { width, height } = page.getSize();
  const text = `THE VAULT INVESTIGATES · OFFICIAL DOCUMENT · ${docId}`;
  const fontSize = 9;
  const opacity = 0.07;
  const spacing = 110;

  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: GOLD,
        rotate: degrees(35),
        opacity,
      });
    }
  }
}

// ─── Border frame ─────────────────────────────────────────────────────────
function drawBorder(page: PDFPage): void {
  const { width, height } = page.getSize();
  const m = 18;
  const m2 = 26;
  // Outer border
  page.drawRectangle({ x: m, y: m, width: width - m * 2, height: height - m * 2, borderColor: GOLD, borderWidth: 1.5, color: undefined });
  // Inner border
  page.drawRectangle({ x: m2, y: m2, width: width - m2 * 2, height: height - m2 * 2, borderColor: GOLD_DIM, borderWidth: 0.5, color: undefined });
}

// ─── Header block ─────────────────────────────────────────────────────────
async function drawHeader(
  page: PDFPage,
  boldFont: PDFFont,
  regularFont: PDFFont,
  docType: ProgramDocType,
  docId: string
): Promise<void> {
  const { width, height } = page.getSize();
  const topY = height - 60;

  // Org name
  const orgText = "THE VAULT INVESTIGATES";
  const orgW = boldFont.widthOfTextAtSize(orgText, 9);
  page.drawText(orgText, { x: (width - orgW) / 2, y: topY, size: 9, font: boldFont, color: GOLD, opacity: 0.9 });

  // Document title
  const titleText = DOC_LABELS[docType];
  const titleSize = 18;
  const titleW = boldFont.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, { x: (width - titleW) / 2, y: topY - 26, size: titleSize, font: boldFont, color: WHITE });

  // Subtitle
  const subText = DOC_SUBTITLES[docType];
  const subW = regularFont.widthOfTextAtSize(subText, 9);
  page.drawText(subText, { x: (width - subW) / 2, y: topY - 46, size: 9, font: regularFont, color: LIGHT_GRAY });

  // Divider
  page.drawLine({ start: { x: 50, y: topY - 56 }, end: { x: width - 50, y: topY - 56 }, thickness: 0.5, color: GOLD_DIM, opacity: 0.6 });

  // Doc ID badge
  const idLabel = "DOCUMENT ID";
  const idLabelW = regularFont.widthOfTextAtSize(idLabel, 7);
  const idW = boldFont.widthOfTextAtSize(docId, 9);
  const badgeX = width - 160;
  const badgeY = topY - 10;
  page.drawRectangle({ x: badgeX - 6, y: badgeY - 14, width: Math.max(idW, idLabelW) + 12, height: 28, borderColor: GOLD_DIM, borderWidth: 0.5, color: rgb(0.08, 0.065, 0.045) });
  page.drawText(idLabel, { x: badgeX, y: badgeY + 8, size: 7, font: regularFont, color: MID_GRAY });
  page.drawText(docId, { x: badgeX, y: badgeY - 6, size: 9, font: boldFont, color: GOLD });
}

// ─── Content renderer ─────────────────────────────────────────────────────
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderContent(
  pdfDoc: PDFDocument,
  boldFont: PDFFont,
  regularFont: PDFFont,
  italicFont: PDFFont,
  docType: ProgramDocType,
  docId: string
): Promise<void> {
  const pageWidth = 612;
  const pageHeight = 792;
  const leftMargin = 60;
  const rightMargin = 60;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  const bodyStartY = pageHeight - 130; // below header
  const bottomMargin = 80;

  const sections = getDocumentSections(docType, docId);

  let page = pdfDoc.getPage(0);
  let y = bodyStartY;

  const newPage = (): PDFPage => {
    const p = pdfDoc.addPage([pageWidth, pageHeight]);
    p.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: DARK_BG });
    drawBorder(p);
    drawWatermark(p, boldFont, docId);
    drawFooter(p, regularFont, docId);
    return p;
  };

  const ensureSpace = (needed: number): void => {
    if (y - needed < bottomMargin) {
      page = newPage();
      y = pageHeight - 60;
    }
  };

  for (const section of sections) {
    if (section.type === "heading") {
      ensureSpace(30);
      const size = section.level === 1 ? 13 : 11;
      const color = section.level === 1 ? GOLD : WHITE;
      const font = boldFont;
      page.drawText(section.text, { x: leftMargin, y, size, font, color });
      y -= size + 10;
      if (section.level === 1) {
        page.drawLine({ start: { x: leftMargin, y: y + 4 }, end: { x: pageWidth - rightMargin, y: y + 4 }, thickness: 0.4, color: GOLD_DIM, opacity: 0.5 });
        y -= 8;
      }
    } else if (section.type === "paragraph") {
      const lines = wrapText(section.text, regularFont, 9, contentWidth);
      ensureSpace(lines.length * 13 + 8);
      for (const line of lines) {
        page.drawText(line, { x: leftMargin, y, size: 9, font: regularFont, color: LIGHT_GRAY });
        y -= 13;
      }
      y -= 6;
    } else if (section.type === "bullet") {
      const lines = wrapText(section.text, regularFont, 9, contentWidth - 16);
      ensureSpace(lines.length * 13 + 4);
      page.drawText("•", { x: leftMargin + 4, y, size: 9, font: boldFont, color: GOLD_DIM });
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: leftMargin + 16, y: y - i * 13, size: 9, font: regularFont, color: LIGHT_GRAY });
      }
      y -= lines.length * 13 + 2;
    } else if (section.type === "spacer") {
      y -= section.height ?? 12;
    } else if (section.type === "signature_line") {
      ensureSpace(40);
      page.drawLine({ start: { x: leftMargin, y: y - 8 }, end: { x: leftMargin + 200, y: y - 8 }, thickness: 0.5, color: GOLD_DIM, opacity: 0.7 });
      page.drawText(section.text, { x: leftMargin, y: y - 20, size: 8, font: regularFont, color: MID_GRAY });
      y -= 36;
    } else if (section.type === "note") {
      const lines = wrapText(section.text, italicFont, 8, contentWidth - 20);
      ensureSpace(lines.length * 12 + 16);
      page.drawRectangle({ x: leftMargin, y: y - lines.length * 12 - 4, width: contentWidth, height: lines.length * 12 + 12, color: rgb(0.08, 0.065, 0.045), borderColor: GOLD_DIM, borderWidth: 0.4 });
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: leftMargin + 8, y: y - i * 12, size: 8, font: italicFont, color: LIGHT_GRAY });
      }
      y -= lines.length * 12 + 20;
    }
  }
}

// ─── Footer ───────────────────────────────────────────────────────────────
function drawFooter(page: PDFPage, font: PDFFont, docId: string): void {
  const { width } = page.getSize();
  const footerY = 38;
  page.drawLine({ start: { x: 50, y: footerY + 14 }, end: { x: width - 50, y: footerY + 14 }, thickness: 0.4, color: GOLD_DIM, opacity: 0.5 });
  const text = `VERIFY AT: VET.THEVAULTINVESTIGATES.CLOUD/VERIFY · DOCUMENT ID: ${docId}`;
  const tw = font.widthOfTextAtSize(text, 6.5);
  page.drawText(text, { x: (width - tw) / 2, y: footerY, size: 6.5, font, color: MID_GRAY, opacity: 0.8 });
}

// ─── Document content definitions ─────────────────────────────────────────
type Section =
  | { type: "heading"; text: string; level: 1 | 2 }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "spacer"; height?: number }
  | { type: "signature_line"; text: string }
  | { type: "note"; text: string };

function getDocumentSections(docType: ProgramDocType, docId: string): Section[] {
  const year = new Date().getFullYear();

  if (docType === "consent_form") {
    return [
      { type: "note", text: "Please read this form carefully before signing. Contact vaultinvestigates@protonmail.com with any questions before returning this form." },
      { type: "spacer", height: 10 },
      { type: "heading", text: "About the Program", level: 1 },
      { type: "paragraph", text: "The Vault Investigates is an independent investigative journalism publication. The Civic Journalism Fellowship Program is a structured volunteer research program for academically motivated high school students. Students contribute to active, published investigations by performing open-source research tasks under direct supervision." },
      { type: "paragraph", text: "The program is fully remote and asynchronous. There are no fixed meeting times, no travel requirements, and no financial costs to students or families." },
      { type: "heading", text: "What Your Child Will Do", level: 1 },
      { type: "bullet", text: "Perform structured research tasks using publicly available sources only" },
      { type: "bullet", text: "Submit documented deliverables through the program portal" },
      { type: "bullet", text: "Receive written feedback from the Lead Investigator" },
      { type: "bullet", text: "Earn a signed Certificate of Accomplishment with a unique verifiable Document ID upon completion" },
      { type: "heading", text: "What Your Child Will NOT Do", level: 1 },
      { type: "bullet", text: "Contact, interview, or communicate with confidential sources or whistleblowers" },
      { type: "bullet", text: "Access, handle, or process sensitive personal data belonging to third parties" },
      { type: "bullet", text: "Participate in any politically affiliated, partisan, or advocacy-related work" },
      { type: "bullet", text: "Attend in-person meetings, events, or field visits of any kind" },
      { type: "bullet", text: "Incur any financial cost or obligation" },
      { type: "heading", text: "Program Details", level: 1 },
      { type: "bullet", text: "Duration: 4–8 weeks, fully asynchronous, approximately 10–20 hours total" },
      { type: "bullet", text: "Language: English" },
      { type: "bullet", text: "Cost: None" },
      { type: "bullet", text: "Contact: vaultinvestigates@protonmail.com" },
      { type: "bullet", text: `Program portal: vet.thevaultinvestigates.cloud/volunteer` },
      { type: "heading", text: "Parent / Guardian Consent", level: 1 },
      { type: "paragraph", text: "By signing below, I confirm that I have read and understood this consent form and give my consent for my child to participate in the Civic Journalism Fellowship Program." },
      { type: "spacer", height: 8 },
      { type: "signature_line", text: "Student Full Name" },
      { type: "signature_line", text: "School Name" },
      { type: "signature_line", text: "Grade Level" },
      { type: "signature_line", text: "Parent / Guardian Full Name" },
      { type: "signature_line", text: "Relationship to Student" },
      { type: "signature_line", text: "Parent / Guardian Signature & Date" },
      { type: "signature_line", text: "Student Signature & Date" },
      { type: "spacer", height: 8 },
      { type: "note", text: `Form version: April ${year} · The Vault Investigates · Document ID: ${docId}` },
    ];
  }

  if (docType === "confidentiality_agreement") {
    return [
      { type: "note", text: "This agreement protects the active investigation your student is contributing to — not the student. It does not restrict your child from disclosing their participation, claiming the experience on a college application, or showing their completed work in a portfolio." },
      { type: "spacer", height: 10 },
      { type: "heading", text: "Purpose", level: 1 },
      { type: "paragraph", text: "The Vault Investigates conducts active investigative journalism. The integrity of an ongoing investigation depends on the confidentiality of certain internal information — specifically, the direction of the research, the sources being examined, and the methodology being applied. This agreement defines what is confidential, what the student agrees to protect, and what the student retains the full right to disclose." },
      { type: "heading", text: "Confidential Information", level: 1 },
      { type: "bullet", text: "The identity of any individual or organization being researched, where not yet publicly disclosed" },
      { type: "bullet", text: "The specific research direction, methodology, or strategy of the assigned investigation" },
      { type: "bullet", text: "Internal communications between the student and the Lead Investigator" },
      { type: "bullet", text: "The identity of any other student trainees or volunteers in the program" },
      { type: "bullet", text: "Any unpublished findings, draft documents, or interim research conclusions" },
      { type: "heading", text: "What This Agreement Does NOT Restrict", level: 1 },
      { type: "bullet", text: "Disclosing participation in the Fellowship Program on college applications, resumes, or social media" },
      { type: "bullet", text: "Including completed research deliverables in a personal portfolio" },
      { type: "bullet", text: "Discussing general skills learned: OSINT, document research, source verification" },
      { type: "bullet", text: "Reporting any concern about the program to a parent, school, or relevant authority" },
      { type: "heading", text: "Student Obligations", level: 1 },
      { type: "paragraph", text: "The student agrees, for the duration of the program and for twelve (12) months following completion, to: not disclose Confidential Information to any third party; not publish or distribute Confidential Information through any channel; store provided documents securely; and promptly report any unauthorized disclosure to the Lead Investigator." },
      { type: "heading", text: "Duration & Governing Law", level: 1 },
      { type: "paragraph", text: `This agreement is effective from the date of signature and remains in force for twelve (12) months following the conclusion of the student's participation. It is governed by the laws of the Republic of the Philippines.` },
      { type: "heading", text: "Signatures", level: 1 },
      { type: "paragraph", text: "Because the student is a minor, this agreement requires co-signature by a parent or legal guardian to be binding." },
      { type: "spacer", height: 8 },
      { type: "signature_line", text: "Student Full Name" },
      { type: "signature_line", text: "School Name" },
      { type: "signature_line", text: "Student Signature & Date" },
      { type: "signature_line", text: "Parent / Guardian Full Name" },
      { type: "signature_line", text: "Parent / Guardian Signature & Date" },
      { type: "signature_line", text: "Lead Investigator Signature & Date" },
      { type: "spacer", height: 8 },
      { type: "note", text: `Agreement version: April ${year} · The Vault Investigates · Document ID: ${docId}` },
    ];
  }

  // sample_research_task
  return [
    { type: "note", text: "This is a sanitized sample of the type of task assigned to student trainees. All sources referenced are publicly available. No confidential information, sensitive personal data, or restricted materials are involved." },
    { type: "spacer", height: 10 },
    { type: "heading", text: "Task Overview", level: 1 },
    { type: "bullet", text: "Track: OSINT Research Trainee" },
    { type: "bullet", text: "Difficulty: Introductory" },
    { type: "bullet", text: "Estimated time: 3–5 hours" },
    { type: "bullet", text: "Tools required: Web browser, word processor or Google Docs" },
    { type: "bullet", text: "Cost: None" },
    { type: "heading", text: "Background", level: 1 },
    { type: "paragraph", text: "The Vault Investigates tracks YouTube channels that publish content depicting poverty in the Philippines. Part of our research involves building a factual profile of each channel — its registration status, revenue model, and audience reach. This information is gathered entirely from public sources: YouTube platform data, business registration databases, and publicly available regulatory records." },
    { type: "heading", text: "Your Assignment", level: 1 },
    { type: "paragraph", text: "You will be assigned one YouTube channel (provided by the Lead Investigator). Using only the public sources listed below, you will compile a structured Channel Profile Report. You will not contact the channel operator or any person associated with the channel." },
    { type: "heading", text: "Step 1 — YouTube Channel Data", level: 2 },
    { type: "bullet", text: "Channel name, handle, subscriber count, total video count" },
    { type: "bullet", text: "Date channel was created (YouTube About tab > Joined)" },
    { type: "bullet", text: "Country listed, channel description, links in About tab" },
    { type: "bullet", text: "Most recent 5 video titles; most viewed video title and view count" },
    { type: "heading", text: "Step 2 — Social Media Cross-Reference", level: 2 },
    { type: "bullet", text: "Search for the channel on: Facebook, Instagram, TikTok, X (Twitter), Patreon" },
    { type: "bullet", text: "Record: whether an account exists, username, follower count, and link" },
    { type: "heading", text: "Step 3 — Business Registration Search", level: 2 },
    { type: "bullet", text: "SEC Philippines (sec.gov.ph) — search channel operator name" },
    { type: "bullet", text: "DTI Business Name Registry (bnrs.dti.gov.ph) — same search" },
    { type: "bullet", text: "DSWD NGO Registry (dswd.gov.ph) — same search" },
    { type: "bullet", text: "Record: search term used, date, and result (found / not found / inconclusive)" },
    { type: "heading", text: "Step 4 — Revenue Model Documentation", level: 2 },
    { type: "bullet", text: "Document all visible revenue streams: YouTube ads, memberships, Patreon, merchandise, GoFundMe, PayPal, sponsored content disclosures" },
    { type: "heading", text: "Submission Checklist", level: 1 },
    { type: "bullet", text: "All five sections of the report template completed" },
    { type: "bullet", text: "Every data point has a source URL and access date" },
    { type: "bullet", text: "No opinions or interpretations — documented facts only" },
    { type: "bullet", text: "No contact made with any individual associated with the channel" },
    { type: "heading", text: "Questions", level: 1 },
    { type: "paragraph", text: "Email the Lead Investigator at vaultinvestigates@protonmail.com with the subject line: Task Question — [Your Name] — [Task ID]. Response time is typically within 2 business days." },
    { type: "spacer", height: 8 },
    { type: "note", text: `Sample Task version: April ${year} · The Vault Investigates · Document ID: ${docId} · Cleared for distribution to school principals, parents, and prospective student applicants.` },
  ];

  if (docType === "program_summary") return [
    { type: "note", text: "This document is cleared for distribution to school principals, parents, scholarship committees, and prospective student applicants." },
    { type: "spacer", height: 10 },
    { type: "heading", text: "What Is This Program?", level: 1 },
    { type: "paragraph", text: "The Civic Journalism Fellowship Program is a structured volunteer research program for academically motivated high school students in Manila. Students contribute to The Vault Investigates — an independent investigative journalism publication — by performing open-source research tasks on active, published investigations." },
    { type: "paragraph", text: "The program is fully remote, asynchronous, and free. There are no fixed meeting times, no travel requirements, and no financial costs to students or families." },
    { type: "heading", text: "What Students Do", level: 1 },
    { type: "bullet", text: "Perform structured research tasks using publicly available sources only" },
    { type: "bullet", text: "Submit documented deliverables through the program portal" },
    { type: "bullet", text: "Receive written feedback from the Lead Investigator" },
    { type: "bullet", text: "Earn a signed Certificate of Accomplishment with a unique verifiable Document ID" },
    { type: "heading", text: "What Students Do NOT Do", level: 1 },
    { type: "bullet", text: "Contact confidential sources or whistleblowers" },
    { type: "bullet", text: "Handle sensitive personal data belonging to third parties" },
    { type: "bullet", text: "Participate in any politically affiliated or advocacy-related work" },
    { type: "bullet", text: "Attend in-person meetings or field visits" },
    { type: "bullet", text: "Incur any financial cost or obligation" },
    { type: "heading", text: "Available Roles", level: 1 },
    { type: "bullet", text: "Junior OSINT Research Trainee — 4-6 hrs/week" },
    { type: "bullet", text: "Data Verification Trainee — 2-4 hrs/week" },
    { type: "bullet", text: "Digital Journalism Apprentice — 4-8 hrs/week" },
    { type: "heading", text: "Program Details", level: 1 },
    { type: "bullet", text: "Duration: 4-8 weeks, fully asynchronous" },
    { type: "bullet", text: "Language: English" },
    { type: "bullet", text: "Eligibility: Grade 11-12 students in Manila, ages 15-20" },
    { type: "bullet", text: "Cost: None" },
    { type: "heading", text: "The Certificate", level: 1 },
    { type: "paragraph", text: "Every student who completes the program receives a signed Certificate of Accomplishment with a unique Document ID. Certificates are verifiable online at vet.thevaultinvestigates.cloud/verify — suitable for college applications and scholarship portfolios." },
    { type: "heading", text: "Apply or Learn More", level: 1 },
    { type: "bullet", text: "Program portal: vet.thevaultinvestigates.cloud/volunteer" },
    { type: "bullet", text: "Contact: vaultinvestigates@protonmail.com" },
    { type: "bullet", text: "Publication: thevaultinvestigates.cloud" },
    { type: "spacer", height: 8 },
    { type: "note", text: `Program Summary · ${year} · The Vault Investigates · Document ID: ${docId}` },
  ];

  return [];
}

// ─── Main export ──────────────────────────────────────────────────────────
export async function generateProgramDocument(
  docType: ProgramDocType
): Promise<{ url: string; docId: string }> {
  const docId = generateDocId();
  const pageWidth = 612;
  const pageHeight = 792;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Dark background
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: DARK_BG });

  // Watermark
  await drawWatermark(page, boldFont, docId);

  // Border
  drawBorder(page);

  // Header
  await drawHeader(page, boldFont, regularFont, docType, docId);

  // Footer on first page
  drawFooter(page, regularFont, docId);

  // QR code — bottom right corner
  const verifyUrl = `https://vet.thevaultinvestigates.cloud/verify?id=${docId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 64,
      margin: 1,
      color: { dark: "#e5c87a", light: "#00000000" },
    });
    const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");
    const qrBytes = Buffer.from(qrBase64, "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);
    page.drawImage(qrImage, { x: pageWidth - 80, y: 44, width: 52, height: 52 });
  } catch {
    // QR optional — continue without it
  }

  // Content
  await renderContent(pdfDoc, boldFont, regularFont, italicFont, docType, docId);

  const pdfBytes = await pdfDoc.save();
  const fileKey = `program-docs/${docType}-${docId}.pdf`;
  const { url } = await storagePut(fileKey, Buffer.from(pdfBytes), "application/pdf");

  return { url, docId };
}
