// ─── Resend-based email helper ────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "editor@vet.thevaultinvestigates.cloud";
const FROM_NAME = "The Vault Investigates";

async function sendViaResend(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping send");
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return null;
    }
    const data = await res.json() as { id: string };
    return data.id ?? null;
  } catch (e: any) {
    console.error("[Email] Resend exception:", e?.message);
    return null;
  }
}

// ─── Vetting Application Emails ───────────────────────────────────────────────

export async function sendApprovalEmail(
  to: string,
  name: string,
  assignedRole: string
): Promise<string | null> {
  return sendViaResend(
    to,
    "Your Application to The Vault Investigates — Approved ✓",
    `<p>Dear ${name},</p>
    <p>Your application has been <strong>approved</strong>. You have been assigned the role of <strong>${assignedRole}</strong>.</p>
    <p>You can now access the platform at <a href="https://truthdrop.io">truthdrop.io</a>.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendRejectionEmail(
  to: string,
  name: string
): Promise<string | null> {
  return sendViaResend(
    to,
    "Update on Your Application — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for your interest in The Vault Investigates. After careful review, we are unable to approve your application at this time.</p>
    <p>You are welcome to reapply in the future with a more detailed application.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendMoreInfoEmail(
  to: string,
  name: string,
  infoMessage: string
): Promise<string | null> {
  return sendViaResend(
    to,
    "Action Required: Additional Information Needed — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Our review team requires additional information before we can make a final decision on your application.</p>
    <p><strong>Information Needed:</strong></p>
    <p>${infoMessage}</p>
    <p>Please reply to this email with the requested information, or resubmit at <a href="https://vet.thevault.watch">vet.thevault.watch</a>.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendNewApplicationNotification(params: {
  adminEmail: string;
  applicantName: string;
  applicantEmail: string;
  applicationId: string;
}): Promise<void> {
  await sendViaResend(
    params.adminEmail,
    "New Vetting Application Received",
    `<h2>New Vetting Application</h2>
    <p>A new application has been submitted and requires your review.</p>
    <p><strong>Applicant:</strong> ${params.applicantName} (${params.applicantEmail})</p>
    <p><a href="https://vet.thevaultinvestigates.cloud/admin">Review Application →</a></p>`
  );
}

export async function sendSubmissionConfirmation(to: string, name: string): Promise<void> {
  await sendViaResend(
    to,
    "Application Received — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for applying to access The Vault Investigates database. Your application has been received and is under review.</p>
    <p>You will hear from us within 3–5 business days.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendReengagementEmail(
  to: string,
  name: string,
  _role: string
): Promise<string | null> {
  return sendViaResend(
    to,
    "We miss you — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>We noticed you haven't logged in recently. The Vault Investigates database has new case files and updates waiting for you.</p>
    <p><a href="https://vet.thevaultinvestigates.cloud">Return to The Vault →</a></p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendInvitationEmail(
  to: string,
  personalMessage: string | null,
  inviteUrl: string
): Promise<void> {
  await sendViaResend(
    to,
    "You've been invited to The Vault Investigates",
    `<p>You have been personally invited to apply for access to The Vault Investigates database.</p>
    ${personalMessage ? `<p><em>${personalMessage}</em></p>` : ""}
    <p><a href="${inviteUrl}">Click here to apply →</a></p>
    <p>— The Vault Investigates Team</p>`
  );
}

// ─── Volunteer Emails ─────────────────────────────────────────────────────────

export async function sendTeacherConfirmationEmail(
  teacherEmail: string,
  teacherName: string,
  studentName: string,
  schoolName: string,
  role: string,
  _city: string
): Promise<void> {
  await sendViaResend(
    teacherEmail,
    `Student Volunteer Application — ${studentName}`,
    `<p>Dear ${teacherName},</p>
    <p>Your student <strong>${studentName}</strong> has applied to volunteer with The Vault Investigates as a <strong>${role}</strong> from ${schoolName}.</p>
    <p>We will contact you if we need to verify their application.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendVolunteerConfirmationEmail(
  to: string,
  name: string,
  role: string,
  _schoolName: string,
  _teacherName: string,
  _parentalConsent: boolean
): Promise<void> {
  await sendViaResend(
    to,
    "Volunteer Application Received — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for applying to volunteer as a <strong>${role}</strong> with The Vault Investigates. Your application is under review.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendVolunteerApprovalEmail(
  to: string,
  name: string,
  role: string
): Promise<void> {
  await sendViaResend(
    to,
    "Volunteer Application Approved — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Congratulations! Your volunteer application has been approved. You are now an official <strong>${role}</strong> with The Vault Investigates.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

export async function sendVolunteerRejectionEmail(
  to: string,
  name: string
): Promise<void> {
  await sendViaResend(
    to,
    "Update on Your Volunteer Application — The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for your interest in volunteering with The Vault Investigates. After careful review, we are unable to approve your application at this time.</p>
    <p>— The Vault Investigates Team</p>`
  );
}

// ─── School Outreach Emails ───────────────────────────────────────────────────

export async function sendPrincipalFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  district: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const emailId = await sendViaResend(
    to,
    "Fellowship Opportunity — The Vault Investigates",
    `<p>Dear ${principalName},</p>
    <p>We are reaching out from The Vault Investigates to introduce a fellowship opportunity for students at ${schoolName} (${district}).</p>
    <p>The Vault Investigates is a non-partisan investigative journalism initiative focused on accountability and truth. We are seeking student volunteers to assist with research, documentation, and outreach.</p>
    <p>We would welcome the opportunity to discuss this further. Please reply to this email or contact us at <a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a>.</p>
    <p>— The Vault Investigates Team</p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

export async function sendFollowUpFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  _district: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const emailId = await sendViaResend(
    to,
    "Follow-Up: Fellowship Opportunity — The Vault Investigates",
    `<p>Dear ${principalName},</p>
    <p>We are following up on our previous message regarding a fellowship opportunity for students at ${schoolName}.</p>
    <p>If you have any questions or would like more information, please do not hesitate to reach out.</p>
    <p>— The Vault Investigates Team</p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

export async function sendFinalNudgeFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  _district: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const emailId = await sendViaResend(
    to,
    "Final Notice: Fellowship Opportunity — The Vault Investigates",
    `<p>Dear ${principalName},</p>
    <p>This is our final follow-up regarding the fellowship opportunity for students at ${schoolName}. We understand you are busy and we respect your time.</p>
    <p>If you are interested, please reply at your convenience. We will not contact you again after this message unless you reach out first.</p>
    <p>— The Vault Investigates Team</p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

// ─── Media / Vlogger Outreach Emails ─────────────────────────────────────────

export async function sendPressReleaseEmail(
  to: string,
  contactName: string,
  orgName: string,
  subject: string,
  personalNote: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const emailId = await sendViaResend(
    to,
    subject || `Press Inquiry — The Vault Investigates`,
    `<p>Dear ${contactName} / ${orgName},</p>
    <p>${personalNote}</p>
    <p>— The Vault Investigates Team<br><a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a></p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

export async function sendVloggerInquiryEmail(params: {
  recipientEmail: string;
  creatorName: string;
  channelName: string;
  letterText: string;
  deadline: string;
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const { recipientEmail, creatorName, letterText, deadline } = params;
  const emailId = await sendViaResend(
    recipientEmail,
    `Press Inquiry — The Vault Investigates`,
    `<p>Dear ${creatorName},</p>
    ${letterText}
    <p><em>Response deadline: ${deadline}</em></p>
    <p>— The Vault Investigates Team</p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
