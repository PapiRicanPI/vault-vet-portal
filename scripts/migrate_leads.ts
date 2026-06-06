import "dotenv/config";
import fs from "fs";
import { getDb } from "../server/db";
import { mediaLeads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function migrate() {
  const jsonPath = "/home/ubuntu/data/scanned_leads.json";
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const leads = JSON.parse(rawData);
  console.log(`Loaded ${leads.length} leads from JSON file.`);

  const db = await getDb();
  if (!db) {
    console.error("Error: Could not connect to the database.");
    process.exit(1);
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    const url = lead.url;
    
    // Check if lead already exists in DB by URL
    const existing = await db
      .select()
      .from(mediaLeads)
      .where(eq(mediaLeads.url, url))
      .limit(1);

    if (existing.length > 0) {
      skippedCount++;
      continue;
    }

    // Map source enum
    let mappedSource: "Google News" | "YouTube" | "Reddit" | "Google Web" = "Google Web";
    if (lead.source === "Google News") {
      mappedSource = "Google News";
    } else if (lead.source === "YouTube") {
      mappedSource = "YouTube";
    } else if (lead.source === "Reddit") {
      mappedSource = "Reddit";
    }

    // Parse date
    let publishedAt: Date | null = null;
    if (lead.publishedAt) {
      try {
        publishedAt = new Date(lead.publishedAt);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = null;
        }
      } catch (e) {
        publishedAt = null;
      }
    }

    // Format notes
    const notesParts = [];
    if (lead.keyword) notesParts.push(`Keyword: "${lead.keyword}"`);
    if (lead.severity) notesParts.push(`Severity: ${lead.severity}`);
    if (lead.flagged !== undefined) notesParts.push(`Flagged: ${lead.flagged}`);
    if (lead.channelOrAuthor) notesParts.push(`Channel/Author: ${lead.channelOrAuthor}`);
    
    const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

    // Insert lead
    await db.insert(mediaLeads).values({
      title: lead.title,
      url: lead.url,
      source: mappedSource,
      platform: lead.channelOrAuthor || null,
      publishedAt: publishedAt,
      snippet: lead.description || null,
      status: "Lead",
      rightsStatus: "Unknown",
      notes: notes,
      savedBy: "System Scraper",
    });

    insertedCount++;
  }

  console.log(`Migration complete!`);
  console.log(`Inserted: ${insertedCount} new leads.`);
  console.log(`Skipped (already exists): ${skippedCount} leads.`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
