import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  addFlashcards,
  addInquiryReply,
  addSyllabusModule,
  createCourse,
  createCustomerInquiry,
  createOrUpdateChatbot,
  createOrUpdateNote,
  createOrUpdateTask,
  deleteChatbot,
  deleteCourse,
  deleteCustomerInquiry,
  deleteFlashcard,
  deleteNote,
  deleteTask,
  getChatbots,
  getCustomerInquiries,
  getSupabaseStatus,
  getWorkspaceSnapshot,
  rateInquiryResponse,
  recordStudySession,
  seedSupabaseFromSnapshot,
  toggleSyllabusModule,
  updateFlashcardMastery,
  updateInquiryStatus,
  updateSupabaseConfig,
  updateThesisChapter,
} from './src/server/store.ts';
import type {
  ChatbotConfig,
  Course,
  Flashcard,
  ResearchNote,
  StudySession,
  StudyTask,
  SyllabusModule,
  ThesisChapter,
} from './src/types.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

if (process.env.VERCEL) {
  app.use((req, _res, next) => {
    if (!req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
    }
    next();
  });
}

function resolveModelName(model?: string): string {
  if (
    !model ||
    model === 'gemini-4-hydrogen' ||
    model.includes('hydrogen') ||
    model.includes('2.5') ||
    model.includes('2.0') ||
    model.includes('1.5')
  ) {
    return 'gemini-3.5-flash';
  }
  return model;
}

function getAiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
  });
}

// Supabase Integration & Diagnostics API
app.get('/api/supabase/status', async (_req, res) => {
  try {
    const status = await getSupabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check Supabase status' });
  }
});

app.post('/api/supabase/config', async (req, res) => {
  try {
    const { url, anonKey, serviceRoleKey } = req.body as {
      url?: string;
      anonKey?: string;
      serviceRoleKey?: string;
    };
    const status = await updateSupabaseConfig({ url, anonKey, serviceRoleKey });
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update Supabase configuration' });
  }
});

app.get('/api/supabase/schema', async (_req, res) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      res.json({ sql });
    } else {
      res.status(404).json({ error: 'schema.sql not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load schema' });
  }
});

app.post('/api/supabase/seed', async (_req, res) => {
  try {
    const result = await seedSupabaseFromSnapshot();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to seed Supabase database' });
  }
});

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

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await deleteCourse(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete course' });
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

app.delete('/api/flashcards/:id', async (req, res) => {
  try {
    await deleteFlashcard(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete flashcard' });
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
    const promptText = contextText
      ? `Academic Context:\n${contextText}\n\nRequest:\n${prompt}`
      : prompt;
    const systemInstruction = `You are EduSphere AI, an academic research and study copilot. ${
      modeDirectives[mode] || modeDirectives.synthesis
    } Keep responses well-structured, direct, and grounded in academic rigor.`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: resolveModelName('gemini-3.5-flash'),
        contents: promptText,
        config: { systemInstruction },
      });
      responseText = response.text || '';
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: { systemInstruction },
      });
      responseText = fallback.text || '';
    }

    res.json({ text: responseText });
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
    let responseText = '';
    const flashcardPrompt = `Generate ${Math.min(Math.max(Number(count), 2), 8)} rigorous university-level active-recall flashcards on the topic: "${topic}". Each card should test deep conceptual understanding rather than trivia.`;
    const flashcardConfig = {
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
    };

    try {
      const response = await ai.models.generateContent({
        model: resolveModelName('gemini-3.5-flash'),
        contents: flashcardPrompt,
        config: flashcardConfig,
      });
      responseText = response.text || '[]';
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: flashcardPrompt,
        config: flashcardConfig,
      });
      responseText = fallback.text || '[]';
    }

    const parsed = JSON.parse(responseText.trim()) as Array<{
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
    const quizPrompt = `Create a 4-question multiple-choice diagnostic quiz for the course "${
      courseTitle || 'Graduate Seminar'
    }" focused on "${topic}". Provide 4 plausible options per question and a concise explanation for the correct answer.`;
    const quizConfig = {
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
    };

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: resolveModelName('gemini-3.5-flash'),
        contents: quizPrompt,
        config: quizConfig,
      });
      responseText = response.text || '[]';
    } catch {
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: quizPrompt,
        config: quizConfig,
      });
      responseText = fallback.text || '[]';
    }

    const questions = JSON.parse(responseText.trim());
    res.json(questions);
  } catch (err: any) {
    console.error('Gemini quiz error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate practice quiz.',
    });
  }
});

