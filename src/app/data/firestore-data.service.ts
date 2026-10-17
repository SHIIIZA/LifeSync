import { Injectable, computed, signal } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  enableIndexedDbPersistence,
  type QueryDocumentSnapshot,
} from '@angular/fire/firestore';
import {
  BudgetCategory,
  Expense,
  GroceryItem,
  HabitStreak,
  MealSlot,
  RoutineItem,
  StudyBlock,
} from '../models/lifesync.models';

// Firestore-backed store — single source of truth for all pages.
@Injectable({ providedIn: 'root' })
export class FirestoreDataService {
  readonly userName = signal('Mika');

  readonly routine = signal<RoutineItem[]>([]);
  readonly habits = signal<HabitStreak[]>([]);
  readonly studyBlocks = signal<StudyBlock[]>([]);
  readonly budgetCategories = signal<BudgetCategory[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly meals = signal<MealSlot[]>([]);
  readonly groceries = signal<GroceryItem[]>([]);

  readonly routineProgress = computed(() => {
    const items = this.routine();
    const done = items.filter((i) => i.done).length;
    return items.length ? Math.round((done / items.length) * 100) : 0;
  });

  readonly totalSpent = computed(() =>
    this.budgetCategories().reduce((sum, c) => sum + c.spent, 0),
  );

  readonly totalLimit = computed(() =>
    this.budgetCategories().reduce((sum, c) => sum + c.limit, 0),
  );

  // Loading & error state for offline resilience (item 10)
  readonly loading = signal<boolean>(true);
  readonly lastError = signal<string | null>(null);
  readonly isOnline = signal<boolean>(navigator.onLine);

  private uid: string | null = null;
  private unsubscribers: Array<() => void> = [];
  private boundCollections = 0;
  private totalCollections = 7;

  constructor(private firestore: Firestore, auth: Auth) {
    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.lastError.set(null);
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.lastError.set('You are offline — changes will sync when you reconnect.');
    });

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(this.firestore).catch((err) => {
      // Persistence is best-effort; fail silently in unsupported contexts
      console.warn('Firestore persistence not available:', err);
    });

