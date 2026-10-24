# LifeSync

A mobile-friendly personal productivity app built with **Angular 17 + Ionic 7 + Firebase** (Firestore, Auth). Capacitor-enabled for native iOS/Android builds.

---

## Features

### Accounts & Data
- Email/password sign-up with unique usernames; sign in using either username or email
- Per-user private data in Firestore
- Account page: display name editing, password reset, sign out, clear all data
- Startup restores the Firebase session before routing; logged-in users go straight to the dashboard and only signed-out users see onboarding
- Auth guards protect all app routes
- Branded startup splash with the LifeSync logo and “Fitness at your Fingertips” motto

### Dashboard
- Daily routine checklist (add, toggle, recurring rules)
- Medication items require explicit confirmation
- Local pill reminders + enable-reminders button (native + web fallback)
- Habit streak chips
- External daily quote (graceful offline fallback)
- Loading spinner + error banner with retry on Firestore failures

### Planner
- Add/delete study blocks with priority (urgent/soon/later)
- Edit existing study blocks (course, time, duration, priority, date)
- Priority matrix view
- Calendar week view of study blocks (today highlighted, unscheduled section)

### Calendar
- Week navigation (prev/next/today) with date range label
- Tap-to-edit any study block (modal with course, time, duration, priority, date)
- Supports arbitrary dates via `date` field (YYYY-MM-DD) or "Today, …" / "Tomorrow, …" strings
- Delete blocks from edit modal

### Habits
- Add/delete habits with target + unit
- Edit existing habits (name, target, unit)
- Log progress (+1 / +5 min / done)
- Streak counter and daily goal progress bar
- "Goal met" success toast

### Budget
- Budget categories with monthly limits
- Edit category limits inline
- Quick-entry expense form (validated), delete expenses
- Threshold color warnings + toast alert at 85%+
- Budget amounts and expense reports shown in Philippine pesos (₱)

### Meals
- Weekly meal grid (day × Breakfast/Lunch/Dinner)
- Tap any grid cell to edit that meal slot
- Add meals with ingredient lists
- Auto-generated grocery checklist from ingredients
- Manual grocery items + check-off

### Insights
- Routine %, total spent, top streak stat cards (empty-state safe)
- SVG bar charts: budget usage, habit streaks, study blocks by priority
- Auto-generated insight notes (real data)
- XML import of routine logs
- XSLT-generated HTML expense report

### Shared
- Persistent Insights/Account header on every tab
- Empty states, form hints, input validation + sanitization
- Accessible Contact Us form that saves support requests to a separate Firebase project
- Onboarding screen, mobile-friendly layout
- Light/dark colors follow the device appearance setting; interactive controls use larger touch targets
- Loading spinners + error banners with retry on all tab pages
- Offline resilience: Firestore IndexedDB persistence, online/offline detection, retry UX
- Invalid study-block edits, including impossible calendar dates, are blocked with a clear message
- Authentication and account errors use user-safe messages rather than exposing backend details

---

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Framework | Angular 17 (standalone components, signals) |
| UI        | Ionic 7 (standalone)                        |
| Backend   | Firebase Auth + Firestore                  |
| Native    | Capacitor 5 (iOS + Android)                 |
| Charts    | Custom SVG bar chart (no external library)  |
| Tests     | Karma + Jasmine                             |

---

## Project Structure

```
src/app/
├── account/          # Account page (profile, password reset, sign out)
├── api/              # External API service (quote, FX rate)
├── auth/             # Auth service + route guards
├── budget/           # Budget page (categories, expenses, limits)
├── calendar/         # Calendar page (week view, edit modal)
├── contact/           # Accessible support form + callable email client
├── dashboard/        # Dashboard (routine, reminders, quote)
├── data/             # Firestore data service + XML report service
├── habits/           # Habits page (add/edit/delete, streaks)
├── insights/         # Insights page (charts, notes, XML tools)
├── login/            # Login/signup page
├── meals/            # Meals page (grid, groceries)
├── models/           # TypeScript interfaces
├── notifications/    # Notification service (native + web fallback)
├── onboarding/       # Onboarding screen
├── planner/          # Planner page (study blocks, priority matrix)
├── shared/           # Shared components (header actions, charts, loading, errors)
└── tabs/             # Tab navigation
```

