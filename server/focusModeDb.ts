import { getDb } from "./db";
import { focusSessions, brainExerciseLogs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ── Spurgeon's Morning Devotions (365 entries, public domain) ────────────────
// A curated selection of 7 entries (one per day of week, rotated by day-of-year)
export const SPURGEON_DEVOTIONS = [
  {
    ref: "Spurgeon — Morning, Day 1",
    text: "\"Let me seek to know God better, and to make Him better known.\" The Christian life is not a passive existence but an active pursuit. Each morning is a fresh commission — to go deeper into the knowledge of the One who called you, and to carry that knowledge outward into every conversation, every decision, every act of courage this day demands.",
  },
  {
    ref: "Spurgeon — Morning, Day 2",
    text: "\"God is too good to be unkind, too wise to be mistaken, and when you cannot trace His hand, you can always trust His heart.\" When the work is hard and the results invisible, remember: faithfulness is the assignment. The harvest belongs to God. Your task is to plant, water, and keep showing up.",
  },
  {
    ref: "Spurgeon — Morning, Day 3",
    text: "\"It is not how much we have, but how much we enjoy, that makes happiness.\" The investigator who works with integrity, who pursues truth without compromise, who serves the vulnerable without expecting recognition — that person has already found what the world is searching for.",
  },
  {
    ref: "Spurgeon — Morning, Day 4",
    text: "\"A Bible that is falling apart usually belongs to someone who isn't.\" The disciplines you build today — the routines, the habits, the daily commitments — are the architecture of a life that holds together under pressure. Do not despise small beginnings. The oak was once an acorn.",
  },
  {
    ref: "Spurgeon — Morning, Day 5",
    text: "\"I have learned to kiss the wave that throws me against the Rock of Ages.\" Every setback in this work — every door that closes, every source that goes silent, every day the donations do not come — is not the end of the story. It is the pressure that produces the pearl.",
  },
  {
    ref: "Spurgeon — Morning, Day 6",
    text: "\"Nobody ever outgrows Scripture; the book widens and deepens with our years.\" You are 70 years into a life that has given you something no algorithm can replicate: the wisdom of having lived through what others only theorize about. That is your edge. Use it.",
  },
  {
    ref: "Spurgeon — Morning, Day 7",
    text: "\"By perseverance the snail reached the ark.\" Consistency over brilliance. Showing up over inspiration. The work you do today — even if it feels small — is a brick in a wall that will one day stand as evidence that someone cared enough to tell the truth when it was costly to do so.",
  },
];

// Daily verses — 7 entries keyed by day of week (0=Sun, 1=Mon ... 6=Sat)
export const DAILY_VERSES = [
  { ref: "Psalm 118:24", text: "This is the day that the Lord has made; let us rejoice and be glad in it." },
  { ref: "Proverbs 16:3", text: "Commit your work to the Lord, and your plans will be established." },
  { ref: "Isaiah 40:31", text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
  { ref: "Philippians 4:13", text: "I can do all things through him who strengthens me." },
  { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go." },
  { ref: "Matthew 5:6", text: "Blessed are those who hunger and thirst for righteousness, for they shall be satisfied." },
];

// Closing verses for end-of-day
export const CLOSING_VERSES = [
  { ref: "Psalm 4:8", text: "In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety." },
  { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness." },
  { ref: "Psalm 121:8", text: "The Lord will keep your going out and your coming in from this time forth and forevermore." },
  { ref: "Numbers 6:24-26", text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace." },
  { ref: "2 Timothy 4:7", text: "I have fought the good fight, I have finished the race, I have kept the faith." },
  { ref: "Psalm 19:14", text: "Let the words of my mouth and the meditation of my heart be acceptable in your sight, O Lord, my rock and my redeemer." },
  { ref: "Micah 6:8", text: "He has told you, O man, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God?" },
];

// ── Brain Exercises ──────────────────────────────────────────────────────────
export const BRAIN_EXERCISES = {
  memory: [
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**JUSTICE · ARCHIVE · SIGNAL · TRUTH · WITNESS**\n\nType them back in the correct sequence.", answer: "JUSTICE, ARCHIVE, SIGNAL, TRUTH, WITNESS" },
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**CIPHER · MANILA · RECORD · VAULT · EXPOSE**\n\nType them back in the correct sequence.", answer: "CIPHER, MANILA, RECORD, VAULT, EXPOSE" },
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**COURAGE · DOCUMENT · VERIFY · SOURCE · PUBLISH**\n\nType them back in the correct sequence.", answer: "COURAGE, DOCUMENT, VERIFY, SOURCE, PUBLISH" },
  ],
  pattern: [
    { prompt: "Complete the sequence — what comes next?\n\n**2, 4, 8, 16, ___**", answer: "32" },
    { prompt: "Complete the sequence — what comes next?\n\n**Monday, Wednesday, Friday, ___**", answer: "Sunday" },
    { prompt: "Complete the sequence — what comes next?\n\n**A, C, F, J, ___**\n\n*(Hint: the gaps between letters increase by 1 each time)*", answer: "O" },
  ],
  word_association: [
    { prompt: "The word is **JUSTICE**.\n\nName 5 things this word personally means to you — one per line. There are no wrong answers. This is about your own connections.", answer: "" },
    { prompt: "The word is **TRUTH**.\n\nName 5 things this word personally means to you — one per line. Think about your work, your faith, your life.", answer: "" },
    { prompt: "The word is **COURAGE**.\n\nName 5 people or moments in your life that this word brings to mind — one per line.", answer: "" },
  ],
  breathing: [
    { prompt: "## 4-7-8 Breathing — 3 Rounds\n\nThis technique activates your parasympathetic nervous system, lowers cortisol, and sharpens focus.\n\n**Round 1:** Inhale through your nose for **4 counts** → Hold for **7 counts** → Exhale through your mouth for **8 counts**\n\n**Round 2:** Repeat\n\n**Round 3:** Repeat\n\nWhen you have completed all 3 rounds, type \"Done\" below.", answer: "Done" },
    { prompt: "## Box Breathing — 4 Rounds\n\nUsed by Navy SEALs and surgeons to reset under pressure.\n\n**Each round:** Inhale for **4 counts** → Hold for **4 counts** → Exhale for **4 counts** → Hold for **4 counts**\n\nComplete 4 rounds. When finished, type \"Done\" below.", answer: "Done" },
  ],
  gratitude: [
    { prompt: "## Gratitude Anchor\n\nName **one specific thing** you are grateful for today — and write **one sentence** about why it matters to you.\n\nThis is private. Only you will see it. Be honest.", answer: "" },
    { prompt: "## Gratitude Anchor\n\nThink about someone who has helped your work — directly or indirectly. Name them (or describe them if you prefer privacy) and write one sentence about what they gave you.", answer: "" },
    { prompt: "## Gratitude Anchor\n\nWhat is one thing about your own character or ability that you are grateful for today? Write one honest sentence.", answer: "" },
  ],
};

// ── DB Helpers ───────────────────────────────────────────────────────────────

export async function getTodaySession(userId: number, sessionDate: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.userId, userId), eq(focusSessions.sessionDate, sessionDate)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertFocusSession(
  userId: number,
  sessionDate: string,
  data: Partial<typeof focusSessions.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getTodaySession(userId, sessionDate);
  if (existing) {
    await db
      .update(focusSessions)
      .set(data)
      .where(eq(focusSessions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(focusSessions).values({ userId, sessionDate, ...data });
    return (result[0] as any).insertId as number;
  }
}

export async function logBrainExercise(
  sessionId: number,
  exerciseType: "memory" | "pattern" | "word_association" | "breathing" | "gratitude",
  prompt: string,
  userResponse: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(brainExerciseLogs).values({ sessionId, exerciseType, prompt, userResponse });
}

export async function getSessionExerciseLogs(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brainExerciseLogs).where(eq(brainExerciseLogs.sessionId, sessionId));
}