    authState(auth).subscribe((user) => {
      // Stop listening to the previous user's data.
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
      this.uid = user?.uid ?? null;
      this.boundCollections = 0;
      this.loading.set(true);

      this.routine.set([]);
      this.habits.set([]);
      this.studyBlocks.set([]);
      this.budgetCategories.set([]);
      this.expenses.set([]);
      this.meals.set([]);
      this.groceries.set([]);

      if (!user) {
        this.userName.set('Guest');
        this.loading.set(false);
        return;
      }
      this.userName.set(user.email?.split('@')[0] ?? 'You');
      this.bindCollection<RoutineItem>('routine', this.routine);
      this.bindCollection<HabitStreak>('habits', this.habits);
      this.bindCollection<StudyBlock>('studyBlocks', this.studyBlocks);
      this.bindCollection<BudgetCategory>('budgetCategories', this.budgetCategories);
      this.bindCollection<Expense>('expenses', this.expenses);
      this.bindCollection<MealSlot>('meals', this.meals);
      this.bindCollection<GroceryItem>('groceries', this.groceries);
    });
  }

  private userDoc(name: string) {
    return collection(this.firestore, 'users', this.uid!, name);
  }

  private bindCollection<T extends { id: string }>(
    name: string,
    target: ReturnType<typeof signal<T[]>>,
  ) {
    const unsub = onSnapshot(
      this.userDoc(name),
      (snap) => {
        target.set(snap.docs.map((d) => ({ ...(d.data() as T), id: d.id })));
        if (name === 'routine') {
          void this.resetRecurring(snap.docs).catch((err: unknown) => {
            console.error('Firestore recurring routine reset error', err);
            this.lastError.set('Could not reset recurring items — check your connection.');
          });
        }
        this.lastError.set(null);
        this.boundCollections++;
        if (this.boundCollections >= this.totalCollections) {
          this.loading.set(false);
        }
      },
      (err) => {
        console.error(`Firestore ${name} error`, err);
        this.lastError.set('Could not sync data — check your connection.');
        this.loading.set(false);
      },
    );
    this.unsubscribers.push(unsub);
  }

  // Retry re-binding all collections after an error
  retryConnection() {
    this.lastError.set(null);
    this.loading.set(true);
    this.boundCollections = 0;
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    if (this.uid) {
      this.bindCollection<RoutineItem>('routine', this.routine);
      this.bindCollection<HabitStreak>('habits', this.habits);
      this.bindCollection<StudyBlock>('studyBlocks', this.studyBlocks);
      this.bindCollection<BudgetCategory>('budgetCategories', this.budgetCategories);
      this.bindCollection<Expense>('expenses', this.expenses);
      this.bindCollection<MealSlot>('meals', this.meals);
      this.bindCollection<GroceryItem>('groceries', this.groceries);
    }
  }

  async toggleRoutineItem(id: string) {
    const item = this.routine().find((i) => i.id === id);
    if (!item) return;
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'routine', id), {
      done: !item.done,
      completedAt: !item.done ? Date.now() : null,
    });
  }

  // Recurring items that were completed in a previous period get reset to
  // not-done so the same routine reappears every day/week.
  async resetRecurring(docs: QueryDocumentSnapshot[] = []) {
    const now = Date.now();
    await Promise.all(
      docs.map(async (d) => {
        const item = d.data() as RoutineItem;
        if (!item.done || !item.completedAt) return;
        if (item.recurring === 'daily' && now - item.completedAt > 24 * 3600e3) {
          await updateDoc(d.ref, { done: false, completedAt: null });
        } else if (item.recurring === 'weekly' && now - item.completedAt > 7 * 24 * 3600e3) {
          await updateDoc(d.ref, { done: false, completedAt: null });
        }
      }),
    );
  }

  async logHabitProgress(id: string, amount: number) {
    const habit = this.habits().find((h) => h.id === id);
    if (!habit) return;
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'habits', id), {
      progress: Math.min(habit.target, habit.progress + amount),
    });
  }

  async toggleGroceryItem(id: string) {
    const item = this.groceries().find((g) => g.id === id);
    if (!item) return;
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'groceries', id), {
      checked: !item.checked,
    });
  }

  async addExpense(expense: Omit<Expense, 'id'>) {
    await addDoc(this.userDoc('expenses'), expense);
    const cat = this.budgetCategories().find((c) => c.name === expense.category);
    if (cat) {
      await updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', cat.id), {
        spent: cat.spent + expense.amount,
      });
    }
  }

  async deleteExpense(id: string) {
    const e = this.expenses().find((x) => x.id === id);
    await deleteDoc(doc(this.firestore, 'users', this.uid!, 'expenses', id));
    if (e) {
      const cat = this.budgetCategories().find((c) => c.name === e.category);
      if (cat) {
        await updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', cat.id), {
          spent: Math.max(0, cat.spent - e.amount),
        });
      }
    }
  }

  async addStudyBlock(block: Omit<StudyBlock, 'id'>) {
    await addDoc(this.userDoc('studyBlocks'), block);
  }

  async deleteStudyBlock(id: string) {
    await deleteDoc(doc(this.firestore, 'users', this.uid!, 'studyBlocks', id));
  }

  async addRoutineItem(item: Omit<RoutineItem, 'id'>) {
    await addDoc(this.userDoc('routine'), item);
  }

  async updateRoutineItem(id: string, patch: Partial<RoutineItem>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'routine', id), patch);
  }

  async updateHabit(id: string, patch: Partial<HabitStreak>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'habits', id), patch);
  }

  async updateStudyBlock(id: string, patch: Partial<StudyBlock>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'studyBlocks', id), patch);
  }

  async updateBudgetCategory(id: string, patch: Partial<BudgetCategory>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', id), patch);
  }

  async updateMeal(id: string, patch: Partial<MealSlot>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'meals', id), patch);
  }

  async updateGroceryItem(id: string, patch: Partial<GroceryItem>) {
    await updateDoc(doc(this.firestore, 'users', this.uid!, 'groceries', id), patch);
  }

  async addBudgetCategory(category: Omit<BudgetCategory, 'id'>) {
    await addDoc(this.userDoc('budgetCategories'), category);
  }

  async addHabit(habit: Omit<HabitStreak, 'id'>) {
    await addDoc(this.userDoc('habits'), habit);
  }

  async deleteHabit(id: string) {
    await deleteDoc(doc(this.firestore, 'users', this.uid!, 'habits', id));
  }

  async addMeal(meal: Omit<MealSlot, 'id'>) {
    // Replace any existing entry for the same day + meal slot.
    const snap = await getDocs(this.userDoc('meals'));
    for (const d of snap.docs) {
      const data = d.data() as MealSlot;
      if (data.day === meal.day && data.meal === meal.meal) await deleteDoc(d.ref);
    }
    await addDoc(this.userDoc('meals'), meal);
  }

  async addGroceryItem(item: Omit<GroceryItem, 'id'>) {
    await addDoc(this.userDoc('groceries'), item);
  }

  // Delete every document in the signed-in user's subtree.
  async clearMyData() {
    const names = [
      'routine',
      'habits',
      'studyBlocks',
      'budgetCategories',
      'expenses',
      'meals',
      'groceries',
    ];
    for (const name of names) {
      const snap = await getDocs(this.userDoc(name));
      for (const d of snap.docs) await deleteDoc(d.ref);
    }
  }
}
