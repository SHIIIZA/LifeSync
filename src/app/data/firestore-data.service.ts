import { Injectable, computed, inject, signal } from '@angular/core';
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
import { ConnectivityService } from './connectivity.service';

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
  readonly isOnline = inject(ConnectivityService).isOnline;

  private uid: string | null = null;
  private unsubscribers: Array<() => void> = [];
  private boundCollections = 0;
  private totalCollections = 7;

  constructor(private firestore: Firestore, auth: Auth) {
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

  private async persistWrite(write: Promise<unknown>, action: string): Promise<void> {
    if (this.isOnline()) {
      await write;
      return;
    }

    void write.catch((error: unknown) => {
      console.error(`Firestore ${action} error`, error);
      this.lastError.set('Could not sync your changes. Please reconnect and try again.');
    });
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
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'routine', id), {
        done: !item.done,
        completedAt: !item.done ? Date.now() : null,
      }),
      'routine update',
    );
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
          await this.persistWrite(
            updateDoc(d.ref, { done: false, completedAt: null }),
            'recurring routine reset',
          );
        } else if (item.recurring === 'weekly' && now - item.completedAt > 7 * 24 * 3600e3) {
          await this.persistWrite(
            updateDoc(d.ref, { done: false, completedAt: null }),
            'recurring routine reset',
          );
        }
      }),
    );
  }

  async logHabitProgress(id: string, amount: number) {
    const habit = this.habits().find((h) => h.id === id);
    if (!habit) return;
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'habits', id), {
        progress: Math.min(habit.target, habit.progress + amount),
      }),
      'habit update',
    );
  }

  async toggleGroceryItem(id: string) {
    const item = this.groceries().find((g) => g.id === id);
    if (!item) return;
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'groceries', id), {
        checked: !item.checked,
      }),
      'grocery update',
    );
  }

  async addExpense(expense: Omit<Expense, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('expenses'), expense), 'expense creation');
    const cat = this.budgetCategories().find((c) => c.name === expense.category);
    if (cat) {
      await this.persistWrite(
        updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', cat.id), {
          spent: cat.spent + expense.amount,
        }),
        'budget update',
      );
    }
  }

  async deleteExpense(id: string) {
    const e = this.expenses().find((x) => x.id === id);
    await this.persistWrite(
      deleteDoc(doc(this.firestore, 'users', this.uid!, 'expenses', id)),
      'expense deletion',
    );
    if (e) {
      const cat = this.budgetCategories().find((c) => c.name === e.category);
      if (cat) {
        await this.persistWrite(
          updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', cat.id), {
            spent: Math.max(0, cat.spent - e.amount),
          }),
          'budget update',
        );
      }
    }
  }

  async addStudyBlock(block: Omit<StudyBlock, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('studyBlocks'), block), 'schedule creation');
  }

  async deleteStudyBlock(id: string) {
    await this.persistWrite(
      deleteDoc(doc(this.firestore, 'users', this.uid!, 'studyBlocks', id)),
      'schedule deletion',
    );
  }

  async addRoutineItem(item: Omit<RoutineItem, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('routine'), item), 'routine creation');
  }

  async updateRoutineItem(id: string, patch: Partial<RoutineItem>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'routine', id), patch),
      'routine update',
    );
  }

  async updateHabit(id: string, patch: Partial<HabitStreak>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'habits', id), patch),
      'habit update',
    );
  }

  async updateStudyBlock(id: string, patch: Partial<StudyBlock>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'studyBlocks', id), patch),
      'schedule update',
    );
  }

  async updateBudgetCategory(id: string, patch: Partial<BudgetCategory>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'budgetCategories', id), patch),
      'budget update',
    );
  }

  async updateMeal(id: string, patch: Partial<MealSlot>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'meals', id), patch),
      'meal update',
    );
  }

  async updateGroceryItem(id: string, patch: Partial<GroceryItem>) {
    await this.persistWrite(
      updateDoc(doc(this.firestore, 'users', this.uid!, 'groceries', id), patch),
      'grocery update',
    );
  }

  async addBudgetCategory(category: Omit<BudgetCategory, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('budgetCategories'), category), 'budget creation');
  }

  async addHabit(habit: Omit<HabitStreak, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('habits'), habit), 'habit creation');
  }

  async deleteHabit(id: string) {
    await this.persistWrite(
      deleteDoc(doc(this.firestore, 'users', this.uid!, 'habits', id)),
      'habit deletion',
    );
  }

  async addMeal(meal: Omit<MealSlot, 'id'>) {
    for (const existing of this.meals()) {
      if (existing.day === meal.day && existing.meal === meal.meal) {
        await this.persistWrite(
          deleteDoc(doc(this.firestore, 'users', this.uid!, 'meals', existing.id)),
          'meal deletion',
        );
      }
    }
    await this.persistWrite(addDoc(this.userDoc('meals'), meal), 'meal creation');
  }

  async addGroceryItem(item: Omit<GroceryItem, 'id'>) {
    await this.persistWrite(addDoc(this.userDoc('groceries'), item), 'grocery creation');
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
      for (const d of snap.docs) {
        await this.persistWrite(deleteDoc(d.ref), 'account data deletion');
      }
    }
  }
}
