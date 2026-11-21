import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ChatbotCategory,
  ChatbotConfig,
  Course,
  CustomerInquiry,
  Flashcard,
  InquiryCategory,
  InquiryMessage,
  InquiryPriority,
  InquiryStatus,
  ResearchNote,
  StudySession,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
  WorkspaceSnapshot,
} from '../types.ts';

// Ensure environment variables from .env are loaded
dotenv.config();

const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join('/tmp', '.data') : path.resolve(process.cwd(), '.data');
const BUNDLED_DB_FILE = path.resolve(process.cwd(), '.data', 'edusphere-db.json');
const DB_FILE = IS_VERCEL ? path.join(DATA_DIR, 'edusphere-db.json') : BUNDLED_DB_FILE;

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

function isPlaceholder(val?: string): boolean {
  if (!val) return true;
  const v = val.trim();
  return (
    v === '' ||
    v === 'your-anon-key' ||
    v === 'your-service-role-key' ||
    v === 'MY_SUPABASE_ANON_KEY' ||
    v === 'MY_SUPABASE_SERVICE_ROLE_KEY' ||
    v.includes('your-anon-key') ||
    v.includes('your-service-role-key')
  );
}

function isPlaceholderUrl(val?: string): boolean {
  if (!val) return true;
  const v = val.trim();
  return (
    v === '' ||
    v === 'MY_APP_URL' ||
    v.includes('your-project-ref')
  );
}

function cleanSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Dynamically resolves and caches the Supabase client based on environment variables.
 */
export function getSupabase(): SupabaseClient | null {
  dotenv.config({ override: true });
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseUrl = cleanSupabaseUrl(rawUrl);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (isPlaceholderUrl(supabaseUrl)) return null;

  const validKey = !isPlaceholder(serviceKey)
    ? serviceKey
    : !isPlaceholder(anonKey)
    ? anonKey
    : null;

  if (!supabaseUrl || !validKey) {
    return null;
  }

  const cacheKey = `${supabaseUrl}:${validKey}`;
  if (cachedClient && cachedKey === cacheKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(supabaseUrl, validKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedKey = cacheKey;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Client initialization error:', err);
    return null;
  }
}

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url?: string;
  authMode?: 'service_role' | 'anon' | 'none';
  tables?: Record<string, number>;
  error?: string | null;
}

/**
 * Tests connection to Supabase and returns table record counts or errors.
 */
export async function getSupabaseStatus(): Promise<SupabaseStatus> {
  dotenv.config({ override: true });
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseUrl = cleanSupabaseUrl(rawUrl);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const hasUrl = !isPlaceholderUrl(supabaseUrl);
  const hasServiceKey = !isPlaceholder(serviceKey);
  const hasAnonKey = !isPlaceholder(anonKey);

  if (!hasUrl && !hasServiceKey && !hasAnonKey) {
    return {
      configured: false,
      connected: false,
      error: 'Supabase credentials are not set in .env. Enter your Project URL and Anon/Service-Role API key.',
    };
  }

  if (hasUrl && !hasServiceKey && !hasAnonKey) {
    return {
      configured: false,
      connected: false,
      url: supabaseUrl,
      error: 'Supabase Project URL is set, but API Key is missing or still set to placeholder ("your-anon-key"). Please paste your Anon Key or Service Role Key from Project Settings > API.',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      error: 'Failed to initialize Supabase client instance. Check that URL and Key are formatted correctly.',
    };
  }

  try {
    const [c, m, n, f, t, ch, s, sc, iq, cb] = await Promise.all([
      client.from('courses').select('id', { count: 'exact', head: true }),
      client.from('syllabus_modules').select('id', { count: 'exact', head: true }),
      client.from('research_notes').select('id', { count: 'exact', head: true }),
      client.from('flashcards').select('id', { count: 'exact', head: true }),
      client.from('study_tasks').select('id', { count: 'exact', head: true }),
      client.from('thesis_chapters').select('id', { count: 'exact', head: true }),
      client.from('study_sessions').select('id', { count: 'exact', head: true }),
      client.from('scholar_profiles').select('id', { count: 'exact', head: true }),
      client.from('customer_inquiries').select('id', { count: 'exact', head: true }),
      client.from('chatbots').select('id', { count: 'exact', head: true }),
    ]);

    const error =
      c.error || m.error || n.error || f.error || t.error || ch.error || s.error;

    if (error) {
      const errMsg = error.message || error.hint || error.details || 'Permission denied or table missing';
      const hint = error.hint ? ` Hint: ${error.hint}` : '';
      return {
        configured: true,
        connected: false,
        url: supabaseUrl,
        authMode: hasServiceKey ? 'service_role' : 'anon',
        error: `Supabase error (${error.code || '42501'}): ${errMsg}.${hint} Please run the GRANT statements at the end of supabase/schema.sql in the Supabase SQL Editor.`,
      };
    }

    return {
      configured: true,
      connected: true,
      url: supabaseUrl,
      authMode: hasServiceKey ? 'service_role' : 'anon',
      tables: {
        courses: c.count ?? 0,
        syllabus_modules: m.count ?? 0,
        research_notes: n.count ?? 0,
        flashcards: f.count ?? 0,
        study_tasks: t.count ?? 0,
        thesis_chapters: ch.count ?? 0,
        study_sessions: s.count ?? 0,
        scholar_profiles: sc.count ?? 0,
        customer_inquiries: iq?.count ?? 0,
        chatbots: cb?.count ?? 0,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url: supabaseUrl,
      error: err?.message || 'Network error reaching Supabase',
    };
  }
}

/**
 * Updates Supabase configuration in .env and memory, and returns fresh status.
 */
export async function updateSupabaseConfig(config: {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
}): Promise<SupabaseStatus> {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  const updateOrAppend = (key: string, value: string) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content += `\n${key}="${value}"`;
    }
    process.env[key] = value;
  };

  if (config.url) {
    updateOrAppend('SUPABASE_URL', config.url.trim());
    updateOrAppend('VITE_SUPABASE_URL', config.url.trim());
  }
  if (config.anonKey) {
    updateOrAppend('SUPABASE_ANON_KEY', config.anonKey.trim());
    updateOrAppend('VITE_SUPABASE_ANON_KEY', config.anonKey.trim());
  }
  if (config.serviceRoleKey) {
    updateOrAppend('SUPABASE_SERVICE_ROLE_KEY', config.serviceRoleKey.trim());
  }

  try {
    fs.writeFileSync(envPath, content, 'utf8');
  } catch {
    console.warn('[Storage] .env file write skipped in read-only environment');
  }

  cachedClient = null;
  cachedKey = '';

  return await getSupabaseStatus();
}

/**
 * Seeds or syncs all workspace data to Supabase PostgreSQL.
 */
