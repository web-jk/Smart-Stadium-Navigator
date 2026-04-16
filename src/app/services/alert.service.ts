import { Injectable, signal, inject, NgZone } from '@angular/core';
import { Firestore, collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from '@angular/fire/firestore';
import { AlertData } from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private firestore = inject(Firestore, { optional: true });
  private ngZone = inject(NgZone);
  private initialized = false;

  /** Currently visible alerts */
  readonly alerts = signal<AlertData[]>([]);

  constructor() {
    if (this.firestore) {
      const q = query(
        collection(this.firestore, 'stadiums/default/notifications'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      onSnapshot(q, (snapshot) => {
        this.ngZone.run(() => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && this.initialized) {
              const data = change.doc.data();
              this.pushLocal(data as Omit<AlertData, 'id'>);
            }
          });
          this.initialized = true;
        });
      });
    }
  }

  /** Push a new alert to all clients via Firestore (used by Admin) */
  async push(alert: Omit<AlertData, 'id'>): Promise<void> {
    if (this.firestore) {
      await addDoc(collection(this.firestore, 'stadiums/default/notifications'), {
        ...alert,
        createdAt: Timestamp.now()
      });
    } else {
      this.pushLocal(alert);
    }
  }

  /** Display the alert locally */
  private pushLocal(alert: Omit<AlertData, 'id'>): void {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullAlert: AlertData = { ...alert, id };

    this.alerts.update(list => [...list, fullAlert]);
    
    this.playNotificationSound();

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismiss(id);
    }, alert.duration || 5000);
  }

  /** Play a short, pleasant notification chime */
  private playNotificationSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const now = audioContext.currentTime;

      const playTone = (freq: number, volume: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
      };

      // Play a soft, pleasant dual-tone chime (E5 and B5)
      playTone(659.25, 0.15, 0.8); 
      setTimeout(() => playTone(987.77, 0.1, 0.6), 50);

    } catch (e) {
      console.warn('Could not play notification sound', e);
    }
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
      message: 'WICKET! Expect a sudden rush at food stands!',
      severity: 'warning',
      icon: '☝️',
      duration: 6000
    });
  }

  halftimeStarted(): void {
    this.push({
      message: 'Innings Break! Restrooms and food zones getting busy',
      severity: 'warning',
      icon: '🥪',
      duration: 8000
    });
  }

  halftimeEnding(): void {
    this.push({
      message: 'Play Resuming — crowds clearing from concessions',
      severity: 'success',
      icon: '🏏',
      duration: 6000
    });
  }

  crowdClearing(zoneName: string): void {
    this.push({
      message: `${zoneName} is clearing up — good time to visit!`,
      severity: 'success',
      icon: '✅',
      duration: 5000
    });
  }

  rainAlert(): void {
    this.push({
      message: 'Rain detected! Covered areas getting crowded',
      severity: 'warning',
      icon: '🌧️',
      duration: 7000
    });
  }
}
