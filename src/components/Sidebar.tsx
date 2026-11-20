import {
  BookOpen,
  CalendarClock,
  Database,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { useState } from 'react';

export type NavView =
  | 'overview'
  | 'courses'
  | 'thesis'
  | 'notes'
  | 'flashcards'
  | 'planner'
  | 'focus'
  | 'copilot';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  scholar: {
    name: string;
    program: string;
    term: string;
    gpa: number;
    avatarUrl: string;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSupabaseModal?: () => void;
}

const NAV_GROUPS: Array<{
  heading: string;
  items: Array<{ id: NavView; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    heading: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'courses', label: 'Courses & Syllabi', icon: BookOpen },
      { id: 'planner', label: 'Study Planner', icon: CalendarClock },
      { id: 'focus', label: 'Focus Timer', icon: Timer },
    ],
  },
  {
    heading: 'Research & Mastery',
    items: [
      { id: 'thesis', label: 'Thesis Studio', icon: GraduationCap },
      { id: 'notes', label: 'Research Notes', icon: FileText },
      { id: 'flashcards', label: 'Active Recall', icon: Layers },
      { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
    ],
  },
];

export function Sidebar({
  activeView,
  onSelectView,
  scholar,
  mobileOpen,
  onCloseMobile,
  onOpenSupabaseModal,
}: SidebarProps) {
  const [imgError, setImgError] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col bg-[#0a0e18] border-r border-white/[0.08]">
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => {
            onSelectView('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6] text-white font-bold text-sm shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
            E
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            EduSphere AI
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7" aria-label="Primary navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-2 text-xs font-medium text-slate-400 tracking-wide">
              {group.heading}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectView(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${
                        active
                          ? 'bg-[#7c3aed]/20 text-white border border-[#7c3aed]/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-[#4cd7f6]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => {
            onOpenSupabaseModal?.();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors border border-white/5 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#3ecf8e]" />
            <span>Supabase Database</span>
          </span>
          <span className="text-[10px] text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">Setup</span>
        </button>
      </div>

      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          {scholar.avatarUrl && !imgError ? (
            <img
              src={scholar.avatarUrl}
              alt={scholar.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#3131c0] text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {scholar.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{scholar.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {scholar.term} · GPA <span className="tabular-nums text-[#4cd7f6]">{scholar.gpa.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{navContent}</aside>
        </div>
      )}
    </>
  );
}
