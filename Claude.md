# Claude.md

This file provides guidance for AI assistants working with this codebase.

## Project Overview

**Chat SDK** (v3.1.0) is a production-ready AI chatbot template built with Next.js 15 and the Vercel AI SDK. It provides streaming chat with xAI Grok models, document/code/spreadsheet generation, and multi-modal input support.

## Tech Stack

- **Framework**: Next.js 15.3 (App Router), React 19 RC, TypeScript 5.6
- **AI**: Vercel AI SDK 5.0, xAI Grok models (grok-2-vision-1212, grok-3-mini)
- **Database**: PostgreSQL with Drizzle ORM, Redis (optional for resumable streams)
- **Auth**: Auth.js 5.0 (next-auth) with credentials provider
- **UI**: shadcn/ui, Radix UI, Tailwind CSS 4.1
- **Editors**: CodeMirror (code), ProseMirror (text), React Data Grid (sheets)
- **Storage**: Vercel Blob
- **Linting**: Biome (not ESLint)

## Project Structure

```
app/
├── (auth)/                 # Authentication routes
│   ├── auth.ts            # Auth.js configuration
│   ├── login/             # Login page
│   └── register/          # Registration page
├── (chat)/                # Main chat interface
│   ├── page.tsx           # Chat home (new chat)
│   ├── chat/[id]/         # Individual chat view
│   └── api/               # API routes (chat, history, files, etc.)
├── layout.tsx             # Root layout
└── globals.css            # Global styles

components/                # React components
├── chat.tsx               # Main chat component
├── message.tsx            # Message display
├── multimodal-input.tsx   # Text + file input
├── artifact.tsx           # Artifact container
├── code-editor.tsx        # CodeMirror wrapper
├── text-editor.tsx        # ProseMirror wrapper
├── sheet-editor.tsx       # Spreadsheet editor
└── ui/                    # shadcn/ui components

lib/
├── ai/
│   ├── models.ts          # Model definitions
│   ├── providers.ts       # AI Gateway configuration
│   ├── prompts.ts         # System prompts
│   ├── entitlements.ts    # User tier limits
│   └── tools/             # AI tool definitions
├── db/
│   ├── schema.ts          # Database schema (Drizzle)
│   ├── queries.ts         # Database queries
│   └── migrations/        # SQL migrations
├── artifacts/server.ts    # Artifact handler config
└── utils.ts               # Utility functions

artifacts/                 # Artifact type handlers
├── code/                  # Python code artifacts
├── text/                  # Text document artifacts
├── sheet/                 # Spreadsheet artifacts
└── image/                 # Image artifacts

hooks/                     # Custom React hooks
tests/                     # Playwright E2E tests
```

## Development Commands

```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # Run migrations + build
pnpm start            # Start production server
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
pnpm test             # Run Playwright tests
pnpm lint             # Run Biome linter
pnpm format           # Fix formatting with Biome
```

## Key Patterns

### Server Components & Actions
- Default to Server Components; use `'use client'` only when needed
- Server Actions in `app/(chat)/actions.ts` and `app/(auth)/actions.ts`
- API routes in `app/(chat)/api/` for streaming and file operations

### AI Integration
- Models defined in `lib/ai/models.ts`
- Tools defined in `lib/ai/tools/` (create-document, update-document, get-weather, request-suggestions)
- Prompts in `lib/ai/prompts.ts`
- Streaming via `streamText` from AI SDK

### Database
- Schema in `lib/db/schema.ts` using Drizzle ORM
- Queries in `lib/db/queries.ts`
- Tables: User, Chat, Message_v2, Vote_v2, Document, Suggestion, Stream

### Artifacts
- Each artifact type has `client.tsx` (UI) and `server.ts` (generation logic)
- Types: code (Python), text (markdown/prose), sheet (CSV), image

### Authentication
- Middleware in `middleware.ts` handles auth redirects
- Guest mode creates anonymous users
- Session-based auth with Auth.js

## Important Files

| File | Purpose |
|------|---------|
| `app/(chat)/api/chat/route.ts` | Main chat streaming endpoint |
| `lib/ai/models.ts` | Available AI models |
| `lib/ai/tools/*.ts` | AI tool implementations |
| `lib/db/schema.ts` | Database schema |
| `lib/db/queries.ts` | Database operations |
| `middleware.ts` | Auth middleware |
| `components/chat.tsx` | Main chat UI component |

## Environment Variables

Required:
- `AUTH_SECRET` - NextAuth secret
- `POSTGRES_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage

Optional:
- `REDIS_URL` - For resumable streams
- `AI_GATEWAY_API_KEY` - For non-Vercel deployments

## Testing

- Framework: Playwright
- Tests in `tests/` directory
- Run with `pnpm test`
- Page objects in `tests/pages/`

## Code Style

- Uses Biome for linting/formatting (not ESLint/Prettier)
- Run `pnpm lint` to check, `pnpm format` to fix
- TypeScript strict mode enabled
- Prefer named exports
- Use Zod for validation (`lib/` files)

## Common Tasks

### Adding a new AI tool
1. Create tool in `lib/ai/tools/`
2. Register in chat route `app/(chat)/api/chat/route.ts`
3. Add UI handling in `components/` if needed

### Adding a new artifact type
1. Create directory in `artifacts/` with `client.tsx` and `server.ts`
2. Register in `lib/artifacts/server.ts`
3. Add kind to document schema if needed

### Modifying database schema
1. Update `lib/db/schema.ts`
2. Run `pnpm db:push` or create migration with `pnpm db:generate`

### Adding UI components
1. Use shadcn/ui components from `components/ui/`
2. Follow existing patterns in `components/`
3. Use Tailwind CSS for styling
