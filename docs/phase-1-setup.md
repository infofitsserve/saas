# Phase 1 application foundation

This repository is a Next.js App Router application for Infofitsserve SaaS. Existing routes include Supabase email authentication, business onboarding, and initial ShiftPilot and RecruitFlow workspaces. Phase 1 adds a shared responsive workspace shell, product selection, and a data-backed overview dashboard. Payment processing and external AI integrations are intentionally not included.

## Requirements

- Node.js 20.9 or later
- npm
- A Supabase project for authentication and database-backed routes

## Run locally

1. Clone the repository and enter its directory.
2. Copy the tracked environment template: `cp .env.example .env.local` (PowerShell: `Copy-Item .env.example .env.local`).
3. In `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to its publishable key (or legacy anon key). These browser-safe values are not service-role secrets.
4. Install dependencies with `npm install`.
5. Start the development server with `npm run dev`, then open `http://localhost:3000`.

The repository already includes `README.md` and `.env.example`; those existing files were intentionally left unchanged. This supplemental file documents the Phase 1 routes and local start steps without replacing project documentation.

## Routes

- `/` — public marketing page
- `/login` — sign-in
- `/signup` — account registration
- `/app/onboarding` — business workspace setup
- `/app/overview` — authenticated workspace dashboard shell
- `/app/products` — authenticated product selector
- `/app/shiftpilot` — ShiftPilot workspace
- `/app/recruitflow` — RecruitFlow AI workspace

## Environment and secret handling

Never commit `.env.local` or place a service-role key, database password, payment secret, or AI provider key in a `NEXT_PUBLIC_*` variable. The Supabase publishable/anon key is intended for client use; access must still be constrained by database RLS. No payment or AI integration is configured by this phase.

Configure Supabase Auth site URL and redirect allowlist for localhost and your production domain. Apply repository migrations to a development Supabase project before relying on database-backed flows. Production hosting, custom domain, email delivery, and deployment secrets must be configured separately in the chosen provider.

## Available checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Run these from the repository root after installing dependencies.
