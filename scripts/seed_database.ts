import "dotenv/config";
import { getDb } from "../server/db";
import { schoolContacts, users } from "../drizzle/schema";
import { DEPED_SCHOOLS } from "../server/depedSchoolDirectory";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting database seeding...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection could not be established.");
    process.exit(1);
  }

  // 1. Seed Admin User
  console.log("Seeding admin user...");
  const adminOpenId = process.env.OWNER_OPEN_ID || "L3GvYjB9Dtp38Ah7RrHJHY";
  const adminName = process.env.OWNER_NAME || "Papi Rican Blue";
  const adminEmail = "vaultinvestigates@protonmail.com";

  await db.insert(users).values({
    openId: adminOpenId,
    name: adminName,
    email: adminEmail,
    loginMethod: "manus",
    role: "admin",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      name: adminName,
      email: adminEmail,
      role: "admin",
      lastSignedIn: new Date(),
    }
  });
  console.log(`Admin user '${adminName}' seeded successfully.`);

  // 2. Seed Preloaded Schools (DEPED_SCHOOLS)
  console.log(`Seeding ${DEPED_SCHOOLS.length} preloaded schools...`);
  const preloadedInserts = DEPED_SCHOOLS.map((school) => ({
    schoolName: school.name,
    principalName: school.principal,
    district: school.district || `${school.city} Division`,
    email: school.email,
    phone: school.phone || null,
    notes: `Preloaded official DepEd school from ${school.city}.`,
    status: "not_sent" as const,
  }));

  if (preloadedInserts.length > 0) {
    await db.insert(schoolContacts).values(preloadedInserts);
    console.log("Preloaded schools seeded successfully.");
  }

  // 3. Seed Parsed Schools from parsed_schools.json
  const parsedPath = path.join(process.cwd(), "scripts", "parsed_schools.json");
  if (fs.existsSync(parsedPath)) {
    console.log("Loading parsed schools from parsed_schools.json...");
    const parsedData = JSON.parse(fs.readFileSync(parsedPath, "utf-8"));
    console.log(`Seeding ${parsedData.length} parsed schools...`);
    
    // De-duplicate parsed schools against preloaded ones by name
    const preloadedNames = new Set(DEPED_SCHOOLS.map(s => s.name.toLowerCase()));
    const uniqueParsedInserts = parsedData
      .filter((s: any) => !preloadedNames.has(s.schoolName.toLowerCase()))
      .map((s: any) => ({
        schoolName: s.schoolName,
        principalName: s.principalName,
        district: s.district,
        email: s.email,
        phone: s.phone,
        notes: s.notes,
        status: "not_sent" as const,
      }));

    if (uniqueParsedInserts.length > 0) {
      await db.insert(schoolContacts).values(uniqueParsedInserts);
      console.log(`Seeded ${uniqueParsedInserts.length} unique parsed schools.`);
    } else {
      console.log("No unique parsed schools to seed.");
    }
  } else {
    console.warn("parsed_schools.json not found, skipping parsed schools seeding.");
  }

  console.log("Database seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Database seeding failed:", err);
  process.exit(1);
});
