import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

const MOTIVATIONAL_QUOTES = [
  "The truth is not always beautiful, nor beautiful words the truth. — Lao Tzu",
  "Journalism is printing what someone else does not want printed. Everything else is public relations. — George Orwell",
  "The most courageous act is still to think for yourself. Aloud. — Coco Chanel",
  "In a time of deceit, telling the truth is a revolutionary act. — George Orwell",
  "Facts do not cease to exist because they are ignored. — Aldous Huxley",
  "The press is the best instrument for enlightening the mind of man. — Thomas Jefferson",
  "Courage is what it takes to stand up and speak. — Winston Churchill",
];

type Phase = "morning" | "tasks" | "brain" | "evening" | "session_complete";

export default function FocusMode() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  const [phase, setPhase] = useState<Phase>("morning");
  const [quoteIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [prayerText, setPrayerText] = useState("");
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [brainAnswer, setBrainAnswer] = useState("");
  const [brainSubmitting, setBrainSubmitting] = useState(false);
  const [endAnswer, setEndAnswer] = useState("");
  const [endSubmitting, setEndSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<"memory" | "pattern" | "word_association" | "breathing" | "gratitude">("memory");

  const sessionQuery = trpc.focusMode.getOrCreateSession.useQuery(undefined, { enabled: !!user });
  const completeDevotion = trpc.focusMode.completeDevotion.useMutation();
  const logBrain = trpc.focusMode.logBrainExercise.useMutation();
  const endSession = trpc.focusMode.endSession.useMutation();
  const weeklyTasksQuery = trpc.weeklyOps.getTasks.useQuery(undefined, { enabled: !!user });
  const toggleTask = trpc.weeklyOps.toggleTask.useMutation({
    onSuccess: () => weeklyTasksQuery.refetch(),
  });

  const devotion = sessionQuery.data?.spurgeon ?? { ref: "Spurgeon — Morning", text: "Let me seek to know God better, and to make Him better known." };
  const dailyVerse = { ref: "Proverbs 16:3", text: "Commit your work to the Lord, and your plans will be established." };
  const closingVerse = { ref: "Psalm 4:8", text: "In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety." };

  const exerciseTypes: Array<{ type: "memory" | "pattern" | "word_association" | "breathing" | "gratitude"; label: string; emoji: string }> = [
    { type: "memory", label: "Memory", emoji: "🧠" },
    { type: "pattern", label: "Pattern", emoji: "🔢" },
    { type: "word_association", label: "Word Association", emoji: "💬" },
    { type: "breathing", label: "Breathing", emoji: "🌬️" },
    { type: "gratitude", label: "Gratitude", emoji: "🙏" },
  ];

  const brainExercises: Record<string, { prompt: string; answer: string }[]> = {
    memory: [
      { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**JUSTICE · ARCHIVE · SIGNAL · TRUTH · WITNESS**\n\nType them back in the correct sequence.", answer: "JUSTICE, ARCHIVE, SIGNAL, TRUTH, WITNESS" },
      { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**CIPHER · MANILA · RECORD · VAULT · EXPOSE**\n\nType them back in the correct sequence.", answer: "CIPHER, MANILA, RECORD, VAULT, EXPOSE" },
    ],
    pattern: [
      { prompt: "Complete the sequence — what comes next?\n\n**2, 4, 8, 16, ___**", answer: "32" },
      { prompt: "Complete the sequence — what comes next?\n\n**Monday, Wednesday, Friday, ___**", answer: "Sunday" },
    ],
    word_association: [
      { prompt: "The word is **JUSTICE**.\n\nName 5 things this word personally means to you — one per line.", answer: "" },
      { prompt: "The word is **TRUTH**.\n\nName 5 things this word personally means to you — one per line.", answer: "" },
    ],
    breathing: [
      { prompt: "## 4-7-8 Breathing — 3 Rounds\n\nInhale for **4 counts** → Hold for **7 counts** → Exhale for **8 counts**\n\nComplete 3 rounds. When finished, type \"Done\" below.", answer: "Done" },
    ],
    gratitude: [
      { prompt: "## Gratitude Anchor\n\nName **one specific thing** you are grateful for today — and write **one sentence** about why it matters to you.", answer: "" },
    ],
  };

  const currentExercise = brainExercises[selectedExerciseType][dayOfYear % brainExercises[selectedExerciseType].length];

  const tasksData = weeklyTasksQuery.data;
  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData as any)?.tasks ?? [];
  const completedIds = new Set(tasks.filter((t: any) => t.completed).map((t: any) => t.id));

  async function handleStartSession() {
    try {
      const result = await completeDevotion.mutateAsync({
        devotionReflection: prayerText || "—",
        prayerText: prayerText || "—",
        devotionVerseRef: "Proverbs 16:3",
        devotionVerseText: "Commit your work to the Lord, and your plans will be established.",
      });
      setSessionId(result.sessionId);
      setPhase("tasks");
    } catch {
      setPhase("tasks");
    }
  }

  async function handleLogPrayer() {
    setPrayerSubmitting(true);
    try {
      const result = await completeDevotion.mutateAsync({
        devotionReflection: prayerText || "—",
        prayerText: prayerText || "—",
        devotionVerseRef: "Proverbs 16:3",
        devotionVerseText: "Commit your work to the Lord, and your plans will be established.",
      });
      setSessionId(result.sessionId);
      setPhase("tasks");
    } catch {
      setPhase("tasks");
    } finally {
      setPrayerSubmitting(false);
    }
  }

  async function handleLogBrain() {
    setBrainSubmitting(true);
    try {
      if (sessionId) {
        await logBrain.mutateAsync({
          sessionId,
          exerciseType: selectedExerciseType,
          prompt: currentExercise.prompt,
          userResponse: brainAnswer,
        });
      }
      setPhase("evening");
    } catch {
      setPhase("evening");
    } finally {
      setBrainSubmitting(false);
    }
  }

  async function handleEndSession() {
    setEndSubmitting(true);
    try {
      if (sessionId) await endSession.mutateAsync({ sessionId, endOfDayAnswer: endAnswer, closingVerseRef: "Psalm 4:8", closingVerseText: "In peace I will both lie down and sleep.", totalMinutes: 30 });
      setPhase("session_complete");
    } catch {
      setPhase("session_complete");
    } finally {
      setEndSubmitting(false);
    }
  }

  // ── Morning Phase ────────────────────────────────────────────────────────────
  if (phase === "morning") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/admin" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">← Admin</Link>
          <span className="text-gray-700 text-xs font-mono">{today}</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl">🌅</div>
          <h1 className="text-2xl font-bold tracking-tight">Focus Mode</h1>
          <p className="text-gray-500 text-sm">Start your day with intention</p>
        </div>

        {/* Daily Verse */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(180,130,40,0.08) 0%, rgba(180,130,40,0.03) 100%)", border: "1px solid rgba(180,130,40,0.15)" }}>
          <div className="text-amber-500/60 text-xs tracking-widest uppercase font-mono mb-3">📖 Today's Verse</div>
          <blockquote className="text-white text-lg leading-relaxed font-light italic mb-3">"{dailyVerse.text}"</blockquote>
          <cite className="text-amber-400 text-sm font-semibold not-italic">— {dailyVerse.ref}</cite>
        </div>

        {/* Spurgeon Devotion */}
        <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-gray-500 text-xs tracking-widest uppercase font-mono">📚 Morning Devotion</div>
          <p className="text-gray-300 text-sm leading-relaxed">{devotion.text}</p>
          <p className="text-gray-600 text-xs italic">— {devotion.ref}</p>
        </div>

        {/* Prayer */}
        <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label className="text-gray-500 text-xs tracking-widest uppercase font-mono block">🙏 Morning Prayer (optional)</label>
          <textarea
            value={prayerText}
            onChange={e => setPrayerText(e.target.value)}
            placeholder="Write your prayer or intention for today…"
            rows={4}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <button
          onClick={handleStartSession}
          disabled={completeDevotion.isPending}
          className="w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #92400e, #d97706)", color: "white", boxShadow: "0 0 40px rgba(217,119,6,0.2)" }}
        >
          {completeDevotion.isPending ? "Starting…" : "Begin Today's Session →"}
        </button>
      </div>
    );
  }

  // ── Tasks Phase ──────────────────────────────────────────────────────────────
  if (phase === "tasks") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Link href="/admin" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">← Admin</Link>
          <span className="text-gray-700 text-xs font-mono">{today}</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-bold tracking-tight">Today's Tasks</h1>
          <p className="text-gray-500 text-sm">Check off what you've completed this week</p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            No weekly tasks configured. <Link href="/admin/weekly-ops" className="text-amber-500 hover:underline">Set up Weekly Ops →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={{ ...task, completed: completedIds.has(task.id) }}
                onToggle={(checked) => toggleTask.mutate({ taskId: task.id, completed: checked })}
                accentColor="amber"
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase("brain")}
          className="w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)", color: "white", boxShadow: "0 0 40px rgba(37,99,235,0.2)" }}
        >
          Continue to Brain Exercise →
        </button>
      </div>
    );
  }

  // ── Brain Exercise Phase ─────────────────────────────────────────────────────
  if (phase === "brain") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setPhase("tasks")} className="text-gray-600 text-sm hover:text-gray-400 transition-colors">← Back</button>
          <span className="text-gray-700 text-xs font-mono">{today}</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl">🧠</div>
          <h1 className="text-2xl font-bold tracking-tight">Brain Exercise</h1>
          <p className="text-gray-500 text-sm">Keep your mind sharp</p>
        </div>

        {/* Exercise Type Selector */}
        <div className="flex gap-2 flex-wrap justify-center">
          {exerciseTypes.map(({ type, label, emoji }) => (
            <button
              key={type}
              onClick={() => setSelectedExerciseType(type)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: selectedExerciseType === type ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedExerciseType === type ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: selectedExerciseType === type ? "#60a5fa" : "#666",
              }}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Exercise Prompt */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{currentExercise.prompt}</div>
          <textarea
            value={brainAnswer}
            onChange={e => setBrainAnswer(e.target.value)}
            placeholder="Your answer…"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <button
          onClick={handleLogBrain}
          disabled={!brainAnswer.trim() || brainSubmitting}
          className="w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: brainAnswer.trim() ? "linear-gradient(135deg, #166534, #16a34a)" : "rgba(255,255,255,0.05)",
            color: brainAnswer.trim() ? "white" : "#666",
            boxShadow: brainAnswer.trim() ? "0 0 40px rgba(22,163,74,0.2)" : "none",
          }}
        >
          {brainSubmitting ? "Saving…" : "Continue to Evening Reflection →"}
        </button>
      </div>
    );
  }

  // ── Evening Phase ────────────────────────────────────────────────────────────
  if (phase === "evening") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setPhase("brain")} className="text-gray-600 text-sm hover:text-gray-400 transition-colors">← Back</button>
          <span className="text-gray-700 text-xs font-mono">{today}</span>
        </div>

        <div className="text-center space-y-2">
          <div className="text-4xl">🌙</div>
          <h1 className="text-2xl font-bold tracking-tight">Evening Reflection</h1>
          <p className="text-gray-500 text-sm">Close the day with intention</p>
        </div>

        {/* Monetization Action */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(180,130,40,0.08) 0%, rgba(180,130,40,0.03) 100%)", border: "1px solid rgba(180,130,40,0.15)" }}>
          <div className="text-amber-500/60 text-xs tracking-widest uppercase font-mono mb-4">💛 Revenue Action for Today</div>
          <MonetizationAction day={dayOfYear} />
        </div>

        {/* Closing Verse */}
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(30,100,60,0.1) 0%, rgba(30,100,60,0.04) 100%)", border: "1px solid rgba(30,100,60,0.2)" }}>
          <div className="text-green-500/60 text-xs tracking-widest uppercase font-mono mb-3">📖 Closing Verse</div>
          <blockquote className="text-white text-lg leading-relaxed font-light italic mb-3">"{closingVerse.text}"</blockquote>
          <cite className="text-green-400 text-sm font-semibold not-italic">— {closingVerse.ref}</cite>
        </div>

        {/* End of Day Question */}
        <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label className="text-green-500/60 text-xs tracking-widest uppercase font-mono block">
            🌟 What was the most important thing you did today?
          </label>
          <textarea
            value={endAnswer}
            onChange={e => setEndAnswer(e.target.value)}
            placeholder="One honest sentence…"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-green-500/50 transition-colors"
          />
        </div>

        <button
          onClick={handleEndSession}
          disabled={!endAnswer.trim() || endSubmitting}
          className="w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: endAnswer.trim() ? "linear-gradient(135deg, #166534, #16a34a)" : "rgba(255,255,255,0.05)",
            color: endAnswer.trim() ? "white" : "#666",
            boxShadow: endAnswer.trim() ? "0 0 40px rgba(22,163,74,0.2)" : "none",
          }}
        >
          {endSubmitting ? "Closing session…" : "🌙 End Session & Log Off"}
        </button>
      </div>
    );
  }

  // ── Session Complete ─────────────────────────────────────────────────────────
  if (phase === "session_complete") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center space-y-6">
        <div className="text-6xl">🌙</div>
        <h1 className="text-3xl font-bold text-white">Session Complete</h1>
        <p className="text-gray-500 max-w-md text-sm leading-relaxed">
          Today's session has been recorded. Your prayer, reflection, and work log are saved.
          Come back tomorrow — a new verse, a new devotion, and a fresh mission will be waiting.
        </p>
        <div className="rounded-2xl px-8 py-4" style={{ background: "rgba(180,130,40,0.08)", border: "1px solid rgba(180,130,40,0.15)" }}>
          <p className="text-amber-400/70 text-sm italic">"{MOTIVATIONAL_QUOTES[(quoteIdx + 1) % MOTIVATIONAL_QUOTES.length]}"</p>
        </div>
        <Link
          href="/admin"
          className="px-8 py-3 rounded-xl font-bold text-sm tracking-wide"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}
        >
          ← Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// ─── Task Card Component ─────────────────────────────────────────────────────
