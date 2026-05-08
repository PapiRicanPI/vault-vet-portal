import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { weeklyOpsTasks, weeklyOpsCompletions } from "../drizzle/schema";

/** Returns the ISO date string (YYYY-MM-DD) for the most recent Monday */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export async function getAllWeeklyTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(weeklyOpsTasks)
    .orderBy(weeklyOpsTasks.day, weeklyOpsTasks.sortOrder);
}

export async function getCompletionsForWeek(weekStart: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(weeklyOpsCompletions)
    .where(eq(weeklyOpsCompletions.weekStart, weekStart));
}

export async function markTaskComplete(taskId: number, weekStart: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert: insert only if not already completed this week
  const existing = await db
    .select()
    .from(weeklyOpsCompletions)
    .where(
      and(
        eq(weeklyOpsCompletions.taskId, taskId),
        eq(weeklyOpsCompletions.weekStart, weekStart)
      )
    )
    .limit(1);
  if (existing.length === 0) {
    await db.insert(weeklyOpsCompletions).values({ taskId, weekStart });
  }
}

export async function markTaskIncomplete(taskId: number, weekStart: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(weeklyOpsCompletions)
    .where(
      and(
        eq(weeklyOpsCompletions.taskId, taskId),
        eq(weeklyOpsCompletions.weekStart, weekStart)
      )
    );
}
