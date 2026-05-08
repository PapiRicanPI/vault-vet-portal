import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
type Day = typeof DAYS[number];

const DAY_LABELS: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Friday",
  friday: "Friday",
};
// Fix labels
const DAY_DISPLAY: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const DAY_FOCUS: Record<Day, string> = {
  monday: "Foundation Day — Clear the queue, set the week's direction",
  tuesday: "Content + Education Day — Build the curriculum, write the newsletter",
  wednesday: "Outreach Day — Hit schools, post on social, grow the network",
  thursday: "Community + Newsletter Day — Publish, send, engage",
  friday: "Development + Retrospective — Ship one thing, review the week, plan Monday",
};

// Revenue actions shown in the Monetization panel — one per day
const MONETIZATION_FOCUS: Record<Day, { action: string; why: string; channel: string }> = {
  monday: {
    action: "Add a Substack paid-tier CTA to your newsletter outline",
    why: "Monday planning is when you decide what the week's content will be. Embedding a paid upgrade prompt in the outline means it will make it into the final post.",
    channel: "Substack",
  },
  tuesday: {
    action: "Add one donation link or Ko-fi button to the Substack draft",
    why: "Readers who finish a well-written post are at peak engagement. A single, non-pushy line at the end converts better than a dedicated fundraising post.",
    channel: "Ko-fi / Substack",
  },
  wednesday: {
    action: "Post one revenue-aware social update (e.g. 'Support the investigation → link')",
    why: "Wednesday is your highest-reach day. Even one post that mentions how readers can support the work builds the habit of asking publicly.",
    channel: "Twitter/X + Instagram",
  },
  thursday: {
    action: "Include a paid-tier or donation ask in the subscriber email",
    why: "Your email list is your warmest audience. A brief, honest ask — 'This work costs $X/month to run. If it has been useful, consider supporting it.' — is the highest-converting channel you have.",
    channel: "Email / Substack",
  },
  friday: {
    action: "Review this week's revenue metrics: Substack paid subs, Ko-fi, donations",
    why: "You cannot grow what you do not measure. Friday is when you record the numbers, identify what drove any conversions, and decide what to test next week.",
    channel: "Analytics",
  },
};

