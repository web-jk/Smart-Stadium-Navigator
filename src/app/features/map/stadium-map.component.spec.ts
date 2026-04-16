import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StadiumMapComponent } from './stadium-map.component';
import { SimulatorService } from '../../services/simulator.service';
import { signal, NO_ERRORS_SCHEMA, ComponentRef } from '@angular/core';

describe('StadiumMapComponent', () => {
  let component: StadiumMapComponent;
  let fixture: ComponentFixture<StadiumMapComponent>;
  let mockSimulator: any;

  beforeEach(async () => {
    mockSimulator = {
      venue: signal({
        id: 'test',
        name: 'Test Stadium',
        isInitialized: true,
        zones: [
          { id: 'z1', name: 'Zone 1', type: 'concession', position: { x: 100, y: 100 }, crowdDensity: 0.5, waitTimeMinutes: 5 }
        ],
        connections: []
      })
    };

    await TestBed.configureTestingModule({
      imports: [StadiumMapComponent],
      providers: [
        { provide: SimulatorService, useValue: mockSimulator }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StadiumMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('SVG Logic', () => {
    it('should calculate correct fill for density', () => {
      const zone = mockSimulator.venue().zones[0];
      const fill = component.getDensityFill(zone);
      expect(fill).toContain('#f59e0b'); // Hex for medium (amber)
    });

    it('should identify highlighted zones', () => {
      fixture.componentRef.setInput('highlightZoneType', 'food');
      fixture.detectChanges();
      
      const zone = mockSimulator.venue().zones[0];
      expect(component.isHighlighted(zone)).toBe(true);
    });
  });

  describe('interactions', () => {
    it('should emit zoneClicked when a zone is clicked', () => {
      const zone = mockSimulator.venue().zones[0];
      const emitSpy = vi.spyOn(component.zoneClicked, 'emit');
      
      component.onZoneClick(zone, new MouseEvent('click'));
      expect(emitSpy).toHaveBeenCalledWith(zone);
    });

    it('should update pan coordinates', () => {
      component.panX.set(100);
      component.panY.set(200);
      expect(component.panX()).toBe(100);
      expect(component.panY()).toBe(200);
    });
  });
});
