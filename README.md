# CleanDayCRM

AI receptionist + CRM for residential cleaning businesses.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind + shadcn/ui (dark mode)
- Prisma ORM
- **Supabase** (Postgres)
- **Vercel** (hosting + cron)
- NextAuth (Credentials)
- Twilio (SMS)
- OpenAI (AI replies)

---

## Deploy in 5 minutes — no terminal required

You only need a browser. Steps are:

1. **Create the Supabase project**
2. **Import this repo to Vercel**
3. **Set env vars in Vercel**
4. **Click Deploy** (Prisma migrations run automatically)
5. **Visit `/api/admin/seed?secret=…` once** to load the Awesome Maids demo data

### 1. Supabase

1. Go to <https://supabase.com> → **New project**.
2. Wait for the database to provision.
3. Open **Project Settings → Database → Connection string** and copy two strings:
   - **Transaction pooler** (port `6543`) → this is your `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1` if not already present.
   - **Session / Direct** (port `5432`) → this is your `DIRECT_URL`.

   They look like:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

You do **not** need to create any tables manually — Prisma Migrate runs on every Vercel build and applies `prisma/migrations/` to your Supabase database.

### 2. Vercel

1. Push this repo to GitHub (use the GitHub web UI if you don't want a terminal).
2. Go to <https://vercel.com> → **Add New… → Project** → import the repo.
3. Framework preset is detected as **Next.js**. Leave the build command alone — `package.json` already runs `prisma generate && prisma migrate deploy && next build`.

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Supabase pooled connection (`6543`, with `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | ✅ | Supabase direct connection (`5432`) — used by `prisma migrate deploy` at build time |
| `NEXTAUTH_URL` | ✅ | The full URL of your Vercel deployment, e.g. `https://cleandaycrm.vercel.app` |
| `NEXTAUTH_SECRET` | ✅ | Generate one at <https://generate-secret.vercel.app/32> |
| `SEED_SECRET` | ✅ | Any random string. You'll use it once to seed via the browser. |
| `CRON_SECRET` | recommended | Random string. Vercel Cron will send it as `Authorization: Bearer …` |
| `TWILIO_ACCOUNT_SID` | optional | Without it, outbound SMS is logged to Vercel runtime logs (simulated) |
| `TWILIO_AUTH_TOKEN` | optional | |
| `TWILIO_PHONE_NUMBER` | optional | The number Twilio will send/receive on |
| `OPENAI_API_KEY` | optional | Without it, the AI uses a deterministic fallback |
| `OPENAI_MODEL` | optional | Default `gpt-4o-mini` |

### 4. Deploy

Hit **Deploy**. The build runs `prisma migrate deploy`, which creates every table/enum/index in your Supabase Postgres database.

### 5. Seed the demo data

Open this URL in your browser **once** (replace the host and secret):

```
https://<your-project>.vercel.app/api/admin/seed?secret=<SEED_SECRET>
```

This wipes any existing data and creates the **Awesome Maids** business with:

- 1 owner login
- 4 pricing rules (Standard / Deep / Move / Airbnb)
- 4 automation rules (auto-reply / follow-up / reminder / review)
- 5 leads in different statuses (incl. one escalated, one booked)
- 2 customers, 3 bookings, sample message threads

### Sign in

Now open `https://<your-project>.vercel.app/login`:

```
Email:    owner@awesomemaids.com
Password: password123
```

---

## Twilio webhook (for live SMS)

In your Twilio console → Phone Numbers → choose your number → "A message comes in":

- **Webhook URL:** `https://<your-project>.vercel.app/api/twilio/inbound`
- **HTTP method:** `POST`

The endpoint matches the `To` field against `Business.twilioNumber` to route SMS to the right tenant. New phone numbers automatically become Leads. The AI replies inline if the `AUTO_REPLY` automation is enabled.

## Cron jobs (Vercel)

`vercel.json` registers two hourly crons:

```jsonc
{
  "crons": [
    { "path": "/api/automations/follow-up",     "schedule": "0 * * * *" },
    { "path": "/api/automations/review-request", "schedule": "0 * * * *" }
  ]
}
```

These iterate every business and respect the `delayHours` configured on each automation rule. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

---

## Pages

- `/login` — credentials sign-in
- `/dashboard` — KPIs (new leads, attention, bookings, revenue, follow-ups, reviews)
- `/leads` — list + status filter chips
- `/leads/[id]` — message thread, lead form, escalation banner
- `/leads/new` — create a lead
- `/bookings` — schedule
- `/customers` — repeat customers + LTV
- `/automations` — toggle and view templates
- `/settings` — business profile + pricing rules + integration status

## API

| Method & Path | Purpose |
| --- | --- |
| `POST /api/auth/[...nextauth]` | NextAuth credentials sign-in |
| `POST /api/twilio/inbound` | Twilio Messaging webhook |
| `GET/POST /api/leads` | List / create leads |
| `PATCH /api/leads/:id` | Update a lead |
| `POST /api/leads/:id/messages` | Send manual or AI-drafted SMS |
| `POST /api/bookings` | Create a booking (sets lead → BOOKED) |
| `PATCH /api/automations/:id` | Toggle / edit a rule |
| `PATCH /api/pricing-rules/:id` | Edit pricing |
| `PATCH /api/business` | Edit business profile |
| `GET /api/automations/follow-up` | Cron: follow-up SMS on QUOTED leads |
| `GET /api/automations/review-request` | Cron: review SMS post-completion |
| `GET /api/admin/seed?secret=…` | Seed Awesome Maids demo data |

## AI behavior (`lib/ai-reply.ts`)

- Replies fast and professionally as the business.
- Uses `PricingRule` rows to build quotes: `base + perBedroom·beds + perBathroom·baths + perSqFt·sqft`, floored at `minPrice`.
- Asks for the missing qualification fields (zip, beds, baths, sqft, service type).
- **Never** confirms a booking on its own — offers slots and lets the owner confirm.
- **Escalates** to a human and sets `Lead.needsHuman = true` / `status = NEEDS_HUMAN` when the customer message contains keywords like _refund, broken, damage, complaint, angry, lawyer, sue_.

---

## Local dev (optional, requires terminal)

If you ever want to run it locally:

```bash
npm install
cp .env.example .env       # fill DATABASE_URL + DIRECT_URL + NEXTAUTH_SECRET
npm run db:push            # or: npx prisma migrate deploy
npm run db:seed
npm run dev
```
