import { TestBed } from '@angular/core/testing';
import { VenueService } from './venue.service';
import { SimulatorService } from './simulator.service';
import { signal } from '@angular/core';
import { Venue, Zone } from '../models/venue.model';

describe('VenueService', () => {
  let service: VenueService;
  let mockSimulator: any;

  const mockVenue: Venue = {
    id: 'test-stadium',
    name: 'Test Stadium',
    type: 'stadium',
    capacity: 1000,
    currentAttendance: 500,
    eventName: 'Test Event',
    eventPhase: 'active',
    isInitialized: true,
    zones: [
      {
        id: 'zone-1',
        name: 'Gate A',
        type: 'entrance',
        position: { x: 100, y: 100 },
        crowdDensity: 0.2,
        waitTimeMinutes: 2,
        isOpen: true,
        amenities: []
      } as Zone,
      {
        id: 'zone-2',
        name: 'Food Court',
        type: 'concession',
        position: { x: 200, y: 200 },
        crowdDensity: 0.8,
        waitTimeMinutes: 15,
        isOpen: true,
        amenities: []
      } as Zone
    ],
    connections: [
      { from: 'zone-1', to: 'zone-2', distance: 100, travelTime: 60 }
    ]
  };

  beforeEach(() => {
    mockSimulator = {
      venue: signal(mockVenue)
    };

    TestBed.configureTestingModule({
      providers: [
        VenueService,
        { provide: SimulatorService, useValue: mockSimulator }
      ]
    });
    service = TestBed.inject(VenueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getZone', () => {
    it('should find a zone by id', () => {
      const zone = service.getZone('zone-1');
      expect(zone).toBeDefined();
      expect(zone?.name).toBe('Gate A');
    });

    it('should return undefined for non-existent zone', () => {
      const zone = service.getZone('non-existent');
      expect(zone).toBeUndefined();
    });
  });

  describe('findNearest', () => {
    it('should find open concession zones when searching for food', () => {
      const recommendations = service.findNearest('food', 'zone-1');
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].zone.id).toBe('zone-2');
    });

    it('should calculate estimated walk time', () => {
      const recommendations = service.findNearest('food', 'zone-1');
      expect(recommendations[0].estimatedWalkTime).toBeGreaterThan(0);
    });
  });

  describe('calculateRoute', () => {
    it('should calculate a valid route between two zones', () => {
      const route = service.calculateRoute('zone-1', 'zone-2');
      expect(route).not.toBeNull();
      expect(route?.path).toContain('zone-1');
      expect(route?.path).toContain('zone-2');
    });

    it('should return null for unreachable zones', () => {
      const unreachableVenue = { ...mockVenue, connections: [] };
      mockSimulator.venue.set(unreachableVenue);
      const route = service.calculateRoute('zone-1', 'zone-2');
      expect(route).toBeNull();
    });
  });
});