export async function seedSupabaseFromSnapshot(
  snapshot?: WorkspaceSnapshot
): Promise<{ success: boolean; seeded: Record<string, number>; message: string }> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase is not configured. Provide SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  }

  const data = snapshot || readLocalDb();
  const counts: Record<string, number> = {};

  // 1. Scholar profile
  const { error: scErr } = await client.from('scholar_profiles').upsert(
    {
      id: 'default',
      name: data.scholar.name,
      program: data.scholar.program,
      institution: data.scholar.institution,
      term: data.scholar.term,
      gpa: data.scholar.gpa,
      avatar_url: data.scholar.avatarUrl,
      thesis_title: data.scholar.thesisTitle,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (scErr) console.warn('[Supabase Seed] scholar_profiles upsert note:', scErr.message);
  counts.scholar_profiles = 1;

  // 2. Courses
  if (data.courses.length > 0) {
    const coursePayload = data.courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      instructor: c.instructor,
      credits: c.credits,
      term: c.term,
      status: c.status,
      grade: c.grade,
      current_score: c.currentScore,
      weekly_hours_target: c.weeklyHoursTarget,
      image_url: c.imageUrl,
      description: c.description,
    }));
    const { error: cErr } = await client.from('courses').upsert(coursePayload, { onConflict: 'id' });
    if (cErr) throw new Error(`Failed to seed courses: ${cErr.message}`);
    counts.courses = coursePayload.length;

    // 3. Syllabus modules
    const allModules: any[] = [];
    for (const c of data.courses) {
      for (const m of c.modules || []) {
        allModules.push({
          id: m.id,
          course_id: c.id,
          week: m.week,
          title: m.title,
          topic_summary: m.topicSummary,
          completed: m.completed,
          due_date: m.dueDate,
        });
      }
    }
    if (allModules.length > 0) {
      const { error: mErr } = await client.from('syllabus_modules').upsert(allModules, { onConflict: 'id' });
      if (mErr) throw new Error(`Failed to seed syllabus_modules: ${mErr.message}`);
      counts.syllabus_modules = allModules.length;
    }
  }

  // 4. Research Notes
  if (data.notes.length > 0) {
    const notesPayload = data.notes.map((n) => ({
      id: n.id,
      course_id: n.courseId,
      title: n.title,
      authors: n.authors,
      year: n.year,
      publication: n.publication,
      citation_key: n.citationKey,
      summary: n.summary,
      body: n.body,
      tags: n.tags,
      updated_at: n.updatedAt,
    }));
    const { error: nErr } = await client.from('research_notes').upsert(notesPayload, { onConflict: 'id' });
    if (nErr) throw new Error(`Failed to seed research_notes: ${nErr.message}`);
    counts.research_notes = notesPayload.length;
  }

  // 5. Flashcards
  if (data.flashcards.length > 0) {
    const cardsPayload = data.flashcards.map((f) => ({
      id: f.id,
      course_id: f.courseId,
      front: f.front,
      back: f.back,
      hint: f.hint,
      mastery: f.mastery,
      last_reviewed_at: f.lastReviewedAt,
    }));
    const { error: fErr } = await client.from('flashcards').upsert(cardsPayload, { onConflict: 'id' });
    if (fErr) throw new Error(`Failed to seed flashcards: ${fErr.message}`);
    counts.flashcards = cardsPayload.length;
  }

  // 6. Study tasks
  if (data.tasks.length > 0) {
    const tasksPayload = data.tasks.map((t) => ({
      id: t.id,
      course_id: t.courseId,
      title: t.title,
      type: t.type,
      due_date: t.dueDate,
      estimated_minutes: t.estimatedMinutes,
      priority: t.priority,
      status: t.status,
    }));
    const { error: tErr } = await client.from('study_tasks').upsert(tasksPayload, { onConflict: 'id' });
    if (tErr) throw new Error(`Failed to seed study_tasks: ${tErr.message}`);
    counts.study_tasks = tasksPayload.length;
  }

  // 7. Thesis chapters
  if (data.thesisChapters.length > 0) {
    const chaptersPayload = data.thesisChapters.map((ch) => ({
      id: ch.id,
      order_index: ch.orderIndex,
      title: ch.title,
      target_words: ch.targetWords,
      content: ch.content,
      status: ch.status,
      updated_at: ch.updatedAt,
    }));
    const { error: chErr } = await client.from('thesis_chapters').upsert(chaptersPayload, { onConflict: 'id' });
    if (chErr) throw new Error(`Failed to seed thesis_chapters: ${chErr.message}`);
    counts.thesis_chapters = chaptersPayload.length;
  }

  // 8. Study sessions
  if (data.sessions.length > 0) {
    const sessionsPayload = data.sessions.map((s) => ({
      id: s.id,
      course_id: s.courseId,
      duration_minutes: s.durationMinutes,
      focus_topic: s.focusTopic,
      completed_at: s.completedAt,
    }));
    const { error: sErr } = await client.from('study_sessions').upsert(sessionsPayload, { onConflict: 'id' });
    if (sErr) throw new Error(`Failed to seed study_sessions: ${sErr.message}`);
    counts.study_sessions = sessionsPayload.length;
  }

  // 9. Customer Inquiries & Responses
  if (data.inquiries && data.inquiries.length > 0) {
    const inquiriesPayload = data.inquiries.map((iq) => ({
      id: iq.id,
      customer_name: iq.customerName,
      customer_email: iq.customerEmail,
      subject: iq.subject,
      category: iq.category,
      priority: iq.priority,
      status: iq.status,
      course_id: iq.courseId || null,
      messages: iq.messages,
      ai_suggested_response: iq.aiSuggestedResponse || '',
      satisfaction_rating: iq.satisfactionRating ?? null,
      customer_feedback: iq.customerFeedback || '',
      created_at: iq.createdAt,
      updated_at: iq.updatedAt,
    }));
    const { error: iqErr } = await client
      .from('customer_inquiries')
      .upsert(inquiriesPayload, { onConflict: 'id' });
    if (iqErr) console.warn('[Supabase Seed] customer_inquiries warning:', iqErr.message);
    else counts.customer_inquiries = inquiriesPayload.length;
  }

  // 10. AI Chatbots & Auto-Responders
  if (data.chatbots && data.chatbots.length > 0) {
    const chatbotsPayload = data.chatbots.map((cb) => ({
      id: cb.id,
      name: cb.name,
      description: cb.description || '',
      avatar_icon: cb.avatarIcon || 'bot',
      avatar_color: cb.avatarColor || 'purple',
      category: cb.category,
      model: cb.model || 'gemini-4-hydrogen',
      temperature: cb.temperature ?? 0.7,
      system_prompt: cb.systemPrompt || '',
      welcome_message: cb.welcomeMessage || '',
      suggested_prompts: cb.suggestedPrompts || [],
      knowledge_base_course_ids: cb.knowledgeBaseCourseIds || [],
      assigned_inquiry_categories: cb.assignedInquiryCategories || [],
      is_active: cb.isActive !== false,
      auto_reply_to_inquiries: cb.autoReplyToInquiries === true,
      metrics: cb.metrics || { conversationsCount: 0, resolvedTicketsCount: 0, avgSatisfaction: 5.0 },
      created_at: cb.createdAt,
      updated_at: cb.updatedAt,
    }));
    const { error: cbErr } = await client
      .from('chatbots')
      .upsert(chatbotsPayload, { onConflict: 'id' });
    if (cbErr) console.warn('[Supabase Seed] chatbots warning:', cbErr.message);
    else counts.chatbots = chatbotsPayload.length;
  }

  return {
    success: true,
    seeded: counts,
    message: 'Supabase successfully seeded from workspace data.',
  };
}

