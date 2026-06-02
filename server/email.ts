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

// Helper to wrap any outreach email in a premium, compliant dark theme
function wrapOutreachEmail(contentHtml: string, titleText: string, subtitleText: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleText}</title>
</head>
<body style="background-color: #050505; color: #e5e5e5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #000000; border: 1px solid #1a1a1a; border-radius: 8px; padding: 30px; border-collapse: collapse;">
    <tr>
      <td>
        <!-- Header -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td>
              <span style="font-family: monospace; font-size: 11px; color: #ff5722; text-transform: uppercase; letter-spacing: 1.5px;">${subtitleText}</span>
              <h1 style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${titleText}</h1>
            </td>
          </tr>
        </table>

        <!-- Body Content -->
        ${contentHtml}

        <!-- Stripe Support Banner -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-top: 30px; border-top: 1px solid #2d2d2d; padding-top: 20px;">
          <tr>
            <td style="padding: 20px; background-color: #0d0d0d; border-radius: 6px; border: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0 0 10px 0; font-family: monospace; font-size: 11px; color: #ff5722; text-transform: uppercase; letter-spacing: 1px;">⚡ Reader-Supported Research</p>
              <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #a0a0a0; line-height: 1.5;">
                The Vault Investigates is an independent, reader-funded platform. We receive no institutional backing. If you value our public accountability research, consider supporting our server costs and public records requests with a small tip.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td align="center" style="background-color: #ff5722; border-radius: 4px;">
                    <a href="https://vet.thevaultinvestigates.cloud/support" target="_blank" style="display: inline-block; padding: 8px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 4px;">Support Our Work</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPrincipalFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  district: string,
  lang: "en" | "tl" = "en"
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;

  let subject = "";
  let title = "";
  let subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";
  let content = "";

  if (lang === "tl") {
    subject = `Paanyaya para sa Civic Journalism Fellowship Program / ${schoolName}`;
    title = "Pinalalakas ang Boses ng mga Estudyante.";
    content = `
      <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Mahal na Principal ${lastName},</p>
      
      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Sana ay nasa mabuti kayong kalagayan. Ako si <strong>${operatorName}</strong>, program director ng <strong>The Vault Investigates</strong>. Sumusulat kami upang anyayahan ang mga piling mag-aaral ng Senior High School mula sa <strong>${schoolName}</strong> na mag-apply para sa aming nalalapit na <strong>Civic Journalism Fellowship Program</strong>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Ang programang ito ay nagbibigay sa mga mag-aaral ng ligtas at aktwal na pagsasanay sa digital research, pagpapatunay ng pampublikong dokumento, at media literacy. Sa ilalim ng mahigpit na pahintulot ng mga magulang at propesyonal na gabay, matututuhan ng mga mag-aaral kung paano magsuri ng pampublikong dokumento, tumukoy ng pagsasamantala sa media, at sumuporta sa makatotohanang pagbabalita.
      </p>

      <div style="background-color: #0d0d0d; border-left: 3px solid #ff5722; padding: 15px; border-radius: 0 4px 4px 0; margin: 15px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #ffffff;">Mga Tampok ng Programa:</h3>
        <ul style="margin: 0; padding-left: 15px; font-size: 12px; color: #a0a0a0; line-height: 1.6;">
          <li>100% remote, flexible na mga gawain sa pananaliksik (tinatayang 3-5 oras kada linggo).</li>
          <li>Komprehensibong pagsasanay sa Open Source Intelligence (OSINT).</li>
          <li>Opisyal na <strong>Certificate of Accomplishment</strong> pagkatapos ng programa.</li>
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Maaaring suriin ng mga interesadong mag-aaral ang kurikulum at isumite ang kanilang aplikasyon nang direkta sa aming portal: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Maraming salamat sa inyong pamumuno at dedikasyon sa edukasyong sibil. Huwag mag-atubiling makipag-ugnayan kung nais ninyong mag-iskedyul ng mabilis na tawag upang talakayin ang mga detalye ng programa.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Warm regards,<br>
        <strong>${operatorName}</strong><br>
        <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
      </p>
    `;
  } else {
    subject = `Invitation to join the Civic Journalism Fellowship Program / ${schoolName}`;
    title = "Empowering Student Voices.";
    content = `
      <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
      
      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        I hope this email finds you well. My name is <strong>${operatorName}</strong>, program director at <strong>The Vault Investigates</strong>. We are writing to invite select Senior High School students from <strong>${schoolName}</strong> to apply for our upcoming <strong>Civic Journalism Fellowship Program</strong>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        This fellowship provides students with hands-on, secure training in digital research, public records verification, and media literacy. Under strict parental consent and professional guidance, student volunteers will learn how to analyze public documents, identify media exploitation, and support factual reporting.
      </p>

      <div style="background-color: #0d0d0d; border-left: 3px solid #ff5722; padding: 15px; border-radius: 0 4px 4px 0; margin: 15px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #ffffff;">Fellowship Highlights:</h3>
        <ul style="margin: 0; padding-left: 15px; font-size: 12px; color: #a0a0a0; line-height: 1.6;">
          <li>100% remote, flexible research tasks (approx. 3-5 hours/week).</li>
          <li>Comprehensive training in Open Source Intelligence (OSINT).</li>
          <li>Official <strong>Certificate of Accomplishment</strong> upon program completion.</li>
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Interested students can review the full curriculum and submit their applications directly at our public portal: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Thank you for your leadership and dedication to civic education. Please feel free to reach out if you would like to schedule a brief call to discuss the program details.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Warm regards,<br>
        <strong>${operatorName}</strong><br>
        <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
      </p>
    `;
  }

  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

export async function sendFollowUpFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  _district: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;

  const subject = `Follow-Up: Fellowship Opportunity — The Vault Investigates`;
  const title = "Continuing the Conversation.";
  const subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";
  
  const content = `
    <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
    
    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We are following up on our previous message regarding the remote, educational <strong>Civic Journalism Fellowship Program</strong> for students at <strong>${schoolName}</strong>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We understand that school administrations manage extremely demanding schedules. However, we wanted to ensure our invitation was received, as we are allocating a limited number of fellowship slots for select schools in your division.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      This program requires no school resources or funding, is fully remote/asynchronous, and is designed to build critical media verification skills. Interested students can apply at: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      If you have any questions or would like to schedule a quick 5-minute introductory call, please feel free to reply directly to this email.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      Warm regards,<br>
      <strong>${operatorName}</strong><br>
      <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
    </p>
  `;

  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}

export async function sendFinalNudgeFellowshipEmail(
  to: string,
  principalName: string,
  schoolName: string,
  _district: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;

  const subject = `Final Notice: Fellowship Opportunity — The Vault Investigates`;
  const title = "Final Invitation.";
  const subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";

  const content = `
    <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
    
    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      This is our final follow-up regarding the remote, educational <strong>Civic Journalism Fellowship Program</strong> for students at <strong>${schoolName}</strong>. We understand you are incredibly busy and we deeply respect your time.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We will close applications for this cohort shortly. If any students from your school are interested in digital OSINT research and media verification, they are welcome to apply before the deadline at: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      If we do not hear from you, we will not contact you again regarding this cohort. Thank you for your dedication to your students and your leadership in civic education.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      Warm regards,<br>
      <strong>${operatorName}</strong><br>
      <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
    </p>
  `;

  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
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
