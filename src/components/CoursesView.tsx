import { ArrowLeft, BookOpen, CheckCircle2, Circle, FileText, Layers, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Course, SyllabusModule } from '../types';
import type { NavView } from './Sidebar';

interface CoursesViewProps {
  courses: Course[];
  selectedCourseId?: string;
  onSelectCourse: (courseId: string | undefined) => void;
  onToggleModule: (courseId: string, moduleId: string, completed: boolean) => Promise<void>;
  onAddModule: (courseId: string, payload: Partial<SyllabusModule>) => Promise<void>;
  onCreateCourse: (payload: Partial<Course>) => Promise<void>;
  onJumpToView: (view: NavView, courseId?: string) => void;
}

function GeometricCover({ code }: { code: string }) {
  return (
    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#171b26] via-[#1c1f2a] to-[#0f131d] flex items-center justify-center border-b border-white/[0.06]">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full opacity-55"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="90" r="64" fill="none" stroke="url(#gridGrad)" strokeWidth="1" />
        <circle cx="160" cy="90" r="42" fill="none" stroke="#6366f1" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="40" y1="90" x2="280" y2="90" stroke="#4cd7f6" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="160" y1="16" x2="160" y2="164" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1" />
      </svg>
      <span className="absolute font-mono text-sm font-semibold tracking-wider text-slate-300 bg-[#0b0f19]/80 px-3 py-1 rounded-md border border-white/10">
        {code}
      </span>
    </div>
  );
}

