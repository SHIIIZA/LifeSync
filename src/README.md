# LifeSync source guide

This folder contains the app users see and the logic behind it. The examples below explain the main pieces in plain language.

## How the app starts

- `main.ts` starts the Angular app and connects it to the app's pages, Firebase sign-in, and Firestore data storage.
- `app/app.component.ts` is the outer app frame. It displays the pages and shows a notice when the device is offline.
- `app/app.routes.ts` decides which page to open. Pages that need an account are protected so signed-out visitors are sent to sign in.
- `app/splash/splash.page.ts` checks sign-in status, then opens the dashboard or the welcome screen.

## Sign-in and data

- `app/auth/auth.service.ts` handles signing in, creating accounts, signing out, and password resets. It translates usernames to their saved email address when needed.
- `app/login/login.page.ts` displays the sign-in form and gives people a readable message when something goes wrong.
- `app/data/firestore-data.service.ts` loads and updates each signed-in user's routines, habits, schedule, budget, meals, and grocery list. Live updates keep the screens in sync.
- `app/models/lifesync.models.ts` describes the kinds of information those screens use.

## Screens and shared tools

Each feature has its own folder, such as `dashboard`, `planner`, `habits`, and `budget`. The files in `app/shared` are reusable pieces used by more than one screen, such as theme controls and input checks. Images and other static files belong in `assets`.

## A few code terms

- **Import**: brings a tool or feature into a file so it can be used there.
- **Component**: a screen or reusable part of the app, including its display and behavior.
- **Service**: shared logic that screens can call, such as saving data or signing in.
- **Signal**: a value the app watches; when it changes, the screen can update automatically.
- **`async` / `await`**: lets the app wait for work such as signing in or saving data to finish.
- **`if`**: chooses what to do based on a condition, such as whether a user is signed in.

## Using the app offline

The app checks both the device's network status and whether it can reach the internet. When disconnected, it keeps an offline notice visible and confirms when internet access returns. Firestore keeps previously loaded data on the device and queues supported changes locally, so editing screens can continue to respond without waiting for the server. Queued changes sync when a connection returns. Sign-in and other features that need an internet connection still require connectivity; offline access is available for data already loaded on the device.
