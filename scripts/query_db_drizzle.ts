import { getDb } from "../server/db";
import { vettingApplications } from "../drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }
  try {
    const apps = await db.select().from(vettingApplications);
    console.log("=== VETTING APPLICATIONS IN DB ===");
    console.log("Count:", apps.length);
    console.log(JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error("Failed to query vetting applications:", error);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
