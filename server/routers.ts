import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  createInvitation,
  updateApplicationEmailTracking,
  createTip,
  getAllTips,
  getTipById,
  updateTip,
  deleteTip,
  createExportLog,
  getAllExportLogs,
  createVolunteerApplication,
  getAllVolunteerApplications,
  getVolunteerApplicationById,
  updateVolunteerApplication,
  getVolunteerByDocId,
  getActivityStats,
  getPublicStats,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getNoteForCase,
  upsertNote,
  getProjects,
  createProject,
  updateProjectCases,
  deleteProject,
  recordRecentlyViewed,
  getRecentlyViewed,
} from "./db";
import { storagePut } from "./storage";
import { applyWatermark, createTextPdf } from "./pdfWatermark";
import { v4 as uuidv4 } from "uuid";
import { createHash, randomBytes } from "crypto";
import { scoreApplication } from "./scoring";
import { generateVolunteerCertificate } from "./volunteerCertificate";
import { generateProgramDocument, ProgramDocType } from "./programDocumentPdf";
import { sendSubmissionConfirmation, sendInvitationEmail, sendApprovalEmail, sendRejectionEmail, sendMoreInfoEmail, sendTeacherConfirmationEmail, sendVolunteerConfirmationEmail, sendVolunteerApprovalEmail, sendVolunteerRejectionEmail, sendReengagementEmail, sendPressReleaseEmail, sendPrincipalFellowshipEmail, sendFollowUpFellowshipEmail, sendVloggerInquiryEmail } from "./email";
import { getMediaOutreachStatuses, upsertMediaOutreachStatus, getDonorContacts, getDonorContactById, createDonorContact, updateDonorContact, deleteDonorContact, getAllVloggerInquiries, getVloggerInquiryById, createVloggerInquiry, updateVloggerInquiry, deleteVloggerInquiry, getAllScanLeads, saveScanLead, updateScanLeadStatus, deleteScanLead, getMediaLeads, createMediaLead, updateMediaLead, getDepedSchoolCount, getDepedRegions, getDepedProvinces, searchDepedSchools, bulkInsertDepedSchools } from "./db";
import { ENV } from "./_core/env";
import { callDataApi } from "./_core/dataApi";
import {
  getAllWeeklyTasks,
  getCompletionsForWeek,
  markTaskComplete,
  markTaskIncomplete,
  getCurrentWeekStart,
} from "./weeklyOpsDb";
import {
  SPURGEON_DEVOTIONS,
  DAILY_VERSES,
  CLOSING_VERSES,
  BRAIN_EXERCISES,
  getTodaySession,
  upsertFocusSession,
  logBrainExercise as logBrainExerciseDb,
} from "./focusModeDb";
import { getDb } from "./db";

// Admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Prior work schema
const priorWorkSchema = z.array(z.object({
  title: z.string(),
  url: z.string(),
}));

// Full application submission schema
const applicationSchema = z.object({
  // Section 1: Identity
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Valid email is required"),
  profileUrl: z.string().optional(),

  // Section 2: Organization
  organization: z.string().optional(),
  orgRole: z.string().optional(),
  orgWebsite: z.string().optional(),

  // Section 3: Prior Work
  priorWork: priorWorkSchema.optional(),

  // Section 4: Investigation Purpose
  investigationProject: z.string().min(10, "Please describe your investigation in detail"),
  geographicFocus: z.string().min(1, "Geographic focus is required"),
  outputType: z.string().min(1, "Expected output type is required"),

  // Section 5: Support & Attribution
  supportLink: z.string().optional(),
  agreesToCredit: z.boolean(),

  // Section 6: Safety & Risk
  underThreats: z.enum(["yes", "no", "prefer_not"]).optional(),
  useOpSec: z.boolean().optional(),
  opSecTools: z.string().optional(),
  previouslyDoxxed: z.enum(["yes", "no", "prefer_not"]).optional(),
  emergencyContact: z.string().optional(),
  consentSafetyOutreach: z.boolean().optional(),

  // Section 7: Terms
  referralSource: z.string().optional(),
  willShareRawData: z.boolean().optional(),
  agreesToTerms: z.boolean().refine(v => v === true, "You must agree to the terms of use"),
  agreesToPrivacy: z.boolean().refine(v => v === true, "You must agree to the privacy policy"),
});

