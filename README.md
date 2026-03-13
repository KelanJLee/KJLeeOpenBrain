# Open Brain 🧠

A personalized, agent-readable knowledge base built with Next.js and Supabase.

## Quick Start

### 1. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the contents of `data/supabase_schema.sql`
4. Go to Settings → API to get your `Project URL` and `anon key`

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Deploy to Vercel

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the project
3. Add the same environment variables in Vercel project settings
4. Deploy!

### 4. Run Locally (Optional)

```bash
cd open-brain
npm install
npm run dev
```

Visit http://localhost:3000

## Features

- 📝 Add memories, contacts, projects, and goals
- 🏷️ Tag system for easy organization
- 📱 Mobile-friendly interface
- 🤖 REST API for AI agent integration
- 🔄 Real-time updates

## Categories

| Category | Description |
|----------|-------------|
| memory | General knowledge and facts |
| relationship | People and professional contacts |
| project | Active projects and tasks |
| goal | Goals and aspirations |

## API

See [AI_INTEGRATION.md](./AI_INTEGRATION.md) for detailed API documentation and integration prompts for Claude, ChatGPT, Cursor, and automation platforms.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: Vercel (free)

## Cost

- Supabase: Free tier (500MB)
- Vercel: Free tier
- **Total: $0/month**
