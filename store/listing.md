# Store listing

Copy for the App Store and Google Play. Every field is within its store limit
(counts in brackets). Paste as-is, or tweak the wording; if you change a
field, keep it under the limit shown.

> **Check the name is free first.** App Store names must be unique. If
> "Nudge: Daily Tasks & Habits" is taken, alternatives: "Nudge – Tasks & Habits",
> "Nudge Daily Planner", "Nudge: Plan Your Day".

---

## App Store (App Store Connect)

| Field | Text |
|---|---|
| **Name** (27/30) | Nudge: Daily Tasks & Habits |
| **Subtitle** (29/30) | A calmer way to plan your day |
| **Primary category** | Productivity |
| **Secondary category** | Lifestyle |
| **Age rating** | 4+ (answer "None" to every content question) |
| **Price** | Free |
| **Privacy Policy URL** | `https://<your-site>.expo.app/privacy` (the web app's page, built from [privacy-policy.md](privacy-policy.md)) |
| **Support URL** | `https://github.com/Stonie24/Nudge/issues` (or your own page/email) |
| **Copyright** | `2026 [your name]` |

**Promotional text** (148/170). This can be changed at any time without a new release:

```
Plan today without the overwhelm. Nudge learns how much you usually get done and suggests just enough: overdue tasks first, then what fits your day.
```

**Keywords** (95/100). Comma-separated, no spaces after commas. Words already in the name and subtitle are left out on purpose, because Apple indexes those already:

```
todo,to-do list,planner,routine,checklist,focus timer,streak,reminder,goals,productivity,agenda
```

**Description** (1799/4000):

```
Nudge is a calm daily planner for your tasks and habits. Put a few things on today's board, tick them off, and let everything else wait in your backlog, without the guilt.

PLAN TODAY, NOT EVERYTHING
• Quick-add tasks to today in a second; the rest lives in your backlog
• Swipe right to send a task back to the backlog, swipe left to delete, both with undo
• Optional due dates with a gentle overdue reminder
• Checklists inside a task for the small steps

SUGGESTIONS THAT KNOW YOU
• "Suggested for today" brings up overdue tasks, things left over from yesterday and anything due soon
• Nudge learns your pace (how much you usually finish on a given weekday) and only suggests what fits
• It notices your rhythms, like doing errands on Saturdays
• Old backlog tasks get a friendly "Still want to do this?"
• Every suggestion says why it's there, and it's all worked out on your device

HABITS THAT STICK
• Daily habits with streaks and a progress ring
• A heads-up when you've been slipping on a habit, and an evening reminder when one habit stands between you and your streak
• A gentle daily reminder at a time you choose

FOCUS AND REFLECT
• Focus mode: one task at a time, full screen, with an optional 15, 25 or 45 minute timer
• Weekly overview: what you got done each day, your habit grid, your tags and a one-line insight

WORKS THE WAY YOU DO
• Works offline; your changes sync when you're back online
• See your calendar events next to your tasks (Google Calendar and your phone's calendar, read-only)
• Tags with colours, search and filters
• Light and dark mode
• Sign in with email or Google

PRIVATE BY DESIGN
No ads, no tracking and no selling your data. Your phone's calendar never leaves your device, and you can delete your account and everything in it from Settings at any time.
```

**What's New** (first version: Apple doesn't show this for a brand-new app, so you can leave it empty; use it from the first update):

```
Welcome to Nudge! Plan today with quick-add, due dates and checklists, keep your habits going with streaks, and let smart suggestions and focus mode help you get the right things done.
```

### App Review information

Apple's reviewers need to sign in, so give them a test account that has data in it:

1. In the app, sign up a new account, e.g. `appreview@<your domain>`, with a strong password, and finish onboarding.
2. Give it realistic content: run the `[demo]` SQL script from earlier with that email (it adds 8 weeks of history and a few backlog tasks), and add a couple of tasks and a daily habit by hand.
3. Enter the email and password under **Sign-in required → User name / Password**.

