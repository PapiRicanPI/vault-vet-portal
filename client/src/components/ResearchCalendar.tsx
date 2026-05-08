import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CheckCircle2, Circle, CalendarDays, List } from "lucide-react";

// ── Category config ──────────────────────────────────────────────────────────
type Category = "investigation" | "interview" | "deadline" | "outreach" | "review" | "personal" | "other";

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; dot: string }> = {
  investigation: { label: "Investigation", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
  interview:     { label: "Interview",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30",   dot: "bg-blue-400" },
  deadline:      { label: "Deadline",      color: "bg-red-500/20 text-red-300 border-red-500/30",      dot: "bg-red-400" },
  outreach:      { label: "Outreach",      color: "bg-green-500/20 text-green-300 border-green-500/30", dot: "bg-green-400" },
  review:        { label: "Review",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
  personal:      { label: "Personal",      color: "bg-pink-500/20 text-pink-300 border-pink-500/30",   dot: "bg-pink-400" },
  other:         { label: "Other",         color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",   dot: "bg-zinc-400" },
};

// ── Types ────────────────────────────────────────────────────────────────────
interface ResearchEvent {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  category: Category;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: number;
  caseRef: string | null;
  completed: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EventFormData {
  title: string;
  description: string;
  category: Category;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  caseRef: string;
}

const EMPTY_FORM: EventFormData = {
  title: "",
  description: "",
  category: "other",
  startDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "10:00",
  allDay: true,
  caseRef: "",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Main Component ───────────────────────────────────────────────────────────
export function ResearchCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-based
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ResearchEvent | null>(null);
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<ResearchEvent | null>(null);

  const utils = trpc.useUtils();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: events = [], isLoading } = trpc.calendar.getEvents.useQuery(
    { year: viewYear, month: viewMonth },
    { placeholderData: (prev: any) => prev }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => { utils.calendar.getEvents.invalidate(); setShowModal(false); setForm(EMPTY_FORM); },
  });
  const updateEvent = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => { utils.calendar.getEvents.invalidate(); setShowModal(false); setEditingEvent(null); setForm(EMPTY_FORM); },
  });
  const deleteEvent = trpc.calendar.deleteEvent.useMutation({
    onSuccess: () => { utils.calendar.getEvents.invalidate(); setShowDetailModal(false); },
  });
  const toggleComplete = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => utils.calendar.getEvents.invalidate(),
  });

  // ── Calendar grid helpers ──────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth - 1, 0).getDate();
    const cells: { date: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 2, prevMonthDays - i);
      cells.push({ date: toDateStr(d), isCurrentMonth: false, isToday: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth - 1, d);
      cells.push({ date: toDateStr(date), isCurrentMonth: true, isToday: toDateStr(date) === toDateStr(today) });
    }
    // Trailing days to fill 6 rows
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({ date: toDateStr(date), isCurrentMonth: false, isToday: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  // Map date → events
  const eventsByDate = useMemo(() => {
    const map: Record<string, ResearchEvent[]> = {};
    for (const ev of events as ResearchEvent[]) {
      // Add event to every date it spans
      const start = new Date(ev.startDate + "T00:00:00");
      const end = new Date(ev.endDate + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toDateStr(d);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    }
    return map;
  }, [events]);

  // Week view: current week containing today
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(viewYear, viewMonth - 1, 1);
    // Find Monday of the first week of the month
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(toDateStr(d));
    }
    return days;
  }, [viewYear, viewMonth]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth() + 1); };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openCreate = (date?: string) => {
    const d = date ?? toDateStr(today);
    setForm({ ...EMPTY_FORM, startDate: d, endDate: d });
    setEditingEvent(null);
    setShowModal(true);
  };
  const openEdit = (ev: ResearchEvent) => {
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate,
      startTime: ev.startTime ?? "09:00",
      endTime: ev.endTime ?? "10:00",
      allDay: ev.allDay === 1,
      caseRef: ev.caseRef ?? "",
    });
    setEditingEvent(ev);
    setShowModal(true);
    setShowDetailModal(false);
  };
  const handleSubmit = () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    const payload = {
      title: form.title.trim(),
      description: form.description || undefined,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
      startTime: form.allDay ? undefined : form.startTime || undefined,
      endTime: form.allDay ? undefined : form.endTime || undefined,
      allDay: form.allDay,
      caseRef: form.caseRef || undefined,
    };
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...payload });
    } else {
      createEvent.mutate(payload);
    }
  };

  const openDetail = (ev: ResearchEvent) => { setDetailEvent(ev); setShowDetailModal(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold text-amber-300 min-w-[180px] text-center">
            {MONTHS[viewMonth - 1]} {viewYear}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="ml-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden border border-zinc-700">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${viewMode === "month" ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${viewMode === "week" ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              <List className="h-3.5 w-3.5" /> Week
            </button>
          </div>
          <Button size="sm" onClick={() => openCreate()} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Event
          </Button>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* ── Month View ── */}
      {viewMode === "month" && (
        <div className="rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-700">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.date] ?? [];
              const isSelected = selectedDay === cell.date;
              return (
                <div
                  key={idx}
                  onClick={() => { setSelectedDay(cell.date === selectedDay ? null : cell.date); }}
                  className={`min-h-[90px] p-1.5 border-b border-r border-zinc-800 cursor-pointer transition-colors ${
                    !cell.isCurrentMonth ? "opacity-30" : ""
                  } ${cell.isToday ? "bg-amber-500/5 ring-1 ring-inset ring-amber-500/30" : "hover:bg-zinc-800/50"} ${
                    isSelected ? "bg-zinc-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      cell.isToday ? "bg-amber-500 text-black font-bold" : "text-zinc-400"
                    }`}>
                      {cell.date.split("-")[2].replace(/^0/, "")}
                    </span>
                    {cell.isCurrentMonth && (
                      <button
                        onClick={e => { e.stopPropagation(); openCreate(cell.date); }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-zinc-500 hover:text-amber-400 transition-opacity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); openDetail(ev); }}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate border transition-opacity ${
                          ev.completed ? "opacity-50 line-through" : ""
                        } ${CATEGORY_CONFIG[ev.category]?.color ?? CATEGORY_CONFIG.other.color}`}
                      >
                        {ev.allDay ? "" : (ev.startTime ? ev.startTime + " " : "")}{ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-zinc-500 pl-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Week / List View ── */}
      {viewMode === "week" && (
        <div className="rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900">
          {/* All events for the month in list form, grouped by date */}
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Loading events…</div>
          ) : (events as ResearchEvent[]).length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-500 text-sm mb-3">No events scheduled for {MONTHS[viewMonth - 1]} {viewYear}.</p>
              <Button size="sm" onClick={() => openCreate()} className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold gap-1">
                <Plus className="h-3.5 w-3.5" /> Schedule your first event
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {(events as ResearchEvent[]).map(ev => {
                const cfg = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.other;
                return (
                  <div key={ev.id} className={`flex items-start gap-3 p-3 hover:bg-zinc-800/50 transition-colors ${ev.completed ? "opacity-50" : ""}`}>
                    {/* Complete toggle */}
                    <button
                      onClick={() => toggleComplete.mutate({ id: ev.id, completed: !ev.completed })}
                      className="mt-0.5 text-zinc-500 hover:text-amber-400 transition-colors flex-shrink-0"
                    >
                      {ev.completed ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4" />}
                    </button>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <span className={`font-medium text-sm text-zinc-100 ${ev.completed ? "line-through" : ""}`}>{ev.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                        <span>
                          {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} → ${ev.endDate}`}
                          {!ev.allDay && ev.startTime ? ` · ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ""}` : ""}
                        </span>
                        {ev.caseRef && <span className="text-amber-500/70">📁 {ev.caseRef}</span>}
                      </div>
                      {ev.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{ev.description}</p>}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(ev)} className="text-zinc-600 hover:text-amber-400 transition-colors p-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteEvent.mutate({ id: ev.id })} className="text-zinc-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-md">
          {detailEvent && (() => {
            const cfg = CATEGORY_CONFIG[detailEvent.category] ?? CATEGORY_CONFIG.other;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    {detailEvent.completed ? <span className="text-xs text-green-400">✓ Completed</span> : null}
                  </div>
                  <DialogTitle className="text-amber-300 text-lg">{detailEvent.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">Date: </span>
                    {detailEvent.startDate === detailEvent.endDate ? detailEvent.startDate : `${detailEvent.startDate} → ${detailEvent.endDate}`}
                    {!detailEvent.allDay && detailEvent.startTime ? ` · ${detailEvent.startTime}${detailEvent.endTime ? `–${detailEvent.endTime}` : ""}` : " (All day)"}
                  </div>
                  {detailEvent.caseRef && (
                    <div className="text-sm text-zinc-400">
                      <span className="font-medium text-zinc-300">Case Reference: </span>
                      <span className="text-amber-400">{detailEvent.caseRef}</span>
                    </div>
                  )}
                  {detailEvent.description && (
                    <div className="text-sm text-zinc-400">
                      <span className="font-medium text-zinc-300 block mb-1">Notes:</span>
                      <p className="bg-zinc-800 rounded-lg p-3 text-zinc-300">{detailEvent.description}</p>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex gap-2 sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleComplete.mutate({ id: detailEvent.id, completed: !detailEvent.completed })}
                      className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs"
                    >
                      {detailEvent.completed ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteEvent.mutate({ id: detailEvent.id })}
                      className="border-red-800/50 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => openEdit(detailEvent)} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Create / Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={v => { setShowModal(v); if (!v) { setEditingEvent(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-300">{editingEvent ? "Edit Event" : "New Research Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Event Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Interview with source, Deadline: case report"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as Category }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-zinc-100 focus:bg-zinc-700">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs mb-1.5 block">Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs mb-1.5 block">End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            {/* All-day toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.allDay}
                onCheckedChange={v => setForm(f => ({ ...f, allDay: v }))}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label className="text-zinc-400 text-sm cursor-pointer">All-day event</Label>
            </div>

            {/* Time fields (only when not all-day) */}
            {!form.allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block">Start Time</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block">End Time</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* Case reference */}
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Case Reference (optional)</Label>
              <Input
                value={form.caseRef}
                onChange={e => setForm(f => ({ ...f, caseRef: e.target.value }))}
                placeholder="e.g. Case #42 — Manila Slum Displacement"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-zinc-400 text-xs mb-1.5 block">Notes (optional)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Preparation notes, agenda items, follow-up actions…"
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingEvent(null); setForm(EMPTY_FORM); }} className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || !form.startDate || !form.endDate || createEvent.isPending || updateEvent.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              {createEvent.isPending || updateEvent.isPending ? "Saving…" : editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
