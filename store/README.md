# Store submission material

| File | What it's for |
|---|---|
| [listing.md](listing.md) | App Store and Google Play listing text (name, subtitle, descriptions, keywords), reviewer notes, screenshot sizes |
| [privacy-policy.md](privacy-policy.md) | The privacy policy, published at `/privacy` on the web app. Link it from both stores |
| [delete-account.md](delete-account.md) | How to delete your account, published at `/delete-account`. Google Play's "Delete account URL" |
| [legal-details.json](legal-details.json) | Your name, contact email and the other `[bracket]` details for both pages |
| [privacy-answers.md](privacy-answers.md) | Answers for Apple's App Privacy and Google's Data safety forms and other questionnaires, plus **blockers to fix before submitting** |

Keep these in step with the app: when Nudge starts collecting something new,
update the policy and both forms together.

## Publishing the pages

The `/privacy` and `/delete-account` pages in the app are built from the
markdown above. After editing `privacy-policy.md`, `delete-account.md` or
`legal-details.json`, run:

```bash
npm run legal
```

and commit the updated `lib/legal/content.generated.ts`. (The Typecheck
workflow fails if you forget.) The web app, pages included, is deployed to
EAS Hosting by the **Web deploy** workflow whenever main changes: see the
main README.
