# SaaSify - SaaS Boilerplate

## Overview

SaaSify is a full-stack SaaS boilerplate application built with React, Express, and Supabase. It provides a modern starter template with authentication, role-based access control (user/admin roles), a landing page, user dashboard, and admin portal. The application follows a client-server architecture with the frontend handling most user interactions through Supabase client-side SDK while the Express backend serves as an API layer and static file server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with CSS variables for theming, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI animations
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Management**: Minimal backend - authentication primarily handled client-side via Supabase

### Authentication Strategy
- **Provider**: Supabase Auth (client-side SDK)
- **Methods**: Email/password authentication with OAuth (Google) support
- **Role Management**: User roles stored in a `profiles` table with `role` column ("user" or "admin")
- **Protected Routes**: React-based route protection using auth context

### Database Schema
- **profiles table**: Extends Supabase auth.users with id (UUID primary key), email, role (enum: user/admin), createdAt
- **Schema location**: shared/schema.ts using Drizzle ORM with drizzle-zod for validation

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui based)
│   │   ├── hooks/       # Custom React hooks (auth, toast, mobile)
│   │   ├── lib/         # Utilities (supabase client, queryClient)
│   │   ├── pages/       # Page components (Landing, Auth, Dashboard, Admin)
│   │   └── App.tsx      # Root component with routing
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── db.ts         # Database connection
│   └── storage.ts    # Data access layer interface
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route type definitions
└── migrations/       # Drizzle database migrations
```

### Key Design Patterns
- **Shared Types**: Schema and route definitions shared between frontend and backend
- **Component Library**: Full shadcn/ui component set with Radix UI primitives
- **API Layer**: Minimal Express API with health check; most data operations use Supabase client directly
- **Build Process**: Custom esbuild script bundles server with selective dependency bundling for cold start optimization

## External Dependencies

### Supabase (Required)
- **Purpose**: Authentication, database, and user management
- **Environment Variables**: 
  - `VITE_SUPABASE_URL` - Supabase project URL (frontend)
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (frontend)
- **Usage**: Client-side SDK for auth flows, profile management, and database queries

### PostgreSQL Database
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Commands**: `npm run db:push` to push schema changes

### UI/Component Libraries
- **shadcn/ui**: Pre-built accessible components (configured in components.json)
- **Radix UI**: Underlying primitives for complex UI components
- **Lucide React**: Icon library
- **Framer Motion**: Animation library

### Development Tools
- **Vite**: Frontend dev server with HMR
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (development only)