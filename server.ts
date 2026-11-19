import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  addFlashcards,
  addSyllabusModule,
  createCourse,
  createOrUpdateNote,
  createOrUpdateTask,
  deleteNote,
  deleteTask,
  getWorkspaceSnapshot,
  recordStudySession,
  toggleSyllabusModule,
  updateFlashcardMastery,
  updateThesisChapter,
} from './src/server/store.ts';
import type {
  Course,
  Flashcard,
  ResearchNote,
  StudySession,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
} from './src/types.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Workspace Data API
app.get('/api/workspace', async (_req, res) => {
  try {
    const snapshot = await getWorkspaceSnapshot();
    res.json(snapshot);
  } catch (err: any) {
    console.error('Failed to load workspace:', err);
    res.status(500).json({ error: err?.message || 'Failed to load workspace' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const body = req.body as Partial<Course>;
    if (!body.code || !body.title) {
      return res.status(400).json({ error: 'Course code and title are required.' });
    }
    const course: Course = {
      id: body.id || `course-${Date.now()}`,
      code: body.code.trim(),
      title: body.title.trim(),
      instructor: body.instructor?.trim() || 'Faculty Instructor',
      credits: Number(body.credits ?? 3.0),
      term: body.term?.trim() || 'Fall 2026',
      status: body.status === 'completed' ? 'completed' : 'active',
      grade: body.grade?.trim() || 'In Progress',
      currentScore: Number(body.currentScore ?? 92),
      weeklyHoursTarget: Number(body.weeklyHoursTarget ?? 6),
      imageUrl: body.imageUrl || '',
      description: body.description?.trim() || '',
      modules: Array.isArray(body.modules) ? body.modules : [],
    };
    const created = await createCourse(course);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create course' });
  }
});

app.patch('/api/courses/:courseId/modules/:moduleId', async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { completed } = req.body as { completed: boolean };
    const updated = await toggleSyllabusModule(courseId, moduleId, Boolean(completed));
    if (!updated) return res.status(404).json({ error: 'Module not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update module' });
  }
});

app.post('/api/courses/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const body = req.body as Partial<SyllabusModule>;
    if (!body.title) {
      return res.status(400).json({ error: 'Module title is required.' });
    }
    const mod: SyllabusModule = {
      id: `mod-${Date.now()}`,
      courseId,
      week: Number(body.week ?? 1),
      title: body.title.trim(),
      topicSummary: body.topicSummary?.trim() || '',
      completed: Boolean(body.completed),
      dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
    };
    const created = await addSyllabusModule(mod);
    if (!created) return res.status(404).json({ error: 'Course not found' });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add syllabus module' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const body = req.body as Partial<ResearchNote>;
    if (!body.title || !body.courseId) {
      return res.status(400).json({ error: 'Title and courseId are required.' });
    }
    const note: ResearchNote = {
      id: body.id || `note-${Date.now()}`,
      courseId: body.courseId,
      title: body.title.trim(),
      authors: body.authors?.trim() || 'Self-Authored Synthesis',
      year: body.year?.trim() || '2026',
      publication: body.publication?.trim() || 'Course Research Archive',
      citationKey: body.citationKey?.trim() || `note${Date.now().toString().slice(-4)}`,
      summary: body.summary?.trim() || '',
      body: body.body?.trim() || '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      updatedAt: new Date().toISOString(),
    };
    const saved = await createOrUpdateNote(note);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save research note' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await deleteNote(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete note' });
  }
});

app.post('/api/flashcards', async (req, res) => {
  try {
    const body = req.body as Partial<Flashcard>;
    if (!body.courseId || !body.front || !body.back) {
      return res.status(400).json({ error: 'courseId, front, and back are required.' });
    }
    const card: Flashcard = {
      id: `fc-${Date.now()}`,
      courseId: body.courseId,
      front: body.front.trim(),
      back: body.back.trim(),
      hint: body.hint?.trim() || '',
      mastery: 0,
      lastReviewedAt: null,
    };
    const [saved] = await addFlashcards([card]);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create flashcard' });
  }
});