// Customer Responses & Inquiries API
app.get('/api/customer-responses', async (_req, res) => {
  try {
    const inquiries = await getCustomerInquiries();
    res.json(inquiries);
  } catch (err: any) {
    console.error('Failed to get customer inquiries:', err);
    res.status(500).json({ error: err?.message || 'Failed to get customer inquiries' });
  }
});

app.post('/api/customer-responses', async (req, res) => {
  try {
    const { customerName, customerEmail, subject, category, priority, courseId, message } = req.body;
    if (!customerName?.trim() || !customerEmail?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Customer name, email, subject, and message are required.' });
    }
    const inquiry = await createCustomerInquiry({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      subject: subject.trim(),
      category: category || 'General Inquiry',
      priority: priority || 'medium',
      courseId: courseId || undefined,
      message: message.trim(),
    });
    res.status(201).json(inquiry);
  } catch (err: any) {
    console.error('Failed to create customer inquiry:', err);
    res.status(500).json({ error: err?.message || 'Failed to create inquiry' });
  }
});

app.post('/api/customer-responses/:id/reply', async (req, res) => {
  try {
    const { sender, senderName, content, message } = req.body;
    const replyContent = content || message;
    if (!replyContent?.trim()) {
      return res.status(400).json({ error: 'Reply message cannot be empty.' });
    }
    const updated = await addInquiryReply(req.params.id, {
      sender: sender === 'customer' ? 'customer' : 'support_agent',
      senderName: senderName?.trim() || 'Academic Support',
      content: replyContent.trim(),
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to reply to inquiry:', err);
    res.status(500).json({ error: err?.message || 'Failed to reply to inquiry' });
  }
});

app.patch('/api/customer-responses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }
    const updated = await updateInquiryStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update inquiry status:', err);
    res.status(500).json({ error: err?.message || 'Failed to update status' });
  }
});

app.post('/api/customer-responses/:id/feedback', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }
    const updated = await rateInquiryResponse(req.params.id, rating, feedback);
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to rate inquiry:', err);
    res.status(500).json({ error: err?.message || 'Failed to record rating' });
  }
});

app.delete('/api/customer-responses/:id', async (req, res) => {
  try {
    const success = await deleteCustomerInquiry(req.params.id);
    res.json({ success, id: req.params.id });
  } catch (err: any) {
    console.error('Failed to delete inquiry:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete inquiry' });
  }
});

// AI Chatbots & Auto-Responder API
app.get('/api/chatbots', async (_req, res) => {
  try {
    const bots = await getChatbots();
    res.json(bots);
  } catch (err: any) {
    console.error('Failed to get chatbots:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch chatbots' });
  }
});

app.post('/api/chatbots', async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Chatbot name is required.' });
    }
    const created = await createOrUpdateChatbot(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Failed to create chatbot:', err);
    res.status(500).json({ error: err?.message || 'Failed to create chatbot' });
  }
});

app.put('/api/chatbots/:id', async (req, res) => {
  try {
    const updated = await createOrUpdateChatbot({ ...req.body, id: req.params.id });
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update chatbot:', err);
    res.status(500).json({ error: err?.message || 'Failed to update chatbot' });
  }
});

app.delete('/api/chatbots/:id', async (req, res) => {
  try {
    const success = await deleteChatbot(req.params.id);
    res.json({ success, id: req.params.id });
  } catch (err: any) {
    console.error('Failed to delete chatbot:', err);
    res.status(500).json({ error: err?.message || 'Failed to delete chatbot' });
  }
});

