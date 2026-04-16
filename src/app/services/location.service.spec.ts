import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    // Mock Geolocation API
    const mockGeolocation = {
      watchPosition: vi.fn((success) => {
        success({
          coords: { latitude: 18.6744, longitude: 73.7067, accuracy: 10 },
          timestamp: Date.now()
        });
        return 1;
      }),
      clearWatch: vi.fn()
    };
    
    vi.stubGlobal('navigator', {
      geolocation: mockGeolocation,
      permissions: {
        query: vi.fn().mockResolvedValue({ state: 'granted', addEventListener: vi.fn() })
      }
    });

    TestBed.configureTestingModule({
      providers: [LocationService]
    });
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('tracking', () => {
    it('should update currentPosition when tracking starts', () => {
      service.startTracking();
      expect(service.isTracking()).toBe(true);
      expect(service.currentPosition()).not.toBeNull();
      expect(service.currentPosition()?.lat).toBe(18.6744);
    });

    it('should clear watchId when tracking stops', () => {
      service.startTracking();
      service.stopTracking();
      expect(service.isTracking()).toBe(false);
      expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
    });
  });

  describe('calculations', () => {
    it('should calculate 0 distance when at stadium center', () => {
      service.currentPosition.set({
        lat: 18.6744,
        lng: 73.7067,
        accuracy: 5,
        timestamp: Date.now()
      });
      expect(service.distanceToStadium()).toBeCloseTo(0, 0);
      expect(service.distanceLabel()).toBe('0m away');
    });

    it('should format distance labels correctly for long distances', () => {
      // Offset by approx 2km
      service.currentPosition.set({
        lat: 18.6744 + 0.02,
        lng: 73.7067,
        accuracy: 5,
        timestamp: Date.now()
      });
      expect(service.distanceLabel()).toContain('km away');
    });
  });
});
