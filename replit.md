# SaaSify - SaaS Boilerplate (Supabase Edition)

## Overview

SaaSify is a high-performance, minimalist SaaS boilerplate designed for Replit, using **Supabase** as the exclusive provider for database and authentication. It follows a "frontend-first" architecture where the React application communicates directly with Supabase, while a lightweight Express backend handles static assets and health checks.

## Core Principles

1.  **Supabase Everywhere**: No local database (PostgreSQL de Replit) or alternative providers. All data persistence and auth flows go through Supabase. L'utilisation de la base de données de développement Replit est strictement interdite.
2.  **Clean Architecture**: Separation of concerns using custom hooks (`use-auth`, `use-supabase`).
3.  **Modern UI**: Built with React, Tailwind CSS, shadcn/ui, and Framer Motion.
4.  **Admin Ready**: Integrated role-based access control (RBAC) with a dedicated admin portal.

## System Architecture

### Authentication & Database (Supabase)
- **Provider**: Supabase Auth (Client-side SDK).
- **Database**: PostgreSQL managed by Supabase.
- **ORM**: Drizzle ORM is used for schema definitions and type safety, but direct communication happens via `@supabase/supabase-js`.

### Frontend
- **Routing**: `wouter` for lightweight client-side routing.
- **State Management**: `TanStack React Query` for server state, context for auth.
- **Components**: `shadcn/ui` based on Radix UI primitives.

## Getting Started

### 1. Supabase Configuration
Create a project on Supabase and set the following **Secrets** in Replit:
- `VITE_SUPABASE_URL`: Your project URL.
- `VITE_SUPABASE_ANON_KEY`: Your project's anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key (for administrative operations).

### 2. SQL Setup
Run the contents of `supabase_setup.sql` in the Supabase SQL Editor. This will:
- Create the `profiles` table.
- Set up Row Level Security (RLS).
- Create a trigger to auto-create profiles on signup.

### 3. Running the App
The application starts automatically via the "Start application" workflow (`npm run dev`).

## Project Structure

```text
├── client/
│   ├── src/
│   │   ├── components/  # UI components (layout, dashboard)
│   │   ├── hooks/       # useAuth, useSupabase (React Query)
│   │   ├── lib/         # Supabase client singleton
│   │   └── pages/       # Landing, Auth, Dashboard, Admin
├── shared/
│   └── schema.ts        # Single source of truth for data models
└── supabase_setup.sql   # Idempotent database setup script
```

## Admin Access
To grant admin rights to a user, run this SQL in Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';
```
