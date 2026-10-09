import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { FirestoreDataService } from '../data/firestore-data.service';
import { ApiService } from '../api/api.service';
import { ToastController } from '@ionic/angular/standalone';
import { sanitizeText } from '../shared/sanitize';
import { HeaderActionsComponent } from '../shared/header-actions.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    HeaderActionsComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './budget.page.html',
  styleUrl: './budget.page.scss',
})
export class BudgetPage implements OnInit {
  ngOnInit() {
    this.api.loadExchangeRate();
  }

  form = this.fb.group({
    label: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(60)],
    ],
    // digits with optional 1-2 decimal places
    amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.min(0.01)]],
    category: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  catForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(30)]],
    limit: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/), Validators.min(0.01)]],
  });

  editingCatId: string | null = null;
  editLimitValue = '';
  editLimitError = '';

  constructor(
    public data: FirestoreDataService,
    public api: ApiService,
    private fb: FormBuilder,
    private toast: ToastController,
  ) {}

  startEditCategory(cat: { id: string; name: string; limit: number }) {
    this.editingCatId = cat.id;
    this.editLimitValue = String(cat.limit);
    this.editLimitError = '';
  }

  cancelEditCategory() {
    this.editingCatId = null;
    this.editLimitValue = '';
    this.editLimitError = '';
  }

  async saveCategoryLimit() {
    if (!this.editingCatId) return;
    const limit = parseFloat(this.editLimitValue);
    if (!Number.isFinite(limit) || limit <= 0) {
      this.editLimitError = 'Enter a limit greater than $0.';
      return;
    }
    await this.data.updateBudgetCategory(this.editingCatId, { limit });
    this.editingCatId = null;
    this.editLimitValue = '';
    this.editLimitError = '';
  }

  pct(spent: number, limit: number) {
    return Math.min(100, Math.round((spent / limit) * 100));
  }

  isOverThreshold(spent: number, limit: number) {
    return spent / limit >= 0.85;
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { label, amount, category } = this.form.getRawValue();
    await this.data.addExpense({
      label: sanitizeText(label!),
      category: category!,
      amount: Math.round(parseFloat(amount!) * 100) / 100,
      date: 'Today',
    });
    this.form.reset({ label: '', amount: '', category: '' });

    // Warning trigger: toast when the category crosses 85% of its limit.
    const updated = this.data.budgetCategories().find((c) => c.name === category);
    if (updated && updated.spent / Math.max(1, updated.limit) >= 0.85) {
      const t = await this.toast.create({
        message: `${updated.name} is at ${Math.round((updated.spent / updated.limit) * 100)}% of its limit ($${updated.spent} / $${updated.limit})`,
        duration: 3000,
        color: 'warning',
      });
      await t.present();
    }
  }

  remove(id: string) {
    this.data.deleteExpense(id);
  }

  async addCategory() {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }
    const { name, limit } = this.catForm.getRawValue();
    await this.data.addBudgetCategory({
      name: sanitizeText(name!),
      spent: 0,
      limit: parseFloat(limit!),
    });
    this.catForm.reset();
  }
}
