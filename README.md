# Margins

**Where smart people read together.**

## About

Margins is a platform where intellectual discourse happens in the margins of content. Instead of disconnected comments, conversations are anchored to specific passages. Voice is earned through demonstrated depth, not follower counts.

## Core Concept

- **Contextual Annotations**: React to specific passages, not entire articles
- **Depth System**: Earn your voice by reading deeply and contributing thoughtfully
- **Quality over Quantity**: No likes, no follower counts — just ideas
- **Reading Gate**: See what others think only after you've engaged with the content

## How It Works

### The Depth Levels

| Level | Name | How to Earn | Abilities |
|-------|------|-------------|-----------|
| 0 | Reader | Start here | Read articles, see heat maps |
| 1 | Highlighter | Read 3 articles fully | Highlight passages, see annotations |
| 2 | Annotator | Read 5+ articles | Write annotations (3/article limit) |
| 3 | Voice | Quality annotations | Unlimited annotations, start discussions |
| 4 | Contributor | Sustained quality | Publish responses, curate paths |

### Annotation Types

- 💡 **Insight** — Adding context or a new angle
- ❓ **Question** — Genuine curiosity about a claim
- ⚔️ **Challenge** — Disagreeing with reasoning
- 🔗 **Connection** — Linking to other ideas

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ML/AI**: Google Gemini 2.5 Flash (annotation quality scoring)
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Google AI Studio account (for Gemini API key)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/margins.git
   cd margins
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase and Gemini API credentials in `.env.local`.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google Gemini API key from AI Studio |
| `NEXT_PUBLIC_APP_URL` | Public URL of your deployed app |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY` → Create a secret named `gemini-api-key`
   - All other env vars from `.env.example`
4. Deploy!

### Database Setup

Run the SQL migrations in `/supabase/migrations` against your Supabase project via the Supabase dashboard or CLI:

```bash
supabase db push
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check — returns service status |
| `/api/score` | POST | Score an annotation using Gemini AI |
| `/api/annotations` | GET/POST | Fetch or create annotations |

## ML Scoring

Annotations are scored by Gemini on four dimensions (0–25 each):

| Dimension | What it Measures |
|-----------|-----------------|
| Relevance | Engagement with the specific highlighted text |
| Specificity | Precision vs. vagueness |
| Originality | New perspective vs. surface-level observation |
| Reasoning | Clarity of logic and argumentation |

**Total score**: 0–100. Scores influence depth-level progression.

## License

MIT
