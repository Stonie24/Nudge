# Store privacy forms and questionnaires

Answers for Apple's **App Privacy** section and Google Play's **Data safety**
form, plus the other questionnaires both stores ask before release. They
match [privacy-policy.md](privacy-policy.md) and what the app does as of this
version: if the app starts collecting something new, update all three.

---

## ⚠️ Fix before submitting

These will block approval or the launch:

1. **Sign in with Apple (App Store).** Apple's guideline 4.8 says an app that
   offers a third-party login (Nudge offers **Sign in with Google**) must also
   offer an equivalent privacy-focused login, and Sign in with Apple is the
   standard way to meet it. Apple commonly rejects apps without it. This needs
   code (Supabase supports Apple as a login provider) and an Apple Developer
   account. *Alternative:* hide the Google button in the iOS app.
2. **Google OAuth verification (Google Calendar).** Read-only Calendar access
   (`calendar.readonly`) is a "sensitive" scope. Until Google verifies the
   OAuth app, only up to 100 test users can connect, and they see an
   "unverified app" warning. In Google Cloud console → **OAuth consent
   screen**: add the privacy policy URL, app home page and logo, verify your
   domain, and submit for verification (Google may ask for a short video of
   the Calendar connect flow). Allow a few weeks. Sign in with Google itself
   (name, email, picture) doesn't need this.
3. **Account deletion link (Google Play).** Play requires a **web** link where
   people can ask to delete their account, as well as the in-app option. Use
   the privacy policy's section:
   `…/store/privacy-policy.md#delete-your-account`.
4. **A test account with data**, for both stores' reviewers. See
   [listing.md](listing.md#app-review-information).

---

## Apple: App Privacy (App Store Connect → App Privacy)

**Do you or your third-party partners collect data from this app?** Yes.

**Is any data used to track users?** No. Nudge has no ads, no analytics SDKs
and no data brokers.

For **each data type below**, answer: **Linked to the user's identity: Yes**,
**Used for tracking: No**, **Purpose: App Functionality** only.

| Category | Data type | Why it's collected |
|---|---|---|
| Contact Info | **Email Address** | Account sign-in |
| Contact Info | **Name** | Only with Sign in with Google (from Google) |
| User Content | **Photos or Videos** | Optional profile picture |
| User Content | **Customer Support** | Optional feedback (posted as a GitHub issue) |
| User Content | **Other User Content** | Tasks, notes, checklists, tags, habit check-ins, calendar entries created in Nudge |
| Identifiers | **User ID** | Account ID that links data to the account |

**Not collected:** Location, Contacts, Health & Fitness, Financial Info,
Browsing/Search History, Usage Data, Diagnostics, Purchases, Sensitive Info,
Device ID. Calendar events from the phone are only read on the device and
Google Calendar events go straight from Google to the device, so neither
counts as "collected".

---

## Google Play: Data safety (Play Console → App content → Data safety)

**Does your app collect or share any of the required user data types?** Yes.

**Is all of the user data collected by your app encrypted in transit?** Yes.

**Which of the following methods of account creation does your app support?**
Username and password; OAuth (Sign in with Google).

**Do you provide a way for users to request that their data is deleted?**
Yes. Delete-account URL: `…/store/privacy-policy.md#delete-your-account`.

### Data types

For each type: **Collected: Yes. Shared: No.** Processed ephemerally: **No**.
Purpose: **App functionality** and **Account management** (for the account
fields).

| Category | Data type | Required or optional |
|---|---|---|
| Personal info | **Email address** | Required |
| Personal info | **Name** | Optional (Sign in with Google) |
| Personal info | **User IDs** | Required |
| Photos and videos | **Photos** | Optional (profile picture) |
| App activity | **Other user-generated content** | Required (tasks, habits, checklists, tags, calendar entries, feedback) |

**Why "Shared: No":** Google doesn't count transfers to service providers
that process data for you (Supabase, Expo) as sharing, nor transfers the user
starts and expects (posting feedback, connecting Google). **Not collected:**
location, contacts, calendar (read on the device only), financial info, health,
messages, audio, files, web history, app info and performance, device IDs.

---

## Other Play Console declarations (App content)

| Section | Answer |
|---|---|
| **Ads** | No, the app doesn't contain ads |
| **App access** | Some functionality is restricted → add the test account and instructions |
| **Content rating** | Run the IARC questionnaire, category "Utility, Productivity, Communication, or Other": answer **No** to everything → rated Everyone / PEGI 3 |
| **Target audience** | 13 and over (not designed for children) |
| **News app** | No |
| **COVID-19 apps** | Not a COVID-19 app |
| **Government app** | No |
| **Financial features** | None |
| **Health apps** | Not a health app (habit tracking isn't health functionality) |
| **Data safety** | As above |

## Other App Store answers

| Question | Answer |
|---|---|
| **Export compliance / encryption** | Already answered in `app.json` (`usesNonExemptEncryption: false`): the app only uses standard HTTPS |
| **Content rights** | Doesn't contain, show or access third-party content (beyond the user's own calendars) |
| **Advertising identifier (IDFA)** | Not used |
| **Age rating** | 4+ |
