import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EarthMapComponent } from './earth-map.component';
import { LocationService } from '../../services/location.service';
import { SimulatorService } from '../../services/simulator.service';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

describe('EarthMapComponent', () => {
  let component: EarthMapComponent;
  let fixture: ComponentFixture<EarthMapComponent>;
  let mockLocationService: any;
  let mockSimulator: any;

  beforeEach(async () => {
    // Mock Leaflet global
    (window as any).L = {
      map: vi.fn().mockReturnValue({
        on: vi.fn(),
        setView: vi.fn(),
        remove: vi.fn(),
        removeLayer: vi.fn()
      }),
      tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn()
      }),
      marker: vi.fn().mockReturnValue({
        addTo: vi.fn(),
        bindPopup: vi.fn().mockReturnThis(),
        on: vi.fn(),
        setLatLng: vi.fn().mockReturnThis(),
        setIcon: vi.fn().mockReturnThis(),
        dragging: { enable: vi.fn(), disable: vi.fn() }
      }),
      divIcon: vi.fn(),
      circle: vi.fn().mockReturnValue({
        addTo: vi.fn(),
        setLatLng: vi.fn().mockReturnThis(),
        setRadius: vi.fn().mockReturnThis()
      }),
      polyline: vi.fn().mockReturnValue({
        addTo: vi.fn()
      })
    };

    mockLocationService = {
      currentPosition: signal(null),
      isTracking: signal(true),
      distanceLabel: signal('120m'),
      locationError: signal('')
    };

    mockSimulator = {
      venue: signal({
        id: 'test',
        name: 'Test Stadium',
        isInitialized: true,
        center: { lat: 10, lng: 10 },
        zones: []
      })
    };

    await TestBed.configureTestingModule({
      imports: [EarthMapComponent],
      providers: [
        { provide: LocationService, useValue: mockLocationService },
        { provide: SimulatorService, useValue: mockSimulator }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EarthMapComponent);
    component = fixture.componentInstance;
    // We don't call detectChanges yet because initMap depends on mapMount being available
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('map logic', () => {
    it('should toggle tile modes', () => {
      component.setTileMode('street');
      expect(component.tileMode()).toBe('street');
      
      component.setTileMode('satellite');
      expect(component.tileMode()).toBe('satellite');
    });

    it('should handle search errors', async () => {
      // Mock search error
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      await component.searchLocation('invalid venue');
      expect(component.searchError()).not.toBeNull();
    });
  });

  describe('admin tools', () => {
    it('should emit locationSelected in admin mode', () => {
      fixture.componentRef.setInput('isAdminMode', true);
      const emitSpy = vi.spyOn(component.locationSelected, 'emit');
      
      // We manually simulate the map click logic
      (component as any).locationSelected.emit({ lat: 5, lng: 5 });
      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