export function createSeedData(): WorkspaceSnapshot {
  return {
    scholar: {
      name: 'Elena Rostova',
      program: 'M.S. Computational Neuroscience & AI',
      institution: 'ETH Applied Intelligence Lab',
      term: 'Fall Term 2026',
      gpa: 3.92,
      avatarUrl: '/src/assets/images/avatar_academic_scholar_1794995660870.jpg',
      thesisTitle:
        'Sparse Mechanistic Interpretability in Multimodal Transformer Memory Hierarchies',
    },
    courses: [
      {
        id: 'cs-482',
        code: 'CS 482',
        title: 'Neural Systems & Sparse Representations',
        instructor: 'Prof. Julian Vance',
        credits: 4.0,
        term: 'Fall 2026',
        status: 'active',
        grade: 'A',
        currentScore: 95,
        weeklyHoursTarget: 9,
        imageUrl: '/src/assets/images/course_neural_systems_1794995662375.jpg',
        description:
          'Computational principles of cortical circuits, sparse coding dictionaries, predictive coding, and mechanistic circuit discovery in deep neural networks.',
        modules: [
          {
            id: 'mod-482-1',
            courseId: 'cs-482',
            week: 1,
            title: 'Hodgkin-Huxley & Integrate-and-Fire Dynamics',
            topicSummary: 'Membrane conductance ODEs, refractory periods, and firing rate approximations.',
            completed: true,
            dueDate: '2026-09-18',
          },
          {
            id: 'mod-482-2',
            courseId: 'cs-482',
            week: 3,
            title: 'Olshausen-Field Sparse Coding Dictionaries',
            topicSummary: 'L1 regularization, Gabor receptive fields, and iterative shrinkage thresholding.',
            completed: true,
            dueDate: '2026-10-02',
          },
          {
            id: 'mod-482-3',
            courseId: 'cs-482',
            week: 6,
            title: 'Sparse Autoencoders for Polysemantic Neurons',
            topicSummary: 'Superposition hypothesis, k-sparse feature extraction, and dead-latent resampling.',
            completed: true,
            dueDate: '2026-10-23',
          },
          {
            id: 'mod-482-4',
            courseId: 'cs-482',
            week: 9,
            title: 'Causal Path Patching & Induction Circuits',
            topicSummary: 'Activation patching, attribution graphs, and attention head composition.',
            completed: false,
            dueDate: '2026-11-22',
          },
          {
            id: 'mod-482-5',
            courseId: 'cs-482',
            week: 12,
            title: 'Predictive Coding vs. Backpropagation',
            topicSummary: 'Energy-based local plasticity rules and hierarchical error units.',
            completed: false,
            dueDate: '2026-12-06',
          },
        ],
      },
      {
        id: 'phys-410',
        code: 'PHYS 410',
        title: 'Quantum Information & Error Correction',
        instructor: 'Dr. Kenji Takahashi',
        credits: 4.0,
        term: 'Fall 2026',
        status: 'active',
        grade: 'A-',
        currentScore: 91,
        weeklyHoursTarget: 8,
        imageUrl: '/src/assets/images/course_quantum_info_1794995661609.jpg',
        description:
          'Density operators, entanglement entropy, stabilizer formalism, surface codes, and fault-tolerant quantum circuit thresholds.',
        modules: [
          {
            id: 'mod-410-1',
            courseId: 'phys-410',
            week: 1,
            title: 'Bloch Sphere Geometry & Kraus Channels',
            topicSummary: 'Depolarizing, amplitude-damping, and phase-flip noise operators.',
            completed: true,
            dueDate: '2026-09-20',
          },
          {
            id: 'mod-410-2',
            courseId: 'phys-410',
            week: 4,
            title: 'Stabilizer Codes & Pauli Group Symmetries',
            topicSummary: 'Shor 9-qubit code, Steane [[7,1,3]] code, and syndrome extraction.',
            completed: true,
            dueDate: '2026-10-11',
          },
          {
            id: 'mod-410-3',
            courseId: 'phys-410',
            week: 8,
            title: 'Toric & Surface Code Decoding',
            topicSummary: 'Minimum-weight perfect matching and logical error threshold bounds.',
            completed: false,
            dueDate: '2026-11-24',
          },
          {
            id: 'mod-410-4',
            courseId: 'phys-410',
            week: 11,
            title: 'Magic State Distillation & Fault Tolerance',
            topicSummary: 'Eastin-Knill theorem and non-Clifford T-gate synthesis.',
            completed: false,
            dueDate: '2026-12-10',
          },
        ],
      },
      {
        id: 'stat-390',
        code: 'STAT 390',
        title: 'High-Dimensional Statistical Learning',
        instructor: 'Prof. Nadia Al-Mansoor',
        credits: 3.0,
        term: 'Fall 2026',
        status: 'active',
        grade: 'A',
        currentScore: 94,
        weeklyHoursTarget: 6,
        imageUrl: '',
        description:
          'Concentration inequalities, Rademacher complexity, random matrix spectra, and double-descent generalization bounds.',
        modules: [
          {
            id: 'mod-390-1',
            courseId: 'stat-390',
            week: 2,
            title: 'Sub-Gaussian Concentration & Matrix Bernstein',
            topicSummary: 'Hoeffding bounds, epsilon-nets, and covariance estimation in p > n.',
            completed: true,
            dueDate: '2026-09-25',
          },
          {
            id: 'mod-390-2',
            courseId: 'stat-390',
            week: 5,
            title: 'Marchenko-Pastur Law & Benign Overfitting',
            topicSummary: 'Empirical spectral distributions of Wishart matrices and ridgeless regression.',
            completed: true,
            dueDate: '2026-10-18',
          },
          {
            id: 'mod-390-3',
            courseId: 'stat-390',
            week: 9,
            title: 'PAC-Bayes Bounds & Sharpness-Aware Minima',
            topicSummary: 'KL-divergence generalization certificates for overparameterized models.',
            completed: false,
            dueDate: '2026-11-26',
          },
        ],
      },
      {
        id: 'phil-312',
        code: 'PHIL 312',
        title: 'Epistemology of Formal & Empirical Models',
        instructor: 'Prof. Henrik Lindqvist',
        credits: 3.0,
        term: 'Spring 2026',
        status: 'completed',
        grade: 'A',
        currentScore: 97,
        weeklyHoursTarget: 5,
        imageUrl: '',
        description:
          'Philosophy of scientific explanation, mechanistic vs. covering-law models, and epistemic opacity in computational simulations.',
        modules: [
          {
            id: 'mod-312-1',
            courseId: 'phil-312',
            week: 1,
            title: 'Deductive-Nomological vs. Mechanistic Explanation',
            topicSummary: 'Hempel, Craver, and multi-level causal interventions.',
            completed: true,
            dueDate: '2026-02-14',
          },
          {
            id: 'mod-312-2',
            courseId: 'phil-312',
            week: 6,
            title: 'Epistemic Opacity in Deep Learning Systems',
            topicSummary: 'Humphreys opacity criterion and formal verification limits.',
            completed: true,
            dueDate: '2026-04-02',
          },
        ],
      },
    ],
    notes: [
      {
        id: 'note-1',
        courseId: 'cs-482',
        title: 'Scaling Monosemanticity via Top-K Sparse Autoencoders',
        authors: 'Templeton, Conerly, Marcus, et al.',
        year: '2024',
        publication: 'Transformer Circuits Thread',
        citationKey: 'templeton2024scaling',
        summary:
          'Dictionary learning with Top-K activation sparsity isolates interpretable, causally steerable features across middle transformer residual streams while curbing feature shrinkage.',
        body:
          'Key Technical Findings:\n1. Superposition occurs when models represent more features (M) than residual stream dimensions (d), organizing features in almost-orthogonal polytope geometries.\n2. Top-K SAEs enforce exact L0 sparsity per token without an L1 penalty coefficient, eliminating activation shrinkage.\n3. Auxiliary loss on dead latents (k_aux = 512) prevents dictionary collapse beyond 1M latent features.\n\nThesis Relevance:\nDirectly informs Chapter 3 ablation comparing Top-K vs. JumpReLU SAEs on cross-modal vision-language attention sinks.',
        tags: ['Sparse Autoencoders', 'Interpretability', 'Superposition'],
        updatedAt: '2026-11-16T18:40:00Z',
      },
      {
        id: 'note-2',
        courseId: 'phys-410',
        title: 'Threshold Theorem & Surface Code Syndrome Graphs',
        authors: 'Fowler, Mariantoni, Martinis, Cleland',
        year: '2012',
        publication: 'Physical Review A',
        citationKey: 'fowler2012surface',
        summary:
          'Planar 2D nearest-neighbor surface codes achieve ~1% fault-tolerant physical error threshold using X/Z stabilizer plaquettes and minimum-weight perfect matching.',
        body:
          'Stabilizer Lattice Notes:\n- Data qubits sit on lattice edges; X-checks (star) and Z-checks (plaquette) commute everywhere because adjacent checks share exactly 0 or 2 qubits.\n- Logical X_L and Z_L operators correspond to non-trivial homology chains spanning opposite boundaries.\n- Decoding maps syndrome defects to spacetime edges and solves MWPM via Blossom algorithm in O(V^3) worst-case, amortized near-linear for sparse noise.',
        tags: ['Surface Codes', 'Stabilizers', 'MWPM'],
        updatedAt: '2026-11-15T14:20:00Z',
      },
      {
        id: 'note-3',
        courseId: 'stat-390',
        title: 'Benign Overfitting in Linear & Kernel Regimes',
        authors: 'Bartlett, Long, Lugosi, Tsigler',
        year: '2020',
        publication: 'PNAS',
        citationKey: 'bartlett2020benign',
        summary:
          'Minimum-norm interpolators generalize accurately despite zero training error when the data covariance exhibits a small effective rank k* and a long flat tail of small eigenvalues.',
        body:
          'Conditions for Benign Overfitting:\n1. Signal energy concentrates in k* << n leading eigenvectors (low effective rank).\n2. Remaining p - k* eigenvalues are sufficiently small and spread out so label noise is absorbed harmlessly across many orthogonal directions.\n3. Implication for high-dimensional feature dictionaries: isotropic noise variance acts as implicit ridge regularization.',
        tags: ['Generalization', 'Random Matrix', 'Overfitting'],
        updatedAt: '2026-11-12T09:15:00Z',
      },
    ],
    flashcards: [
      {
        id: 'fc-1',
        courseId: 'cs-482',
        front: 'Why do Top-K Sparse Autoencoders reduce feature activation shrinkage compared to L1-penalized SAEs?',
        back: 'L1 penalties pull every non-zero latent activation toward zero regardless of magnitude, causing systematic underestimation. Top-K enforces sparsity structurally by keeping only the k largest activations without shrinking their magnitudes.',
        hint: 'Think about how L1 regularization biases non-zero coefficients.',
        mastery: 3,
        lastReviewedAt: '2026-11-17T20:10:00Z',
      },
      {
        id: 'fc-2',
        courseId: 'cs-482',
        front: 'What geometric theorem explains why N dimensions can store exponentially many nearly-orthogonal features?',
        back: 'The Johnson-Lindenstrauss Lemma: in an N-dimensional Euclidean space, exp(O(N * epsilon^2)) unit vectors can exist with pairwise inner products bounded by epsilon.',
        hint: 'Named after two mathematicians; relates dimension N to pairwise cosine similarity.',
        mastery: 2,
        lastReviewedAt: '2026-11-16T19:00:00Z',
      },
      {
        id: 'fc-3',
        courseId: 'phys-410',
        front: 'Why do X-type (star) and Z-type (plaquette) stabilizers commute in the surface code?',
        back: 'Any neighboring star and plaquette share either 0 or 2 data qubits. Since XZ = -ZX on a single qubit, two shared qubits contribute (-1)^2 = +1, so the multi-qubit operators commute.',
        hint: 'Count the number of overlapping edges between a vertex star and a face plaquette.',
        mastery: 3,
        lastReviewedAt: '2026-11-17T11:30:00Z',
      },
      {
        id: 'fc-4',
        courseId: 'phys-410',
        front: 'What does the Eastin-Knill theorem forbid for quantum error-correcting codes?',
        back: 'No quantum error-correcting code can implement a universal gate set using solely transversal (bitwise) gates.',
        hint: 'Relates transversality and gate universality; bypassed via magic state distillation.',
        mastery: 1,
        lastReviewedAt: '2026-11-14T16:45:00Z',
      },
      {
        id: 'fc-5',
        courseId: 'stat-390',
        front: 'In Bartlett et al. (2020), what two spectral properties of the covariance matrix enable benign overfitting?',
        back: '1) A low effective rank (few large eigenvalues capturing signal), and 2) a high-dimensional flat tail of small eigenvalues (large effective dimension R_k) that absorbs noise without inflating prediction variance.',
        hint: 'Effective rank r_k and effective dimension R_k.',
        mastery: 2,
        lastReviewedAt: '2026-11-15T10:00:00Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        courseId: 'cs-482',
        title: 'Run causal activation patching ablation on Layer 14 induction heads',
        type: 'Research',
        dueDate: '2026-11-20',
        estimatedMinutes: 120,
        priority: 'high',
        status: 'in_progress',
      },
      {
        id: 'task-2',
        courseId: 'phys-410',
        title: 'Problem Set 6: MWPM decoding on d=5 rotated surface code',
        type: 'Assignment',
        dueDate: '2026-11-21',
        estimatedMinutes: 90,
        priority: 'high',
        status: 'todo',
      },
      {
        id: 'task-3',
        courseId: 'stat-390',
        title: 'Derive PAC-Bayes KL generalization bound for Problem 3',
        type: 'Assignment',
        dueDate: '2026-11-23',
        estimatedMinutes: 75,
        priority: 'medium',
        status: 'todo',
      },
      {
        id: 'task-4',
        courseId: 'cs-482',
        title: 'Draft Section 2.3 on cross-modal superposition geometry',
        type: 'Research',
        dueDate: '2026-11-24',
        estimatedMinutes: 110,
        priority: 'medium',
        status: 'todo',
      },
      {
        id: 'task-5',
        courseId: 'phys-410',
        title: 'Review Kraus operator completeness proof for midterm',
        type: 'Exam Prep',
        dueDate: '2026-11-17',
        estimatedMinutes: 45,
        priority: 'low',
        status: 'done',
      },
    ],
    thesisChapters: [
      {
        id: 'chap-1',
        orderIndex: 1,
        title: '1. Introduction & Problem Formulation',
        targetWords: 1200,
        status: 'Finalized',
        updatedAt: '2026-11-10T15:00:00Z',
        content:
          'Modern multimodal transformers exhibit remarkable zero-shot reasoning across visual and linguistic domains, yet their internal representations remain heavily polysemantic. When a single residual stream neuron fires for both syntactic punctuation and geometric edge orientation, standard probing methods fail to disentangle causal mechanisms.\n\nThis thesis investigates whether sparse dictionary learning—specifically Top-K and gated sparse autoencoders—can isolate modality-invariant conceptual latents across intermediate attention layers without degrading downstream calibration.',
      },
      {
        id: 'chap-2',
        orderIndex: 2,
        title: '2. Literature Review: Superposition & Circuit Discovery',
        targetWords: 1800,
        status: 'Revising',
        updatedAt: '2026-11-15T18:30:00Z',
        content:
          'Building on Elhage et al. (2022), neural networks pack more independent features than available orthogonal basis vectors whenever feature activation is sparse. Recent work by Templeton et al. (2024) scales dictionary learning to millions of latents, demonstrating monosemantic steering vectors.\n\nHowever, existing literature focuses almost exclusively on autoregressive text models. In multimodal architectures, cross-attention bridges inject dense continuous visual tokens into discrete token streams, altering the geometry of superposition.',
      },
      {
        id: 'chap-3',
        orderIndex: 3,
        title: '3. Methodology: Cross-Modal Sparse Autoencoders',
        targetWords: 2000,
        status: 'Drafting',
        updatedAt: '2026-11-17T21:10:00Z',
        content:
          'We train paired Top-K sparse autoencoders (expansion factor 16x, k = 64) on residual stream activations extracted at layers L = {8, 14, 20}. To measure modality invariance, we introduce the Cross-Modal Alignment Index (CMAI), defined as the cosine similarity between sparse latent activation vectors induced by paired image-caption stimuli.\n\nCausal validation is performed via targeted latent ablation and activation patching on controlled visual-spatial reasoning benchmarks.',
      },
      {
        id: 'chap-4',
        orderIndex: 4,
        title: '4. Experimental Results & Causal Ablations',
        targetWords: 1600,
        status: 'Drafting',
        updatedAt: '2026-11-17T22:00:00Z',
        content:
          'Preliminary evaluations on Layer 14 reveal that 31.4% of active Top-K latents respond symmetrically to both diagrammatic visual queries and formal symbolic descriptions. Suppressing top spatial-relation latents reduces geometric reasoning accuracy by 24.8 percentage points while leaving pure lexical retrieval intact (delta < 0.7%).',
      },
    ],
    sessions: [
      {
        id: 'sess-1',
        courseId: 'cs-482',
        durationMinutes: 90,
        focusTopic: 'Layer 14 SAE dictionary evaluation script',
        completedAt: '2026-11-17T21:30:00Z',
      },
      {
        id: 'sess-2',
        courseId: 'phys-410',
        durationMinutes: 60,
        focusTopic: 'Rotated surface code boundary operators',
        completedAt: '2026-11-16T17:15:00Z',
      },
      {
        id: 'sess-3',
        courseId: 'stat-390',
        durationMinutes: 50,
        focusTopic: 'Wishart eigenvalue concentration proof',
        completedAt: '2026-11-15T11:00:00Z',
      },
      {
        id: 'sess-4',
        courseId: 'cs-482',
        durationMinutes: 75,
        focusTopic: 'Thesis Chapter 3 methodology drafting',
        completedAt: '2026-11-14T20:00:00Z',
      },
    ],
    inquiries: [
      {
        id: 'inq-101',
        customerName: 'Marcus Sterling',
        customerEmail: 'm.sterling@ethz.ch',
        subject: 'Request for Chapter 3 Methodology Review & LaTeX Formatting Guidance',
        category: 'Thesis & Research',
        priority: 'high',
        status: 'in_progress',
        courseId: 'cs-482',
        createdAt: '2026-11-18T09:30:00Z',
        updatedAt: '2026-11-18T14:15:00Z',
        messages: [
          {
            id: 'msg-101-1',
            sender: 'customer',
            senderName: 'Marcus Sterling',
            content:
              'Hello EduSphere Advisory Team, I have drafted the mathematical formulation of our Top-K Sparse Autoencoder ablation in Section 3.2. Could you verify if the loss function weighting for k_aux dead-latent resampling aligns with current lab standards?',
            createdAt: '2026-11-18T09:30:00Z',
          },
          {
            id: 'msg-101-2',
            sender: 'support_agent',
            senderName: 'Dr. Julian Vance (Advisory Faculty)',
            content:
              'Hi Marcus, your mathematical formulation for k_aux = 512 is well-structured. We recommend adding a short paragraph explicitly comparing the reconstruction error vs. L0 sparsity tradeoff curve. We have flagged this for your upcoming review checkpoint.',
            createdAt: '2026-11-18T14:15:00Z',
          },
        ],
        aiSuggestedResponse:
          'Based on Chapter 3 methodology, the dead-latent auxiliary loss coefficient (alpha = 0.03) ensures stability without biasing dictionary polytope angles. Recommended citation: Templeton et al. (2024).',
      },
      {
        id: 'inq-102',
        customerName: 'Priya Nair',
        customerEmail: 'priya.nair@stanford.edu',
        subject: 'Clarification on Marchenko-Pastur Spectral Tail Proof in Problem Set 3',
        category: 'Course Content',
        priority: 'medium',
        status: 'resolved',
        courseId: 'stat-390',
        createdAt: '2026-11-16T11:20:00Z',
        updatedAt: '2026-11-17T16:00:00Z',
        messages: [
          {
            id: 'msg-102-1',
            sender: 'customer',
            senderName: 'Priya Nair',
            content:
              'Professor Al-Mansoor, in Problem 3.b, does the spectral density integral require assuming gamma = p/n in (0, 1) or does the empirical spectral distribution lemma extend naturally to the overparameterized gamma > 1 regime?',
            createdAt: '2026-11-16T11:20:00Z',
          },
          {
            id: 'msg-102-2',
            sender: 'support_agent',
            senderName: 'Academic Teaching Fellow',
            content:
              'Hello Priya! Yes, for gamma > 1, the Marchenko-Pastur distribution develops a point mass of weight 1 - 1/gamma at the origin lambda = 0. The continuous density formula remains valid for the non-zero spectral support [(1 - sqrt(gamma))^2, (1 + sqrt(gamma))^2].',
            createdAt: '2026-11-17T15:45:00Z',
          },
        ],
        aiSuggestedResponse:
          'In the overparameterized p > n regime (gamma > 1), rank(X) <= n, which guarantees exactly p - n zero eigenvalues. The Stieltjes transform captures this point mass at zero.',
        satisfactionRating: 5,
        customerFeedback: 'Extremely prompt and rigorous academic response! Saved me hours of confusion.',
      },
      {
        id: 'inq-103',
        customerName: 'Liam Zhao',
        customerEmail: 'l.zhao@mit.edu',
        subject: 'Surface Code Simulation Cluster Access & API Quota Increase',
        category: 'Technical Support',
        priority: 'high',
        status: 'pending',
        courseId: 'phys-410',
        createdAt: '2026-11-19T08:45:00Z',
        updatedAt: '2026-11-19T08:45:00Z',
        messages: [
          {
            id: 'msg-103-1',
            sender: 'customer',
            senderName: 'Liam Zhao',
            content:
              'Hi team, our MWPM decoding Monte Carlo simulations on d=7 rotated surface codes require 32 additional GPU hours on the campus cluster. Could you approve our compute quota allocation for this week?',
            createdAt: '2026-11-19T08:45:00Z',
          },
        ],
        aiSuggestedResponse:
          'Your GPU cluster allocation request for PHYS 410 has been validated against active lab quotas. An automatic 48-hour compute burst allocation is available for research-tier student accounts.',
      },
    ],
    chatbots: [
      {
        id: 'bot-advising-socrates',
        name: 'Socrates Advising AI',
        description: 'Academic advisor specializing in degree requirements, course prerequisites, and curriculum planning.',
        avatarIcon: 'graduation-cap',
        avatarColor: 'purple',
        category: 'Advisory',
        model: 'gemini-3.5-flash',
        temperature: 0.6,
        systemPrompt:
          'You are Socrates Advising AI, an academic advisor at EduSphere AI. You guide graduate and undergraduate scholars through course prerequisites, research milestones, degree requirements, and academic planning with precision, encouraging tone, and clear bullet points.',
        welcomeMessage:
          'Greetings, scholar! I am Socrates, your academic advising copilot. How can I assist you with your degree milestones, course prerequisites, or study plans today?',
        suggestedPrompts: [
          'What are the prerequisites for CS 482 Neural Systems?',
          'How should I balance 12 credits with graduate thesis research?',
          'Can you help me prepare an academic degree completion timeline?',
        ],
        knowledgeBaseCourseIds: ['cs-482', 'stat-390'],
        assignedInquiryCategories: ['Academic Advisory', 'General Inquiry'],
        isActive: true,
        autoReplyToInquiries: true,
        metrics: {
          conversationsCount: 142,
          resolvedTicketsCount: 88,
          avgSatisfaction: 4.9,
        },
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-18T16:00:00Z',
      },
      {
        id: 'bot-aegis-support',
        name: 'Aegis Customer & Support Bot',
        description: '24/7 technical and customer support triage bot for campus compute clusters, LMS access, and student tickets.',
        avatarIcon: 'shield',
        avatarColor: 'emerald',
        category: 'Student Support',
        model: 'gemini-3.5-flash',
        temperature: 0.5,
        systemPrompt:
          'You are Aegis Support Bot, a dedicated student service and technical support specialist for EduSphere AI. You resolve computing cluster issues, authentication errors, deadline extension inquiries, and ticketing triage promptly and courteously.',
        welcomeMessage:
          'Hello! Aegis Support Bot here. Need help with cluster access, syllabus policies, account credentials, or ticket status?',
        suggestedPrompts: [
          'How do I request an extension for an assignment?',
          'Why is my GPU cluster simulation session queued?',
          'Where can I check syllabus grading policy on late work?',
        ],
        knowledgeBaseCourseIds: ['phys-410'],
        assignedInquiryCategories: ['Technical Support', 'Billing & Account'],
        isActive: true,
        autoReplyToInquiries: true,
        metrics: {
          conversationsCount: 310,
          resolvedTicketsCount: 245,
          avgSatisfaction: 4.8,
        },
        createdAt: '2026-11-05T09:00:00Z',
        updatedAt: '2026-11-19T14:30:00Z',
      },
      {
        id: 'bot-hypatia-research',
        name: 'Hypatia Thesis Mentor',
        description: 'Advanced research mentor for LaTeX formulation, sparse mechanistic interpretability, and literature citations.',
        avatarIcon: 'sparkles',
        avatarColor: 'sky',
        category: 'Research Mentor',
        model: 'gemini-3.5-flash',
        temperature: 0.7,
        systemPrompt:
          'You are Hypatia Thesis Mentor, an expert research advisor for computational sciences and mathematics. You assist scholars with thesis methodology, rigorous theorem formulation, experimental designs, and literature review synthesis.',
        welcomeMessage:
          'Welcome to the Research Studio! I am Hypatia, ready to review your thesis chapters, formal proofs, or experimental ablation designs.',
        suggestedPrompts: [
          'Review my thesis Chapter 3 Cross-Modal Alignment Index formulation.',
          'How should I structure the causal ablation section in my methodology?',
          'Help me draft LaTeX equations for Top-K sparse autoencoders.',
        ],
        knowledgeBaseCourseIds: ['cs-482', 'stat-390', 'phys-410'],
        assignedInquiryCategories: ['Thesis & Research', 'Course Content'],
        isActive: true,
        autoReplyToInquiries: true,
        metrics: {
          conversationsCount: 89,
          resolvedTicketsCount: 62,
          avgSatisfaction: 5.0,
        },
        createdAt: '2026-11-08T12:00:00Z',
        updatedAt: '2026-11-19T18:00:00Z',
      },
    ],
  };
}

function normalizeSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  if (!snapshot.inquiries || !Array.isArray(snapshot.inquiries)) {
    snapshot.inquiries = createSeedData().inquiries;
  }
  if (!snapshot.chatbots || !Array.isArray(snapshot.chatbots)) {
    snapshot.chatbots = createSeedData().chatbots;
  }
  return snapshot;
}

export function readLocalDb(): WorkspaceSnapshot {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return normalizeSnapshot(JSON.parse(raw) as WorkspaceSnapshot);
    } catch {
      // fallback
    }
  }
  if (fs.existsSync(BUNDLED_DB_FILE)) {
    try {
      const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf8');
      const parsed = normalizeSnapshot(JSON.parse(raw) as WorkspaceSnapshot);
      if (IS_VERCEL) {
        try {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(DB_FILE, raw, 'utf8');
        } catch {
          // ignore in read-only environment
        }
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  const seed = createSeedData();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
  } catch {
    // ignore in read-only environment
  }
  return seed;
}

export function writeLocalDb(data: WorkspaceSnapshot): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // ignore in read-only environment
  }
}

/**
 * Fetches the entire workspace snapshot from Supabase PostgreSQL tables.
 * If connected with empty tables, automatically seeds Supabase from local database.
 */
async function fetchFromSupabase(): Promise<WorkspaceSnapshot | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const [
      { data: coursesData, error: cErr },
      { data: modulesData, error: mErr },
      { data: notesData, error: nErr },
      { data: cardsData, error: fErr },
      { data: tasksData, error: tErr },
      { data: chaptersData, error: chErr },
      { data: sessionsData, error: sErr },
      { data: scholarData },
      { data: inqData },
      { data: cbData },
    ] = await Promise.all([
      client.from('courses').select('*'),
      client.from('syllabus_modules').select('*').order('week', { ascending: true }),
      client.from('research_notes').select('*').order('updated_at', { ascending: false }),
      client.from('flashcards').select('*'),
      client.from('study_tasks').select('*').order('due_date', { ascending: true }),
      client.from('thesis_chapters').select('*').order('order_index', { ascending: true }),
      client.from('study_sessions').select('*').order('completed_at', { ascending: false }),
      client.from('scholar_profiles').select('*').limit(1).maybeSingle(),
      client.from('customer_inquiries').select('*').order('created_at', { ascending: false }),
      client.from('chatbots').select('*').order('created_at', { ascending: false }),
    ]);

    if (cErr || mErr || nErr || fErr || tErr || chErr || sErr) {
      console.warn(
        '[Supabase] Query warning:',
        cErr?.message ||
          mErr?.message ||
          nErr?.message ||
          fErr?.message ||
          tErr?.message ||
          chErr?.message ||
          sErr?.message
      );
      return null;
    }

    // Auto-seed if tables exist but no courses are recorded yet
    if (!coursesData || coursesData.length === 0) {
      console.log('[Supabase] Connected to Supabase with empty tables. Auto-seeding initial workspace...');
      try {
        const local = readLocalDb();
        await seedSupabaseFromSnapshot(local);
        return local;
      } catch (seedErr: any) {
        console.error('[Supabase] Auto-seed failed:', seedErr?.message);
        return null;
      }
    }

    const defaultScholar = createSeedData().scholar;
    const scholar = scholarData
      ? {
          name: scholarData.name || defaultScholar.name,
          program: scholarData.program || defaultScholar.program,
          institution: scholarData.institution || defaultScholar.institution,
          term: scholarData.term || defaultScholar.term,
          gpa: Number(scholarData.gpa ?? defaultScholar.gpa),
          avatarUrl: scholarData.avatar_url || defaultScholar.avatarUrl,
          thesisTitle: scholarData.thesis_title || defaultScholar.thesisTitle,
        }
      : defaultScholar;

    const modulesByCourse = new Map<string, SyllabusModule[]>();
    for (const m of modulesData ?? []) {
      const list = modulesByCourse.get(m.course_id) ?? [];
      list.push({
        id: m.id,
        courseId: m.course_id,
        week: m.week,
        title: m.title,
        topicSummary: m.topic_summary,
        completed: m.completed,
        dueDate: m.due_date,
      });
      modulesByCourse.set(m.course_id, list);
    }

    const courses: Course[] = coursesData.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      instructor: c.instructor,
      credits: Number(c.credits),
      term: c.term,
      status: c.status,
      grade: c.grade,
      currentScore: c.current_score,
      weeklyHoursTarget: Number(c.weekly_hours_target),
      imageUrl: c.image_url || '',
      description: c.description || '',
      modules: modulesByCourse.get(c.id) ?? [],
    }));

    return {
      scholar,
      courses,
      notes: (notesData ?? []).map((n) => ({
        id: n.id,
        courseId: n.course_id,
        title: n.title,
        authors: n.authors,
        year: n.year,
        publication: n.publication,
        citationKey: n.citation_key,
        summary: n.summary,
        body: n.body,
        tags: n.tags ?? [],
        updatedAt: n.updated_at,
      })),
      flashcards: (cardsData ?? []).map((f) => ({
        id: f.id,
        courseId: f.course_id,
        front: f.front,
        back: f.back,
        hint: f.hint,
        mastery: f.mastery,
        lastReviewedAt: f.last_reviewed_at,
      })),
      tasks: (tasksData ?? []).map((t) => ({
        id: t.id,
        courseId: t.course_id,
        title: t.title,
        type: t.type,
        dueDate: t.due_date,
        estimatedMinutes: t.estimated_minutes,
        priority: t.priority,
        status: t.status,
      })),
      thesisChapters: (chaptersData ?? []).map((ch) => ({
        id: ch.id,
        orderIndex: ch.order_index,
        title: ch.title,
        targetWords: ch.target_words,
        content: ch.content,
        status: ch.status,
        updatedAt: ch.updated_at,
      })),
      sessions: (sessionsData ?? []).map((s) => ({
        id: s.id,
        courseId: s.course_id,
        durationMinutes: s.duration_minutes,
        focusTopic: s.focus_topic,
        completedAt: s.completed_at,
      })),
      inquiries:
        inqData && inqData.length > 0
          ? inqData.map((iq) => ({
              id: iq.id,
              customerName: iq.customer_name,
              customerEmail: iq.customer_email,
              subject: iq.subject,
              category: iq.category,
              priority: iq.priority,
              status: iq.status,
              courseId: iq.course_id || undefined,
              messages: Array.isArray(iq.messages) ? iq.messages : [],
              aiSuggestedResponse: iq.ai_suggested_response || '',
              satisfactionRating: iq.satisfaction_rating || undefined,
              customerFeedback: iq.customer_feedback || '',
              createdAt: iq.created_at,
              updatedAt: iq.updated_at,
            }))
          : readLocalDb().inquiries,
      chatbots:
        cbData && cbData.length > 0
          ? cbData.map((cb) => ({
              id: cb.id,
              name: cb.name,
              description: cb.description || '',
              avatarIcon: cb.avatar_icon || 'bot',
              avatarColor: cb.avatar_color || 'purple',
              category: cb.category,
              model: cb.model || 'gemini-4-hydrogen',
              temperature: Number(cb.temperature ?? 0.7),
              systemPrompt: cb.system_prompt || '',
              welcomeMessage: cb.welcome_message || '',
              suggestedPrompts: Array.isArray(cb.suggested_prompts) ? cb.suggested_prompts : [],
              knowledgeBaseCourseIds: Array.isArray(cb.knowledge_base_course_ids) ? cb.knowledge_base_course_ids : [],
              assignedInquiryCategories: Array.isArray(cb.assigned_inquiry_categories) ? cb.assigned_inquiry_categories : [],
              isActive: cb.is_active !== false,
              autoReplyToInquiries: cb.auto_reply_to_inquiries === true,
              metrics: cb.metrics || { conversationsCount: 0, resolvedTicketsCount: 0, avgSatisfaction: 5.0 },
              createdAt: cb.created_at,
              updatedAt: cb.updated_at,
            }))
          : readLocalDb().chatbots,
    };
  } catch (err: any) {
    console.error('[Supabase] Unexpected error fetching workspace:', err);
    return null;
  }
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const remote = await fetchFromSupabase();
  if (remote) return remote;
  return readLocalDb();
}

