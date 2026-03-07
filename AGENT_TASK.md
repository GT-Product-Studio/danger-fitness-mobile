# TASK: Build Phase 1 — Core App

Read BUILD_SPEC.md for the full spec. You are building the Danger Fitness React Native mobile app.

## What to Build

1. **Expo Router file-based navigation**: Set up app/ directory with _layout.tsx, (auth)/ group, (tabs)/ group with bottom tab nav, workout/[day].tsx route
2. **Auth context** (lib/auth.tsx): Supabase auth provider wrapping the app, login/register/reset-password screens
3. **Home Dashboard** (app/(tabs)/index.tsx): Day X of 30 progress, today's workout card, challenge card, BLE status placeholder
4. **Program Overview** (app/(tabs)/program.tsx): 30-day program with weekly grouping, day cards showing completion
5. **Workout Day View** (app/workout/[day].tsx): Full exercise list grouped by block (cycling/moto/gym/recovery/race), workout timer (start/stop), per-exercise timer
6. **Challenge Tab** (app/(tabs)/challenge.tsx): Challenge progress, leaderboard, activity logger
7. **Settings Tab** (app/(tabs)/settings.tsx): Account info, sign out, BLE placeholder, subscription placeholder
8. **All UI components**: Cards, buttons, badges, zone badges — all dark theme with BRAAP green (#29F000)

## Rules

- Use lib/supabase.ts (already created) and lib/constants/brand.ts (already created) — DO NOT recreate them
- Dark theme ONLY: background #0A0A0A, surface #141414, primary #29F000
- All data comes from existing Supabase tables (workouts, exercises, challenges, profiles, etc.)
- Mobile-first: large touch targets (48px min), bold typography
- TypeScript strict
- Expo Router for all navigation (file-based routing in app/ directory)
- The app.json is already configured — don't modify it
- Install any missing npm packages you need

## Database

The Supabase project has 30 workouts seeded (day_number 1-30), 186 exercises with block types, challenges, leaderboard view, profiles, etc.

Test account: stephen@dangerfitness.com / DangerBoy2026!

## When Done

Run these commands:
```
git add -A && git commit -m "Phase 1: Core app with auth, dashboard, program, workouts, challenges, settings" && git push origin main
```

Then run:
```
openclaw system event --text "Done: Danger Fitness mobile Phase 1 complete — auth, dashboard, 30-day program, workout day view with timers, challenge leaderboard, settings. All dark theme with BRAAP green." --mode now
```
