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

## Reading the app's syntax

LifeSync screens use Angular templates with TypeScript:

- `{{ value }}` puts a value into the screen, such as `{{ item.title }}`.
- `[property]="value"` sends a value from the component to an element, such as `[checked]="item.done"`.
- `(event)="function()"` runs code when the user interacts with an element.
- `@if (condition) { ... }` shows content only when a condition is true.
- `@for (item of items; track item.id) { ... }` repeats content for each item in a list.
- `name: string` is a type annotation: it says `name` should contain text.
- A **component** controls a screen; a **service** shares logic or data between screens.
- A **signal** is a value the screen watches. When it changes, the screen updates automatically.
- `async` and `await` let code wait for work such as saving data to finish.

## Examples from the app

### Event handler

In the dashboard template, checking a routine item's checkbox calls a component method:

```html
<ion-checkbox
  [checked]="item.done"
  (ionChange)="toggle(item.id)"
></ion-checkbox>
```

`(ionChange)` listens for a checkbox change. When it happens, `toggle` receives that item's ID. `[checked]` keeps the checkbox in sync with whether the item is done.

### Function

The dashboard component defines the `toggle` function:

```ts
toggle(id: string) {
  const item = this.data.routine().find((entry) => entry.id === id);
  if (item?.requiresConfirmation && !item.done) {
    const ok = window.confirm(`Confirm: ${item.title}?`);
    if (!ok) return;
  }
  this.data.toggleRoutineItem(id);
}
```

`id: string` means the function expects a text ID. It finds the matching item, asks for confirmation when required, and stops if the user declines. Otherwise, it asks the data service to update the item.

### Function that saves data

The dashboard's `addItem` function validates the form and waits for the save:

```ts
async addItem() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  const { title, time, category, recurring } = this.form.getRawValue();
  await this.data.addRoutineItem({
    title: sanitizeText(title!),
    time: this.formatRoutineTime(time!),
    category: category!,
    done: false,
    recurring: recurring!,
    requiresConfirmation: category === 'medication',
  });
  this.form.reset({ title: '', time: '', category: 'personal', recurring: 'none' });
}
```

`async` allows the function to wait. `await` waits for the save to finish. If the form is invalid, `return` exits early so invalid data is not saved. The `!` after a form value tells TypeScript that validation has already checked the value is present.

### Control structures in the template

The dashboard conditionally shows a loading indicator and displays the routine list:

```html
@if (data.loading()) {
  <app-loading-spinner></app-loading-spinner>
}

@for (item of data.routine(); track item.id) {
  <p>{{ item.title }}</p>
}
```

`@if` chooses whether to show the spinner. `@for` repeats the paragraph once per routine item; `track item.id` helps Angular keep each displayed item matched to its data.

## Using the app offline

The app checks both the device's network status and whether it can reach the internet. When disconnected, it keeps an offline notice visible and confirms when internet access returns. Firestore keeps previously loaded data on the device and queues supported changes locally, so editing screens can continue to respond without waiting for the server. Queued changes sync when a connection returns. Sign-in and other features that need an internet connection still require connectivity; offline access is available for data already loaded on the device.