// ── Vlogger Inquiries Router ──────────────────────────────────────────────────
const vloggerInquiriesRouter = router({
  list: adminProcedure.query(async () => {
    return getAllVloggerInquiries();
  }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      creatorName: z.string().optional(),
      channelName: z.string().optional(),
      platform: z.enum(["youtube", "tiktok", "facebook", "instagram", "other"]).optional(),
      subscriberCount: z.string().optional(),
      email: z.string().optional(),
      evidenceTier: z.enum(["confirmed_violation", "documented_evidence", "under_investigation"]).optional(),
      violationDate: z.string().optional(),
      agency: z.string().optional(),
      violationSummary: z.string().optional(),
      startYear: z.string().optional(),
      estimatedRevenue: z.string().optional(),
      inquiryStatus: z.enum(["not_sent", "sent", "responded", "no_reply", "declined"]).optional(),
      internalNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateVloggerInquiry(id, data as any);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVloggerInquiry(input.id);
      return { success: true };
    }),

  sendInquiry: adminProcedure
    .input(z.object({
      id: z.number(),
      letterText: z.string(),
      deadline: z.string(),
      sendEmail: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const deadlineDate = new Date(input.deadline);

      // Fetch creator record to get email + names
      const creator = await getVloggerInquiryById(input.id);
      if (!creator) throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });

      let emailId: string | undefined;
      let emailError: string | undefined;

      if (input.sendEmail) {
        if (!creator.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No email address on file for this creator. Edit the creator row to add one first.",
          });
        }
        const result = await sendVloggerInquiryEmail({
          recipientEmail: creator.email,
          creatorName: creator.creatorName,
          channelName: creator.channelName ?? creator.creatorName,
          letterText: input.letterText,
          deadline: input.deadline,
        });
        if (!result.success) {
          emailError = result.error ?? "Email send failed";
        } else {
          emailId = result.emailId;
        }
      }

      await updateVloggerInquiry(input.id, {
        inquiryStatus: "sent",
        dateSent: now,
        deadline: deadlineDate,
        sentLetterText: input.letterText,
      } as any);

      return { success: true, emailId, emailError };
    }),

  create: adminProcedure
    .input(z.object({
      creatorName: z.string(),
      channelName: z.string().optional(),
      platform: z.enum(["youtube", "tiktok", "facebook", "instagram", "other"]).optional(),
      subscriberCount: z.string().optional(),
      email: z.string().optional(),
      evidenceTier: z.enum(["confirmed_violation", "documented_evidence", "under_investigation"]).optional(),
    }))
    .mutation(async ({ input }) => {
      return createVloggerInquiry(input);
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  vetting: router({
    // Public: submit an application
    submit: publicProcedure
      .input(applicationSchema)
      .mutation(async ({ input }) => {
        // Insert application
        const insertData = {
          displayName: input.displayName,
          email: input.email,
          profileUrl: input.profileUrl ?? null,
          organization: input.organization ?? null,
          orgRole: input.orgRole ?? null,
          orgWebsite: input.orgWebsite ?? null,
          priorWork: input.priorWork ?? [],
          investigationProject: input.investigationProject,
          geographicFocus: input.geographicFocus,
          outputType: input.outputType,
          supportLink: input.supportLink ?? null,
          agreesToCredit: input.agreesToCredit ? 1 : 0,
          underThreats: input.underThreats ?? null,
          useOpSec: input.useOpSec ? 1 : 0,
          opSecTools: input.opSecTools ?? null,
          previouslyDoxxed: input.previouslyDoxxed ?? null,
          emergencyContact: input.emergencyContact ?? null,
          consentSafetyOutreach: input.consentSafetyOutreach ? 1 : 0,
          referralSource: input.referralSource ?? null,
          willShareRawData: input.willShareRawData ? 1 : 0,
          agreesToTerms: input.agreesToTerms ? 1 : 0,
          agreesToPrivacy: input.agreesToPrivacy ? 1 : 0,
          status: "pending" as const,
        };

        const result = await createApplication(insertData);
        const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;

        // Run AI scoring asynchronously (don't block the response)
        if (insertId) {
          scoreApplication(insertData).then(async (score) => {
            await updateApplication(insertId, {
              aiScore: score.totalScore,
              aiScoreIdentity: score.scoreIdentity,
              aiScoreOrganization: score.scoreOrganization,
              aiScorePurpose: score.scorePurpose,
              aiScoreSupport: score.scoreSupport,
              aiScoreRisk: score.scoreRisk,
              aiRationale: score.rationale,
              aiRecommendation: score.recommendation,
            });
          }).catch(err => console.error("[Scoring] Background scoring failed:", err));
        }

        // Notify owner
        await sendSubmissionConfirmation(input.email, input.displayName).catch(() => {});

        return { success: true, applicationId: insertId };
      }),

    // Admin: list all applications
    list: adminProcedure.query(async () => {
      return getAllApplications();
    }),

    // Admin: get single application
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        return app;
      }),

    // Admin: update status (approve/reject/needs_info)
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected", "needs_info"]),
        adminNotes: z.string().optional(),
        assignedRole: z.string().optional(),
        infoMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        await updateApplication(input.id, {
          status: input.status,
          adminNotes: input.adminNotes ?? app.adminNotes,
          assignedRole: input.assignedRole ?? app.assignedRole,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        });

        // Notify owner of decision
        await notifyOwner({
          title: `Vetting Decision: ${input.status.toUpperCase()} — ${app.displayName}`,
          content: `Application #${input.id} for ${app.displayName} (${app.email}) has been ${input.status}.\n\nRole: ${input.assignedRole ?? "N/A"}\nNotes: ${input.adminNotes ?? "None"}`,
        }).catch(() => {});

        // Send applicant notification email and store Resend email ID for open tracking
        let emailId: string | null = null;
        if (input.status === "approved") {
          emailId = await sendApprovalEmail(app.email, app.displayName, input.assignedRole ?? "Researcher").catch(() => null);
        } else if (input.status === "rejected") {
          emailId = await sendRejectionEmail(app.email, app.displayName).catch(() => null);
        } else if (input.status === "needs_info") {
          const msg = input.infoMessage ?? input.adminNotes ?? "Please provide additional information about your application.";
          emailId = await sendMoreInfoEmail(app.email, app.displayName, msg).catch(() => null);
        }
         if (emailId) {
          await updateApplicationEmailTracking(input.id, emailId, input.status).catch(() => {});
        }

        // Provision user on truthdrop.io when approved
        if (input.status === "approved") {
          const webhookSecret = process.env.VETTING_WEBHOOK_SECRET;
          const webhookUrl = process.env.TRUTHDROP_WEBHOOK_URL || "https://truthdrop.io/api/webhook/approve";
          if (webhookSecret) {
            fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": webhookSecret,
              },
              body: JSON.stringify({
                email: app.email,
                name: app.displayName,
                organization: app.organization ?? null,
                assignedRole: input.assignedRole ?? "observer",
              }),
            })
              .then(async (r) => {
                if (!r.ok) {
                  const txt = await r.text().catch(() => "");
                  console.error(`[Webhook] truthdrop.io provisioning failed (${r.status}):`, txt);
                } else {
                  console.log(`[Webhook] truthdrop.io user provisioned for ${app.email}`);
                }
              })
              .catch((err) => console.error("[Webhook] truthdrop.io call failed:", err));
          } else {
            console.warn("[Webhook] VETTING_WEBHOOK_SECRET not set — skipping truthdrop.io provisioning");
          }
        }

        return { success: true };
      }),

    // Admin: update notes only
    updateNotes: adminProcedure
      .input(z.object({
        id: z.number(),
        adminNotes: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateApplication(input.id, { adminNotes: input.adminNotes });
        return { success: true };
      }),

    // Admin: delete application
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteApplication(input.id);
        return { success: true };
      }),

    // Admin: send invitation (supports multiple comma-separated emails)
    sendInvitation: adminProcedure
      .input(z.object({
        emails: z.array(z.string().email()).min(1).max(50),
        personalMessage: z.string().optional(),
        origin: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const results = [];
        for (const email of input.emails) {
          const token = nanoid(32);
          await createInvitation(email, token, input.personalMessage ?? null, ctx.user.id);
          const inviteUrl = `${input.origin}/?invite=${token}`;
          await sendInvitationEmail(email, input.personalMessage ?? null, inviteUrl);
          results.push({ email, inviteUrl });
        }
        await notifyOwner({
          title: `📨 ${input.emails.length} Invitation(s) Sent`,
          content: `Invitations sent to:\n${input.emails.join("\n")}`,
        }).catch(() => {});
        return { success: true, count: input.emails.length, results };
      }),

    // Admin: re-score an application
    rescore: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        const score = await scoreApplication(app);
        await updateApplication(input.id, {
          aiScore: score.totalScore,
          aiScoreIdentity: score.scoreIdentity,
          aiScoreOrganization: score.scoreOrganization,
          aiScorePurpose: score.scorePurpose,
          aiScoreSupport: score.scoreSupport,
          aiScoreRisk: score.scoreRisk,
          aiRationale: score.rationale,
          aiRecommendation: score.recommendation,
        });
        return { success: true, score };
      }),

    // Admin: send re-engagement email to an inactive approved applicant
    sendReengagement: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        if (app.status !== "approved") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Re-engagement emails can only be sent to approved applicants." });
        }
        const emailId = await sendReengagementEmail(
          app.email,
          app.displayName,
          app.assignedRole ?? "researcher"
        );
        if (emailId) {
          await updateApplicationEmailTracking(input.id, emailId, "reengagement").catch(() => {});
        }
        await notifyOwner({
          title: `📧 Re-engagement email sent to ${app.displayName}`,
          content: `Re-engagement notice sent to ${app.email} (Application #${input.id}).`,
        }).catch(() => {});
        return { success: true, emailId };
      }),

    // Admin: downgrade an approved applicant to basic user status
    downgradeToUser: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        await updateApplication(input.id, {
          status: "user_downgraded",
          adminNotes: (app.adminNotes ? app.adminNotes + "\n" : "") +
            `[${new Date().toISOString()}] Downgraded to basic user due to inactivity.`,
        });
        await notifyOwner({
          title: `🔽 ${app.displayName} downgraded to user`,
          content: `Application #${input.id} for ${app.displayName} (${app.email}) has been downgraded to basic user status due to inactivity.`,
        }).catch(() => {});
        return { success: true };
      }),
  }),

  // ─── Public Stats ──────────────────────────────────────────────────────────
  stats: router({
    public: publicProcedure.query(async () => {
      return getPublicStats();
    }),

    activity: adminProcedure.query(async () => {
      return getActivityStats();
    }),
  }),

  // ─── Tips ────────────────────────────────────────────────────────────────
  // Security hardening:
  //   1. Raw IP is NEVER stored — only a one-way SHA-256 hash
  //   2. Pseudonym and burnerEmail are truly optional (no fallback logging)
  //   3. Confirmation response contains no identifying metadata
  //   4. File bytes go to S3 with randomized key — never stored in DB
  //   5. Tip content is accessible only to admin role
  tips: router({
    submit: publicProcedure
    .input(
      z.object({
        pseudonym: z.string().max(100).optional(),
        burnerEmail: z.string().email().max(320).optional().or(z.literal("")),
        category: z.enum(["fraud", "misuse_of_funds", "false_claims", "identity", "network", "other"]),
        subject: z.string().min(5).max(500),
        message: z.string().min(20).max(10000),
        // File upload: base64-encoded content + metadata (max 10 MB enforced client-side)
        fileBase64: z.string().optional(),
        fileName: z.string().max(255).optional(),
        fileMime: z.string().max(100).optional(),
        // Client passes its own IP hash (server will re-hash for safety)
        clientIpHint: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Hash the IP from the request context — raw IP never persisted
      const rawIp = (ctx as any).req?.headers?.["x-forwarded-for"] ||
        (ctx as any).req?.socket?.remoteAddress ||
        "unknown";
      const ipHash = createHash("sha256").update(String(rawIp)).digest("hex");

      // Handle optional file upload
      let fileUrl: string | undefined;
      let fileKey: string | undefined;
      let safeFileName: string | undefined;

      if (input.fileBase64 && input.fileName && input.fileMime) {
        const suffix = randomBytes(8).toString("hex");
        const ext = input.fileName.split(".").pop() ?? "bin";
        safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        fileKey = `tips/${suffix}-${safeFileName}`;
        const buffer = Buffer.from(input.fileBase64, "base64");
        const stored = await storagePut(fileKey, buffer, input.fileMime);
        fileUrl = stored.url;
        fileKey = stored.key;
      }

      await createTip({
        pseudonym: input.pseudonym || null,
        burnerEmail: input.burnerEmail || null,
        category: input.category,
        subject: input.subject,
        message: input.message,
        fileUrl: fileUrl ?? null,
        fileKey: fileKey ?? null,
        fileName: safeFileName ?? null,
        ipHash,
      });

      // Notify owner — no tip content in notification to limit exposure
      await notifyOwner({
        title: "New confidential tip received",
        content: `Category: ${input.category}. Subject: ${input.subject.slice(0, 80)}. Review in admin panel.`,
      }).catch(() => { /* non-fatal */ });

      // Confirmation contains NO identifying metadata
      return { success: true, message: "Your tip has been received securely." };
    }),

  // ADMIN ONLY: list all tips
  list: adminProcedure.query(async () => {
    return getAllTips();
  }),

  // ADMIN ONLY: get a single tip
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const tip = await getTipById(input.id);
      if (!tip) throw new TRPCError({ code: "NOT_FOUND", message: "Tip not found" });
      return tip;
    }),

  // ADMIN ONLY: update status, priority, admin notes
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "reviewing", "actioned", "closed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTip(id, data);
      return { success: true };
    }),

  // ADMIN ONLY: permanently delete a tip
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTip(input.id);
      return { success: true };
    }),
  }),

  // ── PDF Export (chain-of-custody watermarking) ──────────────────────────────────────
  pdf: router({
    /**
     * Export a case as a watermarked PDF.
     * Requires authentication (any logged-in user).
     * Generates a unique document ID, stamps all 4 watermark fields,
     * uploads to S3, and logs the export to export_logs (admin-only).
     */
    exportCase: protectedProcedure
      .input(
        z.object({
          caseId: z.string().min(1),
          caseTitle: z.string().optional(),
          contentLines: z.array(z.string()),
          researcherAlias: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const documentId = uuidv4();
        const exportedAt = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

        const watermarkOpts = {
          researcherAlias: input.researcherAlias,
          documentId,
          exportedAt,
        };

        // Generate watermarked PDF from text content
        const pdfBytes = await createTextPdf(
          input.caseTitle ?? input.caseId,
          input.contentLines,
          watermarkOpts
        );

        // Upload to S3 with randomised key (not guessable)
        const randomSuffix = randomBytes(8).toString("hex");
        const fileKey = `exports/${ctx.user.id}-${input.caseId}-${randomSuffix}.pdf`;
        const { url: fileUrl } = await storagePut(fileKey, Buffer.from(pdfBytes), "application/pdf");

        // Log the export — chain of custody record (admin-only, never shown to researcher)
        await createExportLog({
          researcherId: ctx.user.id,
          researcherAlias: input.researcherAlias,
          caseId: input.caseId,
          caseTitle: input.caseTitle,
          documentId,
          fileUrl,
          fileKey,
        });

        return {
          success: true,
          documentId,
          fileUrl,
          exportedAt,
        };
      }),

    /**
     * Admin-only: list all export log entries.
     * Chain of custody audit trail.
     */
    listExportLogs: adminProcedure.query(async () => {
      return getAllExportLogs();
    }),
  }),

  // ── Volunteer Program ───────────────────────────────────────────────────────
  volunteer: router({
    submit: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1).max(255),
          email: z.string().email(),
          age: z.number().int().min(15).max(20),
          schoolName: z.string().min(1).max(255),
          gradeLevel: z.string().min(1).max(50),
          strand: z.string().max(100).optional(),
          city: z.string().min(1).max(100),
          role: z.enum(["osint_research_trainee", "data_verification_trainee", "digital_journalism_apprentice"]),
          teacherName: z.string().min(1).max(255),
          teacherEmail: z.string().email(),
          teacherSubject: z.string().max(100).optional(),
          whyApply: z.string().min(50),
          relevantExperience: z.string().optional(),
          availabilityHoursPerWeek: z.number().int().min(2).max(10),
          parentalConsentGiven: z.number().int().min(0).max(1),
          parentName: z.string().max(255).optional(),
          parentEmail: z.string().email().optional(),
          agreesToTerms: z.number().int().min(1).max(1),
          agreesToConfidentiality: z.number().int().min(1).max(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const rawIp = (ctx as any)?.req?.ip ?? (ctx as any)?.req?.headers?.["x-forwarded-for"] ?? "";
        const ipHash = rawIp ? createHash("sha256").update(String(rawIp)).digest("hex") : undefined;

        let aiScore = 5;
        let aiScoreMotivation = 2;
        let aiScoreReliability = 1;
        let aiScoreSkillFit = 1;
        let aiScoreAvailability = 1;
        let aiRationale = "Pending manual review.";
        let aiRecommendation: "approve" | "review" | "deny" = "review";

        try {
          const { invokeLLM } = await import("./_core/llm");
          const prompt = `You are reviewing a high school student volunteer application for an investigative journalism program.
Applicant: ${input.fullName}, Age ${input.age}, Grade ${input.gradeLevel} at ${input.schoolName} in ${input.city}.
Role applied for: ${input.role.replace(/_/g, " ")}.
Availability: ${input.availabilityHoursPerWeek} hours/week.
Why they want to join: ${input.whyApply}
Relevant experience: ${input.relevantExperience ?? "None provided"}
Teacher recommender: ${input.teacherName} (${input.teacherEmail})
Parental consent: ${input.parentalConsentGiven ? "Yes" : "No"}

Score this application on 4 dimensions:
1. MOTIVATION (0-3): How genuine and specific is their reason for applying?
2. RELIABILITY (0-3): Does their profile suggest they will follow through?
3. SKILL FIT (0-2): Does their experience/strand match the role?
4. AVAILABILITY (0-2): Is their stated availability realistic?

Respond with valid JSON only:
{"scoreMotivation": <0-3>, "scoreReliability": <0-3>, "scoreSkillFit": <0-2>, "scoreAvailability": <0-2>, "rationale": "<2 sentence summary>", "recommendation": "<approve|review|deny>"}`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a volunteer program coordinator. Respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "volunteer_score",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    scoreMotivation: { type: "integer" },
                    scoreReliability: { type: "integer" },
                    scoreSkillFit: { type: "integer" },
                    scoreAvailability: { type: "integer" },
                    rationale: { type: "string" },
                    recommendation: { type: "string", enum: ["approve", "review", "deny"] },
                  },
                  required: ["scoreMotivation", "scoreReliability", "scoreSkillFit", "scoreAvailability", "rationale", "recommendation"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = response.choices?.[0]?.message?.content;
          if (rawContent) {
            const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));
            aiScoreMotivation = Math.min(3, Math.max(0, parsed.scoreMotivation));
            aiScoreReliability = Math.min(3, Math.max(0, parsed.scoreReliability));
            aiScoreSkillFit = Math.min(2, Math.max(0, parsed.scoreSkillFit));
            aiScoreAvailability = Math.min(2, Math.max(0, parsed.scoreAvailability));
            aiScore = aiScoreMotivation + aiScoreReliability + aiScoreSkillFit + aiScoreAvailability;
            aiRationale = parsed.rationale;
            aiRecommendation = aiScore >= 7 ? "approve" : aiScore >= 4 ? "review" : "deny";
          }
        } catch (e) {
          console.error("[Volunteer] AI scoring failed:", e);
        }

        await createVolunteerApplication({
          fullName: input.fullName,
          email: input.email,
          age: input.age,
          schoolName: input.schoolName,
          gradeLevel: input.gradeLevel,
          strand: input.strand,
          city: input.city,
          role: input.role,
          teacherName: input.teacherName,
          teacherEmail: input.teacherEmail,
          teacherSubject: input.teacherSubject,
          whyApply: input.whyApply,
          relevantExperience: input.relevantExperience,
          availabilityHoursPerWeek: input.availabilityHoursPerWeek,
          parentalConsentGiven: input.parentalConsentGiven,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          agreesToTerms: input.agreesToTerms,
          agreesToConfidentiality: input.agreesToConfidentiality,
          aiScore,
          aiScoreMotivation,
          aiScoreReliability,
          aiScoreSkillFit,
          aiScoreAvailability,
          aiRationale,
          aiRecommendation,
          ipHash,
          status: "pending",
        });

        await notifyOwner({
          title: `New Volunteer Application — ${input.fullName}`,
          content: `Role: ${input.role.replace(/_/g, " ")} | School: ${input.schoolName}, ${input.city} | AI Score: ${aiScore}/10 (${aiRecommendation})`,
        }).catch(() => {});
        // Send teacher confirmation email (fire and forget)
        sendTeacherConfirmationEmail(
          input.teacherEmail,
          input.teacherName,
          input.fullName,
          input.schoolName,
          input.role,
          input.city
        ).catch(() => {});
        // Send student confirmation email (fire and forget)
        sendVolunteerConfirmationEmail(
          input.email,
          input.fullName,
          input.role,
          input.schoolName,
          input.teacherName,
          input.parentalConsentGiven === 1
        ).catch(() => {});
        return { success: true };
      }),

    list: adminProcedure.query(async () => {
      return getAllVolunteerApplications();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getVolunteerApplicationById(input.id);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "approved", "rejected", "needs_info"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const vol = await getVolunteerApplicationById(input.id);
        if (!vol) throw new TRPCError({ code: "NOT_FOUND" });
        await updateVolunteerApplication(input.id, {
          status: input.status,
          adminNotes: input.adminNotes,
        });
        // Send student notification email based on new status
        if (input.status === "approved") {
          sendVolunteerApprovalEmail(vol.email, vol.fullName, vol.role ?? "").catch(() => {});
        } else if (input.status === "rejected") {
          sendVolunteerRejectionEmail(vol.email, vol.fullName).catch(() => {});
        }
        return { success: true };
      }),

    updateHours: adminProcedure
      .input(
        z.object({
          id: z.number(),
          hoursCompleted: z.number().int().min(0),
          contributionSummary: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateVolunteerApplication(input.id, {
          hoursCompleted: input.hoursCompleted,
          contributionSummary: input.contributionSummary,
        });
        return { success: true };
      }),

    generateCertificate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const vol = await getVolunteerApplicationById(input.id);
        if (!vol) throw new TRPCError({ code: "NOT_FOUND" });
        if (vol.status !== "approved") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Volunteer must be approved before generating a certificate." });
        }
        const { url, docId } = await generateVolunteerCertificate(input.id);
        return { url, docId, filename: `certificate-${vol.fullName.replace(/\s+/g, "-")}.pdf` };
      }),

    verifyCertificate: publicProcedure
      .input(z.object({ docId: z.string().min(1) }))
      .query(async ({ input }) => {
        const vol = await getVolunteerByDocId(input.docId.trim().toUpperCase());
        if (!vol || !(vol as any).certificateDocId) {
          return { valid: false, data: null };
        }
        return {
          valid: true,
          data: {
            docId: (vol as any).certificateDocId as string,
            studentName: vol.fullName,
            role: vol.role,
            schoolName: vol.schoolName,
            city: vol.city,
            hoursCompleted: vol.hoursCompleted ?? 0,
            issuedAt: vol.certificateIssuedAt ? vol.certificateIssuedAt.toISOString() : null,
            certificateUrl: (vol as any).certificateFileUrl as string | null,
          },
        };
      }),

    generateProgramDoc: publicProcedure
      .input(z.object({
        docType: z.enum(["consent_form", "confidentiality_agreement", "sample_research_task", "program_summary", "release_of_liability"]),
      }))
      .mutation(async ({ input }) => {
        const { url, docId } = await generateProgramDocument(input.docType as ProgramDocType);
        return { url, docId };
      }),
   }),

  // ─── School Contacts (Manila Principals) ───────────────────────────────────
  schoolContacts: router({
    list: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { schoolContacts } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(schoolContacts).orderBy(desc(schoolContacts.createdAt));
      return rows;
    }),
    add: adminProcedure
      .input(z.object({
        principalName: z.string().min(1),
        schoolName: z.string().min(1),
        district: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(schoolContacts).values({
          principalName: input.principalName,
          schoolName: input.schoolName,
          district: input.district,
          email: input.email,
          phone: input.phone ?? null,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(schoolContacts).where(eq(schoolContacts.id, input.id));
        return { success: true };
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["not_sent", "sent", "responded", "no_reply", "meeting"]),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(schoolContacts).set({ status: input.status }).where(eq(schoolContacts.id, input.id));
        return { success: true };
      }),
    sendFellowshipEmail: adminProcedure
      .input(z.object({
        id: z.number(),
        lang: z.enum(["en", "tl"]).default("en"),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [contact] = await db.select().from(schoolContacts).where(eq(schoolContacts.id, input.id));
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        const result = await sendPrincipalFellowshipEmail(
          contact.email,
          contact.principalName,
          contact.schoolName,
          contact.district,
          input.lang
        );
        if (result.success) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 7);
          await db.update(schoolContacts)
            .set({ status: "sent", lastEmailedAt: new Date(), followUpDate })
            .where(eq(schoolContacts.id, input.id));
        }
        return result;
      }),

    // Bulk send fellowship email to multiple contacts
    sendBulkFellowshipEmail: adminProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1).max(100),
        skipAlreadySent: z.boolean().default(true),
        lang: z.enum(["en", "tl"]).default("en"),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq, inArray } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const contacts = await db.select().from(schoolContacts)
          .where(inArray(schoolContacts.id, input.ids));

        const results: Array<{
          id: number;
          name: string;
          school: string;
          email: string;
          success: boolean;
          skipped: boolean;
          error?: string;
        }> = [];

        for (const contact of contacts) {
          // Optionally skip contacts already marked as sent
          if (input.skipAlreadySent && contact.status === "sent") {
            results.push({
              id: contact.id,
              name: contact.principalName,
              school: contact.schoolName,
              email: contact.email,
              success: false,
              skipped: true,
            });
            continue;
          }

          try {
            const result = await sendPrincipalFellowshipEmail(
              contact.email,
              contact.principalName,
              contact.schoolName,
              contact.district,
              input.lang
            );
            if (result.success) {
              const bulkFollowUpDate = new Date();
              bulkFollowUpDate.setDate(bulkFollowUpDate.getDate() + 7);
              await db.update(schoolContacts)
                .set({ status: "sent", lastEmailedAt: new Date(), followUpDate: bulkFollowUpDate })
                .where(eq(schoolContacts.id, contact.id));
            }
            results.push({
              id: contact.id,
              name: contact.principalName,
              school: contact.schoolName,
              email: contact.email,
              success: result.success,
              skipped: false,
              error: result.success ? undefined : "Resend delivery failed",
            });
          } catch (err: any) {
            results.push({
              id: contact.id,
              name: contact.principalName,
              school: contact.schoolName,
              email: contact.email,
              success: false,
              skipped: false,
              error: err?.message ?? "Unknown error",
            });
          }

          // 300ms delay between sends to avoid rate limiting
          await new Promise((r) => setTimeout(r, 300));
        }

        const sent = results.filter((r) => r.success).length;
        const skipped = results.filter((r) => r.skipped).length;
        const failed = results.filter((r) => !r.success && !r.skipped).length;
        return { results, sent, skipped, failed };
      }),

    // Update sendFellowshipEmail to also set a 7-day follow-up date
    setFollowUpDate: adminProcedure
      .input(z.object({ id: z.number(), followUpDate: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(schoolContacts)
          .set({ followUpDate: new Date(input.followUpDate) })
          .where(eq(schoolContacts.id, input.id));
        return { success: true };
      }),

    sendFollowUpEmail: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [contact] = await db.select().from(schoolContacts).where(eq(schoolContacts.id, input.id));
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        const result = await sendFollowUpFellowshipEmail(
          contact.email,
          contact.principalName,
          contact.schoolName,
          contact.district
        );
        if (result.success) {
          await db.update(schoolContacts)
            .set({ followUpSent: true, followUpSentAt: new Date(), status: "sent" })
            .where(eq(schoolContacts.id, input.id));
        }
         return result;
      }),

    logReply: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["responded", "no_reply", "meeting"]),
        replyNotes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Fetch contact details for notification
        const [contact] = await db.select().from(schoolContacts).where(eq(schoolContacts.id, input.id));
        await db.update(schoolContacts)
          .set({
            status: input.status,
            replyNotes: input.replyNotes ?? null,
            replyReceivedAt: new Date(),
          })
          .where(eq(schoolContacts.id, input.id));
        // Notify owner of the reply
        if (contact) {
          const statusLabel = input.status === "meeting" ? "Meeting Set" : input.status === "responded" ? "Responded" : "No Reply";
          await notifyOwner({
            title: `📩 Reply Logged: ${contact.principalName} — ${contact.schoolName} (${statusLabel})`,
            content: `Status updated to: ${statusLabel}\n\nContact: ${contact.principalName}, ${contact.schoolName}, ${contact.district}\nEmail: ${contact.email}\n\nNotes: ${input.replyNotes ?? "(none)"}`,
          }).catch(() => {});
        }
        return { success: true };
      }),

    sendFinalNudge: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { sendFinalNudgeFellowshipEmail } = await import("./email");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [contact] = await db.select().from(schoolContacts).where(eq(schoolContacts.id, input.id));
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        const result = await sendFinalNudgeFellowshipEmail(
          contact.email,
          contact.principalName,
          contact.schoolName,
          contact.district
        );
        if (result.success) {
          await db.update(schoolContacts)
            .set({ finalNudgeSent: true, finalNudgeSentAt: new Date() })
            .where(eq(schoolContacts.id, input.id));
        }
        return result;
      }),

    updateNotes: adminProcedure
      .input(z.object({
        id: z.number(),
        internalNotes: z.string().max(2000),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { schoolContacts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(schoolContacts)
          .set({ internalNotes: input.internalNotes })
          .where(eq(schoolContacts.id, input.id));
        return { success: true };
      }),
  }),
  // ─── Media Outreach — Send via Resend ──────────────────────────────────────
  outreach: router({
    // Search DepEd school directory
    searchSchools: adminProcedure
      .input(z.object({ query: z.string().min(2).max(100) }))
      .query(({ input }) => {
        const { searchSchools: search } = require("./depedSchoolDirectory") as typeof import("./depedSchoolDirectory");
        return search(input.query);
      }),

    // Get persisted media outreach statuses from DB
    getMediaStatuses: adminProcedure.query(async () => {
      return getMediaOutreachStatuses();
    }),
    // Update media outreach status manually (status dropdown change)
    updateMediaStatus: adminProcedure
      .input(z.object({
        contactNum: z.number(),
        status: z.enum(["not_sent", "sent", "responded", "no_reply", "meeting"]),
        responseNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertMediaOutreachStatus(input.contactNum, input.status, undefined, input.responseNotes);
        return { success: true };
      }),
    sendPressRelease: adminProcedure
      .input(z.object({
        contactNum: z.number(),
        recipientEmail: z.string().email(),
        contactName: z.string(),
        orgName: z.string(),
        subject: z.string(),
        personalNote: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await sendPressReleaseEmail(
          input.recipientEmail,
          input.contactName,
          input.orgName,
          input.subject,
          input.personalNote
        );
        // Persist sent status and timestamp to DB so it survives page refresh
        await upsertMediaOutreachStatus(input.contactNum, "sent", new Date());
        return result;
      }),
  }),
  // ─── Weekly Ops ──────────────────────────────────────────────────────────────
  weeklyOps: router({
    getTasks: adminProcedure.query(async () => {
      const weekStart = getCurrentWeekStart();
      const tasks = await getAllWeeklyTasks();
      const completions = await getCompletionsForWeek(weekStart);
      const completedIds = new Set(completions.map((c) => c.taskId));
      return {
        weekStart,
        tasks: tasks.map((t) => ({ ...t, completed: completedIds.has(t.id) })),
      };
    }),

    toggleTask: adminProcedure
      .input(z.object({ taskId: z.number(), completed: z.boolean() }))
      .mutation(async ({ input }) => {
        const weekStart = getCurrentWeekStart();
        if (input.completed) {
          await markTaskComplete(input.taskId, weekStart);
        } else {
          await markTaskIncomplete(input.taskId, weekStart);
        }
        return { success: true, weekStart };
      }),

    getProgress: adminProcedure.query(async () => {
      const weekStart = getCurrentWeekStart();
      const tasks = await getAllWeeklyTasks();
      const completions = await getCompletionsForWeek(weekStart);
      const completedIds = new Set(completions.map((c) => c.taskId));
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
      const byDay = days.map((day) => {
        const dayTasks = tasks.filter((t) => t.day === day);
        const done = dayTasks.filter((t) => completedIds.has(t.id)).length;
        return { day, total: dayTasks.length, done };
      });
      const total = tasks.length;
      const done = completions.length;
      return { weekStart, total, done, byDay };
    }),
  }),

  focusMode: router({
    getOrCreateSession: adminProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().slice(0, 10);
      const dayOfWeek = new Date().getDay();
      const spurgeonIdx = dayOfWeek % SPURGEON_DEVOTIONS.length;
      const verseIdx = dayOfWeek % DAILY_VERSES.length;
      const closingIdx = (dayOfWeek + 3) % CLOSING_VERSES.length;
      const session = await getTodaySession(ctx.user.id, today);
      return {
        session,
        todayVerse: DAILY_VERSES[verseIdx],
        spurgeon: SPURGEON_DEVOTIONS[spurgeonIdx],
        closingVerse: CLOSING_VERSES[closingIdx],
        today,
      };
    }),

    completeDevotion: adminProcedure
      .input(z.object({
        devotionReflection: z.string().min(1),
        prayerText: z.string().min(1),
        devotionVerseRef: z.string(),
        devotionVerseText: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const today = new Date().toISOString().slice(0, 10);
        const sessionId = await upsertFocusSession(ctx.user.id, today, {
          devotionVerseRef: input.devotionVerseRef,
          devotionVerseText: input.devotionVerseText,
          devotionReflection: input.devotionReflection,
          prayerText: input.prayerText,
          devotionCompletedAt: new Date(),
          sessionStartedAt: new Date(),
        });
        return { success: true, sessionId };
      }),

    logBrainExercise: adminProcedure
      .input(z.object({
        sessionId: z.number(),
        exerciseType: z.enum(["memory", "pattern", "word_association", "breathing", "gratitude"]),
        prompt: z.string(),
        userResponse: z.string(),
      }))
      .mutation(async ({ input }) => {
        await logBrainExerciseDb(input.sessionId, input.exerciseType, input.prompt, input.userResponse);
        return { success: true };
      }),

    endSession: adminProcedure
      .input(z.object({
        sessionId: z.number(),
        endOfDayAnswer: z.string(),
        closingVerseRef: z.string(),
        closingVerseText: z.string(),
        totalMinutes: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db2 = await getDb();
        if (db2) {
          const { focusSessions: fs } = await import("../drizzle/schema");
          const { eq: eqOp } = await import("drizzle-orm");
          await db2.update(fs).set({
            sessionEndedAt: new Date(),
            endOfDayAnswer: input.endOfDayAnswer,
            closingVerseRef: input.closingVerseRef,
            closingVerseText: input.closingVerseText,
            totalMinutes: input.totalMinutes,
          }).where(eqOp(fs.id, input.sessionId));
        }
        return { success: true };
      }),

    getBrainExercise: adminProcedure
      .input(z.object({ exerciseType: z.enum(["memory", "pattern", "word_association", "breathing", "gratitude"]) }))
      .query(({ input }) => {
        const pool = BRAIN_EXERCISES[input.exerciseType];
        const idx = Math.floor(Math.random() * pool.length);
        return pool[idx];
      }),
  }),

  // ── Researcher Portal ───────────────────────────────────────────────────────────────
  researcher: router({
    // Bookmarks
    getBookmarks: protectedProcedure.query(async ({ ctx }) => {
      return getBookmarks(ctx.user.id);
    }),
    addBookmark: protectedProcedure
      .input(z.object({ caseId: z.string().min(1), caseTitle: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return addBookmark(ctx.user.id, input.caseId, input.caseTitle);
      }),
    removeBookmark: protectedProcedure
      .input(z.object({ caseId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return removeBookmark(ctx.user.id, input.caseId);
      }),

    // Notes
    getNote: protectedProcedure
      .input(z.object({ caseId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return getNoteForCase(ctx.user.id, input.caseId);
      }),
    saveNote: protectedProcedure
      .input(z.object({ caseId: z.string().min(1), note: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return upsertNote(ctx.user.id, input.caseId, input.note);
      }),

    // Projects
    getProjects: protectedProcedure.query(async ({ ctx }) => {
      return getProjects(ctx.user.id);
    }),
    createProject: protectedProcedure
      .input(z.object({ title: z.string().min(1).max(255), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return createProject(ctx.user.id, input.title, input.description);
      }),
    updateProjectCases: protectedProcedure
      .input(z.object({ projectId: z.number().int(), caseIds: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        return updateProjectCases(input.projectId, ctx.user.id, input.caseIds);
      }),
    deleteProject: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        return deleteProject(input.projectId, ctx.user.id);
      }),

    // Recently Viewed
    recordView: protectedProcedure
      .input(z.object({ caseId: z.string().min(1), caseTitle: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await recordRecentlyViewed(ctx.user.id, input.caseId, input.caseTitle);
        return { success: true };
      }),
    getRecentlyViewed: protectedProcedure.query(async ({ ctx }) => {
      return getRecentlyViewed(ctx.user.id);
    }),

    // Profile
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255).optional(),
        organization: z.string().max(255).optional(),
        geographicFocus: z.string().max(500).optional(),
        subjectMatterExpertise: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { users: usersTable } = await import("../drizzle/schema");
        const { eq: eqOp } = await import("drizzle-orm");
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (Object.keys(updateData).length > 0) {
          await db2.update(usersTable).set(updateData).where(eqOp(usersTable.id, ctx.user.id));
        }
        // Also update the vetting application if exists
        const { vettingApplications } = await import("../drizzle/schema");
        const apps = await db2.select().from(vettingApplications)
          .where(eqOp(vettingApplications.email, ctx.user.email ?? "")).limit(1);
        if (apps.length > 0) {
          const appUpdate: Record<string, unknown> = {};
          if (input.organization !== undefined) appUpdate.organization = input.organization;
          if (input.geographicFocus !== undefined) appUpdate.geographicFocus = input.geographicFocus;
          if (input.subjectMatterExpertise !== undefined) appUpdate.subjectMatterExpertise = input.subjectMatterExpertise;
          if (Object.keys(appUpdate).length > 0) {
            await db2.update(vettingApplications).set(appUpdate as any).where(eqOp(vettingApplications.id, apps[0].id));
          }
        }
        return { success: true };
      }),
  }),

  // ── Research Calendar ────────────────────────────────────────────────────────
  calendar: router({
    getEvents: protectedProcedure
      .input(z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { researchEvents } = await import("../drizzle/schema");
        const { and, eq: eqOp, lte, gte } = await import("drizzle-orm");
        const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
        const lastDay = new Date(input.year, input.month, 0).getDate();
        const monthEnd = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        const events = await db2
          .select()
          .from(researchEvents)
          .where(
            and(
              eqOp(researchEvents.userId, ctx.user.id),
              lte(researchEvents.startDate, monthEnd),
              gte(researchEvents.endDate, monthStart)
            )
          )
          .orderBy(researchEvents.startDate);
        return events;
      }),

    createEvent: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        category: z.enum(["investigation", "interview", "deadline", "outreach", "review", "personal", "other"]).default("other"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        allDay: z.boolean().default(true),
        caseRef: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { researchEvents } = await import("../drizzle/schema");
        const result = await db2.insert(researchEvents).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          startDate: input.startDate,
          endDate: input.endDate,
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          allDay: input.allDay ? 1 : 0,
          caseRef: input.caseRef ?? null,
          completed: 0,
        });
        return { id: Number((result as any).insertId), success: true };
      }),

    updateEvent: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        category: z.enum(["investigation", "interview", "deadline", "outreach", "review", "personal", "other"]).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
        allDay: z.boolean().optional(),
        caseRef: z.string().max(255).nullable().optional(),
        completed: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { researchEvents } = await import("../drizzle/schema");
        const { and, eq: eqOp } = await import("drizzle-orm");
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.category !== undefined) updateData.category = input.category;
        if (input.startDate !== undefined) updateData.startDate = input.startDate;
        if (input.endDate !== undefined) updateData.endDate = input.endDate;
        if (input.startTime !== undefined) updateData.startTime = input.startTime;
        if (input.endTime !== undefined) updateData.endTime = input.endTime;
        if (input.allDay !== undefined) updateData.allDay = input.allDay ? 1 : 0;
        if (input.caseRef !== undefined) updateData.caseRef = input.caseRef;
        if (input.completed !== undefined) updateData.completed = input.completed ? 1 : 0;
        if (Object.keys(updateData).length === 0) return { success: true };
        await db2
          .update(researchEvents)
          .set(updateData)
          .where(and(eqOp(researchEvents.id, input.id), eqOp(researchEvents.userId, ctx.user.id)));
        return { success: true };
      }),

    deleteEvent: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const db2 = await getDb();
        if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { researchEvents } = await import("../drizzle/schema");
        const { and, eq: eqOp } = await import("drizzle-orm");
        await db2
          .delete(researchEvents)
          .where(and(eqOp(researchEvents.id, input.id), eqOp(researchEvents.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
  donors: router({
    list: adminProcedure.query(async () => {
      return await getDonorContacts();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        platform: z.enum(["kofi", "buymeacoffee", "grant", "individual", "other"]),
        tier: z.string().optional(),
        country: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createDonorContact({
          name: input.name,
          email: input.email || undefined,
          platform: input.platform,
          tier: input.tier || undefined,
          internalNotes: (input.internalNotes || input.notes) || undefined,
        });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        email: z.string().optional(),
        platform: z.enum(["kofi", "buymeacoffee", "grant", "individual", "other"]).optional(),
        tier: z.string().optional(),
        country: z.string().optional(),
        status: z.enum(["new", "thanked", "follow_up_sent", "responded", "declined", "no_reply"]).optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
        followUpDate: z.number().optional(),
        replyNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.platform !== undefined) updateData.platform = data.platform;
        if (data.tier !== undefined) updateData.tier = data.tier;
        if (data.status !== undefined) {
          updateData.status = data.status;
          if (data.status === "thanked" || data.status === "follow_up_sent") {
            updateData.lastContactedAt = new Date();
          }
        }
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
        if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate;
        if (data.replyNotes !== undefined) {
          updateData.replyNotes = data.replyNotes;
          updateData.replyReceivedAt = Date.now();
        }
        await updateDonorContact(id, updateData as any);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteDonorContact(input.id);
        return { success: true };
      }),
    logReply: adminProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(["responded", "declined", "no_reply"]),
        replyNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const donor = await getDonorContactById(input.id);
        await updateDonorContact(input.id, {
          status: input.status,
          replyNotes: input.replyNotes || null,
          replyReceivedAt: Date.now(),
        } as any);
        if (donor) {
          await notifyOwner({
            title: `Donor Reply: ${donor.name}`,
            content: `${donor.name} (${donor.platform?.toUpperCase()}) replied.\nStatus: ${input.status}\nNotes: ${input.replyNotes || "(none)"}`,
          });
        }
        return { success: true };
      }),
    setFollowUpDate: adminProcedure
      .input(z.object({
        id: z.number().int(),
        followUpDate: z.number(),
      }))
      .mutation(async ({ input }) => {
        await updateDonorContact(input.id, { followUpDate: input.followUpDate } as any);
        return { success: true };
      }),
  }),
  campaigns: router({
    summary: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { schoolContacts } = await import("../drizzle/schema");
      const db = await getDb();

      const [schoolRows, mediaStatuses, donorRows] = await Promise.all([
        db ? db.select().from(schoolContacts) : [],
        getMediaOutreachStatuses(),
        getDonorContacts(),
      ]);

      const school = schoolRows as any[];
      const media = mediaStatuses as any[];
      const donors = donorRows as any[];
      const now = Date.now();

      // School stats
      const schoolTotal = school.length;
      const schoolEmailed = school.filter((r: any) => r.emailSent).length;
      const schoolFollowUpSent = school.filter((r: any) => r.followUpSent).length;
      const schoolFinalNudge = school.filter((r: any) => r.finalNudgeSent).length;
      const schoolResponded = school.filter((r: any) => r.schoolOutreachStatus === "responded" || r.schoolOutreachStatus === "meeting_set").length;
      const schoolOverdue = school.filter((r: any) => r.followUpDate && !r.followUpSent && r.followUpDate < now).length;
      const schoolDueSoon = school.filter((r: any) => r.followUpDate && !r.followUpSent && r.followUpDate >= now && r.followUpDate <= now + 2 * 24 * 60 * 60 * 1000).length;

      // Media stats
      const mediaTotal = 10;
      const mediaSent = media.filter((s: any) => s.status && s.status !== "Not Sent").length;
      const mediaResponded = media.filter((s: any) => s.status === "responded" || s.status === "meeting_set").length;

      // Donor stats
      const donorTotal = donors.length;
      const donorContacted = donors.filter((d: any) => d.lastContactedAt).length;
      const donorResponded = donors.filter((d: any) => d.status === "responded" || d.status === "meeting_set").length;
      const donorFollowUpDue = donors.filter((d: any) => d.followUpDate && d.followUpDate < now && d.status !== "responded").length;

      return {
        school: { total: schoolTotal, emailed: schoolEmailed, followUpSent: schoolFollowUpSent, finalNudge: schoolFinalNudge, responded: schoolResponded, overdue: schoolOverdue, dueSoon: schoolDueSoon },
        media: { total: mediaTotal, sent: mediaSent, responded: mediaResponded },
        donors: { total: donorTotal, contacted: donorContacted, responded: donorResponded, followUpDue: donorFollowUpDue },
      };
    }),
    exportObsidian: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { schoolContacts } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const db = await getDb();

      // Gather all three data sources in parallel
      const [schoolRows, mediaStatuses, donorRows] = await Promise.all([
        db ? db.select().from(schoolContacts).orderBy(desc(schoolContacts.createdAt)) : [],
        getMediaOutreachStatuses(),
        getDonorContacts(),
      ]);

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const lines: string[] = [];

      lines.push(`# The Vault — Campaign Export`);
      lines.push(`> Generated: ${now.toUTCString()}`);
      lines.push(`> Source: vet.thevaultinvestigates.cloud`);
      lines.push("");
      lines.push("---");
      lines.push("");

      // ── School Fellowship Outreach ──────────────────────────────────────────
      lines.push("## 🏫 School Fellowship Outreach");
      lines.push("");
      const sentSchool = (schoolRows as any[]).filter((r: any) => r.emailSent);
      const notSentSchool = (schoolRows as any[]).filter((r: any) => !r.emailSent);
      lines.push(`**Total contacts:** ${schoolRows.length} | **Emailed:** ${sentSchool.length} | **Pending:** ${notSentSchool.length}`);
      lines.push("");

      if (sentSchool.length > 0) {
        lines.push("### Emailed Contacts");
        lines.push("");
        lines.push("| Principal | School | District | Status | Follow-up | Reply | Notes |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const r of sentSchool) {
          const followUp = r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : "—";
          const followUpSent = r.followUpSent ? "✓ Sent" : (r.followUpDate ? "Pending" : "—");
          const finalNudge = r.finalNudgeSent ? "✓ Sent" : "—";
          const reply = r.replyNotes ? r.replyNotes.replace(/\|/g, "/").slice(0, 60) : "—";
          const notes = r.internalNotes ? r.internalNotes.replace(/\|/g, "/").slice(0, 60) : "—";
          lines.push(`| ${r.principalName} | ${r.schoolName} | ${r.district} | ${r.schoolOutreachStatus || "sent"} | ${followUp} (${followUpSent}) | ${reply} | ${notes} |`);
        }
        lines.push("");
      }

      if (notSentSchool.length > 0) {
        lines.push("### Not Yet Contacted");
        lines.push("");
        for (const r of notSentSchool) {
          lines.push(`- ${r.principalName} — ${r.schoolName}, ${r.district}`);
        }
        lines.push("");
      }

      lines.push("---");
      lines.push("");

      // ── Media Outreach ──────────────────────────────────────────────────────
      const MEDIA_CONTACTS = [
        { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", email: "jrgalbert@gmail.com", day: 1 },
        { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", email: "pcij@pcij.org", day: 1 },
        { num: 3, name: "Rappler", org: "Rappler", email: "newsdesk@rappler.com", day: 2 },
        { num: 4, name: "VERA Files", org: "VERA Files", email: "newsroom@verafiles.org", day: 2 },
        { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", email: "staff@cmfr-phil.org", day: 3 },
        { num: 6, name: "National Union of Journalists (NUJP)", org: "NUJP", email: "nujp@nujp.org", day: 3 },
        { num: 7, name: "Committee to Protect Journalists", org: "CPJ", email: "info@cpj.org", day: 4 },
        { num: 8, name: "Reporters Without Borders", org: "RSF", email: "rsf@rsf.org", day: 4 },
        { num: 9, name: "DSWD", org: "DSWD", email: "osec@dswd.gov.ph", day: 5 },
        { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", email: "newsroom@inquirer.com.ph", day: 5 },
      ];

      lines.push("## 📰 Media Outreach — Top 10 Authorities");
      lines.push("");
      lines.push("| # | Name / Org | Day | Status | Last Contacted |");
      lines.push("|---|---|---|---|---|");
      for (const c of MEDIA_CONTACTS) {
        const status = (mediaStatuses as any[]).find((s: any) => s.contactNum === c.num);
        const statusLabel = status?.status || "Not Sent";
        const lastContacted = status?.lastContactedAt ? new Date(status.lastContactedAt).toLocaleDateString() : "Never";
        lines.push(`| ${c.num} | **${c.name}** (${c.org}) | Day ${c.day} | ${statusLabel} | ${lastContacted} |`);
      }
      lines.push("");

      lines.push("---");
      lines.push("");

      // ── Donor Outreach ──────────────────────────────────────────────────────
      lines.push("## 💛 Donor Outreach");
      lines.push("");
      const donors = donorRows as any[];
      const byPlatform: Record<string, any[]> = {};
      for (const d of donors) {
        const p = d.platform || "other";
        if (!byPlatform[p]) byPlatform[p] = [];
        byPlatform[p].push(d);
      }
      const platformLabels: Record<string, string> = {
        kofi: "Ko-fi",
        buymeacoffee: "Buy Me a Coffee",
        grant: "Grant",
        individual: "Individual",
        other: "Other",
      };
      for (const [platform, list] of Object.entries(byPlatform)) {
        lines.push(`### ${platformLabels[platform] || platform} (${list.length})`);
        lines.push("");
        lines.push("| Name | Email | Status | Follow-up | Reply Notes | Internal Notes |");
        lines.push("|---|---|---|---|---|---|");
        for (const d of list) {
          const followUp = d.followUpDate ? new Date(d.followUpDate).toLocaleDateString() : "—";
          const reply = d.replyNotes ? d.replyNotes.replace(/\|/g, "/").slice(0, 60) : "—";
          const notes = d.internalNotes ? d.internalNotes.replace(/\|/g, "/").slice(0, 60) : "—";
          lines.push(`| ${d.name} | ${d.email || "—"} | ${d.status || "new"} | ${followUp} | ${reply} | ${notes} |`);
        }
        lines.push("");
      }
      if (donors.length === 0) {
        lines.push("_No donor contacts added yet._");
        lines.push("");
      }

      lines.push("---");
      lines.push("");
      lines.push(`*Exported from The Vault Investigates — ${dateStr}*`);

      return { markdown: lines.join("\n"), filename: `vault-campaign-export-${dateStr}.md` };
    }),
  }),

  vloggerInquiries: vloggerInquiriesRouter,

  contacts: router({
    // Export all contacts across all categories as CSV, Markdown, and PDF-ready data
    exportAll: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { vloggerInquiries: vloggerInquiriesTable, schoolContacts: schoolContactsTable, donorContacts: donorContactsTable } = await import("../drizzle/schema");
      const db = await getDb();

      const MEDIA_CONTACTS = [
        { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", email: "jrgalbert@gmail.com" },
        { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", email: "pcij@pcij.org" },
        { num: 3, name: "Rappler", org: "Rappler", email: "newsdesk@rappler.com" },
        { num: 4, name: "VERA Files", org: "VERA Files", email: "newsroom@verafiles.org" },
        { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", email: "staff@cmfr-phil.org" },
        { num: 6, name: "National Union of Journalists (NUJP)", org: "NUJP", email: "nujp@nujp.org" },
        { num: 7, name: "Committee to Protect Journalists", org: "CPJ", email: "info@cpj.org" },
        { num: 8, name: "Reporters Without Borders", org: "RSF", email: "rsf@rsf.org" },
        { num: 9, name: "DSWD", org: "DSWD", email: "osec@dswd.gov.ph" },
        { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", email: "newsroom@inquirer.com.ph" },
      ];

      const [vloggerRows, donorRows, schoolRows, mediaStatusRows] = await Promise.all([
        db ? db.select().from(vloggerInquiriesTable) : [],
        getDonorContacts(),
        db ? db.select().from(schoolContactsTable) : [],
        getMediaOutreachStatuses(),
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);

      // ── Build unified contacts array for CSV ──────────────────────────────────
      type ContactRow = {
        id: string;
        category: string;
        name: string;
        organisation: string;
        email: string;
        phone: string;
        platform: string;
        status: string;
        notes: string;
        dateAdded: string;
      };

      const allContacts: ContactRow[] = [];

      // Vloggers
      for (const v of (vloggerRows as any[])) {
        allContacts.push({
          id: `VLG-${v.id}`,
          category: "Vlogger",
          name: v.creatorName || "",
          organisation: v.channelName || "",
          email: v.email || "",
          phone: "",
          platform: v.vloggerPlatform || "youtube",
          status: v.inquiryStatus || "not_sent",
          notes: v.internalNotes || "",
          dateAdded: v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : "",
        });
      }

      // Donors
      for (const d of (donorRows as any[])) {
        allContacts.push({
          id: `DON-${d.id}`,
          category: "Donor",
          name: d.name || "",
          organisation: d.grantOrg || "",
          email: d.email || "",
          phone: "",
          platform: d.donorPlatform || "",
          status: d.donorStatus || "new",
          notes: d.internalNotes || "",
          dateAdded: d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : "",
        });
      }

      // School Contacts
      for (const s of (schoolRows as any[])) {
        allContacts.push({
          id: `SCH-${s.id}`,
          category: "School Contact",
          name: s.principalName || "",
          organisation: s.schoolName || "",
          email: s.email || "",
          phone: s.phone || "",
          platform: "",
          status: s.schoolOutreachStatus || "not_sent",
          notes: s.internalNotes || "",
          dateAdded: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "",
        });
      }

      // Media Outreach
      for (const m of MEDIA_CONTACTS) {
        const statusRow = (mediaStatusRows as any[]).find((r: any) => r.contactNum === m.num);
        allContacts.push({
          id: `MED-${m.num}`,
          category: "Media Outreach",
          name: m.name,
          organisation: m.org,
          email: m.email,
          phone: "",
          platform: "",
          status: statusRow?.mediaStatus || "not_sent",
          notes: statusRow?.responseNotes || "",
          dateAdded: statusRow?.lastContactedAt ? new Date(statusRow.lastContactedAt).toISOString().slice(0, 10) : "",
        });
      }

      // ── CSV (Beekeeper-compatible) ─────────────────────────────────────────────
      const csvHeaders = ["ID", "Category", "Name", "Organisation", "Email", "Phone", "Platform", "Status", "Notes", "Date Added"];
      const escCsv = (val: string) => {
        if (!val) return "";
        const s = String(val).replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
      };
      const csvLines = [
        csvHeaders.join(","),
        ...allContacts.map(c => [
          escCsv(c.id),
          escCsv(c.category),
          escCsv(c.name),
          escCsv(c.organisation),
          escCsv(c.email),
          escCsv(c.phone),
          escCsv(c.platform),
          escCsv(c.status),
          escCsv(c.notes),
          escCsv(c.dateAdded),
        ].join(",")),
      ];
      const csv = csvLines.join("\n");

      // ── Markdown ──────────────────────────────────────────────────────────────
      const categories = ["Vlogger", "Donor", "School Contact", "Media Outreach"];
      const mdLines: string[] = [];
      mdLines.push("# The Vault Investigates — Contacts Export");
      mdLines.push("");
      mdLines.push(`**Exported:** ${dateStr}  `);
      mdLines.push(`**Total contacts:** ${allContacts.length}`);
      mdLines.push("");
      mdLines.push("---");
      mdLines.push("");

      for (const cat of categories) {
        const group = allContacts.filter(c => c.category === cat);
        mdLines.push(`## ${cat}s (${group.length})`);
        mdLines.push("");
        if (group.length === 0) {
          mdLines.push("_No contacts in this category._");
          mdLines.push("");
          continue;
        }
        mdLines.push("| ID | Name | Organisation | Email | Phone | Platform | Status | Date Added |");
        mdLines.push("|---|---|---|---|---|---|---|---|");
        for (const c of group) {
          mdLines.push(`| ${c.id} | ${c.name || "—"} | ${c.organisation || "—"} | ${c.email || "—"} | ${c.phone || "—"} | ${c.platform || "—"} | ${c.status} | ${c.dateAdded || "—"} |`);
        }
        mdLines.push("");
      }

      mdLines.push("---");
      mdLines.push("");
      mdLines.push(`*The Vault Investigates · Contacts Export · ${dateStr}*`);
      const markdown = mdLines.join("\n");

      return {
        contacts: allContacts,
        csv,
        markdown,
        filename: `vault-contacts-${dateStr}`,
        exportedAt: dateStr,
        totalCount: allContacts.length,
        categoryCounts: {
          vloggers: allContacts.filter(c => c.category === "Vlogger").length,
          donors: allContacts.filter(c => c.category === "Donor").length,
          schools: allContacts.filter(c => c.category === "School Contact").length,
          media: allContacts.filter(c => c.category === "Media Outreach").length,
        },
      };
    }),
  }),
  creatorScan: router({
    // Run a multi-source scan for a given keyword
    runScan: adminProcedure
      .input(z.object({
        keywords: z.array(z.string()).min(1),
      }))
      .mutation(async ({ input }) => {
        const results: Array<{
          source: "youtube" | "google_news" | "reddit" | "vimeo";
          title: string;
          url: string;
          channelOrAuthor?: string;
          description?: string;
          thumbnail?: string;
          publishedAt?: string;
          keyword: string;
        }> = [];

        for (const keyword of input.keywords) {
          // ── YouTube ──────────────────────────────────────────────────────
          try {
            const ytData = await callDataApi("Youtube/search", {
              query: { q: keyword, hl: "en", gl: "PH" },
            }) as any;
            const contents = ytData?.contents ?? [];
            for (const item of contents.slice(0, 5)) {
              if (item?.type === "video" && item.video) {
                const v = item.video;
                results.push({
                  source: "youtube",
                  title: v.title ?? "Untitled",
                  url: `https://www.youtube.com/watch?v=${v.videoId}`,
                  channelOrAuthor: v.channelTitle ?? "",
                  description: v.descriptionSnippet ?? "",
                  thumbnail: v.thumbnails?.[0]?.url ?? "",
                  publishedAt: v.publishedTimeText ?? "",
                  keyword,
                });
              }
            }
          } catch (e) {
            console.warn("[CreatorScan] YouTube error:", e);
          }

          // ── Google News RSS ───────────────────────────────────────────────
          try {
            const encoded = encodeURIComponent(keyword);
            const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-PH&gl=PH&ceid=PH:en`;
            const rssRes = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (rssRes.ok) {
              const xml = await rssRes.text();
              const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
              for (const item of items.slice(0, 5)) {
                const titleMatch = item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ?? item.match(/<title>(.+?)<\/title>/);
                const linkMatch = item.match(/<link>(.+?)<\/link>/);
                const descMatch = item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ?? item.match(/<description>(.+?)<\/description>/);
                const pubMatch = item.match(/<pubDate>(.+?)<\/pubDate>/);
                const sourceMatch = item.match(/<source[^>]*>(.+?)<\/source>/);
                if (titleMatch && linkMatch) {
                  results.push({
                    source: "google_news",
                    title: titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
                    url: linkMatch[1].trim(),
                    channelOrAuthor: sourceMatch?.[1] ?? "",
                    description: descMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "",
                    publishedAt: pubMatch?.[1] ?? "",
                    keyword,
                  });
                }
              }
            }
          } catch (e) {
            console.warn("[CreatorScan] Google News error:", e);
          }

          // ── Reddit ────────────────────────────────────────────────────────
          try {
            const redditRes = await fetch(
              `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=5`,
              { headers: { "User-Agent": "VaultInvestigates/1.0" } }
            );
            if (redditRes.ok) {
              const redditData = await redditRes.json() as any;
              const posts = redditData?.data?.children ?? [];
              for (const post of posts) {
                const p = post?.data;
                if (!p) continue;
                results.push({
                  source: "reddit",
                  title: p.title ?? "Untitled",
                  url: `https://www.reddit.com${p.permalink}`,
                  channelOrAuthor: `r/${p.subreddit}`,
                  description: p.selftext?.slice(0, 200) ?? "",
                  thumbnail: p.thumbnail?.startsWith("http") ? p.thumbnail : "",
                  publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : "",
                  keyword,
                });
              }
            }
          } catch (e) {
            console.warn("[CreatorScan] Reddit error:", e);
          }

          // ── Vimeo ─────────────────────────────────────────────────────────
          try {
            const vimeoRes = await fetch(
              `https://api.vimeo.com/videos?query=${encodeURIComponent(keyword)}&per_page=5&sort=relevant`,
              { headers: { "Authorization": `Bearer ${ENV.forgeApiKey}`, "Accept": "application/vnd.vimeo.*+json;version=3.4" } }
            );
            // Vimeo public search without auth — use their oEmbed-based approach
            const vimeoSearchRes = await fetch(
              `https://vimeo.com/search?q=${encodeURIComponent(keyword)}&type=videos`,
              { headers: { "User-Agent": "Mozilla/5.0" } }
            );
            // Fallback: use public Vimeo RSS
            const vimeoRss = await fetch(
              `https://vimeo.com/search?q=${encodeURIComponent(keyword)}&format=json`,
              { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
            );
            if (vimeoRss.ok) {
              const vimeoJson = await vimeoRss.json().catch(() => null) as any;
              const clips = vimeoJson?.clips ?? vimeoJson?.data ?? [];
              for (const clip of clips.slice(0, 5)) {
                results.push({
                  source: "vimeo",
                  title: clip.name ?? clip.title ?? "Untitled",
                  url: clip.link ?? clip.url ?? `https://vimeo.com/${clip.id}`,
                  channelOrAuthor: clip.user?.name ?? "",
                  description: clip.description ?? "",
                  thumbnail: clip.pictures?.sizes?.[2]?.link ?? "",
                  publishedAt: clip.created_time ?? "",
                  keyword,
                });
              }
            }
          } catch (e) {
            console.warn("[CreatorScan] Vimeo error:", e);
          }
        }

        return { results, total: results.length };
      }),

    // Save a lead to the database
    saveLead: adminProcedure
      .input(z.object({
        source: z.enum(["youtube", "google_news", "reddit", "vimeo"]),
        title: z.string(),
        url: z.string(),
        channelOrAuthor: z.string().optional(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
        publishedAt: z.string().optional(),
        keyword: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await saveScanLead({
          source: input.source,
          title: input.title,
          url: input.url,
          channelOrAuthor: input.channelOrAuthor ?? null,
          description: input.description ?? null,
          thumbnail: input.thumbnail ?? null,
          publishedAt: input.publishedAt ?? null,
          keyword: input.keyword ?? null,
          leadStatus: "new",
        });
        return { success: true };
      }),

    // List all saved leads
    listLeads: adminProcedure.query(async () => {
      return getAllScanLeads();
    }),

    // Update lead status
    updateLeadStatus: adminProcedure
      .input(z.object({ id: z.number(), leadStatus: z.string(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await updateScanLeadStatus(input.id, input.leadStatus, input.notes);
        return { success: true };
      }),

    // Delete a lead
    deleteLead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteScanLead(input.id);
        return { success: true };
      }),
  }),

  // ─── DEPED DIRECTORY ────────────────────────────────────────────────────────
  deped: router({
    count: protectedProcedure.query(() => getDepedSchoolCount()),
    regions: protectedProcedure.query(() => getDepedRegions()),
    provinces: protectedProcedure.input(z.object({ region: z.string().optional() })).query(({ input }) => getDepedProvinces(input.region)),
    search: protectedProcedure
      .input(z.object({ query: z.string().default(""), region: z.string().optional(), province: z.string().optional(), page: z.number().default(1), pageSize: z.number().default(50) }))
      .query(({ input }) => searchDepedSchools(input.query, input.region, input.province, input.page, input.pageSize)),
    importFromCsv: adminProcedure.mutation(async () => {
      // Load the preloaded CSV from the server filesystem
      let csvContent: string;
      try {
        csvContent = readFileSync("/home/ubuntu/deped_schools.csv", "utf-8");
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DepEd CSV file not found on server" });
      }
      const rows = parse(csvContent, { columns: true, skip_empty_lines: true });
      const schools = rows.map((r: any) => ({
        schoolId: r["school_id"] || r["School ID"] || r["schoolId"] || r["id"] || "",
        schoolName: r["school_name"] || r["School Name"] || r["schoolName"] || r["name"] || "",
        region: r["region"] || r["Region"] || "",
        province: r["province"] || r["Province"] || "",
        municipality: r["municipality"] || r["Municipality"] || r["City/Municipality"] || "",
        programs: r["programs"] || r["Programs"] || r["Strand"] || "",
        tvlSpecializations: r["tvl_specializations"] || r["TVL Specializations"] || r["tvlSpecializations"] || r["TVL"] || "",
      })).filter((s: any) => s.schoolName);
      const count = await bulkInsertDepedSchools(schools);
      return { imported: count };
    }),
  }),

  // ─── MEDIA SCAN ─────────────────────────────────────────────────────────────
  mediaScan: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().min(1), sources: z.array(z.enum(["Google News", "YouTube", "Reddit", "Google Web"])).default(["Google News"]) }))
      .mutation(async ({ input }) => {
        const results: any[] = [];
        for (const source of input.sources) {
          try {
            if (source === "Google News") {
              const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(input.query)}&hl=en-US&gl=US&ceid=US:en`;
              const res = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              const xml = await res.text();
              const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
              for (const item of items.slice(0, 10)) {
                const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
                const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
                const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
                if (title && link) results.push({ title, url: link, source: "Google News", snippet: description.replace(/<[^>]+>/g, "").slice(0, 200), publishedAt: null });
              }
            } else if (source === "Reddit") {
              const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(input.query)}&sort=relevance&limit=10`, { headers: { "User-Agent": "Mozilla/5.0" } });
              const json = await res.json();
              for (const post of json?.data?.children || []) {
                const d = post.data;
                results.push({ title: d.title, url: `https://reddit.com${d.permalink}`, source: "Reddit", snippet: d.selftext?.slice(0, 200) || "", publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null });
              }
            } else if (source === "YouTube") {
              const res = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(input.query)}&type=video&sort_by=upload_date`, { headers: { "User-Agent": "Mozilla/5.0" } });
              if (res.ok) {
                const json = await res.json();
                for (const v of (json || []).slice(0, 10)) {
                  results.push({ title: v.title, url: `https://youtube.com/watch?v=${v.videoId}`, source: "YouTube", snippet: v.description?.slice(0, 200) || "", publishedAt: v.published ? new Date(v.published * 1000).toISOString() : null });
                }
              }
            } else if (source === "Google Web") {
              const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(input.query)}&hl=en&gl=US`;
              const res = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              const xml = await res.text();
              const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
              for (const item of items.slice(0, 10)) {
                const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
                const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
                const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
                if (title && link) results.push({ title, url: link, source: "Google Web", snippet: description.replace(/<[^>]+>/g, "").slice(0, 200), publishedAt: null });
              }
            }
          } catch (e) {
            console.warn(`[MediaScan] Error searching ${source}:`, e);
          }
        }
        return results;
      }),
    leads: router({
      list: protectedProcedure.input(z.object({ status: z.string().optional() })).query(({ input }) => getMediaLeads(input.status)),
      save: protectedProcedure
        .input(
          z.object({
            title: z.string(),
            url: z.string(),
            source: z.enum(["Google News", "YouTube", "Reddit", "Google Web"]),
            snippet: z.string().optional(),
            publishedAt: z.string().optional(),
            rightsStatus: z.enum(["Unknown", "Free to Use", "Copyrighted", "Fair Use"]).default("Unknown"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          await createMediaLead({
            ...input,
            publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
            savedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
          });
          return { success: true };
        }),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number(),
            status: z.enum(["Lead", "Verified", "Coded", "Archived"]).optional(),
            rightsStatus: z.enum(["Unknown", "Free to Use", "Copyrighted", "Fair Use"]).optional(),
            caseRef: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await updateMediaLead(id, data);
          return { success: true };
        }),
    }),
  }),
});
export type AppRouter = typeof appRouter;
