import { Injectable, signal } from '@angular/core';
import { AlertData } from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  /** Currently visible alerts */
  readonly alerts = signal<AlertData[]>([]);

  /** Push a new alert */
  push(alert: Omit<AlertData, 'id'>): void {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullAlert: AlertData = { ...alert, id };

    this.alerts.update(list => [...list, fullAlert]);

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismiss(id);
    }, alert.duration || 5000);
  }

  /** Dismiss an alert by ID */
  dismiss(id: string): void {
    this.alerts.update(list => list.filter(a => a.id !== id));
  }

  /** Clear all alerts */
  clearAll(): void {
    this.alerts.set([]);
  }

  // ─── Pre-built alerts for demo events ───────────────────────

  goalScored(): void {
    this.push({
      message: '⚽ GOAL! Expect a rush at concession stands!',
      severity: 'warning',
      icon: '⚽',
      duration: 6000
    });
  }

  halftimeStarted(): void {
    this.push({
      message: '⏸️ Halftime! Restrooms and food zones getting busy',
      severity: 'warning',
      icon: '⏸️',
      duration: 8000
    });
  }

  halftimeEnding(): void {
    this.push({
      message: '▶️ Match resuming — crowds clearing from concessions',
      severity: 'success',
      icon: '▶️',
      duration: 6000
    });
  }

  crowdClearing(zoneName: string): void {
    this.push({
      message: `✅ ${zoneName} is clearing up — good time to visit!`,
      severity: 'success',
      icon: '✅',
      duration: 5000
    });
  }

  rainAlert(): void {
    this.push({
      message: '🌧️ Rain detected! Covered areas getting crowded',
      severity: 'warning',
      icon: '🌧️',
      duration: 7000
    });
  }
}
