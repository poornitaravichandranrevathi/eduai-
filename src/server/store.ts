import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Course,
  Flashcard,
  ResearchNote,
  StudySession,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
  WorkspaceSnapshot,
} from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'edusphere-db.json');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function createSeedData(): WorkspaceSnapshot {
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
  };
}

function readLocalDb(): WorkspaceSnapshot {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as WorkspaceSnapshot;
  } catch {
    const seed = createSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

function writeLocalDb(data: WorkspaceSnapshot): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function fetchFromSupabase(): Promise<WorkspaceSnapshot | null> {
  if (!supabase) return null;
  try {
    const [
      { data: coursesData, error: cErr },
      { data: modulesData, error: mErr },
      { data: notesData, error: nErr },
      { data: cardsData, error: fErr },
      { data: tasksData, error: tErr },
      { data: chaptersData, error: chErr },
      { data: sessionsData, error: sErr },
    ] = await Promise.all([
      supabase.from('courses').select('*'),
      supabase.from('syllabus_modules').select('*').order('week', { ascending: true }),
      supabase.from('research_notes').select('*').order('updated_at', { ascending: false }),
      supabase.from('flashcards').select('*'),
      supabase.from('study_tasks').select('*').order('due_date', { ascending: true }),
      supabase.from('thesis_chapters').select('*').order('order_index', { ascending: true }),
      supabase.from('study_sessions').select('*').order('completed_at', { ascending: false }),
    ]);

    if (cErr || mErr || nErr || fErr || tErr || chErr || sErr || !coursesData?.length) {
      return null;
    }

    const seed = createSeedData();
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
      scholar: seed.scholar,
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
    };
  } catch {
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

  if (supabase) {
    await supabase.from('courses').insert({
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
  }
  return course;
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

  if (supabase) {
    await supabase.from('syllabus_modules').update({ completed }).eq('id', moduleId);
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

  if (supabase) {
    await supabase.from('syllabus_modules').insert({
      id: mod.id,
      course_id: mod.courseId,
      week: mod.week,
      title: mod.title,
      topic_summary: mod.topicSummary,
      completed: mod.completed,
      due_date: mod.dueDate,
    });
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

  if (supabase) {
    await supabase.from('research_notes').upsert({
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
  }
  return note;
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = readLocalDb();
  db.notes = db.notes.filter((n) => n.id !== noteId);
  writeLocalDb(db);

  if (supabase) {
    await supabase.from('research_notes').delete().eq('id', noteId);
  }
}

export async function addFlashcards(cards: Flashcard[]): Promise<Flashcard[]> {
  const db = readLocalDb();
  db.flashcards.unshift(...cards);
  writeLocalDb(db);

  if (supabase && cards.length > 0) {
    await supabase.from('flashcards').insert(
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
  }
  return cards;
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

  if (supabase) {
    await supabase
      .from('flashcards')
      .update({ mastery, last_reviewed_at: card.lastReviewedAt })
      .eq('id', cardId);
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

  if (supabase) {
    await supabase.from('study_tasks').upsert({
      id: task.id,
      course_id: task.courseId,
      title: task.title,
      type: task.type,
      due_date: task.dueDate,
      estimated_minutes: task.estimatedMinutes,
      priority: task.priority,
      status: task.status,
    });
  }
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = readLocalDb();
  db.tasks = db.tasks.filter((t) => t.id !== taskId);
  writeLocalDb(db);

  if (supabase) {
    await supabase.from('study_tasks').delete().eq('id', taskId);
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

  if (supabase) {
    await supabase.from('thesis_chapters').upsert({
      id: chapter.id,
      order_index: chapter.orderIndex,
      title: chapter.title,
      target_words: chapter.targetWords,
      content: chapter.content,
      status: chapter.status,
      updated_at: chapter.updatedAt,
    });
  }
  return chapter;
}

export async function recordStudySession(session: StudySession): Promise<StudySession> {
  const db = readLocalDb();
  db.sessions.unshift(session);
  writeLocalDb(db);

  if (supabase) {
    await supabase.from('study_sessions').insert({
      id: session.id,
      course_id: session.courseId,
      duration_minutes: session.durationMinutes,
      focus_topic: session.focusTopic,
      completed_at: session.completedAt,
    });
  }
  return session;
}
