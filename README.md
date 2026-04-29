# CleanDayCRM

AI receptionist + CRM for residential cleaning businesses.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (dark mode default)
- Prisma + PostgreSQL
- NextAuth (Credentials)
- Twilio (SMS)
- OpenAI (AI replies)

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env and fill in DATABASE_URL + secrets
cp .env.example .env
# edit .env

# 3. Push schema and seed
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000 and sign in:

```
owner@awesomemaids.com / password123
```

## Environment

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | e.g. `http://localhost:3000` |
| `TWILIO_ACCOUNT_SID` | for live SMS | omit for simulated mode |
| `TWILIO_AUTH_TOKEN` | for live SMS | |
| `TWILIO_PHONE_NUMBER` | for live SMS | |
| `OPENAI_API_KEY` | for AI replies | falls back to canned replies if missing |
| `OPENAI_MODEL` | optional | default `gpt-4o-mini` |

If Twilio creds are missing, outbound SMS are logged to the console (simulated). If
OpenAI is missing, the AI reply uses a deterministic fallback so the app still works
end-to-end.

## Pages

- `/login` — credentials sign-in
- `/dashboard` — KPIs (new leads, attention, bookings, revenue, follow-ups, reviews)
- `/leads` — list + status filters
- `/leads/[id]` — conversation thread, lead form, escalation banner
- `/leads/new` — create a lead
- `/bookings` — schedule
- `/customers` — repeat customers + LTV
- `/automations` — toggle and view templates
- `/settings` — business profile, pricing rules, integration status

## API

- `POST /api/twilio/inbound` — Twilio Messaging webhook. Auto-replies via AI.
- `POST /api/leads` / `PATCH /api/leads/:id` — manage leads
- `POST /api/leads/:id/messages` — send manual or AI SMS reply
- `POST /api/bookings` — create a booking (sets lead → BOOKED)
- `PATCH /api/automations/:id` — toggle/edit a rule
- `PATCH /api/pricing-rules/:id` — edit pricing
- `PATCH /api/business` — edit business profile
- `POST /api/automations/follow-up?businessId=...` — cron: follow-up SMS on QUOTED leads
- `POST /api/automations/review-request?businessId=...` — cron: review SMS post-completion

## AI behavior

The AI receptionist (see `lib/ai-reply.ts`):

- Replies fast and professionally as the business.
- Uses `PricingRule` rows to build quotes (`base + perBedroom*beds + perBathroom*baths + perSqFt*sqft`, floored at `minPrice`).
- Asks for the missing qualification fields (zip, beds, baths, sqft, service type).
- **Never** confirms a booking on its own — offers slots, owner confirms.
- Escalates to a human and sets `Lead.needsHuman = true` / `status = NEEDS_HUMAN` when the customer message contains keywords like _refund, broken, damage, complaint, angry, lawyer, sue_.

## Twilio webhook setup

Point your Twilio phone number's "A message comes in" webhook to:

```
https://your-domain.com/api/twilio/inbound
```

Method: `POST`, Content-Type: `application/x-www-form-urlencoded` (default).

The endpoint matches `To` against `Business.twilioNumber` to find the right tenant.

## Cron / scheduled automations

Trigger these endpoints on a schedule (Vercel Cron, GitHub Action, etc.):

```
POST /api/automations/follow-up?businessId=<id>      # hourly
POST /api/automations/review-request?businessId=<id> # hourly
```
