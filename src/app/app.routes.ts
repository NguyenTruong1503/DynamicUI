import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "",
        loadComponent: () => import('./components/ui-dynamic/ui-dynamic.component').then(m => m.UiDynamicComponent),
        title: 'ui-dynamic'
    }
];
