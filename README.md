# Innovate IQ LLC — Full Stack Application

## Tech Stack
- **Frontend + API**: Next.js 15 (App Router) on Vercel
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend
- **Styling**: Tailwind CSS

## Project Structure
```
app/
├── auth/login          # Login page
├── auth/register       # Register (contractor or client)
├── auth/callback       # OAuth callback
├── dashboard/          # Role-aware dashboard
├── contractor/
│   ├── profile         # Contractor fills their profile
│   ├── apply           # Browse + apply to open jobs
│   ├── checklist       # Onboarding document checklist
│   ├── documents       # Upload/view documents
│   └── messages        # Messaging
├── client/
│   ├── post-job        # Post a contract role
│   ├── dashboard       # View roles + applicants
│   ├── documents       # Documents
│   └── messages        # Messaging
├── admin/
│   ├── contractors     # Review + approve contractors
│   ├── clients         # Manage clients
│   ├── jobs            # All jobs
│   ├── documents       # Approve documents
│   ├── contacts        # Contact form submissions
│   └── messages        # All messages
└── api/
    ├── auth/logout     # Sign out
    ├── contact         # Contact form submission
    ├── contractor      # Contractor CRUD
    ├── client          # Client CRUD
    └── job             # Job CRUD

supabase/schema.sql     # Full DB schema + RLS policies
types/index.ts          # All TypeScript types
lib/
├── supabase/client.ts  # Browser Supabase client
├── supabase/server.ts  # Server Supabase client
├── email.ts            # Resend email helpers
└── utils.ts            # Utility functions
middleware.ts           # Auth + role-based route protection
```

## Setup (Step by Step)

### 1. Supabase
1. Go to supabase.com → New project
2. Go to SQL Editor → paste contents of `supabase/schema.sql` → Run
3. Go to Settings → API → copy URL and anon key
4. Go to Authentication → Email → enable "Confirm email" OFF for dev

### 2. Resend
1. Go to resend.com → create account
2. Create an API key → copy it
3. Add your domain or use the sandbox domain for dev

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 5. Create Your Admin Account
1. Register at /auth/register (pick "Contractor" — we'll change role manually)
2. In Supabase → Table Editor → profiles
3. Find your email → change `role` from `contractor` to `admin`
4. Log out and back in → you'll see the Admin dashboard

### 6. Deploy to Vercel
1. Push to GitHub
2. Connect repo in Vercel
3. Add all env vars in Vercel → Settings → Environment Variables
4. Deploy

## User Flows

### Contractor Flow
Register → Fill Profile → Browse Jobs → Apply → Upload Documents → Complete Checklist → Get Placed

### Client Flow
Register → Post Role → Review Applicants → Sign MSA/SOW → Track Engagement

### Admin (You) Flow
Review Contractors → Approve/Reject → Match to Roles → Manage Documents → Track All Engagements
