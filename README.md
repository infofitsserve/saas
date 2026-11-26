# Infofitsserve SaaS foundation

Next.js App Router foundation for ShiftPilot and RecruitFlow AI. This initial commit establishes the application setup, shared Supabase authentication, and a tenant-isolated PostgreSQL schema. Product workflows, billing, and tenant onboarding are intentionally not represented as complete yet.

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project. This repository is configured for the project reference `sljijexkhuwswbujofzr`.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the project's **publishable key** (or legacy anon key) to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Supabase URL is `https://sljijexkhuwswbujofzr.supabase.co`.
3. Run `npm install` and `npm run dev`.
4. Apply migrations with the Supabase CLI after linking the project: `npx supabase link --project-ref sljijexkhuwswbujofzr`, then `npx supabase db push`.

Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable or commit it. The initial browser and server clients use only the publishable/anon key; database RLS is the security boundary. Configure Supabase Auth's site URL and redirect URLs for local development and production before testing email confirmation.

## Foundation delivered

- Next.js App Router, TypeScript, Tailwind CSS, Zod, Vitest, and Supabase SSR client setup.
- Email/password registration and login server actions with schema validation and generic error responses.
- PostgreSQL tenant, profile, membership, and audit-log foundations with RLS enabled.
- Roles: `platform_super_admin`, `business_owner`, `hr_admin`, `recruiter`, `hiring_manager`, `employee`.

Tenant provisioning, product-specific tables, billing, verified payment webhooks, document storage, admin workflows, and authorization test execution remain follow-up work. Tenant creation/membership assignment is intentionally not exposed to browser clients; implement it through a separately reviewed, server-authorized flow.

## Commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript checks
- `npm test` — unit tests