function TaskCard({ task, onToggle, accentColor }: {
  task: { id: number; label: string; description?: string | null; completed: boolean };
  onToggle: (checked: boolean) => void;
  accentColor: "amber" | "blue";
}) {
  const colors = {
    amber: { border: "rgba(180,130,40,0.15)", check: "#d4a017", bg: "rgba(180,130,40,0.05)" },
    blue: { border: "rgba(59,130,246,0.15)", check: "#3b82f6", bg: "rgba(59,130,246,0.05)" },
  };
  const c = colors[accentColor];

  return (
    <div
      className="flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: task.completed ? c.bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${task.completed ? c.border : "rgba(255,255,255,0.05)"}`,
        opacity: task.completed ? 0.7 : 1,
      }}
      onClick={() => onToggle(!task.completed)}
    >
      <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          borderColor: task.completed ? c.check : "rgba(255,255,255,0.2)",
          background: task.completed ? c.check : "transparent",
        }}>
        {task.completed && <span className="text-black text-xs font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium transition-colors ${task.completed ? "line-through text-gray-600" : "text-gray-200"}`}>
          {task.label}
        </p>
        {task.description && (
          <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{task.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Monetization Action Component ──────────────────────────────────────────
function MonetizationAction({ day }: { day: number }) {
  const actions = [
    { title: "Share GoFundMe", desc: "Post your campaign link on one social platform today. One share can reach 200+ people.", cta: "Open GoFundMe", url: "https://gofund.me/3a4e564d5" },
    { title: "Substack CTA", desc: "End today's Substack post with a direct ask: 'If this work matters to you, support it here.'", cta: "Open Substack", url: "https://substack.com/dashboard" },
    { title: "Principal Follow-Up", desc: "Follow up with 3 principals who have not replied. Each school = potential donors + subscribers.", cta: "Open Outreach", url: "/admin" },
    { title: "Buy Me a Coffee Push", desc: "Post one update on your Buy Me a Coffee page — even a single paragraph keeps supporters engaged.", cta: "Open BMC", url: "https://buymeacoffee.com/thevaultinvestigates" },
    { title: "LinkedIn Post", desc: "One LinkedIn post about your investigation reaches a professional audience that donates at higher rates.", cta: "Open LinkedIn", url: "https://linkedin.com" },
    { title: "Email Your List", desc: "Send a personal email to your subscriber list. Personal = higher open rates and more donations.", cta: "Open Gmail", url: "https://mail.google.com" },
    { title: "Rest & Plan", desc: "Review this week's revenue actions. What worked? What will you do differently next week?", cta: "Open Weekly Ops", url: "/admin/weekly-ops" },
  ];
  const action = actions[day % actions.length];
  return (
    <div className="space-y-3">
      <p className="text-white text-sm font-semibold">{action.title}</p>
      <p className="text-gray-500 text-xs leading-relaxed">{action.desc}</p>
      <a
        href={action.url}
        target={action.url.startsWith("http") ? "_blank" : "_self"}
        rel="noreferrer"
        className="block text-center py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200"
        style={{ background: "rgba(180,130,40,0.15)", border: "1px solid rgba(180,130,40,0.3)", color: "#d4a017" }}
      >
        {action.cta} →
      </a>
    </div>
  );
}
