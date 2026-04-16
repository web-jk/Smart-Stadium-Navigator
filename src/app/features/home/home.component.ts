import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SplashComponent } from '../splash/splash.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SplashComponent],
  template: `
    <app-splash (enter)="onEnter()" />
  `
})
export class HomeComponent {
  private router = inject(Router);

  onEnter() {
    this.router.navigate(['/explore']);
  }
}