function getTodayDay(): Day | null {
  const d = new Date().getDay();
  const map: Record<number, Day> = { 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday" };
  return map[d] ?? null;
}

function formatWeekStart(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function WeeklyOps() {
  const today = getTodayDay();
  const [activeDay, setActiveDay] = useState<Day>(today ?? "monday");

  const { data, isLoading, refetch } = trpc.weeklyOps.getTasks.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: progress } = trpc.weeklyOps.getProgress.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const toggleMutation = trpc.weeklyOps.toggleTask.useMutation({
    onSuccess: () => { refetch(); },
    onError: () => toast.error("Failed to update task"),
  });

  type TaskItem = NonNullable<typeof data>["tasks"][number];
  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const day of DAYS) map[day] = [];
    for (const t of (data?.tasks ?? [])) {
      if (map[t.day]) map[t.day].push(t);
    }
    return map as Record<Day, TaskItem[]>;
  }, [data]);

  const dayTasks = tasksByDay[activeDay] ?? [];
  const vettingTasks = dayTasks.filter((t) => t.block === "vetting");
  const platformTasks = dayTasks.filter((t) => t.block === "platform");

  const totalTasks = data?.tasks?.length ?? 0;
  const completedTotal = data?.tasks?.filter((t: { completed: boolean }) => t.completed).length ?? 0;
  const weekPct = totalTasks > 0 ? Math.round((completedTotal / totalTasks) * 100) : 0;

  const dayProgress = progress?.byDay.find((d) => d.day === activeDay);
  const dayPct = dayProgress && dayProgress.total > 0
    ? Math.round((dayProgress.done / dayProgress.total) * 100)
    : 0;

  function handleToggle(taskId: number, currentlyDone: boolean) {
    toggleMutation.mutate({ taskId, completed: !currentlyDone });
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0a0905", minHeight: "100vh", color: "#e0d8c8", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ color: "#e5c97e", letterSpacing: 4, fontSize: 10, textTransform: "uppercase", margin: "0 0 6px" }}>
              The Vault Investigates — Admin
            </p>
            <h1 style={{ color: "#fff", fontSize: 26, margin: 0, fontWeight: "normal" }}>Weekly Operations</h1>
            {data?.weekStart && (
              <p style={{ color: "#666", fontSize: 13, margin: "4px 0 0" }}>
                Week of {formatWeekStart(data.weekStart)} · Resets every Monday
              </p>
            )}
          </div>
          {/* Overall week progress */}
          <div style={{ textAlign: "right", minWidth: 160 }}>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 2 }}>Week Progress</p>
            <div style={{ background: "#1a1810", borderRadius: 4, height: 8, width: 160, overflow: "hidden" }}>
              <div style={{ background: "#e5c97e", height: "100%", width: `${weekPct}%`, transition: "width 0.4s" }} />
            </div>
            <p style={{ color: "#e5c97e", fontSize: 13, margin: "6px 0 0", fontWeight: "bold" }}>
              {completedTotal} / {totalTasks} tasks ({weekPct}%)
            </p>
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 28, borderBottom: "1px solid #2a2010", paddingBottom: 0 }}>
          {DAYS.map((day) => {
            const dp = progress?.byDay.find((d) => d.day === day);
            const isToday = day === today;
            const isActive = day === activeDay;
            const allDone = dp && dp.total > 0 && dp.done === dp.total;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  background: isActive ? "#1a1810" : "transparent",
                  border: isActive ? "1px solid #2a2010" : "1px solid transparent",
                  borderBottom: isActive ? "1px solid #1a1810" : "1px solid transparent",
                  color: isActive ? "#e5c97e" : isToday ? "#fff" : "#666",
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontFamily: "Georgia, serif",
                  fontSize: 13,
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  marginBottom: -1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {DAY_DISPLAY[day]}
                {isToday && !isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e5c97e", display: "inline-block" }} />
                )}
                {allDone && (
                  <span style={{ color: "#4ade80", fontSize: 11 }}>✓</span>
                )}
                {dp && dp.total > 0 && (
                  <span style={{ color: "#555", fontSize: 11 }}>
                    {dp.done}/{dp.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day content */}
        <div style={{ background: "#0d0c08", border: "1px solid #2a2010", borderTop: "none", borderRadius: "0 4px 4px 4px", padding: "28px 32px", marginBottom: 24 }}>
          {/* Day header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 18, margin: "0 0 4px", fontWeight: "normal" }}>
              {DAY_DISPLAY[activeDay]}
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{DAY_FOCUS[activeDay]}</p>
            {/* Day progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
              <div style={{ background: "#1a1810", borderRadius: 4, height: 6, flex: 1, overflow: "hidden" }}>
                <div style={{ background: dayPct === 100 ? "#4ade80" : "#e5c97e", height: "100%", width: `${dayPct}%`, transition: "width 0.4s" }} />
              </div>
              <span style={{ color: dayPct === 100 ? "#4ade80" : "#e5c97e", fontSize: 12, minWidth: 40, textAlign: "right" }}>
                {dayPct}%
              </span>
            </div>
          </div>

          {isLoading ? (
            <p style={{ color: "#555", fontSize: 14 }}>Loading tasks…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Vetting block */}
              <TaskBlock
                title="Morning Block — Vetting"
                subtitle="5–6 hrs · Applications, outreach, education pipeline"
                accentColor="#e5c97e"
                tasks={vettingTasks}
                onToggle={handleToggle}
                isPending={toggleMutation.isPending}
              />
              {/* Platform block */}
              <TaskBlock
                title="Afternoon Block — Platform & Growth"
                subtitle="5–6 hrs · TruthDrop, social, Substack, development"
                accentColor="#7eb8e5"
                tasks={platformTasks}
                onToggle={handleToggle}
                isPending={toggleMutation.isPending}
              />
            </div>
          )}
        </div>

        {/* Monetization Focus Panel */}
        <MonetizationPanel day={activeDay} />

        {/* Daily non-negotiables */}
        <DailyNonNegotiables />
      </div>
    </div>
  );
}

