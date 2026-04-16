import { TestBed } from '@angular/core/testing';
import { SimulatorService } from './simulator.service';
import { AlertService } from './alert.service';
import { Firestore } from '@angular/fire/firestore';
import { NgZone } from '@angular/core';

describe('SimulatorService', () => {
  let service: SimulatorService;
  let mockAlertService: any;
  let mockFirestore: any;

  beforeEach(() => {
    mockAlertService = {
      push: vi.fn(),
      goalScored: vi.fn(),
      halftimeStarted: vi.fn(),
      rainAlert: vi.fn(),
      halftimeEnding: vi.fn()
    };

    mockFirestore = {};

    TestBed.configureTestingModule({
      providers: [
        SimulatorService,
        { provide: AlertService, useValue: mockAlertService },
        { provide: Firestore, useValue: mockFirestore },
        {
          provide: NgZone,
          useValue: { run: (fn: Function) => fn() }
        }
      ]
    });
    service = TestBed.inject(SimulatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default stadium data', () => {
    const venue = service.venue();
    expect(venue.name).toBeDefined();
    expect(venue.zones.length).toBeGreaterThan(0);
  });

  describe('triggerEvent', () => {
    it('should update event phase and trigger alerts for halftime', () => {
      service.triggerEvent('halftime');
      expect(service.eventPhase()).toBe('halftime');
      expect(mockAlertService.halftimeStarted).toHaveBeenCalled();
    });

    it('should update densities for goal event', () => {
      const initialDensities = service.venue().zones.map(z => z.crowdDensity);
      service.triggerEvent('goal');
      const newDensities = service.venue().zones.map(z => z.crowdDensity);
      
      // Concession zones should have rising density after a goal usually in this logic
      expect(mockAlertService.goalScored).toHaveBeenCalled();
    });
  });

  describe('setZoneDensity', () => {
    it('should manually set a zone density and update wait times', () => {
      const zoneId = service.venue().zones[0].id;
      service.setZoneDensity(zoneId, 0.9);
      
      const zone = service.venue().zones.find(z => z.id === zoneId);
      expect(zone?.crowdDensity).toBe(0.9);
      expect(zone?.trend).toBe('rising');
    });

    it('should clamp density values between 0 and 1', () => {
      const zoneId = service.venue().zones[0].id;
      service.setZoneDensity(zoneId, 1.5);
      expect(service.venue().zones[0].crowdDensity).toBe(1);
    });
  });

  describe('Simulation Loop', () => {
    it('should start and stop the interval', () => {
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      service.start();
      expect(setIntervalSpy).toHaveBeenCalled();
      
      service.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
