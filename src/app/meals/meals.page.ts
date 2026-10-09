import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonCheckbox,
  IonButton,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { FirestoreDataService } from '../data/firestore-data.service';
import { sanitizeText } from '../shared/sanitize';
import { HeaderActionsComponent } from '../shared/header-actions.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-meals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonCheckbox,
    IonButton,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    HeaderActionsComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './meals.page.html',
  styleUrl: './meals.page.scss',
})
export class MealsPage {
  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly mealTimes: Array<'Breakfast' | 'Lunch' | 'Dinner'> = [
    'Breakfast',
    'Lunch',
    'Dinner',
  ];

  mealForm = this.fb.group({
    day: ['Mon', [Validators.required]],
    meal: ['Breakfast' as 'Breakfast' | 'Lunch' | 'Dinner', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    ingredients: ['', []],
  });

  groceryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
  });

  editingMealId: string | null = null;

  constructor(
    public data: FirestoreDataService,
    private fb: FormBuilder,
  ) {}

  mealFor(day: string, meal: string) {
    return this.data
      .meals()
      .find((m) => m.day === day && m.meal === meal)?.name;
  }

  mealIdFor(day: string, meal: string) {
    return this.data
      .meals()
      .find((m) => m.day === day && m.meal === meal)?.id;
  }

  startEditMeal(day: string, meal: string) {
    const existing = this.data.meals().find((m) => m.day === day && m.meal === meal);
    this.editingMealId = existing?.id ?? null;
    this.mealForm.reset({
      day,
      meal: meal as 'Breakfast' | 'Lunch' | 'Dinner',
      name: existing?.name ?? '',
      ingredients: existing?.ingredients?.join(', ') ?? '',
    });
    // Scroll to the form
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEditMeal() {
    this.editingMealId = null;
    this.mealForm.reset({ day: 'Mon', meal: 'Breakfast', name: '', ingredients: '' });
  }

  toggle(id: string) {
    this.data.toggleGroceryItem(id);
  }

  async addMeal() {
    if (this.mealForm.invalid) {
      this.mealForm.markAllAsTouched();
      return;
    }
    const { day, meal, name, ingredients } = this.mealForm.getRawValue();

    if (this.editingMealId) {
      await this.data.updateMeal(this.editingMealId, {
        name: sanitizeText(name!),
        ingredients: (ingredients ?? '')
          .split(',')
          .map((s) => sanitizeText(s))
          .filter((s) => s.length > 0),
      });
      this.editingMealId = null;
    } else {
      await this.data.addMeal({
        day: day!,
        meal: meal!,
        name: sanitizeText(name!),
        ingredients: (ingredients ?? '')
          .split(',')
          .map((s) => sanitizeText(s))
          .filter((s) => s.length > 0),
      });
    }
    this.mealForm.reset({ day: 'Mon', meal: 'Breakfast', name: '', ingredients: '' });
  }

  async addGrocery() {
    if (this.groceryForm.invalid) {
      this.groceryForm.markAllAsTouched();
      return;
    }
    const { name } = this.groceryForm.getRawValue();
    await this.data.addGroceryItem({ name: sanitizeText(name!), checked: false });
    this.groceryForm.reset({ name: '' });
  }

  // Derive grocery items from every planned meal's ingredient list.
  async generateGroceries() {
    const existing = new Set(this.data.groceries().map((g) => g.name.toLowerCase()));
    const wanted = new Map<string, string>(); // lower -> original
    for (const meal of this.data.meals()) {
      for (const ing of meal.ingredients ?? []) {
        const key = ing.toLowerCase();
        if (!existing.has(key) && !wanted.has(key)) wanted.set(key, ing);
      }
    }
    for (const original of wanted.values()) {
      await this.data.addGroceryItem({ name: original, checked: false });
    }
    this.groceryStatus = wanted.size
      ? `Added ${wanted.size} item(s) from your meals.`
      : 'Grocery list is already up to date with your meals.';
  }

  groceryStatus = '';
}