export function CoursesView({
  courses,
  selectedCourseId,
  onSelectCourse,
  onToggleModule,
  onAddModule,
  onCreateCourse,
  onJumpToView,
}: CoursesViewProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    instructor: '',
    credits: '3',
    term: 'Fall 2026',
    description: '',
  });
  const [newModule, setNewModule] = useState({
    week: '10',
    title: '',
    topicSummary: '',
    dueDate: '2026-12-01',
  });
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  useEffect(() => {
    if (selectedCourseId && !selectedCourse) {
      onSelectCourse(undefined);
    }
  }, [selectedCourseId, selectedCourse, onSelectCourse]);

  const filtered = courses.filter((c) => (filter === 'all' ? true : c.status === filter));

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourse.code.trim() || !newCourse.title.trim()) return;
    setSubmitting(true);
    try {
      await onCreateCourse({
        code: newCourse.code,
        title: newCourse.title,
        instructor: newCourse.instructor,
        credits: Number(newCourse.credits) || 3,
        term: newCourse.term,
        description: newCourse.description,
      });
      setNewCourse({
        code: '',
        title: '',
        instructor: '',
        credits: '3',
        term: 'Fall 2026',
        description: '',
      });
      setShowAddCourse(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !newModule.title.trim()) return;
    setSubmitting(true);
    try {
      await onAddModule(selectedCourse.id, {
        week: Number(newModule.week) || 1,
        title: newModule.title,
        topicSummary: newModule.topicSummary,
        dueDate: newModule.dueDate,
        completed: false,
      });
      setNewModule({ week: String((Number(newModule.week) || 1) + 1), title: '', topicSummary: '', dueDate: '2026-12-08' });
    } finally {
      setSubmitting(false);
    }
  }

  if (selectedCourse) {
    const completedCount = selectedCourse.modules.filter((m) => m.completed).length;
    const totalCount = selectedCourse.modules.length || 1;
    const pct = Math.round((completedCount / totalCount) * 100);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onSelectCourse(undefined)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to all courses</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onJumpToView('notes', selectedCourse.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-medium text-white hover:bg-white/[0.1] whitespace-nowrap shrink-0"
            >
              <FileText className="h-3.5 w-3.5 text-[#d2bbff]" />
              <span>Course Notes</span>
            </button>
            <button
              type="button"
              onClick={() => onJumpToView('flashcards', selectedCourse.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-medium text-white hover:bg-white/[0.1] whitespace-nowrap shrink-0"
            >
              <Layers className="h-3.5 w-3.5 text-[#4cd7f6]" />
              <span>Recall Deck</span>
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
              {selectedCourse.imageUrl && !brokenImages[selectedCourse.id] ? (
                <img
                  src={selectedCourse.imageUrl}
                  alt={selectedCourse.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [selectedCourse.id]: true }))
                  }
                  className="h-56 lg:h-full w-full object-cover"
                />
              ) : (
                <div className="h-full min-h-52">
                  <GeometricCover code={selectedCourse.code} />
                </div>
              )}
            </div>

            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs font-mono text-[#4cd7f6]">
                  {selectedCourse.code} · {selectedCourse.term} · {selectedCourse.credits.toFixed(1)} Credits
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {selectedCourse.title}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedCourse.description || 'Graduate coursework syllabus and research milestones.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08]">
                <div>
                  <p className="text-xs text-slate-400">Instructor</p>
                  <p className="text-sm font-medium text-white mt-0.5 truncate">
                    {selectedCourse.instructor}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Standing</p>
                  <p className="text-sm font-mono font-semibold text-[#4cd7f6] tabular-nums mt-0.5">
                    {selectedCourse.grade} ({selectedCourse.currentScore}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Target Load</p>
                  <p className="text-sm font-mono text-white tabular-nums mt-0.5">
                    {selectedCourse.weeklyHoursTarget} hrs/week
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Syllabus Progress</p>
                  <p className="text-sm font-mono text-white tabular-nums mt-0.5">
                    {completedCount}/{selectedCourse.modules.length} ({pct}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Syllabus Timeline + Add Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Syllabus Timeline</h3>
            {selectedCourse.modules.length === 0 ? (
              <p className="text-sm text-slate-400 py-6">
                No syllabus modules added yet. Add your first weekly topic on the right.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {selectedCourse.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="py-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleModule(selectedCourse.id, mod.id, !mod.completed)}
                      className="flex items-start gap-3.5 text-left flex-1 min-w-0"
                    >
                      {mod.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#4cd7f6] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-500 hover:text-[#7c3aed] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-slate-400">
                          Week {mod.week} · Target {mod.dueDate}
                        </p>
                        <p
                          className={`text-sm font-semibold mt-0.5 ${
                            mod.completed ? 'text-slate-400 line-through' : 'text-white'
                          }`}
                        >
                          {mod.title}
                        </p>
                        {mod.topicSummary && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {mod.topicSummary}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleAddModule}
            className="lg:col-span-4 glass-panel rounded-xl p-6 space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-white">
              Add Syllabus Module
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Week</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newModule.week}
                    onChange={(e) => setNewModule((p) => ({ ...p, week: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newModule.dueDate}
                    onChange={(e) => setNewModule((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  value={newModule.title}
                  onChange={(e) => setNewModule((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Variational Free Energy Bounds"
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Key Topics</label>
                <textarea
                  rows={3}
                  value={newModule.topicSummary}
                  onChange={(e) => setNewModule((p) => ({ ...p, topicSummary: e.target.value }))}
                  placeholder="Readings, theorems, or lab milestones..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !newModule.title.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Module</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#171b26] border border-white/[0.08]">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                filter === tab
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Courses' : tab === 'active' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddCourse(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:brightness-110 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((course) => {
          const completed = course.modules.filter((m) => m.completed).length;
          const total = course.modules.length || 1;
          const pct = Math.round((completed / total) * 100);

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectCourse(course.id)}
              className="group text-left glass-panel rounded-xl overflow-hidden hover:border-[#7c3aed]/60 transition-all flex flex-col"
            >
              {course.imageUrl && !brokenImages[course.id] ? (
                <div className="relative h-44 w-full overflow-hidden border-b border-white/[0.06]">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [course.id]: true }))
                    }
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19]/80 via-transparent to-transparent" />
                </div>
              ) : (
                <GeometricCover code={course.code} />
              )}

              <div className="p-5 flex-1 flex flex-col justify-between gap-4 w-full">
                <div className="space-y-2">
                  <p className="text-xs font-mono text-[#4cd7f6]">
                    {course.code} · {course.term} · {course.credits.toFixed(1)} Cr
                  </p>
                  <h3 className="font-display text-lg font-semibold text-white group-hover:text-[#d2bbff] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {course.instructor} · Current {course.grade} ({course.currentScore}%)
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>Syllabus milestones</span>
                    </span>
                    <span className="font-mono tabular-nums text-white">
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
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAddCourse(false)}
        >
          <form
            onSubmit={handleCreateCourse}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-popover rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Enroll New Course</h3>
              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))}
                  placeholder="CS 512"
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Credits</label>
                <input
                  type="number"
                  step="0.5"
                  value={newCourse.credits}
                  onChange={(e) => setNewCourse((p) => ({ ...p, credits: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={newCourse.title}
                onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))}
                placeholder="Computational Algebraic Geometry"
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Instructor</label>
                <input
                  type="text"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse((p) => ({ ...p, instructor: e.target.value }))}
                  placeholder="Prof. Elena Vance"
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Term</label>
                <input
                  type="text"
                  value={newCourse.term}
                  onChange={(e) => setNewCourse((p) => ({ ...p, term: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Syllabus Overview</label>
              <textarea
                rows={3}
                value={newCourse.description}
                onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))}
                placeholder="Core focus areas and assessment breakdown..."
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
