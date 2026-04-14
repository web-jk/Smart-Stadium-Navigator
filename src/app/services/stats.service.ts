import { Injectable, signal, computed } from '@angular/core';

export interface UserAction {
  type: 'zone_view' | 'navigation' | 'quick_action' | 'alert_seen';
  zoneId?: string;
  zoneName?: string;
  timestamp: number;
  detail?: string;
}

export interface PersonalStats {
  zonesVisited: number;
  uniqueZones: string[];
  navigationsUsed: number;
  busyZonesAvoided: number;
  estimatedTimeSavedMin: number;
  totalDistanceWalkedM: number;
  quickActionsUsed: number;
  sessionStartTime: number;
  sessionDurationMin: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly actions = signal<UserAction[]>([]);
  private readonly sessionStart = Date.now();
  private readonly _busyZonesAvoided = signal(0);
  private readonly _timeSavedMin = signal(0);
  private readonly _distanceWalked = signal(0);

  /** Track a user action */
  track(action: Omit<UserAction, 'timestamp'>): void {
    this.actions.update(list => [...list, { ...action, timestamp: Date.now() }]);
  }

  /** Record a busy zone avoidance (from smart routing) */
  trackBusyZoneAvoided(timeSavedSec: number): void {
    this._busyZonesAvoided.update(v => v + 1);
    this._timeSavedMin.update(v => v + Math.round(timeSavedSec / 60));
  }

  /** Record walked distance from navigation */
  trackDistanceWalked(meters: number): void {
    this._distanceWalked.update(v => v + meters);
  }

  /** Compute personal stats */
  readonly stats = computed<PersonalStats>(() => {
    const acts = this.actions();
    const uniqueZones = [...new Set(
      acts.filter(a => a.zoneId).map(a => a.zoneId!)
    )];

    const navigations = acts.filter(a => a.type === 'navigation').length;
    const quickActions = acts.filter(a => a.type === 'quick_action').length;

    const durationMs = Date.now() - this.sessionStart;
    const durationMin = Math.round(durationMs / 60000);

    return {
      zonesVisited: acts.filter(a => a.type === 'zone_view').length,
      uniqueZones,
      navigationsUsed: navigations,
      busyZonesAvoided: this._busyZonesAvoided(),
      estimatedTimeSavedMin: this._timeSavedMin() || Math.max(3, navigations * 4 + quickActions * 2),
      totalDistanceWalkedM: this._distanceWalked() || navigations * 120,
      quickActionsUsed: quickActions,
      sessionStartTime: this.sessionStart,
      sessionDurationMin: Math.max(1, durationMin),
    };
  });
}
