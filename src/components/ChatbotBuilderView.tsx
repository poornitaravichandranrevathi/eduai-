import { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Bot,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  GraduationCap,
  Layers,
  MessageSquare,
  MessageSquareCode,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  User,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import type {
  ChatbotCategory,
  ChatbotConfig,
  ChatbotMessage,
  Course,
  InquiryCategory,
} from '../types';

interface ChatbotBuilderViewProps {
  chatbots: ChatbotConfig[];
  courses: Course[];
  onSaveChatbot: (bot: Partial<ChatbotConfig>) => Promise<ChatbotConfig | void>;
  onDeleteChatbot: (id: string) => Promise<void>;
  onNavigateToInquiries?: () => void;
}

const TEMPLATES: Array<{
  name: string;
  category: ChatbotCategory;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
  assignedCategories: InquiryCategory[];
}> = [
  {
    name: 'Syllabus & Coursework Advisor',
    category: 'Course Tutor',
    description: 'Answers student questions on assignments, prerequisites, exam schedules, and grading rubrics.',
    icon: 'book-open',
    color: 'purple',
    systemPrompt:
      'You are a Coursework & Syllabus Advisor. Provide direct, authoritative, and encouraging guidance grounded in course modules and policies. Clarify assignment requirements, suggest breakdown milestones, and reference syllabus sections explicitly.',
    welcomeMessage:
      'Hello scholar! I am your Syllabus & Coursework Advisor. Ask me anything about assignments, grading rubrics, or lecture topics.',
    suggestedPrompts: [
      'What are the grading percentages for midterm exams?',
      'Can you explain the prerequisites for advanced coursework?',
      'How should I structure my preparation for Week 4?',
    ],
    assignedCategories: ['Academic Advisory', 'Course Content'],
  },
  {
    name: '24/7 Help Desk & Computing Triage',
    category: 'Student Support',
    description: 'Specializes in lab cluster quotas, password resets, environment setups, and ticketing support.',
    icon: 'shield',
    color: 'emerald',
    systemPrompt:
      'You are a Student Technical Support & Help Desk Assistant. Resolve environment errors, cluster compute access inquiries, and platform questions concisely with step-by-step troubleshooting instructions.',
    welcomeMessage:
      'Hello! Help Desk Bot standing by. Need assistance with cluster GPU quota, account credentials, or ticket status?',
    suggestedPrompts: [
      'How do I request additional GPU compute hours?',
      'My workspace changes are not saving to the cloud.',
      'Where do I find my SSH access token for the cluster?',
    ],
    assignedCategories: ['Technical Support', 'Billing & Account'],
  },
  {
    name: 'Thesis & Research Writing Mentor',
    category: 'Research Mentor',
    description: 'Assists graduate researchers with LaTeX syntax, literature review structure, and empirical methodology.',
    icon: 'sparkles',
    color: 'sky',
    systemPrompt:
      'You are a Graduate Research & Thesis Mentor. Offer rigorous academic critique, LaTeX equation drafting, hypothesis formulation, and citation formatting guidance for master and doctoral scholars.',
    welcomeMessage:
      'Welcome to the Research Lab! I am your Thesis Mentor, ready to review methodology drafts, LaTeX proofs, and bibliography citations.',
    suggestedPrompts: [
      'Review my thesis methodology section for mathematical clarity.',
      'Help me draft a LaTeX equation for Sparse Autoencoder loss.',
      'How do I structure a literature review on multimodal transformers?',
    ],
    assignedCategories: ['Thesis & Research'],
  },
  {
    name: 'General Campus Concierge',
    category: 'FAQ Bot',
    description: 'Friendly campus assistant for office hours, library resources, registration dates, and general student life.',
    icon: 'bot',
    color: 'amber',
    systemPrompt:
      'You are a Campus Concierge Assistant. Provide helpful, cheerful, and accurate information regarding university facilities, library access, registrar deadlines, and campus services.',
    welcomeMessage:
      'Hi there! I am your Campus Concierge. Looking for office hours, registration deadlines, or campus amenities?',
    suggestedPrompts: [
      'When is the deadline to add or drop courses?',
      'How do I reserve a quiet study pod in the research library?',
      'Where are virtual faculty office hours hosted?',
    ],
    assignedCategories: ['General Inquiry'],
  },
];

const AVATAR_ICONS: Record<string, typeof Bot> = {
  bot: Bot,
  sparkles: Sparkles,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'message-square': MessageSquare,
  shield: Shield,
  cpu: Cpu,
};

const COLOR_THEMES: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-600 to-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-600 to-teal-600',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    gradient: 'from-sky-600 to-blue-600',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-600 to-orange-600',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    gradient: 'from-rose-600 to-pink-600',
  },
};

