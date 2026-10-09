export type RoutineCategory = 'study' | 'chore' | 'medication' | 'personal';

export interface RoutineItem {
  id: string;
  title: string;
  time: string; // display string, e.g. "8:00 AM"
  category: RoutineCategory;
  done: boolean;
  requiresConfirmation?: boolean; // e.g. medication reminders
  recurring?: 'none' | 'daily' | 'weekly';
  completedAt?: number; // epoch ms when marked done (for recurring reset)
}

export interface HabitStreak {
  id: string;
  name: string;
  streakDays: number;
  target: number; // daily target, e.g. 8 (glasses of water)
  progress: number; // current progress toward target
  unit: string; // "glasses", "min", etc.
}

export interface StudyBlock {
  id: string;
  course: string;
  time: string;
  durationMin: number;
  priority: 'urgent' | 'soon' | 'later';
  date?: string; // ISO date string (YYYY-MM-DD) for arbitrary scheduling
}

export interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
}

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
}

export interface MealSlot {
  id: string;
  day: string;
  meal: 'Breakfast' | 'Lunch' | 'Dinner';
  name: string;
  ingredients?: string[]; // used to auto-build the grocery checklist
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
}