---

## Getting Started

```bash
npm install
npm start        # Dev server
npm run build    # Production build
npm test         # Run Karma tests
```

The production build and Jasmine tests cover the app's current code paths. Validate device-specific layouts, notifications, and orientation behavior on at least one Android or iOS device before release.

### Native Builds

```bash
npx cap add android  # Run once if the Android platform folder is missing
npm run build
npx cap sync android
npx cap open android
npx cap open ios      # Open in Xcode
```

On Windows, regenerate the Android logo assets after adding the platform or syncing, then build a debug APK with JDK 18 selected:

```powershell
npm run build
npx cap sync android
.\scripts\generate-android-branding.ps1
.\android\gradlew.bat -p .\android assembleDebug
```

The APK is written to `android\app\build\outputs\apk\debug\app-debug.apk`. The Android launcher icon and native splash are generated from `src\assets\lifesync-logo.png`; the web app then shows the branded splash while Firebase restores the saved session.

---

## Environment

Firebase config lives in `src/environments/environment.ts`. Replace the placeholder values with your real Firebase Console config.

Deploy `firestore.rules` when configuring Firebase. Username sign-in uses a Firestore `usernames` index that stores each username's email and Firebase Auth UID. The rules allow logged-out clients to read one exact username record (needed to resolve sign-in), but disallow listing the collection and restrict writes to the matching signed-in account. As a result, username/email pairs are not private from someone who knows or guesses a username.

### Free Contact Us inbox setup

Contact Us stores support requests directly in the separate `lifesync-support` Firestore project. LifeSync sign-in and personal data remain in `lifesync-f8691`; Contact Us uses a separate Firebase app and anonymous support-project authentication. The app can save/read back only the submitting user's request; it cannot list, change, or delete support requests. After saving, the app opens an email draft addressed to `ianlancemgeronimo@gmail.com`, prefilled with the request. The sender must press Send; no automatic email service or paid Firebase plan is used. A fallback link is shown if the device does not open the draft automatically.

#### One-time setup in the free support project

1. Confirm the selected Firebase project is `lifesync-support`, not the existing account/data project.
2. Create **Firestore Database** in production mode. The database location cannot be changed after creation; choose the region carefully.
3. In **Authentication → Sign-in method**, enable **Anonymous** sign-in. This is used only to give each app installation an identity in the separate support project; it does not sign the user into their LifeSync account.
4. From the repository root, install or use Firebase CLI and sign in with an account that can administer the support project:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase projects:list
   ```

   Verify `lifesync-support` appears in the list. Then deploy only the support Firestore rules and indexes using the dedicated config:

   ```bash
   firebase --config firebase.support.json deploy --only firestore:rules,firestore:indexes --project lifesync-support
   ```

   Do not use the regular `firebase.json` for this deployment; it contains the separate account/data project's Firestore rules.
5. Build and install the updated app:

   ```powershell
   npm.cmd run build
   npx.cmd cap sync android
   .\android\gradlew.bat -p .\android assembleDebug
   ```

   Install `android\app\build\outputs\apk\debug\app-debug.apk`. For the website, deploy the newly built browser files using the team's existing web hosting process.
6. Submit a test request, then check **Firestore Database → `supportRequests`** in the support project. New requests are stored with a `createdAt` timestamp and sender information. The app then opens a prefilled email draft; press Send to deliver it to the support inbox. If no email app opens, use the fallback link on the confirmation.

The form retains its contents after a failed save. Retrying the unchanged request uses the same document ID, so an already-saved message is recognized rather than duplicated. Rules allow each anonymous support identity to read only its own submitted document; support messages cannot be listed or changed by app clients. The team should establish a retention policy and remove old requests through the Firebase Console. Spark is free only within Firebase's current quota limits; public app traffic can consume Firestore quota, so monitor usage and keep the support rules deployed.

---

## ILOs Covered

- XML parsing (routine import)
- XSLT transform (expense report export)
- Regex validation + input sanitization
- External APIs (daily quote, FX rate) with graceful fallbacks
- Local medication reminders (native + web)
