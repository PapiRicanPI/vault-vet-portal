/**
 * volunteerCertificate.ts
 * Generates a PDF Certificate of Accomplishment matching the uploaded design:
 * - Dark background, gold double border, corner ornaments
 * - Dense diagonal watermark grid: "THE VAULT INVESTIGATES" + "OFFICIAL DOCUMENT <docId>"
 * - Unique Document ID (VTI-YYYY-XXXX) in box AND woven into watermark
 * - THE VAULT circular seal, signature line, verification footer
 */

import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { volunteerApplications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Colors matching the uploaded design ──────────────────────────────────
const DARK_BG    = rgb(0.039, 0.031, 0.024);   // near-black warm
const GOLD       = rgb(0.898, 0.784, 0.478);   // #e5c87a
const GOLD_DIM   = rgb(0.784, 0.659, 0.298);   // #c8a84c
const WHITE      = rgb(1, 1, 1);
const LIGHT_GRAY = rgb(0.80, 0.80, 0.80);
const MID_GRAY   = rgb(0.55, 0.55, 0.55);

// ─── Helpers ───────────────────────────────────────────────────────────────
function generateDocId(seq: number): string {
  const year = new Date().getFullYear();
  return `VTI-${year}-${String(seq).padStart(4, "0")}`;
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    osint_research_trainee: "OSINT Research Trainee",
    data_verification_trainee: "Data Verification Trainee",
    digital_journalism_apprentice: "Digital Journalism Apprentice",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── Main generator ────────────────────────────────────────────────────────
export async function generateVolunteerCertificate(volunteerId: number): Promise<{
  url: string;
  key: string;
  docId: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db
    .select()
    .from(volunteerApplications)
    .where(eq(volunteerApplications.id, volunteerId))
    .limit(1);

  if (!rows.length) throw new Error(`Volunteer ${volunteerId} not found`);
  const vol = rows[0];

  const docId = (vol as any).certificateDocId ?? generateDocId(volunteerId);

  // ── Create PDF (landscape A4) ────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const hBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const hReg    = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const tRoman  = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const tItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const tBoldIt = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  // ── 1. Background ────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height, color: DARK_BG });

  // ── 2. Dense diagonal watermark grid ────────────────────────────────────
  // Two alternating lines, 35° rotation, doc ID embedded in every other row
  const wmLines = [
    "THE VAULT INVESTIGATES",
    `OFFICIAL DOCUMENT  ${docId}`,
  ];
  const wmSize = 10;
  const stepX = 170;
  const stepY = 58;
  for (let row = -3; row < 14; row++) {
    for (let col = -2; col < 7; col++) {
      const txt = wmLines[((row % 2) + 2) % 2];
      page.drawText(txt, {
        x: col * stepX + (row % 2 === 0 ? 0 : 85),
        y: row * stepY,
        size: wmSize,
        font: hBold,
        color: GOLD_DIM,
        opacity: 0.11,
        rotate: degrees(35),
      });
    }
  }

  // ── 3. Double gold border ────────────────────────────────────────────────
  const op = 18;
  const ip = 27;
  page.drawRectangle({
    x: op, y: op, width: width - op * 2, height: height - op * 2,
    borderColor: GOLD_DIM, borderWidth: 1.4, opacity: 0, borderOpacity: 0.75,
  });
  page.drawRectangle({
    x: ip, y: ip, width: width - ip * 2, height: height - ip * 2,
    borderColor: GOLD_DIM, borderWidth: 0.6, opacity: 0, borderOpacity: 0.45,
  });

  // Corner L-marks
  const cl = 20;
  const cp = op + 10;
  const cLines = [
    // TL
    [cp, height - cp, cp + cl, height - cp],
    [cp, height - cp, cp, height - cp - cl],
    // TR
    [width - cp - cl, height - cp, width - cp, height - cp],
    [width - cp, height - cp, width - cp, height - cp - cl],
    // BL
    [cp, cp, cp + cl, cp],
    [cp, cp, cp, cp + cl],
    // BR
    [width - cp - cl, cp, width - cp, cp],
    [width - cp, cp, width - cp, cp + cl],
  ] as [number, number, number, number][];
  for (const [x1, y1, x2, y2] of cLines) {
    page.drawLine({
      start: { x: x1, y: y1 }, end: { x: x2, y: y2 },
      thickness: 1.6, color: GOLD, opacity: 0.85,
    });
  }

  // ── 4. "THE VAULT INVESTIGATES" header ───────────────────────────────────
  const hdrTxt = "THE VAULT INVESTIGATES";
  const hdrSz = 11;
  const hdrW = hBold.widthOfTextAtSize(hdrTxt, hdrSz);
  page.drawText(hdrTxt, {
    x: (width - hdrW) / 2, y: height - 78,
    size: hdrSz, font: hBold, color: GOLD, opacity: 0.9,
  });

  // ── 5. Title ─────────────────────────────────────────────────────────────
  const titleTxt = "Certificate of Accomplishment";
  const titleSz = 38;
  const titleW = tBoldIt.widthOfTextAtSize(titleTxt, titleSz);
  page.drawText(titleTxt, {
    x: (width - titleW) / 2, y: height - 128,
    size: titleSz, font: tBoldIt, color: WHITE,
  });

  // Divider under title
  page.drawLine({
    start: { x: 80, y: height - 146 }, end: { x: width - 80, y: height - 146 },
    thickness: 0.7, color: GOLD_DIM, opacity: 0.55,
  });

  // ── 6. "THIS CERTIFIES THAT" ─────────────────────────────────────────────
  const ctTxt = "THIS CERTIFIES THAT";
  const ctSz = 9;
  const ctW = hBold.widthOfTextAtSize(ctTxt, ctSz);
  page.drawText(ctTxt, {
    x: (width - ctW) / 2, y: height - 183,
    size: ctSz, font: hBold, color: GOLD_DIM, opacity: 0.85,
  });

  // ── 7. Student name box ───────────────────────────────────────────────────
  const nbW = 560; const nbH = 48;
  const nbX = (width - nbW) / 2; const nbY = height - 248;
  page.drawRectangle({
    x: nbX, y: nbY, width: nbW, height: nbH,
    borderColor: GOLD_DIM, borderWidth: 0.8, opacity: 0, borderOpacity: 0.5,
  });
  const nameSz = 26;
  const nameW = tItalic.widthOfTextAtSize(vol.fullName, nameSz);
  page.drawText(vol.fullName, {
    x: (width - nameW) / 2, y: nbY + (nbH - nameSz) / 2 + 4,
    size: nameSz, font: tItalic, color: WHITE,
  });

  // ── 8. "HAS SUCCESSFULLY COMPLETED" ─────────────────────────────────────
  const hscTxt = "HAS SUCCESSFULLY COMPLETED";
  const hscSz = 9;
  const hscW = hBold.widthOfTextAtSize(hscTxt, hscSz);
  page.drawText(hscTxt, {
    x: (width - hscW) / 2, y: nbY - 26,
    size: hscSz, font: hBold, color: GOLD_DIM, opacity: 0.85,
  });

  // ── 9. Role title ─────────────────────────────────────────────────────────
  const roleTxt = getRoleLabel(vol.role ?? "");
  const roleSz = 18;
  const roleW = hBold.widthOfTextAtSize(roleTxt, roleSz);
  page.drawText(roleTxt, {
    x: (width - roleW) / 2, y: nbY - 58,
    size: roleSz, font: hBold, color: GOLD,
  });

  // ── 10. Program + investigation name ─────────────────────────────────────
  const progTxt = "Civic Journalism Fellowship Program";
  const progSz = 13;
  const progW = tRoman.widthOfTextAtSize(progTxt, progSz);
  page.drawText(progTxt, {
    x: (width - progW) / 2, y: nbY - 82,
    size: progSz, font: tRoman, color: LIGHT_GRAY,
  });

  const invTxt = "The Vault Investigates \u2014 Seeds of Fire Investigation";
  const invSz = 12;
  const invW = tRoman.widthOfTextAtSize(invTxt, invSz);
  page.drawText(invTxt, {
    x: (width - invW) / 2, y: nbY - 102,
    size: invSz, font: tRoman, color: LIGHT_GRAY, opacity: 0.8,
  });

  // ── 11. Hours + month/year ────────────────────────────────────────────────
  const hours = vol.hoursCompleted ?? 0;
  const issuedDate = vol.certificateIssuedAt ?? new Date();
  const hrsTxt = `${hours} hours \u00b7 ${formatMonthYear(issuedDate)}`;
  const hrsSz = 11;
  const hrsW = tRoman.widthOfTextAtSize(hrsTxt, hrsSz);
  page.drawText(hrsTxt, {
    x: (width - hrsW) / 2, y: nbY - 122,
    size: hrsSz, font: tRoman, color: MID_GRAY,
  });

  // ── Footer divider ────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: 80, y: 132 }, end: { x: width - 80, y: 132 },
    thickness: 0.7, color: GOLD_DIM, opacity: 0.5,
  });

  // ── 12. THE VAULT circular seal ───────────────────────────────────────────
  const sx = 160; const sy = 90; const sr = 36;
  page.drawCircle({ x: sx, y: sy, size: sr, borderColor: GOLD_DIM, borderWidth: 1.5, opacity: 0, borderOpacity: 0.7 });
  page.drawCircle({ x: sx, y: sy, size: sr - 7, borderColor: GOLD_DIM, borderWidth: 0.8, opacity: 0, borderOpacity: 0.5 });
  const s1 = "THE"; const s1W = hBold.widthOfTextAtSize(s1, 8);
  page.drawText(s1, { x: sx - s1W / 2, y: sy + 5, size: 8, font: hBold, color: GOLD, opacity: 0.9 });
  const s2 = "VAULT"; const s2W = hBold.widthOfTextAtSize(s2, 8);
  page.drawText(s2, { x: sx - s2W / 2, y: sy - 7, size: 8, font: hBold, color: GOLD, opacity: 0.9 });

  // ── 13. Signature line ────────────────────────────────────────────────────
  const slX1 = 220; const slX2 = 480; const slY = 102;
  page.drawLine({ start: { x: slX1, y: slY }, end: { x: slX2, y: slY }, thickness: 0.8, color: GOLD_DIM, opacity: 0.6 });
  const sigTxt = "Lead Investigator, The Vault Investigates";
  const sigSz = 11;
  const sigW = tItalic.widthOfTextAtSize(sigTxt, sigSz);
  page.drawText(sigTxt, {
    x: (slX1 + slX2) / 2 - sigW / 2, y: slY - 16,
    size: sigSz, font: tItalic, color: LIGHT_GRAY, opacity: 0.85,
  });

  // ── 14. Document ID box ───────────────────────────────────────────────────
  const dbW = 160; const dbH = 28;
  const dbX = width - 80 - dbW; const dbY = 84;
  const dlTxt = "DOCUMENT ID";
  const dlSz = 8;
  const dlW = hBold.widthOfTextAtSize(dlTxt, dlSz);
  page.drawText(dlTxt, {
    x: dbX + (dbW - dlW) / 2, y: dbY + dbH + 4,
    size: dlSz, font: hBold, color: GOLD_DIM, opacity: 0.8,
  });
  page.drawRectangle({
    x: dbX, y: dbY, width: dbW, height: dbH,
    borderColor: GOLD_DIM, borderWidth: 1, opacity: 0, borderOpacity: 0.7,
  });
  const diSz = 13;
  const diW = hBold.widthOfTextAtSize(docId, diSz);
  page.drawText(docId, {
    x: dbX + (dbW - diW) / 2, y: dbY + (dbH - diSz) / 2 + 2,
    size: diSz, font: hBold, color: GOLD,
  });

  // ── 15. School name ───────────────────────────────────────────────────────
  const schoolTxt = `${vol.schoolName} \u00b7 ${vol.city}`;
  const schoolSz = 9;
  const schoolW = hReg.widthOfTextAtSize(schoolTxt, schoolSz);
  page.drawText(schoolTxt, {
    x: (width - schoolW) / 2, y: 52,
    size: schoolSz, font: hReg, color: MID_GRAY, opacity: 0.65,
  });

  // ── 16. Verification footer ───────────────────────────────────────────────
  const vfTxt = `VERIFY AT: VET.THEVAULTINVESTIGATES.CLOUD/VERIFY  \u00b7  DOCUMENT ID REQUIRED`;
  const vfSz = 7.5;
  const vfW = hReg.widthOfTextAtSize(vfTxt, vfSz);
  page.drawText(vfTxt, {
    x: (width - vfW) / 2, y: 36,
    size: vfSz, font: hReg, color: MID_GRAY, opacity: 0.65,
  });

  // ── 17. QR Code ───────────────────────────────────────────────────────────
  // Generate a QR code PNG pointing to the verify URL with the doc ID pre-filled
  const verifyUrl = `https://vet.thevaultinvestigates.cloud/verify?id=${docId}`;
  try {
    const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      width: 80,
      margin: 1,
      color: { dark: "#e5c87a", light: "#0a090500" }, // gold on transparent
    });
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);
    // Place QR code bottom-right, above the doc ID box
    const qrSize = 56;
    const qrX = width - 80 - 160 / 2 - qrSize / 2 + 160 / 2 + 4; // align with doc ID box center
    const qrY = dbY + dbH + 10;
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  } catch (qrErr) {
    console.warn("[Certificate] QR code generation failed (non-fatal):", qrErr);
  }

  // ── Serialize & upload ────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const key = `certificates/${docId}-${Date.now()}.pdf`;
  const { url } = await storagePut(key, Buffer.from(pdfBytes), "application/pdf");

  // ── Persist to DB ─────────────────────────────────────────────────────────
  await db
    .update(volunteerApplications)
    .set({
      certificateFileUrl: url,
      certificateIssuedAt: new Date(),
      ...((vol as any).certificateDocId ? {} : { certificateDocId: docId }),
    } as any)
    .where(eq(volunteerApplications.id, volunteerId));

  return { url, key, docId };
}