**Notes for the reviewer** (paste into "Notes"):

```
Nudge is a daily planner for tasks and habits. Sign in with the account above (email + password). Google sign-in is optional.

Things to try:
- Today: add a task with the "Add a task…" field; tick tasks; swipe a task right to move it to the backlog or left to delete it (both with undo).
- Tap a task to set a due date or add checklist items.
- "Focus ›" on the progress card opens focus mode; "This week ›" opens the weekly overview.
- Settings → Delete account permanently deletes the account and all its data.

Calendar access is optional and read-only: events from the phone's calendar are shown next to tasks and never leave the device.
```

---

## Google Play (Play Console)

| Field | Text |
|---|---|
| **App name** (27/30) | Nudge: Daily Tasks & Habits |
| **Category** | Productivity |
| **Tags** | Productivity, To-do list, Habit tracker, Planner (pick from Google's list) |
| **Contains ads** | No |
| **Email address** | `[your contact email]` (shown publicly on the listing) |
| **Privacy policy** | Same URL as for the App Store |

**Short description** (70/80):

```
A calm daily planner: tasks, habits and suggestions that fit your day.
```

**Full description** (1799/4000). Same as the App Store:

```
Nudge is a calm daily planner for your tasks and habits. Put a few things on today's board, tick them off, and let everything else wait in your backlog, without the guilt.

PLAN TODAY, NOT EVERYTHING
• Quick-add tasks to today in a second; the rest lives in your backlog
• Swipe right to send a task back to the backlog, swipe left to delete, both with undo
• Optional due dates with a gentle overdue reminder
• Checklists inside a task for the small steps

SUGGESTIONS THAT KNOW YOU
• "Suggested for today" brings up overdue tasks, things left over from yesterday and anything due soon
• Nudge learns your pace (how much you usually finish on a given weekday) and only suggests what fits
• It notices your rhythms, like doing errands on Saturdays
• Old backlog tasks get a friendly "Still want to do this?"
• Every suggestion says why it's there, and it's all worked out on your device

HABITS THAT STICK
• Daily habits with streaks and a progress ring
• A heads-up when you've been slipping on a habit, and an evening reminder when one habit stands between you and your streak
• A gentle daily reminder at a time you choose

FOCUS AND REFLECT
• Focus mode: one task at a time, full screen, with an optional 15, 25 or 45 minute timer
• Weekly overview: what you got done each day, your habit grid, your tags and a one-line insight

WORKS THE WAY YOU DO
• Works offline; your changes sync when you're back online
• See your calendar events next to your tasks (Google Calendar and your phone's calendar, read-only)
• Tags with colours, search and filters
• Light and dark mode
• Sign in with email or Google

PRIVATE BY DESIGN
No ads, no tracking and no selling your data. Your phone's calendar never leaves your device, and you can delete your account and everything in it from Settings at any time.
```

**Release notes** for the first release (500 max):

```
Welcome to Nudge! Plan today with quick-add, due dates and checklists, keep your habits going with streaks, and let smart suggestions and focus mode help you get the right things done.
```

### App access (Play Console → App content → App access)

Choose **"All or some functionality is restricted"** and add the same test account and instructions as for Apple.

---

## Screenshots

The next step (item 3 of the plan). Suggested order, which is the story the
listing tells: Today with suggestions → Focus mode → Weekly overview → a task
with a checklist and due date → All tasks with tags → dark mode.

Sizes needed:
- **App Store:** 6.9" iPhone (1320 × 2868) is required; the store scales it for smaller phones. Add a 13" iPad set only if you keep iPad support on (`supportsTablet: true` in `app.json`).
- **Google Play:** at least 2 phone screenshots (1080 × 1920 or larger, 9:16), plus a **feature graphic** (1024 × 500) and a **512 × 512 app icon**.
