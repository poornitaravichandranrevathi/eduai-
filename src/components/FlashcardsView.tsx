import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Loader2, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Course, Flashcard } from '../types';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  courses: Course[];
  initialCourseFilter?: string;
  onRateCard: (cardId: string, mastery: 0 | 1 | 2 | 3) => Promise<void>;
  onCreateCard: (payload: Partial<Flashcard>) => Promise<void>;
  onGeneratedCards: (cards: Flashcard[]) => void;
}

const MASTERY_LABELS = ['New', 'Learning', 'Reviewing', 'Mastered'] as const;

export function FlashcardsView({
  flashcards,
  courses,
  initialCourseFilter,
  onRateCard,
  onCreateCard,
  onGeneratedCards,
}: FlashcardsViewProps) {
  const [mode, setMode] = useState<'deck' | 'quiz'>('deck');
  const [courseFilter, setCourseFilter] = useState(initialCourseFilter || 'all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [showAiGen, setShowAiGen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCourseId, setAiCourseId] = useState(courses[0]?.id || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const [showNewCard, setShowNewCard] = useState(false);
  const [newCard, setNewCard] = useState({
    courseId: courses[0]?.id || '',
    front: '',
    back: '',
    hint: '',
  });

  // Quiz state
  const [quizTopic, setQuizTopic] = useState('Sparse Autoencoders & Circuit Attribution');
  const [quizCourseId, setQuizCourseId] = useState(courses[0]?.id || '');
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>
  >([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');

  const deck = flashcards.filter((f) =>
    courseFilter === 'all' ? true : f.courseId === courseFilter
  );
  const currentCard = deck[index] || deck[0];

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
  }, [courseFilter]);

  useEffect(() => {
    if (index >= deck.length && deck.length > 0) {
      setIndex(0);
    }
  }, [deck.length, index]);

  async function handleRate(mastery: 0 | 1 | 2 | 3) {
    if (!currentCard) return;
    await onRateCard(currentCard.id, mastery);
    setFlipped(false);
    setShowHint(false);
    if (deck.length > 1) {
      setIndex((prev) => (prev + 1) % deck.length);
    }
  }

  async function handleGenerateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!aiTopic.trim() || !aiCourseId) return;
    setAiGenerating(true);
    setAiError('');
    try {
      const created = await api.generateFlashcards({
        courseId: aiCourseId,
        topic: aiTopic.trim(),
        count: 4,
      });
      onGeneratedCards(created);
      setAiTopic('');
      setShowAiGen(false);
      setCourseFilter(aiCourseId);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate flashcards.');
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleCreateManualCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCard.front.trim() || !newCard.back.trim()) return;
    await onCreateCard(newCard);
    setNewCard({ courseId: courses[0]?.id || '', front: '', back: '', hint: '' });
    setShowNewCard(false);
  }

  async function handleStartQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!quizTopic.trim()) return;
    setQuizLoading(true);
    setQuizError('');
    setQuizAnswers({});
    try {
      const course = courses.find((c) => c.id === quizCourseId);
      const questions = await api.generateQuiz({
        topic: quizTopic.trim(),
        courseTitle: course ? `${course.code}: ${course.title}` : undefined,
      });
      setQuizQuestions(questions);
    } catch (err: any) {
      setQuizError(err.message || 'Unable to generate practice quiz.');
    } finally {
      setQuizLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#171b26] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setMode('deck')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                mode === 'deck' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Spaced Recall Deck
            </button>
            <button
              type="button"
              onClick={() => setMode('quiz')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                mode === 'quiz' ? 'bg-[#7c3aed] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Adaptive AI Quiz
            </button>
          </div>

          {mode === 'deck' && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter deck by course"
              className="px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="all">All Decks ({flashcards.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          )}
        </div>

        {mode === 'deck' && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewCard(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-sm font-medium text-white hover:bg-white/[0.12] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Card</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAiGen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Deck</span>
            </button>
          </div>
        )}
      </div>

      {mode === 'deck' ? (
        deck.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center space-y-4">
            <p className="text-base font-medium text-white">No flashcards in this deck yet</p>
            <p className="text-sm text-slate-400">
              Create your first card or let EduSphere AI synthesize active recall cards for a topic.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Card <span className="font-mono tabular-nums text-white">{index + 1}</span> of{' '}
                <span className="font-mono tabular-nums text-white">{deck.length}</span>
              </span>
              <span>
                Mastery:{' '}
                <span className="text-[#4cd7f6] font-medium">
                  {MASTERY_LABELS[currentCard.mastery]}
                </span>
              </span>
            </div>

            {/* Flashcard Stage */}
            <div className="glass-panel rounded-2xl p-8 sm:p-10 min-h-[280px] flex flex-col justify-between gap-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[#4cd7f6]">
                  {courses.find((c) => c.id === currentCard.courseId)?.code || 'Course'}
                </span>
                <span>{flipped ? 'Answer & Mechanism' : 'Recall Prompt'}</span>
              </div>

              <div className="py-4 text-center space-y-4">
                <p className="font-display text-xl sm:text-2xl font-semibold text-white leading-snug">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                {!flipped && showHint && currentCard.hint && (
                  <p className="text-sm text-[#d2bbff]">Hint: {currentCard.hint}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setShowHint(false);
                      setIndex((prev) => (prev - 1 + deck.length) % deck.length);
                    }}
                    aria-label="Previous card"
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlipped(false);
                      setShowHint(false);
                      setIndex((prev) => (prev + 1) % deck.length);
                    }}
                    aria-label="Next card"
                    className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!flipped && currentCard.hint && (
                    <button
                      type="button"
                      onClick={() => setShowHint((v) => !v)}
                      className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:brightness-110 transition-all whitespace-nowrap shrink-0"
                  >
                    {flipped ? <RotateCcw className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{flipped ? 'Show Prompt' : 'Reveal Answer'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Spaced Repetition Rating Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Again', sub: 'Reset interval', mastery: 0 as const },
                { label: 'Hard', sub: 'Review soon', mastery: 1 as const },
                { label: 'Good', sub: 'Standard gap', mastery: 2 as const },
                { label: 'Easy', sub: 'Mastered', mastery: 3 as const },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => handleRate(btn.mastery)}
                  className="glass-panel rounded-xl p-3.5 text-left hover:border-[#7c3aed]/60 transition-colors"
                >
                  <p className="text-sm font-semibold text-white">{btn.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{btn.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Adaptive AI Quiz Mode */
        <div className="max-w-3xl mx-auto space-y-6">
          <form onSubmit={handleStartQuiz} className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">
              Generate Diagnostic Practice Quiz
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={quizCourseId}
                onChange={(e) => setQuizCourseId(e.target.value)}
                aria-label="Course for quiz"
                className="px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="Topic to test (e.g. Stabilizer Codes)"
                className="sm:col-span-2 px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            {quizError && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg p-3">
                {quizError}
              </p>
            )}

            <button
              type="submit"
              disabled={quizLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50"
            >
              {quizLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{quizLoading ? 'Building Diagnostic Quiz...' : 'Generate 4-Question Quiz'}</span>
            </button>
          </form>

          {quizQuestions.length > 0 && (
            <div className="space-y-4">
              {quizQuestions.map((q, qi) => {
                const chosen = quizAnswers[qi];
                const answered = chosen !== undefined;
                return (
                  <div key={qi} className="glass-panel rounded-xl p-6 space-y-4">
                    <p className="text-sm font-semibold text-white">
                      <span className="font-mono text-[#4cd7f6] mr-2">0{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, oi) => {
                        const isChosen = chosen === oi;
                        const isCorrect = q.correctIndex === oi;
                        let style =
                          'bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.06]';
                        if (answered) {
                          if (isCorrect) {
                            style = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200';
                          } else if (isChosen) {
                            style = 'bg-rose-950/40 border-rose-500/50 text-rose-200';
                          }
                        }
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={answered}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))
                            }
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-2 ${style}`}
                          >
                            <span>{opt}</span>
                            {answered && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <p className="text-xs text-slate-300 bg-[#0a0e18]/70 border border-white/[0.06] rounded-lg p-3 leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Flashcard Generator Modal */}
      {showAiGen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAiGen(false)}
        >
          <form
            onSubmit={handleGenerateDeck}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-popover rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Generate Active Recall Deck
              </h3>
              <button
                type="button"
                onClick={() => setShowAiGen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Course</label>
              <select
                value={aiCourseId}
                onChange={(e) => setAiCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Concept or Lecture Topic</label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Activation patching and induction heads"
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              />
            </div>
            {aiError && <p className="text-xs text-rose-300">{aiError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiGen(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={aiGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium disabled:opacity-50"
              >
                {aiGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{aiGenerating ? 'Generating...' : 'Create 4 Cards'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Card Modal */}
      {showNewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowNewCard(false)}
        >
          <form
            onSubmit={handleCreateManualCard}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-popover rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">New Flashcard</h3>
              <button
                type="button"
                onClick={() => setShowNewCard(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Course</label>
              <select
                value={newCard.courseId}
                onChange={(e) => setNewCard((p) => ({ ...p, courseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prompt (Front)</label>
              <textarea
                rows={2}
                required
                value={newCard.front}
                onChange={(e) => setNewCard((p) => ({ ...p, front: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Answer (Back)</label>
              <textarea
                rows={3}
                required
                value={newCard.back}
                onChange={(e) => setNewCard((p) => ({ ...p, back: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hint (Optional)</label>
              <input
                type="text"
                value={newCard.hint}
                onChange={(e) => setNewCard((p) => ({ ...p, hint: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCard(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium"
              >
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