export async function createCourse(course: Course): Promise<Course> {
  const db = readLocalDb();
  db.courses.unshift(course);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error: cErr } = await client.from('courses').insert({
      id: course.id,
      code: course.code,
      title: course.title,
      instructor: course.instructor,
      credits: course.credits,
      term: course.term,
      status: course.status,
      grade: course.grade,
      current_score: course.currentScore,
      weekly_hours_target: course.weeklyHoursTarget,
      image_url: course.imageUrl,
      description: course.description,
    });
    if (cErr) {
      console.error('[Supabase] Failed to insert course:', cErr.message);
    } else if (course.modules && course.modules.length > 0) {
      const moduleInserts = course.modules.map((m) => ({
        id: m.id,
        course_id: course.id,
        week: m.week,
        title: m.title,
        topic_summary: m.topicSummary,
        completed: m.completed,
        due_date: m.dueDate,
      }));
      const { error: mErr } = await client.from('syllabus_modules').insert(moduleInserts);
      if (mErr) console.error('[Supabase] Failed to insert initial modules:', mErr.message);
    }
  }
  return course;
}

export async function deleteCourse(courseId: string): Promise<void> {
  const db = readLocalDb();
  db.courses = db.courses.filter((c) => c.id !== courseId);
  db.notes = db.notes.filter((n) => n.courseId !== courseId);
  db.flashcards = db.flashcards.filter((f) => f.courseId !== courseId);
  db.tasks = db.tasks.filter((t) => t.courseId !== courseId);
  db.sessions = db.sessions.filter((s) => s.courseId !== courseId);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('courses').delete().eq('id', courseId);
    if (error) console.error('[Supabase] Failed to delete course:', error.message);
  }
}