app.patch('/api/flashcards/:id', async (req, res) => {
  try {
    const mastery = Number(req.body?.mastery) as 0 | 1 | 2 | 3;
    const updated = await updateFlashcardMastery(req.params.id, mastery);
    if (!updated) return res.status(404).json({ error: 'Flashcard not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update flashcard' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const body = req.body as Partial<StudyTask>;
    if (!body.title || !body.courseId) {
      return res.status(400).json({ error: 'Title and courseId are required.' });
    }
    const task: StudyTask = {
      id: body.id || `task-${Date.now()}`,
      courseId: body.courseId,
      title: body.title.trim(),
      type: body.type || 'Assignment',
      dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
      estimatedMinutes: Number(body.estimatedMinutes ?? 60),
      priority: body.priority || 'medium',
      status: body.status || 'todo',
    };
    const saved = await createOrUpdateTask(task);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete task' });
  }
});

app.put('/api/thesis/chapters/:id', async (req, res) => {
  try {
    const body = req.body as Partial<ThesisChapter>;
    const chapter: ThesisChapter = {
      id: req.params.id,
      orderIndex: Number(body.orderIndex ?? 1),
      title: body.title?.trim() || 'Untitled Chapter',
      targetWords: Number(body.targetWords ?? 1500),
      content: body.content ?? '',
      status: body.status || 'Drafting',
      updatedAt: new Date().toISOString(),
    };
    const saved = await updateThesisChapter(chapter);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save thesis chapter' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const body = req.body as Partial<StudySession>;
    if (!body.courseId || !body.durationMinutes) {
      return res.status(400).json({ error: 'courseId and durationMinutes are required.' });
    }
    const session: StudySession = {
      id: `sess-${Date.now()}`,
      courseId: body.courseId,
      durationMinutes: Number(body.durationMinutes),
      focusTopic: body.focusTopic?.trim() || 'Focused Study Block',
      completedAt: new Date().toISOString(),
    };
    const saved = await recordStudySession(session);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record session' });
  }
});

// Gemini AI Copilot Endpoints
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { prompt, mode = 'synthesis', contextText = '' } = req.body as {
      prompt?: string;
      mode?: string;
      contextText?: string;
    };
    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const modeDirectives: Record<string, string> = {
      synthesis:
        'Synthesize concepts concisely with rigorous academic precision, clear bullet points, and explicit theoretical connections.',
      explain:
        'Explain the concept step-by-step from first principles, including mathematical intuition and common pitfalls.',
      thesis:
        'Critique structure, clarity, methodological rigor, and suggest concrete improvements for graduate-level academic prose.',
      plan:
        'Create a realistic, prioritized study execution plan broken into timed milestones and active recall checkpoints.',
    };

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: contextText
        ? `Academic Context:\n${contextText}\n\nRequest:\n${prompt}`
        : prompt,
      config: {
        systemInstruction: `You are EduSphere AI, an academic research and study copilot. ${
          modeDirectives[mode] || modeDirectives.synthesis
        } Keep responses well-structured, direct, and grounded in academic rigor.`,
      },
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Gemini copilot error:', err);
    res.status(500).json({
      error: err?.message || 'Unable to reach Gemini AI service. Check GEMINI_API_KEY in Settings > Secrets.',
    });
  }
});

app.post('/api/ai/flashcards', async (req, res) => {
  try {
    const { courseId, topic, count = 4 } = req.body as {
      courseId?: string;
      topic?: string;
      count?: number;
    };
    if (!courseId || !topic?.trim()) {
      return res.status(400).json({ error: 'courseId and topic are required.' });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate ${Math.min(Math.max(Number(count), 2), 8)} rigorous university-level active-recall flashcards on the topic: "${topic}". Each card should test deep conceptual understanding rather than trivia.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: 'Clear question or prompt on the front of the flashcard.' },
              back: { type: Type.STRING, description: 'Concise, accurate academic answer on the back.' },
              hint: { type: Type.STRING, description: 'A subtle clue without giving away the answer.' },
            },
            required: ['front', 'back', 'hint'],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
      front: string;
      back: string;
      hint: string;
    }>;

    const cards: Flashcard[] = parsed.map((item, idx) => ({
      id: `fc-${Date.now()}-${idx}`,
      courseId,
      front: item.front,
      back: item.back,
      hint: item.hint,
      mastery: 0,
      lastReviewedAt: null,
    }));

    const saved = await addFlashcards(cards);
    res.status(201).json(saved);
  } catch (err: any) {
    console.error('Gemini flashcard generation error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate flashcards with Gemini.',
    });
  }
});

app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { topic, courseTitle } = req.body as { topic?: string; courseTitle?: string };
    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Create a 4-question multiple-choice diagnostic quiz for the course "${
        courseTitle || 'Graduate Seminar'
      }" focused on "${topic}". Provide 4 plausible options per question and a concise explanation for the correct answer.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctIndex', 'explanation'],
          },
        },
      },
    });

    const questions = JSON.parse((response.text ?? '[]').trim());
    res.json(questions);
  } catch (err: any) {
    console.error('Gemini quiz error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate practice quiz.',
    });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`EduSphere AI server running on http://0.0.0.0:${port}`);
  });
}

startServer();
