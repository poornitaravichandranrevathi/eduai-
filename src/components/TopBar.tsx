import { Menu, Search, Sparkles } from 'lucide-react';
import type { NavView } from './Sidebar';

const VIEW_TITLES: Record<NavView, string> = {
  overview: 'Academic Overview',
  courses: 'Courses & Syllabi',
  thesis: 'Thesis Studio',
  notes: 'Research Notes',
  flashcards: 'Active Recall',
  planner: 'Study Planner',
  focus: 'Focus Timer',
  copilot: 'AI Copilot',
};

interface TopBarProps {
  activeView: NavView;
  subTitle?: string;
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
  onOpenCopilot: () => void;
}

export function TopBar({
  activeView,
  subTitle,
  onOpenMobileNav,
  onOpenCommand,
  onOpenCopilot,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0b0f19]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between gap-8">
      {/* Zone 1: Breadcrumb / Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.05]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 hidden sm:inline whitespace-nowrap shrink-0">
            EduSphere AI
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-white truncate">
            {VIEW_TITLES[activeView]}
          </h1>
          {subTitle && (
            <>
              <span className="text-slate-600 hidden md:inline" aria-hidden="true">
                /
              </span>
              <span className="text-slate-300 truncate hidden md:inline">{subTitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Quick Search Trigger */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="hidden sm:flex items-center justify-between gap-6 w-64 md:w-80 px-3.5 py-2 rounded-lg bg-[#0f172a]/70 border border-white/10 text-sm text-slate-400 hover:border-[#7c3aed]/60 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] whitespace-nowrap shrink-0"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">Search courses, notes, cards...</span>
        </span>
        <kbd className="font-mono text-xs text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search workspace"
          className="sm:hidden p-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenCopilot}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-medium shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cd7f6]"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Ask Copilot</span>
        </button>
      </div>
    </header>
  );
}
