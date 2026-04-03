# Phase 2 - Authentication System

## Phase Overview

This phase adds real authentication and session management on top of the Phase 1 foundation. The app already has placeholder auth routes and a protected-shell layout placeholder, but those routes are not functional. This phase converts the placeholders into a working Firebase Auth system with server-managed sessions, route protection, and role-aware user loading.

The result of this phase should be that an operator can log in, maintain a session across refreshes, and be redirected correctly between auth routes and the protected application shell.

## Objectives

- Implement login, signup, logout, and session-check APIs.
- Add Firebase Auth integration for browser-side credential handling.
- Add secure server-side session cookies for protected routes.
- Protect `(app)` routes using middleware and server validation.
- Create the initial `users` Firestore profile shape for authenticated operators.
- Prepare role-based authorization foundations for later phases.

## Required Features

- Login form submission with Firebase credential validation.
- Signup form submission with user profile creation.
- Logout behavior that clears the session cookie.
- Session restore on reload.
- Redirect unauthenticated users away from `/dashboard` and other app routes.
- Redirect authenticated users away from `/login` and `/signup`.
- Viewer/operator/admin role loading, even if Phase 2 only uses it minimally.
- Basic auth error messages for invalid credentials and account setup issues.

## Files To Create

- `middleware.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/session/route.ts`
- `features/auth/components/AuthForm.tsx`
- `features/auth/components/AuthCard.tsx`
- `features/auth/components/AuthGuardNotice.tsx`
- `features/auth/hooks/useSession.ts`
- `features/auth/hooks/useLogin.ts`
- `features/auth/hooks/useSignup.ts`
- `features/auth/services/auth-client.ts`
- `features/auth/services/auth-server.ts`
- `features/auth/types/auth.ts`
- `hooks/useAuth.ts`
- `lib/auth/session.ts`
- `lib/auth/guards.ts`
- `lib/auth/permissions.ts`
- `lib/validation/auth.ts`
- `types/user.ts`

## Files To Update

- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(app)/layout.tsx`
- `services/firebase/client.ts`
- `services/firebase/admin.ts`
- `.env.example`
- `README.md`

## Components To Build

- `AuthForm`
  - shared form component for login/signup variants
  - handles fields, submit state, and inline error display
- `AuthCard`
  - shared auth page presentation wrapper
  - keeps login/signup visual structure consistent
- `AuthGuardNotice`
  - optional informational card for redirect/loading/session check states

## APIs To Implement

- `POST /api/auth/login`
  - accepts email/password
  - verifies credentials through Firebase Auth flow
  - creates secure session cookie
  - returns user summary
- `POST /api/auth/signup`
  - accepts name/email/password
  - creates Firebase Auth user
  - creates Firestore user profile
  - issues session cookie
- `POST /api/auth/logout`
  - clears session cookie
- `GET /api/auth/session`
  - validates the current session
  - returns authenticated user profile summary

## Services To Implement

- Firebase browser auth helper
  - sign in with email/password
  - create account
  - token retrieval for session exchange
- Firebase Admin auth helper
  - verify ID token or session cookie
  - create session cookie
  - revoke or clear session
- User profile service
  - create `users/{userId}` profile document
  - load role and operator metadata

## Data Flow

1. User enters credentials in `/login` or `/signup`.
2. Frontend submits through the auth hooks.
3. Hook calls the auth API route.
4. API route uses Firebase Auth and Firebase Admin helpers.
5. On success, server sets session cookie and returns user summary.
6. Client invalidates session query and redirects into `/dashboard`.
7. Protected layouts and middleware validate cookie-backed auth on future requests.

## UI Pages Affected

- `/login`
- `/signup`
- all routes in `app/(app)`

## Integration Points

- Firebase Auth
- Firestore `users` collection
- Session cookie secret from environment
- Next.js middleware for route protection

## Dependencies

- Depends on Phase 1 foundation being complete.
- Must complete before Phase 3 because navigation and shell behavior depend on real session state.
- Must establish user role loading so later phases can gate admin-only actions.

## Validation Checklist

- Login with valid credentials succeeds.
- Login with invalid credentials returns safe error feedback.
- Signup creates both Firebase Auth user and Firestore user profile.
- Refreshing `/dashboard` keeps the user signed in.
- Logging out clears the session and redirects to `/login`.
- Visiting `/dashboard` while unauthenticated redirects to `/login`.
- Visiting `/login` while authenticated redirects to `/dashboard`.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Functional auth routes
- Functional login and signup pages
- Session cookie support
- Middleware-based route protection
- Initial user profile creation
- Shared auth hooks and types

## Hackathon Priority

**Critical for demo**

The demo cannot proceed without authentication because the dashboard-first app experience starts after login.