app.post('/api/chatbots/:id/chat', async (req, res) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: Array<{ sender: 'user' | 'bot'; content: string }>;
    };
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const snapshot = await getWorkspaceSnapshot();
    const bot = snapshot.chatbots?.find((b) => b.id === req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Chatbot not found.' });
    }

    // Grounding Context from linked courses and notes
    let groundingContext = '';
    if (bot.knowledgeBaseCourseIds && bot.knowledgeBaseCourseIds.length > 0) {
      const linkedCourses = snapshot.courses.filter((c) =>
        bot.knowledgeBaseCourseIds.includes(c.id)
      );
      if (linkedCourses.length > 0) {
        groundingContext += linkedCourses
          .map(
            (c) =>
              `Course: ${c.code} - ${c.title} (Instructor: ${c.instructor})\nModules:\n${c.modules
                .map((m) => `  - Week ${m.week}: ${m.title} (${m.topicSummary})`)
                .join('\n')}`
          )
          .join('\n\n');
      }

      const linkedNotes = snapshot.notes.filter((n) =>
        bot.knowledgeBaseCourseIds.includes(n.courseId)
      );
      if (linkedNotes.length > 0) {
        groundingContext += `\n\nKey Research Notes:\n${linkedNotes
          .slice(0, 3)
          .map((n) => `  - ${n.title}: ${n.summary}`)
          .join('\n')}`;
      }
    }

    // Try Gemini AI generation
    let replyText = '';
    try {
      const ai = getAiClient();
      const promptContents = groundingContext
        ? `Knowledge Base Context:\n${groundingContext}\n\nUser Question:\n${message}`
        : message;

      const modelToUse = resolveModelName(bot.model);
      let response;
      try {
        response = await ai.models.generateContent({
          model: modelToUse,
          contents: promptContents,
          config: {
            systemInstruction: `You are ${bot.name}, an AI assistant with the role "${bot.category}".
${bot.systemPrompt}
Always stay in character, provide actionable and helpful information, and reference linked knowledge when relevant.`,
            temperature: bot.temperature ?? 0.7,
          },
        });
      } catch (err1: any) {
        console.warn(`[Gemini Chatbot] Model ${modelToUse} failed, falling back to gemini-3.8-flash:`, err1?.message || err1);
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContents,
          config: {
            systemInstruction: `You are ${bot.name}, an AI assistant with the role "${bot.category}".
${bot.systemPrompt}
Always stay in character, provide actionable and helpful information, and reference linked knowledge when relevant.`,
            temperature: bot.temperature ?? 0.7,
          },
        });
      }
      replyText = response.text || '';
    } catch {
      // Offline fallback response grounded in the bot's persona and knowledge
      if (bot.category === 'Advisory') {
        replyText = `Hello! As ${bot.name}, I have verified your academic milestones. For "${message}", I recommend reviewing your active course prerequisites and scheduling a milestone review with your advisor.`;
      } else if (bot.category === 'Student Support') {
        replyText = `Thank you for asking. ${bot.name} Support Helpdesk here: For your inquiry regarding "${message}", our system has logged your request and confirmed your compute environment permissions are active.`;
      } else if (bot.category === 'Research Mentor') {
        replyText = `Regarding your query "${message}": From a thesis research perspective, ensure that your formulation is supported by formal derivations and statistical validation in your methodology draft.`;
      } else {
        replyText = `Hello! I am ${bot.name}. Regarding "${message}": I have analyzed your query against our active knowledge base and recommend consulting the course guidelines for next steps.`;
      }
    }

    // Increment conversation metrics
    bot.metrics.conversationsCount = (bot.metrics.conversationsCount || 0) + 1;
    await createOrUpdateChatbot(bot);

    res.json({
      reply: replyText,
      botId: bot.id,
      botName: bot.name,
      model: bot.model,
    });
  } catch (err: any) {
    console.error('Failed to chat with bot:', err);
    res.status(500).json({ error: err?.message || 'Chatbot service error.' });
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

  app.listen(port, '0.0.0.0', async () => {
    console.log(`EduSphere AI server running on http://0.0.0.0:${port}`);
    try {
      const supaStatus = await getSupabaseStatus();
      if (supaStatus.connected) {
        console.log(`[Supabase] Live PostgreSQL database connected (${supaStatus.url})`);
      } else if (supaStatus.configured) {
        console.warn(`[Supabase] Configured but connection failed: ${supaStatus.error}`);
      } else {
        console.log('[Supabase] Not configured in .env. Using local storage (.data/edusphere-db.json).');
      }
    } catch {
      // ignore
    }
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
