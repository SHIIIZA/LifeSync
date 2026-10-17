# LifeSync

A mobile-friendly personal productivity app built with **Angular 17 + Ionic 7 + Firebase** (Firestore, Auth). Capacitor-enabled for native iOS/Android builds.

---

## Features

### Accounts & Data
- Email/password sign-up with unique usernames; sign in using either username or email
- Per-user private data in Firestore
- Account page: display name editing, password reset, sign out, clear all data
- Auth guards protect all app routes; guest guard redirects logged-in users

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
- Live USD→PHP exchange rate

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
npm run build
npx cap sync
npx cap open ios      # Open in Xcode
npx cap open android  # Open in Android Studio
```

---

## Environment

Firebase config lives in `src/environments/environment.ts`. Replace the placeholder values with your real Firebase Console config.

Deploy `firestore.rules` when configuring Firebase. Username sign-in uses a Firestore `usernames` index that stores each username's email and Firebase Auth UID. The rules allow logged-out clients to read one exact username record (needed to resolve sign-in), but disallow listing the collection and restrict writes to the matching signed-in account. As a result, username/email pairs are not private from someone who knows or guesses a username.

---

## ILOs Covered

- XML parsing (routine import)
- XSLT transform (expense report export)
- Regex validation + input sanitization
- External APIs (daily quote, FX rate) with graceful fallbacks
- Local medication reminders (native + web)
