import { Check, Loader2, Save, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ThesisChapter } from '../types';

interface ThesisViewProps {
  thesisTitle: string;
  chapters: ThesisChapter[];
  onSaveChapter: (chapter: ThesisChapter) => Promise<void>;
}

export function ThesisView({ thesisTitle, chapters, onSaveChapter }: ThesisViewProps) {
  const [activeId, setActiveId] = useState(chapters[0]?.id || '');
  const activeChapter = chapters.find((c) => c.id === activeId) || chapters[0];

  const [draftTitle, setDraftTitle] = useState(activeChapter?.title || '');
  const [draftContent, setDraftContent] = useState(activeChapter?.content || '');
  const [draftStatus, setDraftStatus] = useState<ThesisChapter['status']>(
    activeChapter?.status || 'Drafting'
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [aiPrompt, setAiPrompt] = useState(
    'Critique the argumentative flow of this chapter and suggest 3 concrete methodological refinements.'
  );
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (activeChapter) {
      setDraftTitle(activeChapter.title);
      setDraftContent(activeChapter.content);
      setDraftStatus(activeChapter.status);
    }
  }, [activeChapter?.id]);

  const wordCount = draftContent.trim().split(/\s+/).filter(Boolean).length;
  const totalWords = chapters.reduce(
    (acc, ch) =>
      acc +
      (ch.id === activeChapter?.id
        ? wordCount
        : ch.content.trim().split(/\s+/).filter(Boolean).length),
    0
  );

  async function handleSave() {
    if (!activeChapter) return;
    setSaving(true);
    try {
      await onSaveChapter({
        ...activeChapter,
        title: draftTitle,
        content: draftContent,
        status: draftStatus,
        updatedAt: new Date().toISOString(),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunCritique(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.askCopilot({
        mode: 'thesis',
        prompt: aiPrompt,
        contextText: `Thesis Title: ${thesisTitle}\nChapter: ${draftTitle}\n\n${draftContent}`,
      });
      setAiResponse(res.text);
    } catch (err: any) {
      setAiError(err.message || 'Unable to generate thesis critique.');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-[#4cd7f6] font-medium">Master&apos;s Thesis Manuscript</p>
          <h2 className="font-display text-xl font-bold text-white truncate mt-0.5">
            {thesisTitle}
          </h2>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-xs text-slate-400">Total Manuscript Words</p>
          <p className="font-mono text-lg font-semibold text-white tabular-nums">
            {totalWords.toLocaleString()} words
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Chapter Outline */}
        <aside className="xl:col-span-3 glass-panel rounded-xl p-4 space-y-2">
          <p className="px-2 pb-2 text-xs font-medium text-slate-400 border-b border-white/[0.06]">
            Manuscript Chapters
          </p>
          {chapters.map((ch) => {
            const count =
              ch.id === activeChapter?.id
                ? wordCount
                : ch.content.trim().split(/\s+/).filter(Boolean).length;
            const active = ch.id === activeChapter?.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveId(ch.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${
                  active
                    ? 'bg-[#7c3aed]/15 border-[#7c3aed]/40 text-white'
                    : 'border-transparent hover:bg-white/[0.03] text-slate-300'
                }`}
              >
                <p className="text-sm font-medium leading-snug">{ch.title}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                  {count}/{ch.targetWords} words · {ch.status}
                </p>
              </button>
            );
          })}
        </aside>

        {/* Main Editor */}
        <section className="xl:col-span-5 glass-panel rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as ThesisChapter['status'])}
                aria-label="Chapter status"
                className="px-3 py-1.5 rounded-lg bg-[#0f172a]/70 border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="Drafting">Drafting</option>
                <option value="Revising">Revising</option>
                <option value="Finalized">Finalized</option>
              </select>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {wordCount} / {activeChapter?.targetWords || 1500} words
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-xs font-medium hover:brightness-110 disabled:opacity-50 transition-all whitespace-nowrap shrink-0"
            >
              {savedNotice ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saving ? 'Saving...' : savedNotice ? 'Saved' : 'Save Chapter'}</span>
            </button>
          </div>

          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full bg-transparent font-display text-xl font-bold text-white focus:outline-none"
          />

          <textarea
            rows={16}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="Write or refine your chapter prose..."
            className="w-full rounded-lg bg-[#0f172a]/55 border border-white/10 p-4 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-[#7c3aed] resize-y"
          />
        </section>

        {/* AI Structuring & Critique Panel */}
        <section className="xl:col-span-4 glass-panel rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#4cd7f6]" />
            <h3 className="font-display text-base font-semibold text-white">
              Thesis Structuring Copilot
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Analyze your active chapter draft for clarity, citations, and methodological rigor.
          </p>

          <form onSubmit={handleRunCritique} className="space-y-3">
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full rounded-lg bg-[#0f172a]/70 border border-white/10 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setAiPrompt('Draft a concise academic transition paragraph linking this section to experimental ablations.')
                }
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Draft transition
              </button>
              <button
                type="button"
                onClick={() =>
                  setAiPrompt('Identify potential reviewer objections or unstated assumptions in this chapter.')
                }
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Reviewer objections
              </button>
            </div>
            <button
              type="submit"
              disabled={aiLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.08] border border-white/15 text-sm font-medium text-white hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#4cd7f6]" />}
              <span>{aiLoading ? 'Analyzing Draft...' : 'Analyze Active Chapter'}</span>
            </button>
          </form>

          {aiError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              {aiError}
            </div>
          )}

          {aiResponse && (
            <div className="p-4 rounded-xl bg-[#0f172a]/70 border border-white/[0.08] text-sm text-slate-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {aiResponse}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
