import { useState, useMemo } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  MessageSquareQuote,
  Minus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Ticket,
  User,
  X,
} from 'lucide-react';
import type {
  ChatbotConfig,
  Course,
  InquiryCategory,
  InquiryPriority,
} from '../types';
import type { NavView } from './Sidebar';

interface CustomerChatWidgetProps {
  chatbots: ChatbotConfig[];
  scholar: {
    name: string;
    program: string;
  };
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
  onNavigate: (view: NavView) => void;
}

export function CustomerChatWidget({
  chatbots,
  scholar,
  courses,
  onCreateInquiry,
  onNavigate,
}: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Default active bot: prefer active bot with autoReplyToInquiries enabled
  const defaultBotId = useMemo(() => {
    const autoBot = chatbots.find((b) => b.isActive && b.autoReplyToInquiries);
    return autoBot?.id || chatbots[0]?.id || '';
  }, [chatbots]);

  const [selectedBotId, setSelectedBotId] = useState<string>(defaultBotId);

  const activeBot = useMemo(() => {
    return (
      chatbots.find((b) => b.id === selectedBotId) ||
      chatbots.find((b) => b.id === defaultBotId) ||
      chatbots[0] ||
      null
    );
  }, [chatbots, selectedBotId, defaultBotId]);

  // Messages in the floating widget
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: 'user' | 'bot'; content: string; time: string }>
  >([
    {
      id: 'init-msg',
      sender: 'bot',
      content:
        activeBot?.welcomeMessage ||
        'Hello scholar! How can I assist you with your courses, research, or student inquiries today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Convert conversation to ticket state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState<InquiryCategory>('Academic Advisory');
  const [inquiryPriority, setInquiryPriority] = useState<InquiryPriority>('medium');
  const [inquiryCourseId, setInquiryCourseId] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [ticketCreatedSuccess, setTicketCreatedSuccess] = useState(false);

  // Handle sending message to bot
  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || !activeBot) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`/api/chatbots/${activeBot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ sender: m.sender, content: m.content })),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          content: data.reply || 'Your inquiry has been checked against our academic syllabus database.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: 'bot',
          content: `Hello! I have noted your question regarding "${text}". If you need official staff evaluation, feel free to click "Convert to Support Ticket" below.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // Pre-fill and open ticket conversion form
  function handleOpenTicketModal() {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    setInquirySubject(
      lastUserMsg?.content.slice(0, 60) || 'Inquiry regarding academic coursework & platform access'
    );
    if (activeBot?.category === 'Advisory') setInquiryCategory('Academic Advisory');
    else if (activeBot?.category === 'Student Support') setInquiryCategory('Technical Support');
    else if (activeBot?.category === 'Research Mentor') setInquiryCategory('Thesis & Research');
    else setInquiryCategory('General Inquiry');

    setShowInquiryModal(true);
  }

  // Submit converted ticket
  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!inquirySubject.trim()) return;

    setIsSubmittingInquiry(true);
    try {
      const conversationTranscript = messages
        .map((m) => `${m.sender === 'user' ? 'Student' : activeBot?.name || 'Bot'}: ${m.content}`)
        .join('\n\n');

      await onCreateInquiry({
        customerName: scholar.name || 'Scholar Student',
        customerEmail: 'scholar@university.edu',
        subject: inquirySubject.trim(),
        category: inquiryCategory,
        priority: inquiryPriority,
        courseId: inquiryCourseId || undefined,
        message: `Transcript from AI Chatbot Assistant:\n\n${conversationTranscript}`,
        autoAiRespond: true,
      });

      setShowInquiryModal(false);
      setTicketCreatedSuccess(true);
      setTimeout(() => setTicketCreatedSuccess(false), 6000);
    } finally {
      setIsSubmittingInquiry(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white shadow-[0_8px_24px_rgba(124,58,237,0.45)] hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Bot className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4cd7f6]" />
            </span>
          </div>
          <span className="text-xs font-bold tracking-tight pr-1">
            Student Support & AI Chat
          </span>
        </button>
      )}

      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[550px] max-h-[85vh] rounded-2xl glass-popover border border-white/[0.12] bg-[#0c101d] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0a0e18] border-b border-white/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4cd7f6] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <select
                    value={activeBot?.id}
                    onChange={(e) => {
                      setSelectedBotId(e.target.value);
                      const chosen = chatbots.find((b) => b.id === e.target.value);
                      if (chosen) {
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `switch-${Date.now()}`,
                            sender: 'bot',
                            content: chosen.welcomeMessage || `Switched to ${chosen.name}. How can I assist you?`,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-white border-none p-0 focus:outline-none cursor-pointer truncate max-w-[170px]"
                  >
                    {chatbots.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#0b0f19] text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 pointer-events-none" />
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Responder Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('chatbots');
                  setIsOpen(false);
                }}
                title="Configure in Chatbot Studio"
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.05]"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.05]"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Success Notification if ticket was created */}
          {ticketCreatedSuccess && (
            <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate">Support inquiry ticket submitted!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate('customer-response');
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold underline shrink-0 hover:text-white"
              >
                View Tickets
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                      isBot ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                      isBot
                        ? 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-sm'
                        : 'bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span className="block text-[9px] text-slate-500 mt-1 text-right">
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#7c3aed]" />
                <span>{activeBot?.name || 'Bot'} is replying...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          {activeBot?.suggestedPrompts && activeBot.suggestedPrompts.length > 0 && (
            <div className="px-3 py-1.5 border-t border-white/[0.04] bg-[#0a0e18]/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {activeBot.suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] whitespace-nowrap shrink-0 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Escalation to Support Inquiry Desk */}
          <div className="px-3 py-1.5 bg-[#0a0e18]/80 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-purple-400" />
              Need formal staff resolution?
            </span>
            <button
              type="button"
              onClick={handleOpenTicketModal}
              className="text-[#4cd7f6] hover:underline font-semibold flex items-center gap-1"
            >
              <Ticket className="h-3 w-3" />
              Convert to Ticket
            </button>
          </div>

          {/* Input Console */}
          <div className="p-3 bg-[#0a0e18] border-t border-white/[0.08]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder={`Ask ${activeBot?.name || 'AI Assistant'}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]"
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className="absolute right-2 p-1.5 text-purple-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Conversion Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c101d] p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Convert Chat to Support Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value as InquiryCategory)}
                    className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Academic Advisory">Academic Advisory</option>
                    <option value="Course Content">Course Content</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Thesis & Research">Thesis & Research</option>
                    <option value="Billing & Account">Billing & Account</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={inquiryPriority}
                    onChange={(e) => setInquiryPriority(e.target.value as InquiryPriority)}
                    className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Course (Optional)</label>
                <select
                  value={inquiryCourseId}
                  onChange={(e) => setInquiryCourseId(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="">None / General Inquiry</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05]">
                The complete transcript with {activeBot?.name || 'the AI bot'} will be attached so support staff can resolve your request immediately.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  {isSubmittingInquiry ? 'Submitting...' : 'Confirm & Dispatch Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
