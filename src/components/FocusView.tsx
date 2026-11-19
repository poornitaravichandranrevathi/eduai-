import { Check, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Course, StudySession } from '../types';

interface FocusViewProps {
  courses: Course[];
  sessions: StudySession[];
  onCompleteSession: (payload: {
    courseId: string;
    durationMinutes: number;
    focusTopic: string;
  }) => Promise<void>;
}

const PRESETS = [25, 50, 90] as const;

export function FocusView({ courses, sessions, onCompleteSession }: FocusViewProps) {
  const [presetMinutes, setPresetMinutes] = useState<number>(50);
  const [secondsLeft, setSecondsLeft] = useState<number>(50 * 60);
  const [running, setRunning] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [focusTopic, setFocusTopic] = useState('Literature synthesis & problem derivation');
  const [loggedFeedback, setLoggedFeedback] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function selectPreset(mins: number) {
    setRunning(false);
    setPresetMinutes(mins);
    setSecondsLeft(mins * 60);
  }

  async function handleLogSession() {
    const elapsedMinutes = Math.max(
      1,
      Math.round((presetMinutes * 60 - secondsLeft) / 60) || presetMinutes
    );
    await onCompleteSession({
      courseId,
      durationMinutes: elapsedMinutes,
      focusTopic: focusTopic.trim() || 'Focused Study Session',
    });
    setRunning(false);
    setSecondsLeft(presetMinutes * 60);
    setLoggedFeedback(true);
    setTimeout(() => setLoggedFeedback(false), 2200);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const progress = 1 - secondsLeft / (presetMinutes * 60);
  const circumference = 2 * Math.PI * 108;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Focus Stage */}
      <section className="lg:col-span-7 glass-panel rounded-2xl p-8 flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#171b26] border border-white/[0.08]">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => selectPreset(m)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 ${
                presetMinutes === m ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}m Block
            </button>
          ))}
        </div>

        <div className="relative flex items-center justify-center w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
            <circle
              cx="120"
              cy="120"
              r="108"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <circle
              cx="120"
              cy="120"
              r="108"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4cd7f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold text-white tabular-nums tracking-tight">
              {mm}:{ss}
            </span>
            <span className="text-xs text-slate-400 mt-2">
              {running ? 'Deep work in progress' : 'Ready to focus'}
            </span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-3 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              aria-label="Course for focus session"
              className="px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="Current focus objective..."
              className="sm:col-span-2 px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 transition-all"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{running ? 'Pause' : 'Start Timer'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(presetMinutes * 60);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-sm font-medium text-white hover:bg-white/[0.12]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleLogSession}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#06b6d4]/15 border border-[#06b6d4]/40 text-sm font-medium text-[#4cd7f6] hover:bg-[#06b6d4]/25"
          >
            <Check className="h-4 w-4" />
            <span>{loggedFeedback ? 'Session Logged' : 'Log Session'}</span>
          </button>
        </div>
      </section>

      {/* Recent Session History */}
      <section className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Focus Session Log</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recorded study blocks contributing to term analytics
          </p>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {sessions.slice(0, 8).map((sess) => {
            const course = courses.find((c) => c.id === sess.courseId);
            return (
              <div key={sess.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{sess.focusTopic}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-[#4cd7f6]">{course?.code || 'Study'}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{new Date(sess.completedAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-white tabular-nums shrink-0">
                  {sess.durationMinutes}m
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
