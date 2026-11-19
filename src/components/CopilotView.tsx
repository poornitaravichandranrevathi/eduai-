import { BookmarkPlus, Check, Loader2, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import type { CopilotMessage, Course, ResearchNote } from '../types';

interface CopilotViewProps {
  courses: Course[];
  notes: ResearchNote[];
  initialPrompt?: string;
  initialContextNote?: ResearchNote;
  onSaveResponseAsNote: (payload: Partial<ResearchNote>) => Promise<void>;
}

const MODES: Array<{ id: CopilotMessage['mode']; label: string }> = [
  { id: 'synthesis', label: 'Literature Synthesis' },
  { id: 'explain', label: 'First-Principles' },
  { id: 'thesis', label: 'Thesis Critique' },
  { id: 'plan', label: 'Study Plan' },
];

export function CopilotView({
  courses,
  notes,
  initialPrompt = '',
  initialContextNote,
  onSaveResponseAsNote,
}: CopilotViewProps) {
  const [mode, setMode] = useState<CopilotMessage['mode']>('synthesis');
  const [attachedCourseId, setAttachedCourseId] = useState<string>(
    initialContextNote?.courseId || courses[0]?.id || ''
  );
  const [attachedNoteId, setAttachedNoteId] = useState<string>(initialContextNote?.id || '');
  const [input, setInput] = useState(
    initialPrompt ||
      (initialContextNote
        ? `Synthesize the core claims and experimental gaps in "${initialContextNote.title}" and connect them to my thesis.`
        : '')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      mode: 'synthesis',
      content:
        'Attach a course or research note above, select a reasoning mode, and ask for a derivation, literature synthesis, or study plan.',
      createdAt: new Date().toISOString(),
    },
  ]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: CopilotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      mode,
      courseId: attachedCourseId,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    const course = courses.find((c) => c.id === attachedCourseId);
    const note = notes.find((n) => n.id === attachedNoteId);
    const contextParts: string[] = [];
    if (course) {
      contextParts.push(`Course: ${course.code} — ${course.title}\n${course.description}`);
    }
    if (note) {
      contextParts.push(
        `Attached Research Note: ${note.title} (${note.authors}, ${note.year})\nSummary: ${note.summary}\nDetails: ${note.body}`
      );
    }

    try {
      const res = await api.askCopilot({
        prompt: userMsg.content,
        mode,
        contextText: contextParts.join('\n\n'),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          mode,
          courseId: attachedCourseId,
          content: res.text,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to reach EduSphere Copilot.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToNotes(msg: CopilotMessage) {
    await onSaveResponseAsNote({
      courseId: msg.courseId || attachedCourseId || courses[0]?.id,
      title: `Copilot Synthesis (${new Date().toLocaleDateString()})`,
      authors: 'EduSphere AI Research Synthesis',
      year: '2026',
      publication: 'Copilot Session Archive',
      summary: msg.content.slice(0, 180) + (msg.content.length > 180 ? '...' : ''),
      body: msg.content,
      tags: ['Copilot Synthesis', msg.mode],
    });
    setSavedIds((prev) => ({ ...prev, [msg.id]: true }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mode & Context Bar */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#171b26] border border-white/[0.08]">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mode === m.id ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Course Context</label>
            <select
              value={attachedCourseId}
              onChange={(e) => setAttachedCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
            >
              <option value="">No specific course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Attach Research Note</label>
            <select
              value={attachedNoteId}
              onChange={(e) => setAttachedNoteId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
            >
              <option value="">None attached</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl p-5 ${
              msg.role === 'user'
                ? 'bg-[#7c3aed]/15 border border-[#7c3aed]/35 ml-8'
                : 'glass-panel mr-0 sm:mr-8'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-[#4cd7f6] flex items-center gap-1.5">
                {msg.role === 'assistant' && <Sparkles className="h-3.5 w-3.5" />}
                <span>{msg.role === 'user' ? 'You' : 'EduSphere Copilot'}</span>
              </span>
              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                <button
                  type="button"
                  onClick={() => handleSaveToNotes(msg)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
                >
                  {savedIds[msg.id] ? (
                    <Check className="h-3.5 w-3.5 text-[#4cd7f6]" />
                  ) : (
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  )}
                  <span>{savedIds[msg.id] ? 'Saved to Notes' : 'Save to Research Notes'}</span>
                </button>
              )}
            </div>
            <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>
        ))}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      {/* Prompt Composer */}
      <form onSubmit={handleSend} className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a mathematical derivation, literature comparison, or exam study roadmap..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 self-end shrink-0 whitespace-nowrap"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>{loading ? 'Thinking...' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
}
