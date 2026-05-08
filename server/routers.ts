import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addOutreachAuditEntry,
  addVloggerAuditEntry,
  bulkInsertDepedSchools,
  bulkInsertSchoolContacts,
  createDonorContact,
  createMediaContact,
  createMediaLead,
  createSchoolContact,
  createVloggerInquiry,
  getAccessTierConfigs,
  getAllUsers,
  getDepedProvinces,
  getDepedRegions,
  getDepedSchoolCount,
  getDonorContacts,
  getMediaContacts,
  getMediaDownloadLog,
  getMediaLeads,
  getMonthlyDownloadCount,
  getOutreachAuditLog,
  getSchoolContacts,
  getUserByOpenId,
  getVloggerAuditLog,
  getVloggerInquiries,
  logMediaDownload,
  searchDepedSchools,
  updateAccessTierConfig,
  updateDonorContact,
  updateMediaContact,
  updateMediaLead,
  updateSchoolContact,
  updateUserDownloadTier,
  updateUserPortalRole,
  updateVloggerInquiry,
} from "./db";
import { storagePut } from "./storage";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "editor@vet.thevaultinvestigates.cloud";
const FROM_NAME = "The Vault Investigates";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

// ─── PORTAL ROLE GUARD ────────────────────────────────────────────────────────
const researcherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await getUserByOpenId(ctx.user.openId);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const allowed = ["Researcher", "Custodian", "Admin"];
  if (!allowed.includes(user.portalRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Researcher role required" });
  return next({ ctx: { ...ctx, portalUser: user } });
});

const custodianProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await getUserByOpenId(ctx.user.openId);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const allowed = ["Custodian", "Admin"];
  if (!allowed.includes(user.portalRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Custodian role required" });
  return next({ ctx: { ...ctx, portalUser: user } });
});

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      const user = await getUserByOpenId(opts.ctx.user.openId);
      return user ?? opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── USERS ──────────────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(() => getAllUsers()),
    updatePortalRole: adminProcedure
      .input(z.object({ userId: z.number(), portalRole: z.enum(["Observer", "Researcher", "Custodian", "Admin"]) }))
      .mutation(({ input }) => updateUserPortalRole(input.userId, input.portalRole)),
    updateDownloadTier: adminProcedure
      .input(z.object({ userId: z.number(), downloadTier: z.enum(["Free", "Supporter", "Investigator"]) }))
      .mutation(({ input }) => updateUserDownloadTier(input.userId, input.downloadTier)),
  }),

  // ─── VLOGGER INQUIRIES ──────────────────────────────────────────────────────
  vlogger: router({
    list: researcherProcedure.input(z.object({ status: z.string().optional() })).query(({ input }) => getVloggerInquiries(input.status)),
    create: researcherProcedure
      .input(
        z.object({
          creatorName: z.string().min(1),
          platform: z.string().min(1),
          channelUrl: z.string().optional(),
          contactEmail: z.string().email().optional(),
          deadlineDays: z.enum(["7", "14", "21"]).default("14"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const deadlineAt = new Date();
        deadlineAt.setDate(deadlineAt.getDate() + parseInt(input.deadlineDays));
        await createVloggerInquiry({ ...input, deadlineAt });
        return { success: true };
      }),
    update: researcherProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Pending", "Sent", "Responded", "Archived"]).optional(),
          deadlineDays: z.enum(["7", "14", "21"]).optional(),
          notes: z.string().optional(),
          lastTemplateUsed: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.deadlineDays) {
          const deadlineAt = new Date();
          deadlineAt.setDate(deadlineAt.getDate() + parseInt(data.deadlineDays));
          await updateVloggerInquiry(id, { ...data, deadlineAt });
        } else {
          await updateVloggerInquiry(id, data);
        }
        return { success: true };
      }),
    sendEmail: researcherProcedure
      .input(
        z.object({
          inquiryId: z.number(),
          to: z.string().email(),
          subject: z.string(),
          html: z.string(),
          templateName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await sendEmail(input.to, input.subject, input.html);
        await updateVloggerInquiry(input.inquiryId, { status: "Sent", lastTemplateUsed: input.templateName });
        await addVloggerAuditEntry({
          inquiryId: input.inquiryId,
          action: `Email sent via template: ${input.templateName}`,
          templateUsed: input.templateName,
          performedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
        });
        await addOutreachAuditEntry({
          module: "Vlogger",
          contactId: input.inquiryId,
          action: `Email sent`,
          templateUsed: input.templateName,
          performedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
        });
        return { success: true };
      }),
    auditLog: researcherProcedure.input(z.object({ inquiryId: z.number() })).query(({ input }) => getVloggerAuditLog(input.inquiryId)),
  }),

  // ─── SCHOOL OUTREACH ────────────────────────────────────────────────────────
  school: router({
    list: researcherProcedure.input(z.object({ status: z.string().optional() })).query(({ input }) => getSchoolContacts(input.status)),
    create: researcherProcedure
      .input(
        z.object({
          schoolName: z.string().min(1),
          principalName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          region: z.string().optional(),
          province: z.string().optional(),
          municipality: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createSchoolContact(input);
        return { success: true };
      }),
    update: researcherProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Pending", "Sent", "Follow-up Sent", "Responded", "Archived"]).optional(),
          lastTemplateUsed: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSchoolContact(id, data);
        return { success: true };
      }),
    sendEmail: researcherProcedure
      .input(
        z.object({
          contactId: z.number(),
          to: z.string().email(),
          subject: z.string(),
          html: z.string(),
          templateName: z.string(),
          isFollowUp: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await sendEmail(input.to, input.subject, input.html);
        const newStatus = input.isFollowUp ? "Follow-up Sent" : "Sent";
        await updateSchoolContact(input.contactId, { status: newStatus, lastTemplateUsed: input.templateName });
        await addOutreachAuditEntry({
          module: "School",
          contactId: input.contactId,
          action: input.isFollowUp ? "Follow-up email sent" : "Email sent",
          templateUsed: input.templateName,
          performedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
        });
        return { success: true };
      }),
    csvImport: researcherProcedure
      .input(z.object({ csvData: z.string() }))
      .mutation(async ({ input }) => {
        const rows = parse(input.csvData, { columns: true, skip_empty_lines: true });
        const contacts = rows.map((r: any) => ({
          schoolName: r["School Name"] || r["schoolName"] || r["name"] || "",
          principalName: r["Principal"] || r["principalName"] || "",
          email: r["Email"] || r["email"] || "",
          phone: r["Phone"] || r["phone"] || "",
          region: r["Region"] || r["region"] || "",
          province: r["Province"] || r["province"] || "",
          municipality: r["Municipality"] || r["municipality"] || "",
        })).filter((c: any) => c.schoolName);
        const count = await bulkInsertSchoolContacts(contacts);
        return { imported: count };
      }),
    auditLog: researcherProcedure.input(z.object({ contactId: z.number() })).query(({ input }) => getOutreachAuditLog("School", input.contactId)),
  }),

  // ─── MEDIA OUTREACH ─────────────────────────────────────────────────────────
  media: router({
    list: researcherProcedure.input(z.object({ territory: z.string().optional() })).query(({ input }) => getMediaContacts(input.territory)),
    create: researcherProcedure
      .input(
        z.object({
          orgName: z.string().min(1),
          contactName: z.string().optional(),
          email: z.string().email().optional(),
          country: z.string().optional(),
          territory: z.enum(["Philippines", "Puerto Rico", "United States", "Other"]).default("Philippines"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createMediaContact(input);
        return { success: true };
      }),
    update: researcherProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Pending", "Sent", "Responded", "Archived"]).optional(),
          daySequence: z.enum(["Day 1", "Day 2", "Day 3", "Complete"]).optional(),
          lastTemplateUsed: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMediaContact(id, data);
        return { success: true };
      }),
    sendEmail: researcherProcedure
      .input(
        z.object({
          contactId: z.number(),
          to: z.string().email(),
          subject: z.string(),
          html: z.string(),
          templateName: z.string(),
          nextDay: z.enum(["Day 1", "Day 2", "Day 3", "Complete"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await sendEmail(input.to, input.subject, input.html);
        await updateMediaContact(input.contactId, { status: "Sent", lastTemplateUsed: input.templateName, daySequence: input.nextDay });
        await addOutreachAuditEntry({
          module: "Media",
          contactId: input.contactId,
          action: `Email sent (${input.templateName})`,
          templateUsed: input.templateName,
          performedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
        });
        return { success: true };
      }),
    auditLog: researcherProcedure.input(z.object({ contactId: z.number() })).query(({ input }) => getOutreachAuditLog("Media", input.contactId)),
  }),

  // ─── DONOR OUTREACH ─────────────────────────────────────────────────────────
  donor: router({
    list: researcherProcedure.input(z.object({ status: z.string().optional() })).query(({ input }) => getDonorContacts(input.status)),
    create: researcherProcedure
      .input(
        z.object({
          donorName: z.string().min(1),
          email: z.string().email().optional(),
          platform: z.string().optional(),
          donationAmount: z.number().optional(),
          territory: z.enum(["Philippines", "Puerto Rico", "United States", "Other"]).default("United States"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createDonorContact(input);
        return { success: true };
      }),
    update: researcherProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Pending", "Sent", "Responded", "Archived"]).optional(),
          lastTemplateUsed: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateDonorContact(id, data);
        return { success: true };
      }),
    sendEmail: researcherProcedure
      .input(
        z.object({
          contactId: z.number(),
          to: z.string().email(),
          subject: z.string(),
          html: z.string(),
          templateName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await sendEmail(input.to, input.subject, input.html);
        await updateDonorContact(input.contactId, { status: "Sent", lastTemplateUsed: input.templateName });
        await addOutreachAuditEntry({
          module: "Donor",
          contactId: input.contactId,
          action: `Email sent via template: ${input.templateName}`,
          templateUsed: input.templateName,
          performedBy: ctx.user.name ?? ctx.user.email ?? "Unknown",
        });
        return { success: true };
      }),
    auditLog: researcherProcedure.input(z.object({ contactId: z.number() })).query(({ input }) => getOutreachAuditLog("Donor", input.contactId)),
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
    search: researcherProcedure
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
                const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
                const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
                if (title && link) results.push({ title, url: link, source: "Google News", snippet: description.replace(/<[^>]+>/g, "").slice(0, 200), publishedAt: pubDate ? new Date(pubDate).toISOString() : null });
              }
            } else if (source === "Reddit") {
              const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(input.query)}&sort=new&limit=10`, { headers: { "User-Agent": "TheVaultInvestigates/1.0" } });
              const json = await res.json();
              for (const post of json?.data?.children || []) {
                const d = post.data;
                results.push({ title: d.title, url: `https://reddit.com${d.permalink}`, source: "Reddit", snippet: d.selftext?.slice(0, 200) || "", publishedAt: new Date(d.created_utc * 1000).toISOString() });
              }
            } else if (source === "YouTube") {
              // YouTube RSS search via invidious public API
              const res = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(input.query)}&type=video&sort_by=upload_date`, { headers: { "User-Agent": "Mozilla/5.0" } });
              if (res.ok) {
                const json = await res.json();
                for (const v of (json || []).slice(0, 10)) {
                  results.push({ title: v.title, url: `https://youtube.com/watch?v=${v.videoId}`, source: "YouTube", snippet: v.description?.slice(0, 200) || "", publishedAt: v.published ? new Date(v.published * 1000).toISOString() : null });
                }
              }
            } else if (source === "Google Web") {
              // Use Google Custom Search RSS as fallback
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
      list: researcherProcedure.input(z.object({ status: z.string().optional() })).query(({ input }) => getMediaLeads(input.status)),
      save: researcherProcedure
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
      update: researcherProcedure
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

  // ─── MEDIA DOWNLOADS ────────────────────────────────────────────────────────
  downloads: router({
    checkAccess: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return { canDownload: false, reason: "User not found" };
      const allowed = ["Researcher", "Custodian", "Admin"];
      if (!allowed.includes(user.portalRole)) return { canDownload: false, reason: "Vetted membership required" };
      if (user.downloadTier === "Free") return { canDownload: false, reason: "Upgrade to Supporter or Investigator tier" };
      const tiers = await getAccessTierConfigs();
      const tierConfig = tiers.find((t) => t.tier === user.downloadTier);
      if (!tierConfig?.canDownload) return { canDownload: false, reason: "Download not enabled for your tier" };
      if (user.downloadTier === "Supporter" && tierConfig.downloadsPerMonth > 0) {
        const used = await getMonthlyDownloadCount(user.id);
        if (used >= tierConfig.downloadsPerMonth) return { canDownload: false, reason: `Monthly limit of ${tierConfig.downloadsPerMonth} downloads reached` };
      }
      return { canDownload: true, tier: user.downloadTier };
    }),
    requestDownload: protectedProcedure
      .input(z.object({ fileUrl: z.string().url(), fileName: z.string(), fileType: z.string(), fileSizeBytes: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const allowed = ["Researcher", "Custodian", "Admin"];
        if (!allowed.includes(user.portalRole)) throw new TRPCError({ code: "FORBIDDEN", message: "Vetted membership required" });
        if (user.downloadTier === "Free") throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Supporter or Investigator tier" });
        const MAX_SIZE = 500 * 1024 * 1024; // 500MB
        if (input.fileSizeBytes > MAX_SIZE) throw new TRPCError({ code: "BAD_REQUEST", message: "File exceeds 500MB limit" });
        const tiers = await getAccessTierConfigs();
        const tierConfig = tiers.find((t) => t.tier === user.downloadTier);
        if (user.downloadTier === "Supporter" && tierConfig && tierConfig.downloadsPerMonth > 0) {
          const used = await getMonthlyDownloadCount(user.id);
          if (used >= tierConfig.downloadsPerMonth) throw new TRPCError({ code: "FORBIDDEN", message: "Monthly download limit reached" });
        }
        await logMediaDownload({
          researcherId: user.id,
          researcherName: user.name ?? user.email ?? "Unknown",
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSizeBytes: input.fileSizeBytes,
        });
        return { success: true, downloadUrl: input.fileUrl };
      }),
    log: adminProcedure.input(z.object({ researcherId: z.number().optional() })).query(({ input }) => getMediaDownloadLog(input.researcherId)),
  }),

  // ─── ACCESS TIERS ───────────────────────────────────────────────────────────
  accessTiers: router({
    list: protectedProcedure.query(() => getAccessTierConfigs()),
    update: adminProcedure
      .input(
        z.object({
          tier: z.enum(["Free", "Supporter", "Investigator"]),
          label: z.string().optional(),
          description: z.string().optional(),
          downloadsPerMonth: z.number().min(0).optional(),
          canDownload: z.boolean().optional(),
          priorityAccess: z.boolean().optional(),
          kofiTier: z.string().optional(),
          bmcTier: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { tier, ...data } = input;
        await updateAccessTierConfig(tier, data);
        return { success: true };
      }),
  }),

  // ─── AUDIT LOG ──────────────────────────────────────────────────────────────
  auditLog: router({
    list: adminProcedure
      .input(z.object({ module: z.string().optional(), contactId: z.number().optional() }))
      .query(({ input }) => getOutreachAuditLog(input.module, input.contactId)),
  }),
});

export type AppRouter = typeof appRouter;
