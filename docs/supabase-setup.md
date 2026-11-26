# Supabase setup and connection verification

Supabase client libraries and browser/server client helpers are already declared in `package.json`; this integration uses the official `@supabase/ssr` clients and Supabase JS dependency. No service-role key is used by application clients.

## Dashboard configuration

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API** (or the API keys section in the current dashboard layout).
3. Copy the **Project URL** and the **publishable key** (prefix `sb_publishable_`). The supplied dashboard URL ending in `/settings/general` is not an API URL. The project reference `sljijexkhuwswbujofzr` is not an API key. Do not paste either value into the key variable.
4. In **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000`. Add the exact localhost callback/redirect URLs used by your app and add production domain URLs when deployed.
5. Keep Auth email confirmation settings and email delivery provider configured for your chosen test flow.

## Local environment

Copy the placeholder template and edit the ignored local file:

```bash
cp .env.example .env.local
```

Set these values in `.env.local` from **Project Settings → API**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_dashboard_value
```

For projects still using a legacy anon JWT, set `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead. The publishable variable takes precedence. A service-role/secret key is deliberately rejected by the client configuration and must never be placed in a `NEXT_PUBLIC_*` variable, `.env.example`, or GitHub source.

`.gitignore` already excludes `.env*` while explicitly allowing only `.env.example`. Verify locally with `git status --ignored --short .env.local` and ensure it is ignored before committing.

## Apply database migrations

Install dependencies, then install/use Supabase CLI via `npx` and link to the project reference:

```bash
npm install
npx supabase login
npx supabase link --project-ref sljijexkhuwswbujofzr
npx supabase db push
```

Review the migration plan and target project before confirming `db push`; use a development Supabase project first. The existing migration creates the profiles, tenants, memberships and RLS foundations. The new connection-health migration adds only a no-data boolean RPC.

## Verify connectivity

After `.env.local` is configured and migrations are applied, start Next.js:

```bash
npm run dev
```

Then request `http://localhost:3000/api/health/supabase`. A JSON response with `{"connected":true,"service":"supabase"}` confirms the configured app can reach the project and invoke the health function. This does not verify production Auth redirects or tenant RLS; run the database RLS tests separately:

```bash
npx supabase test db
```

## GitHub repository configuration

- Commit `.env.example` with placeholders only; never commit `.env.local`.
- To run authenticated integration checks in GitHub Actions, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` under **Repository → Settings → Secrets and variables → Actions**. Use repository variables for non-secret project URL and a secret for the publishable key if required by the workflow. Do not configure a service-role key for browser or normal CI tests.
- Configure production environment values in the selected hosting provider separately. No production host or GitHub deployment workflow is assumed by this change.

## Auth behavior

Email/password sign-in and sign-up actions already use the server Supabase client and Zod validation. Middleware now refreshes Auth cookies on application/auth routes. The existing business provisioning database function is separate; applying migrations and configuring Auth are prerequisites for onboarding. No live connection is claimed until the health endpoint returns success with actual project credentials.
