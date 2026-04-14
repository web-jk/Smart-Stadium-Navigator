import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card glass-strong">
        <h1 class="admin-title">StadiumFlow <span class="hl">Admin</span></h1>
        <p class="subtitle">Log in to manage stadium operations</p>
        
        <form (ngSubmit)="onSubmit()" class="login-form">
          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              placeholder="admin@stadiumflow.com"
              required 
              autofocus />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              placeholder="••••••••"
              required />
          </div>

          <button type="submit" class="login-btn" [disabled]="loading()">
            {{ loading() ? 'Connecting...' : 'Secure Login' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 32px 24px;
      border-radius: 24px;
      text-align: center;
      border: 1px solid var(--color-border);
    }

    .admin-title {
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }

    .hl {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin: 8px 0 24px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-left: 4px;
    }

    input {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px 16px;
      border-radius: 12px;
      color: white;
      font-family: var(--font-sans);
      font-size: 1rem;
      transition: all 0.2s;
    }

    input:focus {
      outline: none;
      border-color: rgba(99, 102, 241, 0.5);
      background: rgba(0, 0, 0, 0.3);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .error-msg {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      text-align: center;
    }

    .login-btn {
      margin-top: 8px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1.05rem;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }

    .login-btn:hover {
      opacity: 0.9;
    }
    
    .login-btn:active {
      transform: scale(0.98);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  private auth = inject(AuthService);
  private router = inject(Router);

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Please fill out all fields.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const success = await this.auth.login(this.email, this.password);
    this.loading.set(false);

    if (success) {
      this.router.navigate(['/admin']);
    } else {
      this.errorMsg.set('Invalid credentials or missing config.');
    }
  }
}
