# Deploying EduSphere AI to Vercel

This repository is pre-configured for seamless deployment to **Vercel** with fullstack support (Vite React frontend on Vercel's global CDN and Express API on Vercel Serverless Functions).

---

## 🚀 Option 1: Deploy via GitHub (Recommended — 2 Minutes)

### Step 1: Push Code to GitHub
If you haven't pushed this repo to GitHub yet:
```bash
git init
git add .
git commit -m "Configure Supabase and Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edusphere-ai.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select your **`edusphere-ai`** repository.
3. Vercel will automatically detect the settings from [`vercel.json`](vercel.json):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section on the Vercel import screen, add the following:

| Key | Value | Description |
|---|---|---|
| `SUPABASE_URL` | `https://ejkpwnxkrmtinbtjrlev.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `sb_publishable_LovoIZdVRjwyoQFBw6XDZQ_rRRTljSQ` | Supabase public publishable key |
| `VITE_SUPABASE_URL` | `https://ejkpwnxkrmtinbtjrlev.supabase.co` | Client-side mirror URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_LovoIZdVRjwyoQFBw6XDZQ_rRRTljSQ` | Client-side mirror key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional)* | Supabase secret key (for admin RLS bypass) |
| `GEMINI_API_KEY` | *(Optional)* | Google AI Studio key for Copilot & Flashcard generation |

### Step 4: Click Deploy!
Vercel will build the frontend assets, bundle the serverless API function, and provide you with a live production URL (e.g. `https://edusphere-ai.vercel.app`).

---

## 💻 Option 2: Deploy using Vercel CLI

If you prefer to deploy directly from your terminal:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Log in**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts (accept default settings).

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables via CLI**:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add GEMINI_API_KEY
   ```

---

## ⚙️ How the Vercel Architecture Works

- **Static Frontend (`dist/`)**: Built by Vite and cached at Vercel's global Edge network with instant delivery.
- **Serverless API (`api/index.ts`)**: Serves all `/api/*` endpoints (workspace data, courses, flashcards, tasks, AI copilot, Supabase status).
- **Rewrites (`vercel.json`)**:
  - `/api/(.*)` ➔ routed to `api/index.ts` serverless function.
  - `/(.*)` ➔ routed to `dist/index.html` (supporting client-side SPA routing).
- **Serverless-Safe Storage**: In serverless environments, local storage uses `/tmp` to prevent read-only filesystem errors (`EROFS`).
