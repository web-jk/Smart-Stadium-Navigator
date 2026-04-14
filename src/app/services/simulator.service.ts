import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { Firestore, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { Venue, Zone, EventPhase, getDensityLevel, DensityLevel } from '../models/venue.model';
import { STADIUM_DATA } from '../data/stadium.data';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private firestore = inject(Firestore, { optional: true });
  private ngZone = inject(NgZone);
  private documentPath = 'stadiums/default';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  tickRate = 3000; // ms — public so admin can adjust

  /** Current venue state — the single source of truth */
  readonly venue = signal<Venue>(structuredClone(STADIUM_DATA));

  /** Current event phase */
  readonly eventPhase = computed(() => this.venue().eventPhase);

  /** Sorted zones by crowd density (descending) */
  readonly hottestZones = computed(() =>
    [...this.venue().zones]
      .filter(z => z.type !== 'seating' && z.type !== 'medical')
      .sort((a, b) => b.crowdDensity - a.crowdDensity)
      .slice(0, 5)
  );

  constructor() {
    if (this.firestore) {
      const docRef = doc(this.firestore, this.documentPath);
      onSnapshot(docRef, (snapshot) => {
        console.log('[FIREBASE] onSnapshot triggered! Exists:', snapshot.exists());
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('[FIREBASE] Fresh data received:', data);
          this.ngZone.run(() => {
            this.venue.set(data as Venue);
          });
        }
      }, (error) => {
        console.error('[FIREBASE ERROR] Real-time sync disabled or disconnected:', error);
      });
    }
  }

  private async syncToFirestore(): Promise<void> {
    if (this.firestore) {
      try {
        console.log('[FIREBASE] Attempting to push venue data to Firestore...');
        const docRef = doc(this.firestore, this.documentPath);
        await setDoc(docRef, this.venue());
        console.log('[FIREBASE] Successfully pushed data to Firestore!');
      } catch (err) {
        console.error('[FIREBASE ERROR] Failed to sync to Firestore: ', err);
      }
    } else {
      console.warn('[FIREBASE WARNING] this.firestore is missing! Cannot sync.');
    }
  }

  /** Start the simulation loop */
  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.tickRate);
  }

  /** Stop the simulation loop */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Manually trigger an event change */
  triggerEvent(event: 'goal' | 'halftime' | 'rain' | 'end-halftime' | 'post-game'): void {
    this.venue.update(v => {
      const updated = structuredClone(v);

      switch (event) {
        case 'goal':
          this.applyGoalScored(updated);
          break;
        case 'halftime':
          updated.eventPhase = 'halftime';
          this.applyHalftime(updated);
          break;
        case 'rain':
          this.applyRainDelay(updated);
          break;
        case 'end-halftime':
          updated.eventPhase = 'active';
          this.applyEndHalftime(updated);
          break;
        case 'post-game':
          updated.eventPhase = 'post-game';
          this.applyPostGame(updated);
          break;
      }

      return updated;
    });
    this.syncToFirestore();
  }

  /** Set event phase directly */
  setPhase(phase: EventPhase): void {
    this.venue.update(v => ({ ...structuredClone(v), eventPhase: phase }));
    this.syncToFirestore();
  }

  /** Set a specific zone's density (for admin panel) */
  setZoneDensity(zoneId: string, density: number): void {
    this.venue.update(v => {
      const updated = structuredClone(v);
      const zone = updated.zones.find(z => z.id === zoneId);
      if (zone) {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(density, 0, 1);
        zone.waitTimeMinutes = this.calculateWaitTime(zone);
        zone.trend = zone.crowdDensity > zone.previousDensity ? 'rising' :
                     zone.crowdDensity < zone.previousDensity ? 'falling' : 'stable';
      }
      return updated;
    });
    this.syncToFirestore();
  }

  // ─── SIMULATION TICK ───────────────────────────────────────────

  private tick(): void {
    this.venue.update(v => {
      const updated = structuredClone(v);
      const phase = updated.eventPhase;

      for (const zone of updated.zones) {
        const baseLoad = this.getBaseLoad(zone.type, phase);
        const noise = (Math.random() - 0.5) * 0.12;
        const momentum = zone.crowdDensity * 0.7; // zones resist sudden change

        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(
          momentum + baseLoad * 0.3 + noise * 0.15,
          0.05, 0.98
        );
        zone.waitTimeMinutes = this.calculateWaitTime(zone);
        zone.trend = this.calculateTrend(zone.crowdDensity, zone.previousDensity);
      }

      return updated;
    });
    this.syncToFirestore();
  }

  private getBaseLoad(type: string, phase: EventPhase): number {
    const patterns: Record<string, Record<EventPhase, number>> = {
      'entrance':    { 'pre-game': 0.8, 'active': 0.15, 'halftime': 0.10, 'post-game': 0.85 },
      'concession':  { 'pre-game': 0.3, 'active': 0.35, 'halftime': 0.85, 'post-game': 0.20 },
      'restroom':    { 'pre-game': 0.2, 'active': 0.30, 'halftime': 0.90, 'post-game': 0.35 },
      'seating':     { 'pre-game': 0.4, 'active': 0.90, 'halftime': 0.40, 'post-game': 0.25 },
      'merchandise': { 'pre-game': 0.5, 'active': 0.20, 'halftime': 0.70, 'post-game': 0.60 },
      'corridor':    { 'pre-game': 0.6, 'active': 0.20, 'halftime': 0.75, 'post-game': 0.80 },
      'vip':         { 'pre-game': 0.3, 'active': 0.50, 'halftime': 0.45, 'post-game': 0.20 },
      'exit':        { 'pre-game': 0.1, 'active': 0.05, 'halftime': 0.05, 'post-game': 0.95 },
      'medical':     { 'pre-game': 0.1, 'active': 0.10, 'halftime': 0.10, 'post-game': 0.10 },
    };
    return patterns[type]?.[phase] ?? 0.3;
  }

  private calculateWaitTime(zone: Zone): number {
    if (zone.type === 'seating' || zone.type === 'medical') return 0;

    const serviceRates: Record<string, number> = {
      'concession': 3.5,   // minutes per person (slow)
      'restroom': 2.0,
      'merchandise': 4.0,
      'entrance': 0.5,
      'exit': 0.3,
      'vip': 1.0,
      'corridor': 0,
    };

    const rate = serviceRates[zone.type] ?? 1;
    // Exponential curve: low density = short wait, high density = long wait
    const waitTime = rate * Math.pow(zone.crowdDensity, 2.5) * 20;
    return Math.round(Math.max(0, Math.min(waitTime, 25)));
  }

  private calculateTrend(current: number, previous: number): 'rising' | 'falling' | 'stable' {
    const diff = current - previous;
    if (diff > 0.02) return 'rising';
    if (diff < -0.02) return 'falling';
    return 'stable';
  }

  // ─── EVENT EFFECTS ───────────────────────────────────────────

  private applyGoalScored(venue: Venue): void {
    for (const zone of venue.zones) {
      if (zone.type === 'concession') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.25, 0, 0.98);
        zone.trend = 'rising';
      }
      if (zone.type === 'seating') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.05, 0, 0.98);
      }
    }
    this.recalcWaitTimes(venue);
  }

  private applyHalftime(venue: Venue): void {
    for (const zone of venue.zones) {
      if (zone.type === 'restroom' || zone.type === 'concession') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.35, 0, 0.98);
        zone.trend = 'rising';
      }
      if (zone.type === 'seating') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity - 0.4, 0.1, 0.98);
        zone.trend = 'falling';
      }
      if (zone.type === 'merchandise') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.25, 0, 0.98);
        zone.trend = 'rising';
      }
    }
    this.recalcWaitTimes(venue);
  }

  private applyEndHalftime(venue: Venue): void {
    for (const zone of venue.zones) {
      if (zone.type === 'restroom' || zone.type === 'concession') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity - 0.3, 0.1, 0.98);
        zone.trend = 'falling';
      }
      if (zone.type === 'seating') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.35, 0.1, 0.98);
        zone.trend = 'rising';
      }
    }
    this.recalcWaitTimes(venue);
  }

  private applyRainDelay(venue: Venue): void {
    for (const zone of venue.zones) {
      // Indoor zones surge
      if (['concession', 'restroom', 'merchandise', 'vip'].includes(zone.type)) {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity + 0.3, 0, 0.98);
        zone.trend = 'rising';
      }
      // Outdoor seating clears
      if (zone.type === 'seating') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity - 0.35, 0.1, 0.98);
        zone.trend = 'falling';
      }
    }
    this.recalcWaitTimes(venue);
  }

  private applyPostGame(venue: Venue): void {
    for (const zone of venue.zones) {
      if (zone.type === 'entrance' || zone.type === 'exit') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = 0.90;
        zone.trend = 'rising';
      }
      if (zone.type === 'seating') {
        zone.previousDensity = zone.crowdDensity;
        zone.crowdDensity = this.clamp(zone.crowdDensity - 0.5, 0.05, 0.98);
        zone.trend = 'falling';
      }
    }
    this.recalcWaitTimes(venue);
  }

  private recalcWaitTimes(venue: Venue): void {
    for (const zone of venue.zones) {
      zone.waitTimeMinutes = this.calculateWaitTime(zone);
    }
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}
