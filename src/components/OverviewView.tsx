import { ArrowRight, CheckCircle2, Circle, Plus, Timer } from 'lucide-react';
import { useState } from 'react';
import type { StudyTask, WorkspaceSnapshot } from '../types';
import type { NavView } from './Sidebar';

interface OverviewViewProps {
  workspace: WorkspaceSnapshot;
  onNavigate: (view: NavView, itemId?: string) => void;
  onToggleTask: (task: StudyTask) => Promise<void>;
  onQuickAddTask: (title: string, courseId: string) => Promise<void>;
}

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 104;
  const h = 28;
  const coords = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="overflow-visible">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export function OverviewView({
  workspace,
  onNavigate,
  onToggleTask,
  onQuickAddTask,
}: OverviewViewProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourseId, setQuickCourseId] = useState(workspace.courses[0]?.id || '');
  const [savingTask, setSavingTask] = useState(false);

  const totalModules = workspace.courses.reduce((acc, c) => acc + c.modules.length, 0);
  const doneModules = workspace.courses.reduce(
    (acc, c) => acc + c.modules.filter((m) => m.completed).length,
    0
  );
  const syllabusPct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0;

  const totalMinutes = workspace.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const focusHours = (totalMinutes / 60).toFixed(1);

  const masteredCards = workspace.flashcards.filter((f) => f.mastery >= 2).length;
  const recallPct =
    workspace.flashcards.length > 0
      ? Math.round((masteredCards / workspace.flashcards.length) * 100)
      : 0;

  const totalThesisWords = workspace.thesisChapters.reduce(
    (acc, ch) => acc + ch.content.trim().split(/\s+/).filter(Boolean).length,
    0
  );

  const openTasks = workspace.tasks.filter((t) => t.status !== 'done').slice(0, 5);
  const activeCourses = workspace.courses.filter((c) => c.status === 'active');

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim() || !quickCourseId) return;
    setSavingTask(true);
    try {
      await onQuickAddTask(quickTitle.trim(), quickCourseId);
      setQuickTitle('');
    } finally {
      setSavingTask(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Academic Anchor */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]">
        <img
          src="/src/assets/images/hero_edusphere_studio_1794995661138.jpg"
          alt="University research studio at night"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/85 to-[#0b0f19]/45" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium text-[#4cd7f6] tracking-wide">
              {workspace.scholar.term} · {workspace.scholar.program}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {workspace.scholar.thesisTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {openTasks.length} active deliverables remaining across {activeCourses.length} enrolled courses, with{' '}
              <span className="font-mono tabular-nums text-white">{totalThesisWords.toLocaleString()}</span> thesis words drafted.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('focus')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all whitespace-nowrap shrink-0"
            >
              <Timer className="h-4 w-4" />
              <span>Start Focus Session</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('thesis')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm font-medium hover:bg-white/[0.12] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Open Thesis Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column Academic Metric Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cumulative GPA</span>
            <span className="text-xs text-[#4cd7f6] font-mono tabular-nums">+0.08 term</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-3xl font-bold text-white tabular-nums">
              {workspace.scholar.gpa.toFixed(2)}
            </span>
            <Sparkline points={[3.78, 3.81, 3.84, 3.87, 3.9, 3.92]} stroke="#4cd7f6" />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Logged Deep Focus</span>
            <span className="text-xs text-slate-300 font-mono tabular-nums">
              {workspace.sessions.length} sessions
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-3xl font-bold text-[#4cd7f6] tabular-nums">
              {focusHours}h
            </span>
            <Sparkline points={[2.5, 4.0, 3.5, 5.2, 4.8, Number(focusHours)]} stroke="#7c3aed" />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Recall Mastery</span>
            <span className="text-xs text-slate-300 font-mono tabular-nums">
              {masteredCards}/{workspace.flashcards.length} cards
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-3xl font-bold text-white tabular-nums">
              {recallPct}%
            </span>
            <Sparkline points={[48, 56, 62, 70, 78, recallPct]} stroke="#6366f1" />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Syllabus Completion</span>
            <span className="text-xs text-slate-300 font-mono tabular-nums">
              {doneModules}/{totalModules} modules
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-3xl font-bold text-white tabular-nums">
              {syllabusPct}%
            </span>
            <Sparkline points={[25, 40, 52, 60, 65, syllabusPct]} stroke="#4cd7f6" />
          </div>
        </div>
      </section>

      {/* Main Split: Upcoming Deliverables + Active Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Deliverables Panel */}
        <section className="lg:col-span-7 glass-panel rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                Upcoming Deliverables
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assignments, lab benchmarks, and thesis milestones
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="text-xs font-medium text-[#4cd7f6] hover:underline whitespace-nowrap shrink-0"
            >
              View full planner
            </button>
          </div>

          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add deliverable or reading..."
              className="flex-1 px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
            />
            <select
              value={quickCourseId}
              onChange={(e) => setQuickCourseId(e.target.value)}
              aria-label="Course for quick task"
              className="px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#7c3aed]"
            >
              {workspace.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={savingTask || !quickTitle.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.08] border border-white/15 text-sm font-medium text-white hover:bg-white/[0.14] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="divide-y divide-white/[0.06]">
            {workspace.tasks.slice(0, 6).map((task) => {
              const course = workspace.courses.find((c) => c.id === task.courseId);
              const done = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task)}
                    className="flex items-start gap-3 text-left min-w-0 flex-1"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-[#4cd7f6] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500 hover:text-[#7c3aed] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          done ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span>{course?.code || 'General'}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{task.type}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{task.estimatedMinutes}m</span>
                      </p>
                    </div>
                  </button>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono tabular-nums text-slate-300">{task.dueDate}</p>
                    <p
                      className={`text-xs capitalize ${
                        task.priority === 'high'
                          ? 'text-amber-400'
                          : task.priority === 'medium'
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {task.priority} priority
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Courses Snapshot */}
        <section className="lg:col-span-5 glass-panel rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Enrolled Courses</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current term progress & standing
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="text-xs font-medium text-[#4cd7f6] hover:underline whitespace-nowrap shrink-0"
            >
              Manage courses
            </button>
          </div>

          <div className="space-y-4">
            {activeCourses.map((course) => {
              const completed = course.modules.filter((m) => m.completed).length;
              const total = course.modules.length || 1;
              const pct = Math.round((completed / total) * 100);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => onNavigate('courses', course.id)}
                  className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#7c3aed]/50 hover:bg-white/[0.05] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-[#4cd7f6]">
                        {course.code} · {course.credits.toFixed(1)} Credits
                      </p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{course.instructor}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-white tabular-nums shrink-0">
                      {course.currentScore}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Syllabus milestones</span>
                      <span className="font-mono tabular-nums">
                        {completed}/{course.modules.length} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#4cd7f6]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
