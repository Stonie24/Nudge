# Nudge Roadmap

## v0.1 — Foundation ✅
- [x] Homepage
- [x] GitHub repo + stack decision (Expo, Supabase, TanStack Query, NativeWind)
- [x] Expo project scaffold
- [x] Supabase project + tasks table + RLS
- [x] User auth (email + password, sign up, sign in, sign out)
- [x] Basic task CRUD (add, complete, delete)
- [x] Tags with colors (presets + custom, synced to Supabase)
- [x] Daily board (recurring tasks + schedule from backlog)
- [x] All tasks screen (search, filter, sort, grouped by tag)
- [x] Settings screen (account info, stats, sign out)
- [x] Responsive layout (list on mobile, kanban on desktop)

## v0.21 — Polish & experience ✅
- [x] Add tasks to backlog
- [x] Search for tasks in backlog with Tags aswell
- [x] Daily tasks should be a different color node in calendar

## v0.22 — Polish & experience ← we are here
- [x] Dark mode
- [x] GitHub issue feedback integration
- [x] Animations & micro-interactions
- [x] Onboarding flow for new users
- [x] Push notifications / gentle nudge reminders
- [x] Offline support
- [x] Streak tracking for recurring tasks
- [ ] Make it possible to log in with OAuth for both mobile and desktop
- [ ] Costum profile picture thats get saved in the database, or pull the picture from the login service, if none of these still use defualt.
- [ ] Inline auth error states (wrong password, account creation failures, duplicate email, etc.) instead of relying on native alert popups

## Design refresh (from "Nudge Redesign" artifact)
Token-level reskin (color, type, spacing, icons, elevation) plus a few new pieces of product surface. See the artifact for the full mockups: https://claude.ai/artifact/9e5w5oRWtM77gYTKKVJmQc
- [x] Warm-tinted design token pass (color/type/space/radius/elevation) matching `lib/theme.ts` — replaces the current cool-grey borders, Georgia/serif split, and hard-coded hexes
- [x] Replace Unicode glyph icons (tab bar, onboarding, calendar integration rows) with real SVG icon set — fixes the empty-box Apple Calendar icon
- [x] Dark-mode tag chip palette (today the light chip colors are just reused on dark surfaces)
- [x] Task detail sheet — tapping a task opens title/tag/repeat/due date/notes instead of only toggling complete
- [ ] Swipe-to-delete with undo toast, replacing long-press + native confirm alert
- [ ] Inline quick-add on the Today board, replacing the full-screen Add Task modal for the common case
- [ ] Progress ring on the Today screen showing today's completion + streak
- [ ] Move calendar integrations (Google/Apple) from the Calendar screen into Settings
- [x] "Gentle nudges" reminder toggle + nudge time in Settings
- [ ] "Export my data" option in Settings

## v0.23 — Power features
- [ ] Optional due dates on tasks (overdue indicator, sort by due date)
- [ ] Subtasks / checklists inside a task (flat checklist, progress shown on task card)
- [ ] Smart daily suggestions (surface overdue + due-soon backlog items automatically)
- [ ] Weekly overview screen (tasks completed, active tags, streak summary)
- [ ] Focus mode (one task at a time, full screen, optional timer)

## v0.3 — Growth
- [ ] iOS App Store submission
- [ ] Android Play Store submission
- [ ] Public web app
- [ ] Waitlist / landing page updates
- [ ] Public beta

## v0.4 — Health integrations
Connect Nudge to health data so recurring habits can auto-complete
based on real activity.

- [ ] Apple HealthKit integration (iOS)
  - Sleep, steps, calories, workouts
  - Auto-complete tasks when health goals are met
- [ ] Google Fit / Health Connect (Android)
  - Same as above for Android users
- [ ] App integrations via health aggregators
  - Sleep Cycle → via Apple Health
  - Lifesum → via Apple Health / Google Fit
  - Garmin, Fitbit, Oura → direct API or via health platforms
- [ ] Health dashboard in Settings
  - View synced health data
  - Map health metrics to recurring tasks

## v1.0 — Launch
- [ ] Full onboarding flow
- [ ] App store screenshots & marketing
- [ ] Public launch