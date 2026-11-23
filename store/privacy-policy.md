# Nudge Privacy Policy

> **Published on the web at `/privacy`** (the app's own web version), and
> linked from the app. Your details in `[brackets]` are filled in from
> [legal-details.json](legal-details.json) when the page is built: fill that
> in, run `npm run legal` and commit. If the app starts collecting something
> new, update this page and the store privacy answers in
> [privacy-answers.md](privacy-answers.md).

**Effective date:** [date]

Nudge is a daily planner for tasks and habits, made by [your name]
("I", "me"). This policy explains what information Nudge handles, why, and
the choices you have. If you have questions, email [contact email].

## The short version

- Nudge stores what you put into it (your account, tasks, habits and settings) so it can show it to you on all your devices.
- There are **no ads, no analytics and no tracking**, and your data is never sold.
- Your phone's calendar is read **on your device only** and is never uploaded.
- You can **delete your account and all its data** in Settings at any time.

## What Nudge collects

### Your account
- **Email address** and a **password** (stored securely by our login provider; I never see it).
- If you **sign in with Google**: your name, email address and profile picture link, as shared by Google.
- If you **sign in with Apple**: your email address (or a private relay address, if you choose Hide My Email) and your name, if you choose to share it.
- An **account ID**, a random identifier that links your data to your account.
- **Settings** saved with your account: whether you finished the intro, and your daily reminder on/off and time.

### What you put into Nudge
- **Tasks**: titles, notes, tags, due dates, the day a task is planned for, checklist items, and whether and when it was completed.
- **Habits**: which daily habits you checked in on, and on which days.
- **Tags** you create, and **calendar entries you create in Nudge**.
- **Profile picture**, if you upload one. It's stored at a long, hard-to-guess web link that isn't listed anywhere, but anyone who has the exact link can view the image.

### Calendars (optional)
- **Your phone's calendar:** if you allow it, Nudge reads events on your device to show them next to your tasks. These events are **not uploaded or stored** by Nudge.
- **Google Calendar:** if you connect it, Nudge stores an access token that allows **read-only** access to your Google Calendar. Your events are fetched directly from Google to your device and are **not stored** by Nudge. You can disconnect at any time in Settings → Calendar integrations, and you can also remove Nudge's access in your Google Account settings.

### Feedback (optional)
- If you send feedback from Settings, your message is posted as a **public issue on Nudge's GitHub page**, together with your account ID (not your name or email). Please don't include personal details in feedback.

### Stored on your device
- A copy of your tasks and settings, so the app works offline and loads quickly.
- Small preferences, such as suggestions you hid for today, backlog tasks you chose to keep, your theme, and your scheduled daily reminder.

These never leave your device. The copy of your tasks is removed when you sign out or delete your account; everything is removed when you uninstall the app.

### What Nudge does **not** collect
No location, no contacts, no advertising IDs, no analytics or usage tracking, and no data from other apps.

## How it's used

Your information is used only to run Nudge for you: to sign you in, store and sync your tasks and habits across your devices, show your calendars next to your tasks, send the daily reminder you chose, and work out on-device features such as suggestions, your pace, streaks and the weekly overview. Those features are computed **on your device** from your own data.

If you're in the EU/EEA or the UK, the legal bases are:
- **Contract:** providing the app you signed up for (your account and content).
- **Consent:** optional features you turn on (calendar access, Google Calendar, reminders, profile picture, feedback). You can withdraw consent at any time by turning the feature off.
- **Legitimate interests:** keeping the service secure and working.

## Who else handles your data

Nudge uses a few services to run. They process data only on my behalf, or when you choose to use them:

| Service | What for | What they receive |
|---|---|---|
| **Supabase** | Sign-in, database and file storage (hosting) | Your account and everything you store in Nudge. Hosted in [Supabase region, e.g. EU (Frankfurt)]. |
| **Google** (only if you use it) | Sign in with Google; reading your Google Calendar | What you approve on Google's consent screen |
| **Apple** (only if you use it) | Sign in with Apple | What you approve on Apple's sign-in sheet |
| **GitHub** (only if you send feedback) | Hosting feedback as public issues | Your feedback text and account ID |
| **Expo** | Delivering app updates | Technical information such as your device type and app version when the app checks for updates |
| **Apple / Google** | Delivering reminder notifications and the app itself | Handled by your phone's operating system |

Your data is never sold, rented or used for advertising.

## How long it's kept

Your data is kept for as long as you have an account. When you delete your account, your tasks, habits, tags, calendar entries, Google Calendar connection, profile picture and login are deleted immediately from the live database. Backups kept by the hosting provider are overwritten within [number of days, e.g. 7 days].

## Your rights and choices

You can:
- **See and change** your data in the app at any time.
- **Delete your account** and everything in it. See below.
- **Get a copy** of your data: email [contact email] and I'll send it to you. An in-app export is planned.
- **Turn off** calendar access, Google Calendar, reminders and photo access at any time, in Settings or your phone's settings.

If you're in the EU/EEA or the UK, you also have the right to access, correct, delete, restrict or object to the processing of your data, and to data portability. You can also complain to your data protection authority ([your country's authority, e.g. IMY in Sweden]).

<a id="delete-your-account"></a>
## Deleting your account

- **In the app:** Settings → **Delete account** → **Delete my account**. This permanently deletes your account and everything in it right away.
- **On the web:** sign in at [/delete-account](/delete-account) and follow the same steps.
- **Without the app:** email [contact email] from the address on your account, with the subject "Delete my Nudge account", and I'll delete it within 30 days.

## Children

Nudge isn't directed at children under 13, and I don't knowingly collect information from them. If you believe a child has created an account, email [contact email] and I'll delete it.

## Security

All data is sent over encrypted connections (HTTPS). In the database, rules ensure each account can only read and change its own data. No system is perfectly secure, but I take reasonable steps to protect your information.

## Changes to this policy

If this policy changes, the new version will be posted here with a new effective date. If the changes are significant, you'll be told in the app.

## Contact

[your name]
[contact email]
[country]
