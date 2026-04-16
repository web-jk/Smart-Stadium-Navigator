import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { SimulatorService } from '../../services/simulator.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { signal, computed, NO_ERRORS_SCHEMA } from '@angular/core';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let mockSimulator: any;
  let mockAlertService: any;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockSimulator = {
      venue: signal({ 
        id: 'test', 
        name: 'Test Stadium', 
        isInitialized: true,
        zones: [
          { id: 'z1', name: 'Zone 1', crowdDensity: 0.5, type: 'concession' }
        ], 
        connections: [],
        eventPhase: 'pre-game',
        center: { lat: 10, lng: 10 }
      }),
      eventPhase: signal('pre-game'),
      setPhase: vi.fn(),
      triggerEvent: vi.fn(),
      setZoneDensity: vi.fn(),
      setDesignMode: vi.fn(),
      initializeVenue: vi.fn(),
      addZone: vi.fn(),
      deleteZone: vi.fn(),
      resetToInitialState: vi.fn(),
      saveDraft: vi.fn(),
      publishToLive: vi.fn()
    };

    mockAlertService = {
      push: vi.fn()
    };

    mockAuthService = {
      logout: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: SimulatorService, useValue: mockSimulator },
        { provide: AlertService, useValue: mockAlertService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('dashboard actions', () => {
    it('should set event phase', () => {
      component.setPhase('active');
      expect(mockSimulator.setPhase).toHaveBeenCalledWith('active');
    });

    it('should fire game events', () => {
      component.fireEvent('goal');
      expect(mockSimulator.triggerEvent).toHaveBeenCalledWith('goal');
    });

    it('should update zone density', () => {
      const mockEvent = { target: { valueAsNumber: 80 } } as any;
      component.onDensityChange('z1', mockEvent);
      expect(mockSimulator.setZoneDensity).toHaveBeenCalledWith('z1', 0.8);
    });

    it('should send custom notification', () => {
      component.customMessage.set('Test Alert');
      component.sendCustomNotification();
      expect(mockAlertService.push).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test Alert'
      }));
      expect(component.customMessage()).toBe('');
    });
  });

  describe('design mode', () => {
    it('should toggle design mode', () => {
      component.toggleDesignMode();
      expect(component.designMode()).toBe(true);
      expect(mockSimulator.setDesignMode).toHaveBeenCalledWith(true);
    });

    it('should handle publish action', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      await component.publishToLive();
      expect(mockSimulator.publishToLive).toHaveBeenCalled();
      expect(mockAlertService.push).toHaveBeenCalled();
    });
  });

  describe('venue initialization', () => {
    it('should initialize venue when location selected and initialized is false', () => {
      mockSimulator.venue.set({ isInitialized: false, zones: [] } as any);
      fixture.detectChanges();
      
      component.venueNameForInit.set('New Home');
      component.pendingLocation.set({ lat: 10, lng: 20 });
      component.confirmInitialize();
      
      expect(mockSimulator.initializeVenue).toHaveBeenCalledWith('New Home', 10, 20);
    });
  });
});
