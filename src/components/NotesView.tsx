import { Check, ChevronDown, ChevronUp, Copy, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Course, ResearchNote } from '../types';

interface NotesViewProps {
  notes: ResearchNote[];
  courses: Course[];
  initialCourseFilter?: string;
  onSaveNote: (note: Partial<ResearchNote>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onAskCopilotAboutNote: (note: ResearchNote) => void;
}

export function NotesView({
  notes,
  courses,
  initialCourseFilter,
  onSaveNote,
  onDeleteNote,
  onAskCopilotAboutNote,
}: NotesViewProps) {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState(initialCourseFilter || 'all');
  const [expandedId, setExpandedId] = useState<string | null>(notes[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({
    courseId: courses[0]?.id || '',
    title: '',
    authors: '',
    year: '2026',
    publication: '',
    citationKey: '',
    summary: '',
    body: '',
    tagsInput: '',
  });

  const filtered = notes.filter((n) => {
    if (courseFilter !== 'all' && n.courseId !== courseFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.authors.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  function copyCitation(note: ResearchNote) {
    const bibtex = `@article{${note.citationKey || 'ref2026'},\n  title={${note.title}},\n  author={${note.authors}},\n  journal={${note.publication}},\n  year={${note.year}}\n}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.courseId) return;
    setSaving(true);
    try {
      await onSaveNote({
        courseId: draft.courseId,
        title: draft.title,
        authors: draft.authors,
        year: draft.year,
        publication: draft.publication,
        citationKey: draft.citationKey,
        summary: draft.summary,
        body: draft.body,
        tags: draft.tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setDraft({
        courseId: courses[0]?.id || '',
        title: '',
        authors: '',
        year: '2026',
        publication: '',
        citationKey: '',
        summary: '',
        body: '',
        tagsInput: '',
      });
      setShowEditor(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter literature notes, authors, or topics..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
            className="px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Research Note</span>
        </button>
      </div>

      {/* Expandable Research Note Cards */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center space-y-3">
          <p className="text-base font-medium text-white">No research notes match your filter</p>
          <p className="text-sm text-slate-400">
            Create a structured literature note or clear your active search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((note) => {
            const course = courses.find((c) => c.id === note.courseId);
            const isOpen = expandedId === note.id;
            return (
              <article
                key={note.id}
                className="glass-panel rounded-xl p-5 sm:p-6 transition-colors hover:border-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs text-slate-400">
                      <span className="font-mono text-[#4cd7f6]">{course?.code || 'Archive'}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{note.authors}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">{note.year}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{note.publication}</span>
                    </p>
                    <h3 className="font-display text-lg font-semibold text-white">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{note.summary}</p>
                    {note.tags.length > 0 && (
                      <p className="text-xs text-slate-400 pt-1">
                        {note.tags.join(' · ')}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : note.id)}
                    aria-label={isOpen ? 'Collapse note' : 'Expand note'}
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white shrink-0"
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-5 pt-5 border-t border-white/[0.08] space-y-4">
                    <div className="rounded-lg bg-[#0a0e18]/80 border border-white/[0.06] p-4 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {note.body || 'No extended synthesis recorded yet.'}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCitation(note)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-medium text-slate-200 hover:bg-white/[0.1] whitespace-nowrap shrink-0"
                        >
                          {copiedId === note.id ? (
                            <Check className="h-3.5 w-3.5 text-[#4cd7f6]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {copiedId === note.id ? 'BibTeX Copied' : `Copy BibTeX (${note.citationKey || 'cite'})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onAskCopilotAboutNote(note)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-xs font-medium text-white hover:bg-[#7c3aed]/30 whitespace-nowrap shrink-0"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#4cd7f6]" />
                          <span>Synthesize with Copilot</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* New Note Modal */}
      {showEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowEditor(false)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl glass-popover rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">New Research Note</h3>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Course</label>
                <select
                  value={draft.courseId}
                  onChange={(e) => setDraft((p) => ({ ...p, courseId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Citation Key</label>
                <input
                  type="text"
                  value={draft.citationKey}
                  onChange={(e) => setDraft((p) => ({ ...p, citationKey: e.target.value }))}
                  placeholder="elhage2022toy"
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Paper / Note Title</label>
              <input
                type="text"
                required
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Toy Models of Superposition"
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Authors</label>
                <input
                  type="text"
                  value={draft.authors}
                  onChange={(e) => setDraft((p) => ({ ...p, authors: e.target.value }))}
                  placeholder="Elhage et al."
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Publication</label>
                <input
                  type="text"
                  value={draft.publication}
                  onChange={(e) => setDraft((p) => ({ ...p, publication: e.target.value }))}
                  placeholder="Anthropic Circuits"
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Year</label>
                <input
                  type="text"
                  value={draft.year}
                  onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Executive Summary</label>
              <textarea
                rows={2}
                value={draft.summary}
                onChange={(e) => setDraft((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Core thesis or empirical contribution in 1-2 sentences..."
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Detailed Synthesis & Equations</label>
              <textarea
                rows={5}
                value={draft.body}
                onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
                placeholder="Key proofs, experimental findings, and thesis connections..."
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Topics (comma-separated)</label>
              <input
                type="text"
                value={draft.tagsInput}
                onChange={(e) => setDraft((p) => ({ ...p, tagsInput: e.target.value }))}
                placeholder="Superposition, Feature Geometry, SAE"
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Research Note'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
