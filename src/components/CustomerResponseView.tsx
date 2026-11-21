import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  MessageSquare,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type {
  Course,
  CustomerInquiry,
  InquiryCategory,
  InquiryPriority,
  InquiryStatus,
} from '../types';

interface CustomerResponseViewProps {
  inquiries: CustomerInquiry[];
  courses: Course[];
  onCreateInquiry: (payload: {
    customerName: string;
    customerEmail: string;
    subject: string;
    category: InquiryCategory;
    priority: InquiryPriority;
    courseId?: string;
    message: string;
    autoAiRespond?: boolean;
  }) => Promise<void>;
  onReplyInquiry: (
    id: string,
    payload: {
      sender?: 'customer' | 'support_agent';
      senderName?: string;
      content: string;
      newStatus?: InquiryStatus;
    }
  ) => Promise<void>;
  onUpdateStatus: (id: string, status: InquiryStatus) => Promise<void>;
  onRateInquiry: (id: string, rating: number, feedback?: string) => Promise<void>;
  onDeleteInquiry: (id: string) => Promise<void>;
  onNavigateToChatbotStudio?: () => void;
}

const CANNED_RESPONSES = [
  {
    title: 'Syllabus & Grading Policy',
    text: 'Thank you for reaching out. Please refer to Section 3 of the course syllabus for detailed guidelines on assignments, grading rubrics, and deadlines. If you require an extension for medical reasons, please submit an official accommodation form.',
  },
  {
    title: 'Office Hours & Consultations',
    text: 'Faculty and teaching assistants hold weekly office hours on Tuesdays and Thursdays at 2:00 PM EST. You can reserve a 1:1 consultation slot directly via your course dashboard.',
  },
  {
    title: 'Platform & Sync Troubleshooting',
    text: 'We have verified your workspace state. Please reload the application, verify your Supabase cloud synchronization status, and clear your browser cache if changes do not reflect immediately.',
  },
  {
    title: 'Faculty Escalation',
    text: 'This inquiry has been forwarded directly to the department instructor for personalized academic evaluation. You will receive an update within 24 to 48 business hours.',
  },
];

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  responded: {
    label: 'Responded',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

const PRIORITY_BADGES: Record<InquiryPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  high: { label: 'High', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
};

const ALL_CATEGORIES: InquiryCategory[] = [
  'Academic Advisory',
  'Course Content',
  'Technical Support',
  'Thesis & Research',
  'Billing & Account',
  'General Inquiry',
];

export function CustomerResponseView({
  inquiries,
  courses,
  onCreateInquiry,
  onReplyInquiry,
  onUpdateStatus,
  onRateInquiry,
  onDeleteInquiry,
  onNavigateToChatbotStudio,
}: CustomerResponseViewProps) {
  const [selectedId, setSelectedId] = useState<string>(inquiries[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | InquiryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply form states
  const [replyContent, setReplyContent] = useState('');
  const [senderName, setSenderName] = useState('EduSphere Academic Support');
  const [replyAutoResolve, setReplyAutoResolve] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // New ticket modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    customerName: string;
    customerEmail: string;
    subject: string;
    category: InquiryCategory;
    priority: InquiryPriority;
    courseId: string;
    message: string;
    autoAiRespond: boolean;
  }>({
    customerName: '',
    customerEmail: '',
    subject: '',
    category: 'Academic Advisory',
    priority: 'medium',
    courseId: '',
    message: '',
    autoAiRespond: true,
  });

  // User feedback state for the active ticket
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Filtered inquiries list
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && inq.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = inq.subject.toLowerCase().includes(q);
        const matchesName = inq.customerName.toLowerCase().includes(q);
        const matchesEmail = inq.customerEmail.toLowerCase().includes(q);
        const matchesContent = inq.messages.some((m) => m.content.toLowerCase().includes(q));
        if (!matchesSubject && !matchesName && !matchesEmail && !matchesContent) return false;
      }
      return true;
    });
  }, [inquiries, statusFilter, categoryFilter, searchQuery]);

  // Selected inquiry
  const activeInquiry = useMemo(() => {
    return (
      inquiries.find((i) => i.id === selectedId) ||
      filteredInquiries[0] ||
      inquiries[0] ||
      null
    );
  }, [inquiries, filteredInquiries, selectedId]);

  // Statistics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const pending = inquiries.filter((i) => i.status === 'pending').length;
    const resolved = inquiries.filter((i) => i.status === 'resolved').length;
    const rated = inquiries.filter((i) => typeof i.satisfactionRating === 'number');
    const avgCsat =
      rated.length > 0
        ? (
            rated.reduce((acc, i) => acc + (i.satisfactionRating || 5), 0) / rated.length
          ).toFixed(1)
        : '4.9';

    return { total, pending, resolved, avgCsat };
  }, [inquiries]);

  // Submit reply
  async function handleSendReply() {
    if (!activeInquiry || !replyContent.trim()) return;
    setIsReplying(true);
    try {
      await onReplyInquiry(activeInquiry.id, {
        sender: 'support_agent',
        senderName: senderName.trim() || 'EduSphere Academic Support',
        content: replyContent.trim(),
        newStatus: replyAutoResolve ? 'resolved' : 'responded',
      });
      setReplyContent('');
    } finally {
      setIsReplying(false);
    }
  }

  // Create new ticket
  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (
      !formData.customerName.trim() ||
      !formData.customerEmail.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateInquiry({
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        subject: formData.subject.trim(),
        category: formData.category,
        priority: formData.priority,
        courseId: formData.courseId || undefined,
        message: formData.message.trim(),
        autoAiRespond: formData.autoAiRespond,
      });
      setIsModalOpen(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        subject: '',
        category: 'Academic Advisory',
        priority: 'medium',
        courseId: '',
        message: '',
        autoAiRespond: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Rate active inquiry
  async function handleRate(score: number) {
    if (!activeInquiry) return;
    setIsSubmittingFeedback(true);
    try {
      await onRateInquiry(activeInquiry.id, score, feedbackInput.trim() || undefined);
      setFeedbackInput('');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <MessageSquareQuote className="h-6 w-6 text-[#7c3aed]" />
            Student Inquiries & Customer Response
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Resolve student questions, dispatch AI-suggested responses, track ticket lifecycles, and monitor CSAT ratings.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {onNavigateToChatbotStudio && (
            <button
              type="button"
              onClick={onNavigateToChatbotStudio}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.08] transition-colors"
            >
              <Bot className="h-4 w-4 text-[#4cd7f6]" />
              Chatbot Auto-Responders
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Student Inquiry
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Inquiries</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Awaiting Response</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.resolved}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Star className="h-5 w-5 fill-sky-400 text-sky-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">CSAT Score</p>
            <p className="text-xl font-bold text-sky-300 mt-0.5">{stats.avgCsat} / 5.0</p>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Inquiries Queue + Active Response Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Filterable Ticket Queue (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden">
          {/* Queue Filters */}
          <div className="p-4 border-b border-white/[0.08] space-y-3 bg-[#0a0e18]/60">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets, student, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs & Category Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {(['all', 'pending', 'in_progress', 'responded', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                      statusFilter === st
                        ? 'bg-[#7c3aed] text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    {st === 'all' ? 'All' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                aria-label="Filter inquiries by category"
                className="bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 rounded-md px-2 py-1 focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="all" className="bg-[#0b0f19]">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0b0f19]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">No inquiries matching filter criteria</p>
                <p className="text-xs text-slate-500 mt-1">Try switching filters or submit a new inquiry.</p>
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = activeInquiry?.id === inq.id;
                const statusInfo = STATUS_CONFIG[inq.status];
                const priorityInfo = PRIORITY_BADGES[inq.priority];
                const lastMsg = inq.messages[inq.messages.length - 1];

                return (
                  <button
                    key={inq.id}
                    type="button"
                    onClick={() => setSelectedId(inq.id)}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-purple-950/30 border-l-4 border-l-[#7c3aed]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-white line-clamp-1">
                        {inq.subject}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {lastMsg ? lastMsg.content : inq.subject}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-300">{inq.customerName}</span>
                        <span>·</span>
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] ${priorityInfo.color}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <MessageSquare className="h-3 w-3" />
                        {inq.messages.length}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Ticket Thread & Response Desk (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden">
          {activeInquiry ? (
            <>
              {/* Ticket Header & Status Switcher */}
              <div className="p-5 border-b border-white/[0.08] bg-[#0a0e18]/80 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        #{activeInquiry.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {activeInquiry.category}
                      </span>
                      {activeInquiry.courseId && (
                        <span className="text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {courses.find((c) => c.id === activeInquiry.courseId)?.code ||
                            activeInquiry.courseId}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {activeInquiry.subject}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted by{' '}
                      <span className="text-slate-200 font-medium">{activeInquiry.customerName}</span>{' '}
                      ({activeInquiry.customerEmail}) ·{' '}
                      {new Date(activeInquiry.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={activeInquiry.status}
                      onChange={(e) => onUpdateStatus(activeInquiry.id, e.target.value as InquiryStatus)}
                      aria-label="Change inquiry status"
                      className="bg-white/[0.05] border border-white/[0.1] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="pending" className="bg-[#0b0f19]">Pending</option>
                      <option value="in_progress" className="bg-[#0b0f19]">In Progress</option>
                      <option value="responded" className="bg-[#0b0f19]">Responded</option>
                      <option value="resolved" className="bg-[#0b0f19]">Resolved</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this inquiry ticket?')) {
                          onDeleteInquiry(activeInquiry.id);
                        }
                      }}
                      title="Delete ticket"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {activeInquiry.messages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        isCustomer ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCustomer
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6] text-white shadow-md'
                        }`}
                      >
                        {isCustomer ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                          isCustomer
                            ? 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-sm'
                            : 'bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border border-purple-500/30 text-white rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-xs">
                          <span className="font-semibold text-slate-300">
                            {msg.senderName}
                            {!isCustomer && (
                              <span className="ml-1.5 text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-normal">
                                Support Agent
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}

                {/* AI Assistant Suggested Draft Banner */}
                {activeInquiry.aiSuggestedResponse && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                        <Sparkles className="h-4 w-4 text-[#4cd7f6]" />
                        EduSphere AI Suggested Resolution
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyContent(activeInquiry.aiSuggestedResponse || '')}
                        className="text-xs font-semibold text-[#4cd7f6] hover:underline flex items-center gap-1"
                      >
                        Insert as Reply
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-black/20 p-3 rounded-lg border border-white/[0.05]">
                      &quot;{activeInquiry.aiSuggestedResponse}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Response Workspace / Editor */}
              <div className="p-4 border-t border-white/[0.08] bg-[#0a0e18]/90 space-y-3">
                {/* Canned Templates Quick Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase shrink-0">
                    Canned Replies:
                  </span>
                  {CANNED_RESPONSES.map((t) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => setReplyContent(t.text)}
                      className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] whitespace-nowrap text-xs transition-colors shrink-0"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>

                {/* Reply Textarea & Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Responding as (e.g. Lead Instructor, Support Staff)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={replyAutoResolve}
                        onChange={(e) => setReplyAutoResolve(e.target.checked)}
                        className="rounded border-slate-700 text-[#7c3aed] focus:ring-0 bg-slate-900"
                      />
                      Mark as Resolved
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Draft personalized response to student..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed] resize-none"
                    />
                    <button
                      type="button"
                      disabled={isReplying || !replyContent.trim()}
                      onClick={handleSendReply}
                      className="absolute right-3 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-xs font-semibold hover:opacity-95 disabled:opacity-40 transition-opacity"
                    >
                      {isReplying ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send Response
                    </button>
                  </div>
                </div>

                {/* CSAT Satisfaction Widget */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Student Satisfaction (CSAT):</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeVal =
                          ratingHover ?? activeInquiry.satisfactionRating ?? 0;
                        const filled = star <= activeVal;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setRatingHover(star)}
                            onMouseLeave={() => setRatingHover(null)}
                            onClick={() => handleRate(star)}
                            disabled={isSubmittingFeedback}
                            className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                filled ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {activeInquiry.satisfactionRating && (
                      <span className="text-emerald-400 font-semibold ml-1">
                        Rated {activeInquiry.satisfactionRating}/5
                      </span>
                    )}
                  </div>

                  {activeInquiry.customerFeedback && (
                    <span className="text-slate-400 italic line-clamp-1 max-w-[200px]">
                      &quot;{activeInquiry.customerFeedback}&quot;
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquareQuote className="h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Inquiry Selected</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Choose an inquiry from the queue or click &quot;New Student Inquiry&quot; to initiate a ticket.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0c101d] p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  +
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Submit Student Inquiry
                  </h3>
                  <p className="text-xs text-slate-400">
                    Creates an academic support ticket with AI auto-resolution assist.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sophia Turner"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Inquiry Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request for CS-8803 Assignment Extension"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as InquiryCategory,
                      })
                    }
                    className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as InquiryPriority,
                      })
                    }
                    className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Related Course
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="">None / General</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your inquiry, question, or request in detail..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#7c3aed] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="autoAiRespond"
                  checked={formData.autoAiRespond}
                  onChange={(e) =>
                    setFormData({ ...formData, autoAiRespond: e.target.checked })
                  }
                  className="rounded border-slate-700 text-[#7c3aed] focus:ring-0 bg-slate-900"
                />
                <label
                  htmlFor="autoAiRespond"
                  className="text-xs text-purple-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#4cd7f6]" />
                  Auto-generate AI suggested response using syllabus context
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
