import { invokeLLM } from "./_core/llm";
import type { VettingApplication } from "../drizzle/schema";

export interface ScoringResult {
  scoreIdentity: number;       // 0-2
  scoreOrganization: number;   // 0-2
  scorePurpose: number;        // 0-2
  scoreSupport: number;        // 0-2
  scoreRisk: number;           // 0-2
  totalScore: number;          // 0-10
  rationale: string;
  recommendation: "approve" | "review" | "deny";
}

export async function scoreApplication(app: Partial<VettingApplication>): Promise<ScoringResult> {
  const priorWorkStr = Array.isArray(app.priorWork) && app.priorWork.length > 0
    ? app.priorWork.map((w: { title: string; url: string }) => `- ${w.title}: ${w.url}`).join("\n")
    : "None provided";

  const prompt = `You are a vetting analyst for The Vault, a secure investigative database for journalists, researchers, and whistleblowers. Score this access application on 5 criteria (0-2 each, total 0-10).

APPLICATION DATA:
- Display Name/Handle: ${app.displayName ?? "Not provided"}
- Email: ${app.email ?? "Not provided"}
- Professional Profile URL: ${app.profileUrl ?? "None"}
- Organization: ${app.organization ?? "Independent/Anonymous"}
- Role/Title: ${app.orgRole ?? "Not provided"}
- Organization Website: ${app.orgWebsite ?? "None"}
- Prior Published Work:
${priorWorkStr}
- Investigation/Project: ${app.investigationProject ?? "Not provided"}
- Geographic Focus: ${app.geographicFocus ?? "Not provided"}
- Expected Output Type: ${app.outputType ?? "Not provided"}
- Support Link (Ko-fi/Substack): ${app.supportLink ?? "None"}
- Agrees to Credit The Vault: ${app.agreesToCredit ? "Yes" : "No"}
- Currently Under Threats: ${app.underThreats ?? "Not answered"}
- Uses OpSec Tools: ${app.useOpSec ? "Yes" : "No"} (${app.opSecTools ?? "not specified"})
- Previously Doxxed: ${app.previouslyDoxxed ?? "Not answered"}
- Consents to Safety Outreach: ${app.consentSafetyOutreach ? "Yes" : "No"}
- How they heard about The Vault: ${app.referralSource ?? "Not provided"}
- Will share raw data publicly: ${app.willShareRawData ? "Yes" : "No"}

SCORING CRITERIA:
1. IDENTITY & EMAIL (0-2):
   - 0: Disposable email, no verifiable footprint, no profile
   - 1: Mixed signals — some indicators but not fully verifiable
   - 2: Verified email domain, professional profile, clear digital footprint

2. ORGANIZATION LEGITIMACY (0-2):
   - 0: Cannot verify, fake, or clearly not legitimate
   - 1: Unclear, very small, or unverifiable organization
   - 2: Verifiable institution, newsroom, NGO, academic body, or credible independent journalist with prior work

3. PURPOSE & INTENDED USE (0-2):
   - 0: Vague, commercial, harmful, or misaligned with public interest
   - 1: Partially aligned — some public interest but lacks specificity
   - 2: Specific, concrete public-interest investigation with clear geographic focus and output type

4. SUPPORT & RECIPROCITY (0-2):
   - 0: No support link, no attribution agreement
   - 1: Agrees to credit only, no financial support
   - 2: Active Ko-fi/Substack/Patreon supporter AND agrees to credit The Vault

5. RISK & RED FLAGS (0-2):
   - 0: Clear red flags — vague purpose, refuses terms, suspicious patterns, will share raw data
   - 1: Minor concerns — some ambiguity but no clear red flags
   - 2: No red flags — clear purpose, strong OpSec awareness, responsible data use commitment

Respond with valid JSON only, no markdown:
{
  "scoreIdentity": <0-2>,
  "scoreOrganization": <0-2>,
  "scorePurpose": <0-2>,
  "scoreSupport": <0-2>,
  "scoreRisk": <0-2>,
  "rationale": "<2-3 sentence explanation of the overall assessment>",
  "recommendation": "<approve|review|deny>"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a vetting analyst. Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vetting_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scoreIdentity: { type: "integer" },
              scoreOrganization: { type: "integer" },
              scorePurpose: { type: "integer" },
              scoreSupport: { type: "integer" },
              scoreRisk: { type: "integer" },
              rationale: { type: "string" },
              recommendation: { type: "string", enum: ["approve", "review", "deny"] },
            },
            required: ["scoreIdentity", "scoreOrganization", "scorePurpose", "scoreSupport", "scoreRisk", "rationale", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content from LLM");
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    const parsed = JSON.parse(content) as ScoringResult;
    const totalScore = parsed.scoreIdentity + parsed.scoreOrganization + parsed.scorePurpose + parsed.scoreSupport + parsed.scoreRisk;

    // Validate recommendation matches score
    let recommendation: "approve" | "review" | "deny" = parsed.recommendation;
    if (totalScore >= 7) recommendation = "approve";
    else if (totalScore >= 4) recommendation = "review";
    else recommendation = "deny";

    return {
      scoreIdentity: Math.min(2, Math.max(0, parsed.scoreIdentity)),
      scoreOrganization: Math.min(2, Math.max(0, parsed.scoreOrganization)),
      scorePurpose: Math.min(2, Math.max(0, parsed.scorePurpose)),
      scoreSupport: Math.min(2, Math.max(0, parsed.scoreSupport)),
      scoreRisk: Math.min(2, Math.max(0, parsed.scoreRisk)),
      totalScore,
      rationale: parsed.rationale,
      recommendation,
    };
  } catch (error) {
    console.error("[Scoring] AI scoring failed:", error);
    // Return neutral score on failure
    return {
      scoreIdentity: 1,
      scoreOrganization: 1,
      scorePurpose: 1,
      scoreSupport: 0,
      scoreRisk: 1,
      totalScore: 4,
      rationale: "Automatic scoring failed. Manual review required.",
      recommendation: "review",
    };
  }
}
