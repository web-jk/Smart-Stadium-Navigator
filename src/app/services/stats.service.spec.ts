import { TestBed } from '@angular/core/testing';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StatsService]
    });
    service = TestBed.inject(StatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('tracking actions', () => {
    it('should track a user action and update stats', () => {
      service.track({ type: 'zone_view', zoneId: 'gate-1', zoneName: 'Gate 1' });
      const currentStats = service.stats();
      expect(currentStats.zonesVisited).toBe(1);
      expect(currentStats.uniqueZones).toContain('gate-1');
    });

    it('should track multiple unique zones', () => {
      service.track({ type: 'zone_view', zoneId: 'gate-1' });
      service.track({ type: 'zone_view', zoneId: 'gate-2' });
      service.track({ type: 'zone_view', zoneId: 'gate-1' }); // Duplicate
      
      const currentStats = service.stats();
      expect(currentStats.uniqueZones.length).toBe(2);
    });

    it('should track quick actions and navigations', () => {
      service.track({ type: 'quick_action', detail: 'food' });
      service.track({ type: 'navigation', zoneId: 'food-court' });
      
      const currentStats = service.stats();
      expect(currentStats.quickActionsUsed).toBe(1);
      expect(currentStats.navigationsUsed).toBe(1);
    });
  });

  describe('performance metrics', () => {
    it('should track busy zone avoidance and time saved', () => {
      service.trackBusyZoneAvoided(120); // 2 minutes
      const currentStats = service.stats();
      expect(currentStats.busyZonesAvoided).toBe(1);
      expect(currentStats.estimatedTimeSavedMin).toBe(2);
    });

    it('should track cumulative distance walked', () => {
      service.trackDistanceWalked(150);
      service.trackDistanceWalked(100);
      const currentStats = service.stats();
      expect(currentStats.totalDistanceWalkedM).toBe(250);
    });
  });

  describe('session info', () => {
    it('should provide session start time and duration', () => {
      const currentStats = service.stats();
      expect(currentStats.sessionStartTime).toBeLessThanOrEqual(Date.now());
      expect(currentStats.sessionDurationMin).toBeGreaterThanOrEqual(1);
    });
  });
});
