import { useEffect, useState } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { CopilotView } from './components/CopilotView';
import { CoursesView } from './components/CoursesView';
import { FlashcardsView } from './components/FlashcardsView';
import { FocusView } from './components/FocusView';
import { NotesView } from './components/NotesView';
import { OverviewView } from './components/OverviewView';
import { PlannerView } from './components/PlannerView';
import { Sidebar, type NavView } from './components/Sidebar';
import { ThesisView } from './components/ThesisView';
import { TopBar } from './components/TopBar';
import { SupabaseModal } from './components/SupabaseModal';
import { api, type SupabaseStatus } from './lib/api';
import type {
  Course,
  Flashcard,
  ResearchNote,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
  WorkspaceSnapshot,
} from './types';

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined);
  const [copilotNoteContext, setCopilotNoteContext] = useState<ResearchNote | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  async function loadWorkspace() {
    setLoading(true);
    setError('');
    try {
      const [data, sStatus] = await Promise.all([
        api.getWorkspace(),
        api.getSupabaseStatus().catch(() => null),
      ]);
      setWorkspace(data);
      if (sStatus) setSupabaseStatus(sStatus);
    } catch (err: any) {
      setError(err.message || 'Unable to load EduSphere AI workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function navigateTo(view: NavView, itemId?: string) {
    setActiveView(view);
    if (view === 'courses') {
      setSelectedCourseId(itemId);
    } else if (view === 'notes' || view === 'flashcards') {
      setSelectedCourseId(itemId);
    }
  }

  async function handleToggleTask(task: StudyTask) {
    const nextStatus: StudyTask['status'] = task.status === 'done' ? 'todo' : 'done';
    const updated = await api.saveTask({ ...task, status: nextStatus });
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
          }
        : prev
    );
  }

  async function handleQuickAddTask(title: string, courseId: string) {
    const created = await api.saveTask({
      title,
      courseId,
      type: 'Assignment',
      dueDate: '2026-11-26',
      estimatedMinutes: 60,
      priority: 'medium',
      status: 'todo',
    });
    setWorkspace((prev) =>
      prev ? { ...prev, tasks: [created, ...prev.tasks] } : prev
    );
  }

  async function handleSaveTask(payload: Partial<StudyTask>) {
    const saved = await api.saveTask(payload);
    setWorkspace((prev) => {
      if (!prev) return prev;
      const exists = prev.tasks.some((t) => t.id === saved.id);
      return {
        ...prev,
        tasks: exists
          ? prev.tasks.map((t) => (t.id === saved.id ? saved : t))
          : [saved, ...prev.tasks],
      };
    });
  }

  async function handleDeleteTask(id: string) {
    await api.deleteTask(id);
    setWorkspace((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) } : prev
    );
  }

  async function handleCreateCourse(payload: Partial<Course>) {
    const created = await api.createCourse(payload);
    setWorkspace((prev) =>
      prev ? { ...prev, courses: [created, ...prev.courses] } : prev
    );
  }

  async function handleToggleModule(courseId: string, moduleId: string, completed: boolean) {
    const updated = await api.toggleModule(courseId, moduleId, completed);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            courses: prev.courses.map((c) =>
              c.id === courseId
                ? {
                    ...c,
                    modules: c.modules.map((m) => (m.id === moduleId ? updated : m)),
                  }
                : c
            ),
          }
        : prev
    );
  }

  async function handleAddModule(courseId: string, payload: Partial<SyllabusModule>) {
    const created = await api.addModule(courseId, payload);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            courses: prev.courses.map((c) =>
              c.id === courseId
                ? {
                    ...c,
                    modules: [...c.modules, created].sort((a, b) => a.week - b.week),
                  }
                : c
            ),
          }
        : prev
    );
  }

  async function handleSaveNote(payload: Partial<ResearchNote>) {
    const saved = await api.saveNote(payload);
    setWorkspace((prev) => {
      if (!prev) return prev;
      const exists = prev.notes.some((n) => n.id === saved.id);
      return {
        ...prev,
        notes: exists
          ? prev.notes.map((n) => (n.id === saved.id ? saved : n))
          : [saved, ...prev.notes],
      };
    });
  }

  async function handleDeleteNote(id: string) {
    await api.deleteNote(id);
    setWorkspace((prev) =>
      prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== id) } : prev
    );
  }

  async function handleRateCard(cardId: string, mastery: 0 | 1 | 2 | 3) {
    const updated = await api.rateFlashcard(cardId, mastery);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            flashcards: prev.flashcards.map((f) => (f.id === updated.id ? updated : f)),
          }
        : prev
    );
  }

  async function handleCreateCard(payload: Partial<Flashcard>) {
    const created = await api.createFlashcard(payload);
    setWorkspace((prev) =>
      prev ? { ...prev, flashcards: [created, ...prev.flashcards] } : prev
    );
  }

  function handleGeneratedCards(cards: Flashcard[]) {
    setWorkspace((prev) =>
      prev ? { ...prev, flashcards: [...cards, ...prev.flashcards] } : prev
    );
  }

  async function handleSaveChapter(chapter: ThesisChapter) {
    const saved = await api.saveChapter(chapter);
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            thesisChapters: prev.thesisChapters.map((ch) =>
              ch.id === saved.id ? saved : ch
            ),
          }
        : prev
    );
  }

  async function handleCompleteSession(payload: {
    courseId: string;
    durationMinutes: number;
    focusTopic: string;
  }) {
    const saved = await api.recordSession(payload);
    setWorkspace((prev) =>
      prev ? { ...prev, sessions: [saved, ...prev.sessions] } : prev
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="h-10 w-10 mx-auto rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6] flex items-center justify-center font-bold text-white">
            E
          </div>
          <p className="text-sm text-slate-300">Loading EduSphere AI workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <h1 className="font-display text-xl font-semibold text-white">
            Unable to load workspace
          </h1>
          <p className="text-sm text-slate-400">{error || 'An unexpected error occurred.'}</p>
          <button
            type="button"
            onClick={loadWorkspace}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeCourseSubtitle =
    activeView === 'courses' && selectedCourseId
      ? workspace.courses.find((c) => c.id === selectedCourseId)?.code
      : undefined;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#dfe2f1] flex">
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => {
          setSelectedCourseId(undefined);
          setActiveView(v);
        }}
        scholar={workspace.scholar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeView={activeView}
          subTitle={activeCourseSubtitle}
          supabaseStatus={supabaseStatus}
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenCopilot={() => {
            setCopilotNoteContext(undefined);
            setActiveView('copilot');
          }}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activeView === 'overview' && (
            <OverviewView
              workspace={workspace}
              onNavigate={navigateTo}
              onToggleTask={handleToggleTask}
              onQuickAddTask={handleQuickAddTask}
            />
          )}

          {activeView === 'courses' && (
            <CoursesView
              courses={workspace.courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
              onToggleModule={handleToggleModule}
              onAddModule={handleAddModule}
              onCreateCourse={handleCreateCourse}
              onJumpToView={navigateTo}
            />
          )}

          {activeView === 'thesis' && (
            <ThesisView
              thesisTitle={workspace.scholar.thesisTitle}
              chapters={workspace.thesisChapters}
              onSaveChapter={handleSaveChapter}
            />
          )}

          {activeView === 'notes' && (
            <NotesView
              notes={workspace.notes}
              courses={workspace.courses}
              initialCourseFilter={selectedCourseId}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onAskCopilotAboutNote={(note) => {
                setCopilotNoteContext(note);
                setActiveView('copilot');
              }}
            />
          )}

          {activeView === 'flashcards' && (
            <FlashcardsView
              flashcards={workspace.flashcards}
              courses={workspace.courses}
              initialCourseFilter={selectedCourseId}
              onRateCard={handleRateCard}
              onCreateCard={handleCreateCard}
              onGeneratedCards={handleGeneratedCards}
            />
          )}

          {activeView === 'planner' && (
            <PlannerView
              tasks={workspace.tasks}
              courses={workspace.courses}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeView === 'focus' && (
            <FocusView
              courses={workspace.courses}
              sessions={workspace.sessions}
              onCompleteSession={handleCompleteSession}
            />
          )}

          {activeView === 'copilot' && (
            <CopilotView
              courses={workspace.courses}
              notes={workspace.notes}
              initialContextNote={copilotNoteContext}
              onSaveResponseAsNote={handleSaveNote}
            />
          )}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        workspace={workspace}
        onNavigate={navigateTo}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        status={supabaseStatus}
        onStatusUpdated={(s) => {
          setSupabaseStatus(s);
          if (s.connected) {
            loadWorkspace();
          }
        }}
      />
    </div>
  );
}
