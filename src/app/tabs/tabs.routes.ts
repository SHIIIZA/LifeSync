import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'planner',
        loadComponent: () =>
          import('../planner/planner.page').then((m) => m.PlannerPage),
      },
      {
        path: 'habits',
        loadComponent: () =>
          import('../habits/habits.page').then((m) => m.HabitsPage),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('../budget/budget.page').then((m) => m.BudgetPage),
      },
      {
        path: 'meals',
        loadComponent: () =>
          import('../meals/meals.page').then((m) => m.MealsPage),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
