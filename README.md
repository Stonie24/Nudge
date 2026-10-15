# Nudge

A cross-platform task tracking app built with React Native (Expo), TypeScript, and Supabase. Nudge helps you manage recurring habits and daily tasks with a clean, minimal interface that works on iOS, Android, and web.

## Features

- **Daily Board** — schedule tasks from your backlog into today's plan; recurring tasks auto-populate
- **Kanban & List views** — responsive layout adapts to screen size (list on mobile, kanban on desktop/web)
- **Tag system** — color-coded tags with custom presets, synced to the database
- **Full-text search & filtering** — search and filter across your entire backlog by name or tag
- **Dark mode** — system-aware with manual override
- **Animations & micro-interactions** — haptic feedback, smooth transitions throughout
- **Calendar integration** — daily tasks appear as events in your device calendar
- **Auth** — email/password sign-up and sign-in via Supabase Auth
- **GitHub issue feedback** — submit feedback directly from the app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 55) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Backend / Auth | Supabase (PostgreSQL + RLS) |
| Data fetching | TanStack Query v5 |
| Styling | NativeWind (Tailwind CSS for RN) |
| Calendar | expo-calendar |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Stonie24/Nudge.git
cd Nudge

# Install dependencies
npm install

# Start the dev server
npm start
```

You'll need a Supabase project. Create a `.env` file at the root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Run on platform:

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Browser
```

## Testing on your phone (over-the-air updates)

Every pushed branch is published as an [EAS Update](https://docs.expo.dev/eas-update/introduction/) on an update branch with the same name (see `.github/workflows/eas-update.yml`), so you can try it on a phone without a computer.

**One-time setup**

1. Create an Expo access token at [expo.dev → Account settings → Access tokens](https://expo.dev/settings/access-tokens).
2. In GitHub → Settings → Secrets and variables → Actions, add:
   - `EXPO_TOKEN` — the token from step 1
   - `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same values as your `.env`
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — for Google sign-in
3. Make a new development build (needed once, since `expo-updates` is a native module):
   ```bash
   eas build --profile development --platform android   # or ios
   ```
   and install it from the link EAS gives you. iOS also needs the device registered first: `eas device:create`.

**Testing a branch**

Push the branch, wait for the **EAS Update** action to finish, then open the Nudge development build → **Extensions** tab → pick the branch's update. A new build is only needed again when native dependencies change (the `fingerprint` runtime version keeps updates from loading into an incompatible build).

## Project Structure

```
Nudge/
├── app/          # Expo Router screens (file-based routing)
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Supabase client, utilities
├── types/        # TypeScript type definitions
├── supabase/     # Database migrations & config
└── assets/       # Images, fonts
```

## Roadmap

See [Roadmap.md](./Roadmap.md) for planned features including push notifications, offline support, streak tracking, OAuth, and health integrations (Apple HealthKit, Google Fit).