function TaskBlock({
  title,
  subtitle,
  accentColor,
  tasks,
  onToggle,
  isPending,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  tasks: Array<{ id: number; label: string; description?: string | null; completed: boolean }>;
  onToggle: (id: number, done: boolean) => void;
  isPending: boolean;
}) {
  const done = tasks.filter((t) => t.completed).length;
  return (
    <div style={{ background: "#100f0a", border: `1px solid #1e1a12`, borderRadius: 6, padding: "20px 22px" }}>
      <div style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: 12, marginBottom: 18 }}>
        <p style={{ color: accentColor, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 3px" }}>{title}</p>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{subtitle}</p>
      </div>
      <p style={{ color: "#444", fontSize: 11, margin: "0 0 14px" }}>
        {done} of {tasks.length} completed
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((task) => (
          <label
            key={task.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id, task.completed)}
              disabled={isPending}
              style={{ marginTop: 3, accentColor, flexShrink: 0, width: 14, height: 14 }}
            />
            <div>
              <p style={{
                color: task.completed ? "#555" : "#ccc",
                fontSize: 13,
                margin: 0,
                textDecoration: task.completed ? "line-through" : "none",
                lineHeight: 1.4,
              }}>
                {task.label}
              </p>
              {task.description && (
                <p style={{ color: "#444", fontSize: 11, margin: "3px 0 0", lineHeight: 1.5 }}>
                  {task.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function MonetizationPanel({ day }: { day: Day }) {
  const focus = MONETIZATION_FOCUS[day];
  return (
    <div style={{
      background: "#0d0c08",
      border: "1px solid #3a2a10",
      borderLeft: "4px solid #e5c97e",
      borderRadius: 6,
      padding: "22px 28px",
      marginBottom: 20,
    }}>
      <p style={{ color: "#e5c97e", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, margin: "0 0 10px" }}>
        💰 Today's Revenue Action — {focus.channel}
      </p>
      <p style={{ color: "#fff", fontSize: 15, margin: "0 0 10px", fontWeight: "bold" }}>
        {focus.action}
      </p>
      <p style={{ color: "#888", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
        {focus.why}
      </p>
      <div style={{ marginTop: 16, padding: "12px 16px", background: "#100f0a", borderRadius: 4 }}>
        <p style={{ color: "#555", fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 2 }}>Revenue Channels to Build</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: "Substack Paid Tier", status: "Priority" },
            { label: "Ko-fi Donations", status: "Active" },
            { label: "School Program Grants", status: "Explore" },
            { label: "Journalism Fellowship Sponsors", status: "Explore" },
            { label: "Research Access Memberships", status: "Future" },
          ].map((ch) => (
            <span key={ch.label} style={{
              background: "#1a1810",
              border: "1px solid #2a2010",
              color: ch.status === "Priority" ? "#e5c97e" : ch.status === "Active" ? "#4ade80" : "#555",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 20,
            }}>
              {ch.label}
              <span style={{ color: "#333", marginLeft: 6 }}>{ch.status}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyNonNegotiables() {
  const items = [
    "Open the admin dashboard — check for new tips, applications, and errors",
    "Check email inbox for principal replies, researcher questions, and Substack replies",
    "Review today's task list and confirm your first task before opening anything else",
  ];
  return (
    <div style={{
      background: "#0d0c08",
      border: "1px solid #1e1a12",
      borderRadius: 6,
      padding: "18px 24px",
      marginBottom: 32,
    }}>
      <p style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, margin: "0 0 12px" }}>
        ⚡ Daily Non-Negotiables (15 min · Every Morning Before Block A)
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ color: "#e5c97e", fontSize: 12, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
            <p style={{ color: "#777", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
