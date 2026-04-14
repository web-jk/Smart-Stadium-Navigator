import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Expose the current user as a signal
  readonly currentUser = signal<User | null>(null);

  constructor() {
    // Listen to Firebase Auth state changes
    authState(this.auth).subscribe((user) => {
      this.currentUser.set(user);
    });
  }

  async login(email: string, pass: string): Promise<boolean> {
    try {
      await signInWithEmailAndPassword(this.auth, email, pass);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}