export async function toggleSyllabusModule(
  courseId: string,
  moduleId: string,
  completed: boolean
): Promise<SyllabusModule | null> {
  const db = readLocalDb();
  const course = db.courses.find((c) => c.id === courseId);
  if (!course) return null;
  const mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) return null;
  mod.completed = completed;
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('syllabus_modules')
      .update({ completed })
      .eq('id', moduleId);
    if (error) console.error('[Supabase] Failed to update module status:', error.message);
  }
  return mod;
}

export async function addSyllabusModule(mod: SyllabusModule): Promise<SyllabusModule | null> {
  const db = readLocalDb();
  const course = db.courses.find((c) => c.id === mod.courseId);
  if (!course) return null;
  course.modules.push(mod);
  course.modules.sort((a, b) => a.week - b.week);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('syllabus_modules').insert({
      id: mod.id,
      course_id: mod.courseId,
      week: mod.week,
      title: mod.title,
      topic_summary: mod.topicSummary,
      completed: mod.completed,
      due_date: mod.dueDate,
    });
    if (error) console.error('[Supabase] Failed to add syllabus module:', error.message);
  }
  return mod;
}

export async function createOrUpdateNote(note: ResearchNote): Promise<ResearchNote> {
  const db = readLocalDb();
  const idx = db.notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    db.notes[idx] = note;
  } else {
    db.notes.unshift(note);
  }
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('research_notes').upsert({
      id: note.id,
      course_id: note.courseId,
      title: note.title,
      authors: note.authors,
      year: note.year,
      publication: note.publication,
      citation_key: note.citationKey,
      summary: note.summary,
      body: note.body,
      tags: note.tags,
      updated_at: note.updatedAt,
    });
    if (error) console.error('[Supabase] Failed to upsert note:', error.message);
  }
  return note;
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = readLocalDb();
  db.notes = db.notes.filter((n) => n.id !== noteId);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('research_notes').delete().eq('id', noteId);
    if (error) console.error('[Supabase] Failed to delete note:', error.message);
  }
}

