import { BookOpen, Bot, FileText, Layers, Search, CheckSquare, MessageSquareQuote, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WorkspaceSnapshot } from '../types';
import type { NavView } from './Sidebar';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  workspace: WorkspaceSnapshot;
  onNavigate: (view: NavView, itemId?: string) => void;
}

export function CommandPalette({ open, onClose, workspace, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: Array<{
      id: string;
      kind: 'Course' | 'Note' | 'Flashcard' | 'Task' | 'Inquiry' | 'Chatbot';
      title: string;
      subtitle: string;
      view: NavView;
      targetId?: string;
    }> = [];

    for (const c of workspace.courses) {
      if (!q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) {
        items.push({
          id: `c-${c.id}`,
          kind: 'Course',
          title: `${c.code} — ${c.title}`,
          subtitle: `${c.instructor} · ${c.term}`,
          view: 'courses',
          targetId: c.id,
        });
      }
    }

    for (const n of workspace.notes) {
      if (
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        items.push({
          id: `n-${n.id}`,
          kind: 'Note',
          title: n.title,
          subtitle: `${n.authors} · ${n.year}`,
          view: 'notes',
          targetId: n.id,
        });
      }
    }

    for (const f of workspace.flashcards) {
      if (!q || f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q)) {
        items.push({
          id: `f-${f.id}`,
          kind: 'Flashcard',
          title: f.front,
          subtitle: f.hint || 'Active recall card',
          view: 'flashcards',
          targetId: f.courseId,
        });
      }
    }

    for (const t of workspace.tasks) {
      if (!q || t.title.toLowerCase().includes(q)) {
        items.push({
          id: `t-${t.id}`,
          kind: 'Task',
          title: t.title,
          subtitle: `Due ${t.dueDate} · ${t.type}`,
          view: 'planner',
        });
      }
    }

    if (workspace.inquiries) {
      for (const inq of workspace.inquiries) {
        if (
          !q ||
          inq.subject.toLowerCase().includes(q) ||
          inq.customerName.toLowerCase().includes(q) ||
          inq.category.toLowerCase().includes(q) ||
          inq.messages.some((m) => m.content.toLowerCase().includes(q))
        ) {
          items.push({
            id: `inq-${inq.id}`,
            kind: 'Inquiry',
            title: inq.subject,
            subtitle: `${inq.customerName} · ${inq.category.replace('_', ' ')} · ${inq.status}`,
            view: 'customer-response' as NavView,
          });
        }
      }
    }

    if (workspace.chatbots) {
      for (const bot of workspace.chatbots) {
        if (
          !q ||
          bot.name.toLowerCase().includes(q) ||
          bot.description.toLowerCase().includes(q) ||
          bot.category.toLowerCase().includes(q)
        ) {
          items.push({
            id: `bot-${bot.id}`,
            kind: 'Chatbot',
            title: bot.name,
            subtitle: `${bot.category} · ${bot.model} · ${bot.autoReplyToInquiries ? 'Auto-Responder' : 'Assistant'}`,
            view: 'chatbots',
            targetId: bot.id,
          });
        }
      }
    }

    return items.slice(0, 12);
  }, [query, workspace]);

  if (!open) return null;

  const iconFor = (kind: string) => {
    switch (kind) {
      case 'Course':
        return <BookOpen className="h-4 w-4 text-[#4cd7f6]" />;
      case 'Note':
        return <FileText className="h-4 w-4 text-[#d2bbff]" />;
      case 'Flashcard':
        return <Layers className="h-4 w-4 text-[#c0c1ff]" />;
      case 'Inquiry':
        return <MessageSquareQuote className="h-4 w-4 text-purple-400" />;
      case 'Chatbot':
        return <Bot className="h-4 w-4 text-[#4cd7f6]" />;
      default:
        return <CheckSquare className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl glass-popover overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to any course, citation note, flashcard, or deliverable..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.05]">
          {results.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching academic items found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.view, item.targetId);
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0">{iconFor(item.kind)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">{item.kind}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
