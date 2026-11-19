import { CheckCircle2, Circle, Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Course, StudyTask } from '../types';

interface PlannerViewProps {
  tasks: StudyTask[];
  courses: Course[];
  onSaveTask: (task: Partial<StudyTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export function PlannerView({ tasks, courses, onSaveTask, onDeleteTask }: PlannerViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [type, setType] = useState<StudyTask['type']>('Assignment');
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [priority, setPriority] = useState<StudyTask['priority']>('medium');
  const [saving, setSaving] = useState(false);

  const filtered = tasks.filter((t) =>
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !courseId) return;
    setSaving(true);
    try {
      await onSaveTask({
        courseId,
        title: title.trim(),
        type,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        priority,
        status: 'todo',
      });
      setTitle('');
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(task: StudyTask) {
    const next: StudyTask['status'] =
      task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    await onSaveTask({ ...task, status: next });
  }

  const totalRemainingMin = tasks
    .filter((t) => t.status !== 'done')
    .reduce((acc, t) => acc + t.estimatedMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Add Deliverable Form */}
      <form onSubmit={handleAdd} className="glass-panel rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white">Add Study Deliverable</h2>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            Remaining workload: {(totalRemainingMin / 60).toFixed(1)} hrs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Deliverable, proof set, or reading milestone..."
            className="md:col-span-5 px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label="Course"
            className="md:col-span-2 px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as StudyTask['type'])}
            aria-label="Deliverable type"
            className="md:col-span-2 px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="Assignment">Assignment</option>
            <option value="Research">Research</option>
            <option value="Exam Prep">Exam Prep</option>
            <option value="Reading">Reading</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="md:col-span-2 px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
          />
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="md:hidden">Add</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <label className="flex items-center gap-2">
            <span>Estimate (min):</span>
            <input
              type="number"
              min={15}
              step={15}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-[#0f172a]/70 border border-white/10 text-white font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as StudyTask['priority'])}
              className="px-2 py-1 rounded bg-[#0f172a]/70 border border-white/10 text-white"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
      </form>

      {/* Filter Bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#171b26] border border-white/[0.08] w-fit">
        {(
          [
            { id: 'all', label: 'All Deliverables' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'done', label: 'Completed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === tab.id ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* High-Density Deliverable Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No deliverables in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-medium text-slate-400">
                  <th className="py-3 px-4">Deliverable</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Est.</th>
                  <th className="py-3 px-4 text-right">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {filtered.map((task) => {
                  const course = courses.find((c) => c.id === task.courseId);
                  const done = task.status === 'done';
                  return (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => cycleStatus(task)}
                          className="flex items-center gap-3 text-left"
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-[#4cd7f6] shrink-0" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="h-4 w-4 text-[#d2bbff] shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                          )}
                          <span className={done ? 'line-through text-slate-500' : 'text-white font-medium'}>
                            {task.title}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#4cd7f6] whitespace-nowrap">
                        {course?.code || 'General'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                        {task.type}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => cycleStatus(task)}
                          className="text-slate-300 hover:text-white underline decoration-white/20 underline-offset-4"
                        >
                          {task.status === 'todo'
                            ? 'To Do'
                            : task.status === 'in_progress'
                            ? 'In Progress'
                            : 'Completed'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-300 whitespace-nowrap">
                        {task.estimatedMinutes}m
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-300 whitespace-nowrap">
                        {task.dueDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label="Delete deliverable"
                          className="p-1.5 text-slate-500 hover:text-rose-300 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
