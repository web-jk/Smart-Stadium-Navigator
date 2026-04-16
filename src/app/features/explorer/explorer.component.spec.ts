import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ExplorerComponent } from './explorer.component';
import { SimulatorService } from '../../services/simulator.service';
import { VenueService } from '../../services/venue.service';
import { AlertService } from '../../services/alert.service';
import { StatsService } from '../../services/stats.service';
import { LocationService } from '../../services/location.service';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';

describe('ExplorerComponent', () => {
  let component: ExplorerComponent;
  let fixture: ComponentFixture<ExplorerComponent>;
  let mockSimulator: any;
  let mockVenueService: any;
  let mockAlertService: any;
  let mockStatsService: any;
  let mockLocationService: any;

  beforeEach(async () => {
    mockSimulator = {
      venue: signal({ 
        id: 'test', 
        name: 'Test Stadium', 
        zones: [], 
        connections: [],
        eventPhase: 'active'
      }),
      eventPhase: signal('active')
    };

    mockVenueService = {
      calculateRoute: vi.fn(),
      getZone: vi.fn()
    };

    mockAlertService = {
      push: vi.fn()
    };

    mockStatsService = {
      track: vi.fn(),
      trackDistanceWalked: vi.fn(),
      trackBusyZoneAvoided: vi.fn()
    };

    mockLocationService = {
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
      distanceLabel: signal('120m')
    };

    await TestBed.configureTestingModule({
      imports: [ExplorerComponent],
      providers: [
        { provide: SimulatorService, useValue: mockSimulator },
        { provide: VenueService, useValue: mockVenueService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: StatsService, useValue: mockStatsService },
        { provide: LocationService, useValue: mockLocationService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle map view', () => {
    component.setMapView('stadium');
    expect(component.mapView()).toBe('stadium');
    component.setMapView('earth');
    expect(component.mapView()).toBe('earth');
  });

  describe('interactions', () => {
    it('should track stats when zone is clicked', () => {
      const mockZone = { id: 'z1', name: 'Zone 1' } as any;
      component.onZoneClicked(mockZone);
      expect(component.selectedZone()).toEqual(mockZone);
      expect(mockStatsService.track).toHaveBeenCalledWith(expect.objectContaining({
        type: 'zone_view',
        zoneId: 'z1'
      }));
    });

    it('should show find nearest when quick action clicked', () => {
      component.onQuickAction('food');
      expect(component.showFindNearest()).toBe(true);
      expect(component.findNearestType()).toBe('food');
    });
  });

  describe('navigation', () => {
    it('should initiate navigation and track stats', () => {
      const mockRoute = { path: ['z1', 'z2'], totalDistance: 100, congestionScore: 0.1 };
      mockVenueService.calculateRoute.mockReturnValue(mockRoute);
      
      component.navigateToZone('z2');
      
      expect(component.activeRoute()).toEqual(mockRoute);
      expect(mockStatsService.track).toHaveBeenCalledWith(expect.objectContaining({
        type: 'navigation',
        zoneId: 'z2'
      }));
      expect(mockStatsService.trackDistanceWalked).toHaveBeenCalledWith(100);
    });

    it('should cancel navigation', () => {
      component.activeRoute.set({ path: ['z1'] } as any);
      component.cancelNavigation();
      expect(component.activeRoute()).toBeNull();
    });
  });
});