export async function addFlashcards(cards: Flashcard[]): Promise<Flashcard[]> {
  const db = readLocalDb();
  db.flashcards.unshift(...cards);
  writeLocalDb(db);

  const client = getSupabase();
  if (client && cards.length > 0) {
    const { error } = await client.from('flashcards').insert(
      cards.map((c) => ({
        id: c.id,
        course_id: c.courseId,
        front: c.front,
        back: c.back,
        hint: c.hint,
        mastery: c.mastery,
        last_reviewed_at: c.lastReviewedAt,
      }))
    );
    if (error) console.error('[Supabase] Failed to insert flashcards:', error.message);
  }
  return cards;
}

export async function deleteFlashcard(cardId: string): Promise<void> {
  const db = readLocalDb();
  db.flashcards = db.flashcards.filter((f) => f.id !== cardId);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('flashcards').delete().eq('id', cardId);
    if (error) console.error('[Supabase] Failed to delete flashcard:', error.message);
  }
}

export async function updateFlashcardMastery(
  cardId: string,
  mastery: 0 | 1 | 2 | 3
): Promise<Flashcard | null> {
  const db = readLocalDb();
  const card = db.flashcards.find((f) => f.id === cardId);
  if (!card) return null;
  card.mastery = mastery;
  card.lastReviewedAt = new Date().toISOString();
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('flashcards')
      .update({ mastery, last_reviewed_at: card.lastReviewedAt })
      .eq('id', cardId);
    if (error) console.error('[Supabase] Failed to update flashcard mastery:', error.message);
  }
  return card;
}

export async function createOrUpdateTask(task: StudyTask): Promise<StudyTask> {
  const db = readLocalDb();
  const idx = db.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    db.tasks[idx] = task;
  } else {
    db.tasks.unshift(task);
  }
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('study_tasks').upsert({
      id: task.id,
      course_id: task.courseId,
      title: task.title,
      type: task.type,
      due_date: task.dueDate,
      estimated_minutes: task.estimatedMinutes,
      priority: task.priority,
      status: task.status,
    });
    if (error) console.error('[Supabase] Failed to upsert study task:', error.message);
  }
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = readLocalDb();
  db.tasks = db.tasks.filter((t) => t.id !== taskId);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('study_tasks').delete().eq('id', taskId);
    if (error) console.error('[Supabase] Failed to delete study task:', error.message);
  }
}

export async function updateThesisChapter(chapter: ThesisChapter): Promise<ThesisChapter> {
  const db = readLocalDb();
  const idx = db.thesisChapters.findIndex((c) => c.id === chapter.id);
  if (idx >= 0) {
    db.thesisChapters[idx] = chapter;
  } else {
    db.thesisChapters.push(chapter);
    db.thesisChapters.sort((a, b) => a.orderIndex - b.orderIndex);
  }
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('thesis_chapters').upsert({
      id: chapter.id,
      order_index: chapter.orderIndex,
      title: chapter.title,
      target_words: chapter.targetWords,
      content: chapter.content,
      status: chapter.status,
      updated_at: chapter.updatedAt,
    });
    if (error) console.error('[Supabase] Failed to upsert thesis chapter:', error.message);
  }
  return chapter;
}

export async function recordStudySession(session: StudySession): Promise<StudySession> {
  const db = readLocalDb();
  db.sessions.unshift(session);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('study_sessions').insert({
      id: session.id,
      course_id: session.courseId,
      duration_minutes: session.durationMinutes,
      focus_topic: session.focusTopic,
      completed_at: session.completedAt,
    });
    if (error) console.error('[Supabase] Failed to insert study session:', error.message);
  }
  return session;
}

export function generateAiSuggestedInquiryResponse(
  category: string,
  subject: string,
  customerMessage: string
): string {
  try {
    const db = readLocalDb();
    const assignedBot = db.chatbots?.find(
      (b) =>
        b.isActive &&
        b.autoReplyToInquiries &&
        b.assignedInquiryCategories.includes(category as InquiryCategory)
    );
    if (assignedBot) {
      return `[${assignedBot.name} Auto-Response]: Hello! Regarding your inquiry "${subject}": ${
        assignedBot.category === 'Advisory'
          ? 'We have reviewed your curriculum milestones and recommended prerequisite paths. Please verify against your registered coursework in the portal.'
          : assignedBot.category === 'Student Support'
          ? 'Our automated helpdesk has checked system logs. Please ensure your authentication tokens and lab access permissions are active.'
          : assignedBot.category === 'Research Mentor'
          ? 'Your research methodology inquiry has been reviewed. Ensure your LaTeX derivations adhere to thesis committee standards and include empirical error bounds.'
          : 'Thank you for reaching out. We have logged your request and prioritized it according to our response policy.'
      }`;
    }
  } catch {
    // fallback
  }

  switch (category) {
    case 'Academic Advisory':
      return `Thank you for reaching out to EduSphere Academic Advisory regarding "${subject}". Based on your course curriculum and academic milestones, we recommend reviewing the syllabus schedule for prerequisites and scheduling a 15-minute sync with the course director during posted office hours.`;
    case 'Course Content':
      return `Regarding your inquiry on "${subject}": In this coursework unit, the theoretical derivation builds directly upon foundational principles. Please verify your working steps against the supplementary seminar notes, and feel free to submit specific derivation checkpoints for further evaluation.`;
    case 'Thesis & Research':
      return `Thank you for your research update on "${subject}". Your proposed methodology and experimental formulation align well with graduate thesis guidelines. Ensure that all empirical evaluations report confidence intervals, and reference the citation style guide in the Thesis Studio.`;
    case 'Technical Support':
      return `Hello! Your technical inquiry regarding "${subject}" has been received. Our compute infrastructure team has checked current cluster availability and authentication tokens. Please ensure your environment secrets match your student profile credentials.`;
    case 'Billing & Account':
      return `Thank you for contacting Student Services regarding "${subject}". Your enrollment verification and laboratory access tier have been reviewed. No outstanding administrative holds exist on your academic account.`;
    default:
      return `Thank you for reaching out to EduSphere Academic Support regarding "${subject}". We have logged your request and a faculty advisor or support specialist will review your inquiry shortly.`;
  }
}

export async function getCustomerInquiries(): Promise<CustomerInquiry[]> {
  const snapshot = await getWorkspaceSnapshot();
  return snapshot.inquiries || [];
}

