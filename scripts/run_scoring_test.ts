import { scoreApplication } from "../server/scoring";
import { getDb } from "../server/db";
import { vettingApplications } from "../drizzle/schema";

async function test() {
  console.log("=== STARTING AI SCORING TEST ===");
  
  const testApp = {
    displayName: "Joseph McKinnon",
    email: "josephmckinnon795@gmail.com",
    organization: "Independent",
    orgRole: "Investigative Journalist",
    investigationProject: "I've been a coal miner for 10 years and have been investigating safety violations and poverty exploitation in the mining industry.",
    geographicFocus: "Appalachia / Philippines mining links",
    outputType: "In-depth investigative report",
    agreesToCredit: true,
    useOpSec: true,
    opSecTools: "Signal, ProtonMail, Tor",
    willShareRawData: false
  };

  console.log("Submitting test application to AI scoring model...");
  const scoreResult = await scoreApplication(testApp as any);
  
  console.log("\n=== AI SCORING RESULT ===");
  console.log(JSON.stringify(scoreResult, null, 2));
  
  console.log("\nConnecting to database...");
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to local database!");
    return;
  }
  
  console.log("Inserting scored application into database...");
  const insertData = {
    ...testApp,
    aiScore: scoreResult.totalScore,
    aiScoreIdentity: scoreResult.scoreIdentity,
    aiScoreOrganization: scoreResult.scoreOrganization,
    aiScorePurpose: scoreResult.scorePurpose,
    aiScoreSupport: scoreResult.scoreSupport,
    aiScoreRisk: scoreResult.scoreRisk,
    aiRationale: scoreResult.rationale,
    aiRecommendation: scoreResult.recommendation,
    status: "pending" as const,
    createdAt: new Date()
  };
  
  await db.insert(vettingApplications).values(insertData);
  console.log("Successfully inserted scored application into database!");
  
  console.log("\nQuerying inserted row from database...");
  const rows = await db.select().from(vettingApplications);
  console.log(`Found ${rows.length} rows in vetting_applications:`);
  console.log(JSON.stringify(rows[rows.length - 1], null, 2));
  
  console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