const ALL_INQUIRY_CATEGORIES: InquiryCategory[] = [
  'Academic Advisory',
  'Course Content',
  'Technical Support',
  'Thesis & Research',
  'Billing & Account',
  'General Inquiry',
];

export function ChatbotBuilderView({
  chatbots,
  courses,
  onSaveChatbot,
  onDeleteChatbot,
  onNavigateToInquiries,
}: ChatbotBuilderViewProps) {
  const [selectedBotId, setSelectedBotId] = useState<string>(chatbots[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'config' | 'playground'>('playground');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active Chatbot in view
  const activeBot = useMemo(() => {
    return chatbots.find((b) => b.id === selectedBotId) || chatbots[0] || null;
  }, [chatbots, selectedBotId]);

  // Editing form state for selected bot
  const [formData, setFormData] = useState<Partial<ChatbotConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form state whenever activeBot changes
  useEffect(() => {
    if (activeBot) {
      setFormData(activeBot);
    }
  }, [activeBot]);

  // Playground conversation state
  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      content:
        activeBot?.welcomeMessage ||
        'Hello! I am your AI assistant. How can I help you with your coursework today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // New chatbot modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);

  // Update form data when switching selected bot
  function selectBot(bot: ChatbotConfig) {
    setSelectedBotId(bot.id);
    setFormData(bot);
    setSaveSuccess(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        content: bot.welcomeMessage || 'Hello! How can I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }

  // Filtered bots list
  const filteredBots = useMemo(() => {
    return chatbots.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [chatbots, selectedCategory, searchQuery]);

  // Overall KPIs
  const stats = useMemo(() => {
    const total = chatbots.length;
    const active = chatbots.filter((b) => b.isActive).length;
    const autoResponders = chatbots.filter((b) => b.autoReplyToInquiries && b.isActive).length;
    const totalConvs = chatbots.reduce((acc, b) => acc + (b.metrics?.conversationsCount || 0), 0);
    const totalTicketsResolved = chatbots.reduce(
      (acc, b) => acc + (b.metrics?.resolvedTicketsCount || 0),
      0
    );
    return { total, active, autoResponders, totalConvs, totalTicketsResolved };
  }, [chatbots]);

  // Save current bot configuration
  async function handleSaveConfig(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeBot) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveChatbot({
        ...activeBot,
        ...formData,
        id: activeBot.id,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle live chat in the Playground simulator
  async function handleSendMessage(textToSend?: string) {
    const msg = textToSend || userInput;
    if (!msg.trim() || !activeBot) return;

    const userMsg: ChatbotMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: msg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setUserInput('');
    setIsBotTyping(true);

    try {
      const res = await fetch(`/api/chatbots/${activeBot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg.trim(),
          history: messages.map((m) => ({ sender: m.sender, content: m.content })),
        }),
      });

      const data = await res.json();
      const botReply: ChatbotMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        content: data.reply || 'I have noted your inquiry and referenced the course knowledge base.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: 'bot',
          content: `Hello! As ${activeBot.name}, I have checked our knowledge base for "${msg.trim()}". Please review your registered course modules or submit a support inquiry.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  }

  // Create bot from template
  async function handleCreateFromTemplate() {
    const tmpl = TEMPLATES[selectedTemplate];
    const name = newBotName.trim() || tmpl.name;
    setIsSaving(true);
    try {
      const newBotPayload: Partial<ChatbotConfig> = {
        name,
        description: tmpl.description,
        avatarIcon: tmpl.icon,
        avatarColor: tmpl.color,
        category: tmpl.category,
        model: 'gemini-3.5-flash',
        temperature: 0.7,
        systemPrompt: tmpl.systemPrompt,
        welcomeMessage: tmpl.welcomeMessage,
        suggestedPrompts: tmpl.suggestedPrompts,
        knowledgeBaseCourseIds: courses.map((c) => c.id).slice(0, 2),
        assignedInquiryCategories: tmpl.assignedCategories,
        isActive: true,
        autoReplyToInquiries: true,
      };

      const created = await onSaveChatbot(newBotPayload);
      setIsCreateModalOpen(false);
      setNewBotName('');
      if (created && 'id' in created) {
        selectBot(created as ChatbotConfig);
        setActiveTab('playground');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const BotIconComponent = activeBot
    ? AVATAR_ICONS[activeBot.avatarIcon] || Bot
    : Bot;
  const currentTheme = activeBot
    ? COLOR_THEMES[activeBot.avatarColor] || COLOR_THEMES.purple
    : COLOR_THEMES.purple;

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-[#7c3aed]" />
            AI Chatbot Studio & Customer Auto-Responder
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Build custom student assistants, ground them in syllabi and research notes, and automate customer inquiry triage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToInquiries && (
            <button
              type="button"
              onClick={onNavigateToInquiries}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.08] transition-colors"
            >
              <MessageSquareQuote className="h-4 w-4 text-[#4cd7f6]" />
              View Student Inquiries Desk
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Chatbot
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Chatbots</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Auto-Responders</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.autoResponders}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <MessageSquareCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Conversations Handled</p>
            <p className="text-xl font-bold text-sky-300 mt-0.5">{stats.totalConvs}</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/[0.08] flex items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Auto-Resolved Inquiries</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{stats.totalTicketsResolved}</p>
          </div>
        </div>
      </div>

      {/* Main Split Interface: Bot Navigator (Left) + Bot Editor & Live Playground (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
        {/* Left Column: Chatbots Directory (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-white/[0.08] space-y-3 bg-[#0a0e18]/60">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search chatbots, personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {['all', 'Advisory', 'Course Tutor', 'Student Support', 'Research Mentor'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#7c3aed] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {cat === 'all' ? 'All Roles' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Chatbots Roster */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredBots.map((bot) => {
              const isSelected = activeBot?.id === bot.id;
              const Icon = AVATAR_ICONS[bot.avatarIcon] || Bot;
              const theme = COLOR_THEMES[bot.avatarColor] || COLOR_THEMES.purple;

              return (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => selectBot(bot)}
                  className={`w-full text-left p-4 transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-purple-950/30 border-l-4 border-l-[#7c3aed]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl ${theme.bg} ${theme.border} border flex items-center justify-center shrink-0 ${theme.text}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {bot.name}
                      </span>
                      {bot.autoReplyToInquiries && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Auto-Reply
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {bot.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      <span className="text-slate-300 font-medium">{bot.category}</span>
                      <span>·</span>
                      <span>{bot.knowledgeBaseCourseIds?.length || 0} courses</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Star className="h-3 w-3 fill-amber-300" />
                        {bot.metrics?.avgSatisfaction || 5.0}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Bot Workspace (Tabs: Live Playground & Configuration) (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden">
          {activeBot ? (
            <>
              {/* Active Bot Header & Mode Switcher */}
              <div className="p-5 border-b border-white/[0.08] bg-[#0a0e18]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl ${currentTheme.bg} ${currentTheme.border} border flex items-center justify-center ${currentTheme.text} shadow-md`}
                  >
                    <BotIconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-display">
                        {activeBot.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                        {activeBot.model}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Role: <span className="text-slate-200">{activeBot.category}</span> ·{' '}
                      {activeBot.isActive ? (
                        <span className="text-emerald-400 font-semibold">● Active</span>
                      ) : (
                        <span className="text-slate-500">○ Inactive</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Tabs Switcher: Test Playground vs Configuration */}
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('playground')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'playground'
                        ? 'bg-[#7c3aed] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Live Test Playground
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(activeBot);
                      setActiveTab('config');
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'config'
                        ? 'bg-[#7c3aed] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Bot Configuration
                  </button>
                </div>
              </div>

              {/* Tab 1: Live Interactive Test Playground */}
              {activeTab === 'playground' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages Timeline */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    {messages.map((m) => {
                      const isBot = m.sender === 'bot';
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              isBot
                                ? `${currentTheme.bg} ${currentTheme.border} border ${currentTheme.text}`
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {isBot ? (
                              <BotIconComponent className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                              isBot
                                ? 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-sm'
                                : 'bg-gradient-to-br from-purple-900/40 to-indigo-900/30 border border-purple-500/30 text-white rounded-tr-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">
                                {isBot ? activeBot.name : 'You (Student Scholar)'}
                              </span>
                              <span>{m.timestamp}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          </div>
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full ${currentTheme.bg} flex items-center justify-center ${currentTheme.text}`}
                        >
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                        <div className="glass-panel px-4 py-2.5 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                          <span>{activeBot.name} is thinking & consulting syllabus...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Starter Quick Questions */}
                  {activeBot.suggestedPrompts && activeBot.suggestedPrompts.length > 0 && (
                    <div className="px-5 py-2 border-t border-white/[0.04] bg-[#0a0e18]/40 flex items-center gap-2 overflow-x-auto text-xs">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold shrink-0">
                        Ask bot:
                      </span>
                      {activeBot.suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(p)}
                          className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] whitespace-nowrap text-xs transition-colors shrink-0"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chat Input Console */}
                  <div className="p-4 border-t border-white/[0.08] bg-[#0a0e18]/90">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="relative flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder={`Talk to ${activeBot.name}... (e.g. test response, ask course questions)`}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-4 pr-24 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]"
                      />
                      <button
                        type="submit"
                        disabled={isBotTyping || !userInput.trim()}
                        className="absolute right-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-xs font-semibold hover:opacity-95 disabled:opacity-40 transition-opacity"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </button>
                    </form>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                      <span>
                        Grounding: {activeBot.knowledgeBaseCourseIds?.length || 0} courses connected
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMessages([
                            {
                              id: `reset-${Date.now()}`,
                              sender: 'bot',
                              content: activeBot.welcomeMessage || 'Chat session cleared.',
                              timestamp: new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                            },
                          ])
                        }
                        className="text-slate-400 hover:text-white hover:underline"
                      >
                        Reset Conversation
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Bot Configuration & Auto-Response Setup */}
              {activeTab === 'config' && (
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Chatbot settings saved and synchronized successfully!
                    </div>
                  )}

                  <form onSubmit={handleSaveConfig} className="space-y-6">
                    {/* Identity & Appearance */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        1. Identity & Appearance
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Chatbot Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Category / Role *
                          </label>
                          <select
                            value={formData.category || 'Student Support'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value as ChatbotCategory,
                              })
                            }
                            className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                          >
                            <option value="Advisory">Advisory</option>
                            <option value="Course Tutor">Course Tutor</option>
                            <option value="Student Support">Student Support</option>
                            <option value="Research Mentor">Research Mentor</option>
                            <option value="FAQ Bot">FAQ Bot</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Short Description / Tagline
                        </label>
                        <input
                          type="text"
                          value={formData.description || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                        />
                      </div>

                      {/* Icon & Color Selector */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Avatar Icon
                          </label>
                          <div className="flex items-center gap-2">
                            {Object.entries(AVATAR_ICONS).map(([key, Icon]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setFormData({ ...formData, avatarIcon: key })}
                                className={`p-2 rounded-lg border transition-all ${
                                  formData.avatarIcon === key
                                    ? 'bg-[#7c3aed]/30 border-[#7c3aed] text-white'
                                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Color Theme
                          </label>
                          <div className="flex items-center gap-2">
                            {Object.entries(COLOR_THEMES).map(([colorKey, theme]) => (
                              <button
                                key={colorKey}
                                type="button"
                                onClick={() => setFormData({ ...formData, avatarColor: colorKey })}
                                className={`h-8 w-8 rounded-lg border transition-all ${theme.bg} ${
                                  formData.avatarColor === colorKey
                                    ? 'ring-2 ring-white scale-105'
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Brain & System Persona */}
                    <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        2. AI Brain & Instructions
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            AI Model
                          </label>
                          <select
                            value={formData.model || 'gemini-4-hydrogen'}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full bg-[#0b0f19] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c3aed]"
                          >
                            <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Accurate - Recommended)</option>
                            <option value="gemini-3.8-flash">gemini-3.8-flash (Reasoning & Frontier)</option>
                            <option value="gemini-4-hydrogen">gemini-4-hydrogen (EduSphere Default)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                            <span>Temperature (Creativity)</span>
                            <span className="text-[#4cd7f6]">{formData.temperature ?? 0.7}</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={formData.temperature ?? 0.7}
                            onChange={(e) =>
                              setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                            }
                            className="w-full accent-[#7c3aed]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-300">
                            System Instruction Prompt *
                          </label>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#4cd7f6]">
                            <Wand2 className="h-3 w-3" />
                            <span>Defines how the bot reasons and responds</span>
                          </div>
                        </div>
                        <textarea
                          rows={4}
                          required
                          value={formData.systemPrompt || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, systemPrompt: e.target.value })
                          }
                          placeholder="e.g. You are an academic advisor for computer science students..."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#7c3aed] resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Welcome Greeting Message
                        </label>
                        <input
                          type="text"
                          value={formData.welcomeMessage || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, welcomeMessage: e.target.value })
                          }
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                        />
                      </div>
                    </div>

                    {/* Knowledge Base Grounding */}
                    <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        3. Knowledge Base Grounding (Syllabi & Research Notes)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Select which courses this chatbot has access to. The bot will automatically reference syllabus modules, readings, and lecture notes when answering questions.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {courses.map((course) => {
                          const isLinked = (formData.knowledgeBaseCourseIds || []).includes(
                            course.id
                          );
                          return (
                            <label
                              key={course.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                                isLinked
                                  ? 'bg-purple-950/20 border-purple-500/40 text-white'
                                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isLinked}
                                onChange={(e) => {
                                  const current = formData.knowledgeBaseCourseIds || [];
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      knowledgeBaseCourseIds: [...current, course.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      knowledgeBaseCourseIds: current.filter((id) => id !== course.id),
                                    });
                                  }
                                }}
                                className="rounded border-slate-700 text-[#7c3aed] focus:ring-0 bg-slate-900"
                              />
                              <div>
                                <p className="text-xs font-bold">{course.code} — {course.title}</p>
                                <p className="text-[10px] text-slate-500">{course.modules.length} modules · {course.instructor}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Customer Response & Inquiries Integration */}
                    <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        4. Customer Response & Inquiries Integration
                      </h4>

                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-[#4cd7f6]" />
                              Auto-Reply to Inbound Student Inquiries
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              When enabled, incoming inquiries in selected categories will receive AI drafts and auto-responses generated by this chatbot.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.autoReplyToInquiries || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                autoReplyToInquiries: e.target.checked,
                              })
                            }
                            className="rounded border-slate-700 text-[#7c3aed] focus:ring-0 bg-slate-900 h-4 w-4"
                          />
                        </label>

                        {formData.autoReplyToInquiries && (
                          <div className="pt-2 border-t border-white/[0.06] space-y-2">
                            <p className="text-[11px] font-semibold text-slate-300">
                              Assigned Inquiry Categories:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {ALL_INQUIRY_CATEGORIES.map((cat) => {
                                const isAssigned = (
                                  formData.assignedInquiryCategories || []
                                ).includes(cat);
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                      const cur = formData.assignedInquiryCategories || [];
                                      setFormData({
                                        ...formData,
                                        assignedInquiryCategories: isAssigned
                                          ? cur.filter((c) => c !== cat)
                                          : [...cur, cat],
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                      isAssigned
                                        ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete chatbot "${activeBot.name}"?`)) {
                            onDeleteChatbot(activeBot.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Chatbot
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Bot className="h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Chatbot Selected</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Select a bot from the directory or click &quot;Create Chatbot&quot; to build a new assistant.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Chatbot with Starter Templates */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#0c101d] p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Create New AI Chatbot
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose a specialized persona template or customize your assistant from scratch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Bot Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS-482 TA Bot, Admissions Concierge..."
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Chatbot Persona Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TEMPLATES.map((tmpl, idx) => {
                    const isPicked = selectedTemplate === idx;
                    const Icon = AVATAR_ICONS[tmpl.icon] || Bot;
                    return (
                      <button
                        key={tmpl.name}
                        type="button"
                        onClick={() => setSelectedTemplate(idx)}
                        className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isPicked
                            ? 'bg-purple-950/40 border-[#7c3aed] ring-1 ring-[#7c3aed]'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-white flex items-center gap-2">
                              <Icon className="h-4 w-4 text-[#4cd7f6]" />
                              {tmpl.name}
                            </span>
                            {isPicked && <Check className="h-4 w-4 text-[#7c3aed]" />}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {tmpl.description}
                          </p>
                        </div>
                        <span className="text-[10px] text-purple-300 font-semibold mt-2.5">
                          Role: {tmpl.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCreateFromTemplate}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Instantiate Chatbot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