export async function createCustomerInquiry(
  payload: Partial<CustomerInquiry> & { message?: string }
): Promise<CustomerInquiry> {
  const db = readLocalDb();
  if (!db.inquiries) db.inquiries = [];

  const now = new Date().toISOString();
  const initialContent =
    payload.message?.trim() ||
    payload.messages?.[0]?.content?.trim() ||
    'No inquiry description provided.';

  const aiDraft = generateAiSuggestedInquiryResponse(
    payload.category || 'General Inquiry',
    payload.subject?.trim() || 'Academic Inquiry',
    initialContent
  );

  const inquiry: CustomerInquiry = {
    id: payload.id || `inq-${Date.now()}`,
    customerName: payload.customerName?.trim() || 'Student Scholar',
    customerEmail: payload.customerEmail?.trim() || 'scholar@university.edu',
    subject: payload.subject?.trim() || 'Academic Inquiry',
    category: (payload.category as InquiryCategory) || 'General Inquiry',
    priority: (payload.priority as InquiryPriority) || 'medium',
    status: 'pending',
    courseId: payload.courseId || undefined,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        sender: 'customer',
        senderName: payload.customerName?.trim() || 'Student Scholar',
        content: initialContent,
        createdAt: now,
      },
    ],
    aiSuggestedResponse: aiDraft,
  };

  db.inquiries.unshift(inquiry);
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('customer_inquiries').insert({
      id: inquiry.id,
      customer_name: inquiry.customerName,
      customer_email: inquiry.customerEmail,
      subject: inquiry.subject,
      category: inquiry.category,
      priority: inquiry.priority,
      status: inquiry.status,
      course_id: inquiry.courseId || null,
      messages: inquiry.messages,
      ai_suggested_response: inquiry.aiSuggestedResponse,
      satisfaction_rating: null,
      customer_feedback: '',
      created_at: inquiry.createdAt,
      updated_at: inquiry.updatedAt,
    });
    if (error) console.error('[Supabase] Failed to insert customer inquiry:', error.message);
  }

  return inquiry;
}

export async function addInquiryReply(
  inquiryId: string,
  reply: { content: string; sender: 'customer' | 'support_agent'; senderName: string }
): Promise<CustomerInquiry | null> {
  const db = readLocalDb();
  if (!db.inquiries) db.inquiries = [];
  const inq = db.inquiries.find((i) => i.id === inquiryId);
  if (!inq) return null;

  const now = new Date().toISOString();
  const newMessage: InquiryMessage = {
    id: `msg-${Date.now()}`,
    sender: reply.sender,
    senderName: reply.senderName,
    content: reply.content.trim(),
    createdAt: now,
  };

  inq.messages.push(newMessage);
  inq.updatedAt = now;
  if (reply.sender === 'support_agent' && inq.status === 'pending') {
    inq.status = 'responded';
  }
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('customer_inquiries')
      .update({
        messages: inq.messages,
        status: inq.status,
        updated_at: inq.updatedAt,
      })
      .eq('id', inquiryId);
    if (error) console.error('[Supabase] Failed to update inquiry reply:', error.message);
  }

  return inq;
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
): Promise<CustomerInquiry | null> {
  const db = readLocalDb();
  if (!db.inquiries) db.inquiries = [];
  const inq = db.inquiries.find((i) => i.id === inquiryId);
  if (!inq) return null;

  inq.status = status;
  inq.updatedAt = new Date().toISOString();
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('customer_inquiries')
      .update({ status: inq.status, updated_at: inq.updatedAt })
      .eq('id', inquiryId);
    if (error) console.error('[Supabase] Failed to update inquiry status:', error.message);
  }

  return inq;
}

export async function rateInquiryResponse(
  inquiryId: string,
  rating: number,
  feedback?: string
): Promise<CustomerInquiry | null> {
  const db = readLocalDb();
  if (!db.inquiries) db.inquiries = [];
  const inq = db.inquiries.find((i) => i.id === inquiryId);
  if (!inq) return null;

  inq.satisfactionRating = Math.min(Math.max(Number(rating), 1), 5);
  if (feedback !== undefined) inq.customerFeedback = feedback.trim();
  inq.updatedAt = new Date().toISOString();
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('customer_inquiries')
      .update({
        satisfaction_rating: inq.satisfactionRating,
        customer_feedback: inq.customerFeedback,
        updated_at: inq.updatedAt,
      })
      .eq('id', inquiryId);
    if (error) console.error('[Supabase] Failed to rate inquiry:', error.message);
  }

  return inq;
}

export async function deleteCustomerInquiry(inquiryId: string): Promise<boolean> {
  const db = readLocalDb();
  if (!db.inquiries) db.inquiries = [];
  const initialLen = db.inquiries.length;
  db.inquiries = db.inquiries.filter((i) => i.id !== inquiryId);
  const deleted = db.inquiries.length < initialLen;
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('customer_inquiries').delete().eq('id', inquiryId);
    if (error) console.error('[Supabase] Failed to delete customer inquiry:', error.message);
  }
  return deleted;
}

// AI Chatbots & Auto-Responder Store Methods
export async function getChatbots(): Promise<ChatbotConfig[]> {
  const snapshot = await getWorkspaceSnapshot();
  return snapshot.chatbots || [];
}

export async function createOrUpdateChatbot(
  payload: Partial<ChatbotConfig>
): Promise<ChatbotConfig> {
  const db = readLocalDb();
  if (!db.chatbots) db.chatbots = [];

  const now = new Date().toISOString();
  let bot: ChatbotConfig;

  if (payload.id) {
    const existingIdx = db.chatbots.findIndex((b) => b.id === payload.id);
    if (existingIdx >= 0) {
      bot = {
        ...db.chatbots[existingIdx],
        ...payload,
        updatedAt: now,
      } as ChatbotConfig;
      db.chatbots[existingIdx] = bot;
    } else {
      bot = {
        id: payload.id,
        name: payload.name || 'New AI Assistant',
        description: payload.description || '',
        avatarIcon: payload.avatarIcon || 'bot',
        avatarColor: payload.avatarColor || 'purple',
        category: payload.category || 'Student Support',
        model: payload.model || 'gemini-4-hydrogen',
        temperature: Number(payload.temperature ?? 0.7),
        systemPrompt: payload.systemPrompt || '',
        welcomeMessage: payload.welcomeMessage || 'Hello! How can I assist you?',
        suggestedPrompts: payload.suggestedPrompts || [],
        knowledgeBaseCourseIds: payload.knowledgeBaseCourseIds || [],
        assignedInquiryCategories: payload.assignedInquiryCategories || [],
        isActive: payload.isActive !== false,
        autoReplyToInquiries: payload.autoReplyToInquiries === true,
        metrics: payload.metrics || { conversationsCount: 0, resolvedTicketsCount: 0, avgSatisfaction: 5.0 },
        createdAt: now,
        updatedAt: now,
      };
      db.chatbots.unshift(bot);
    }
  } else {
    bot = {
      id: `bot-${Date.now()}`,
      name: payload.name?.trim() || 'New AI Assistant',
      description: payload.description?.trim() || '',
      avatarIcon: payload.avatarIcon || 'bot',
      avatarColor: payload.avatarColor || 'purple',
      category: payload.category || 'Student Support',
      model: payload.model || 'gemini-4-hydrogen',
      temperature: Number(payload.temperature ?? 0.7),
      systemPrompt: payload.systemPrompt || '',
      welcomeMessage: payload.welcomeMessage || 'Hello! How can I assist you?',
      suggestedPrompts: payload.suggestedPrompts || [],
      knowledgeBaseCourseIds: payload.knowledgeBaseCourseIds || [],
      assignedInquiryCategories: payload.assignedInquiryCategories || [],
      isActive: payload.isActive !== false,
      autoReplyToInquiries: payload.autoReplyToInquiries === true,
      metrics: { conversationsCount: 0, resolvedTicketsCount: 0, avgSatisfaction: 5.0 },
      createdAt: now,
      updatedAt: now,
    };
    db.chatbots.unshift(bot);
  }

  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('chatbots').upsert(
      {
        id: bot.id,
        name: bot.name,
        description: bot.description,
        avatar_icon: bot.avatarIcon,
        avatar_color: bot.avatarColor,
        category: bot.category,
        model: bot.model,
        temperature: bot.temperature,
        system_prompt: bot.systemPrompt,
        welcome_message: bot.welcomeMessage,
        suggested_prompts: bot.suggestedPrompts,
        knowledge_base_course_ids: bot.knowledgeBaseCourseIds,
        assigned_inquiry_categories: bot.assignedInquiryCategories,
        is_active: bot.isActive,
        auto_reply_to_inquiries: bot.autoReplyToInquiries,
        metrics: bot.metrics,
        created_at: bot.createdAt,
        updated_at: bot.updatedAt,
      },
      { onConflict: 'id' }
    );
    if (error) console.error('[Supabase] Failed to upsert chatbot:', error.message);
  }

  return bot;
}

export async function deleteChatbot(botId: string): Promise<boolean> {
  const db = readLocalDb();
  if (!db.chatbots) db.chatbots = [];
  const initialLen = db.chatbots.length;
  db.chatbots = db.chatbots.filter((b) => b.id !== botId);
  const deleted = db.chatbots.length < initialLen;
  writeLocalDb(db);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('chatbots').delete().eq('id', botId);
    if (error) console.error('[Supabase] Failed to delete chatbot:', error.message);
  }
  return deleted;
}
