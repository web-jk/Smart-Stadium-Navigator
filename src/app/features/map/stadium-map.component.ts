import {
  Component,
  computed,
  signal,
  input,
  output,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorService } from '../../services/simulator.service';
import { Zone, ZoneType, getDensityColor, getDensityLevel } from '../../models/venue.model';

@Component({
  selector: 'app-stadium-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container" #mapContainer
         [class.admin-mode]="isAdminMode()"
         (touchstart)="onTouchStart($event)"
         (touchmove)="onTouchMove($event)"
         (touchend)="onTouchEnd()"
         (mousemove)="onMouseMove($event)"
         (mouseup)="onMouseUp()"
         (mouseleave)="onMouseUp()">

      <svg [attr.viewBox]="'0 0 400 400'"
           class="stadium-svg"
           [style.transform]="'scale(' + scale() + ') translate(' + panX() + 'px, ' + panY() + 'px)'"
           (click)="onSvgClick($event)"
           xmlns="http://www.w3.org/2000/svg">

        <!-- Background -->
        <defs>
          <radialGradient id="field-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#166534" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#14532d" stop-opacity="0.3"/>
          </radialGradient>

          <!-- Glow filter for active zones -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        @if (simulator.venue().isInitialized) {
          <!-- Stadium Outer Shell (circular) -->
          <circle cx="200" cy="200" r="180"
                   fill="none"
                   stroke="rgba(255,255,255,0.08)"
                   stroke-width="2"/>

          <!-- Outer concourse ring -->
          <circle cx="200" cy="200" r="165"
                   fill="rgba(255,255,255,0.02)"
                   stroke="rgba(255,255,255,0.06)"
                   stroke-width="1"/>

          <!-- Seating bowl -->
          <circle cx="200" cy="200" r="130"
                   fill="rgba(255,255,255,0.01)"
                   stroke="rgba(255,255,255,0.04)"
                   stroke-width="1"/>
          
          <!-- Cricket Boundary / Infield -->
          <circle cx="200" cy="200" r="105"
                   fill="rgba(255,255,255,0.02)"
                   stroke="rgba(255, 255, 255, 0.1)"
                   stroke-width="2"
                   stroke-dasharray="4,4"/>

          <!-- Playing Field (Circular) -->
          <circle cx="200" cy="200" r="85"
                fill="url(#field-gradient)"
                stroke="rgba(255,255,255,0.15)"
                stroke-width="1"/>
                
          <!-- Cricket Pitch -->
          <rect x="194" y="175" width="12" height="50" rx="2"
                fill="#d4b886"
                stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
                
          <!-- Inner circle (30 yard circle) -->
          <circle cx="200" cy="200" r="45"
                  fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>
        }

        <!-- Connection paths (corridors) -->
        @for (conn of connections(); track conn.from + conn.to) {
          <line [attr.x1]="getZonePos(conn.from).x"
                [attr.y1]="getZonePos(conn.from).y"
                [attr.x2]="getZonePos(conn.to).x"
                [attr.y2]="getZonePos(conn.to).y"
                stroke="rgba(255,255,255,0.04)"
                stroke-width="1"
                stroke-dasharray="3,3"/>
        }

        <!-- Route overlay -->
        @if (activeRoute().length > 1) {
          @for (i of routeSegments(); track i) {
            <line [attr.x1]="getZonePos(activeRoute()[i]).x"
                  [attr.y1]="getZonePos(activeRoute()[i]).y"
                  [attr.x2]="getZonePos(activeRoute()[i + 1]).x"
                  [attr.y2]="getZonePos(activeRoute()[i + 1]).y"
                  stroke="#6366f1"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-dasharray="6,4"
                  class="route-line"/>
          }
        }

        <!-- Zone markers -->
        @for (zone of zones(); track zone.id) {
          <g class="zone-group"
             [class.selected]="selectedZoneId() === zone.id"
             [class.draggable]="isAdminMode()"
             (mousedown)="onZoneMouseDown(zone, $event)"
             (click)="onZoneClick(zone, $event)">

            <!-- Density circle (background glow) -->
            <circle [attr.cx]="zone.position.x"
                    [attr.cy]="zone.position.y"
                    [attr.r]="getZoneRadius(zone)"
                    [attr.fill]="getDensityFill(zone)"
                    [attr.stroke]="getDensityStroke(zone)"
                    stroke-width="1.5"
                    class="zone-circle"
                    [class.pulse]="zone.trend === 'rising' && getDensityLevel(zone.crowdDensity) === 'high'"
                    />

            <!-- Highlight ring (pulses when quick action matches this zone type) -->
            @if (isHighlighted(zone)) {
              <circle [attr.cx]="zone.position.x"
                      [attr.cy]="zone.position.y"
                      [attr.r]="getZoneRadius(zone) + 4"
                      fill="none"
                      [attr.stroke]="getDensityColor(zone.crowdDensity)"
                      stroke-width="3"
                      class="highlight-ring"
                      />
              <circle [attr.cx]="zone.position.x"
                      [attr.cy]="zone.position.y"
                      [attr.r]="getZoneRadius(zone)"
                      fill="none"
                      [attr.stroke]="getDensityColor(zone.crowdDensity)"
                      stroke-width="2"
                      class="highlight-ping"
                      />
            }

            <!-- Zone icon -->
            <text [attr.x]="zone.position.x"
                  [attr.y]="zone.position.y + 1"
                  text-anchor="middle"
                  dominant-baseline="central"
                  [attr.font-size]="getIconSize(zone)"
                  class="zone-icon">
              {{ getZoneIcon(zone) }}
            </text>

            <!-- Wait time badge (only for amenity zones) -->
            @if (zone.waitTimeMinutes > 0) {
              <g>
                <rect [attr.x]="zone.position.x + getZoneRadius(zone) - 4"
                      [attr.y]="zone.position.y - getZoneRadius(zone) - 4"
                      width="24" height="16" rx="8"
                      [attr.fill]="getDensityColor(zone.crowdDensity)"
                      class="wait-badge"/>
                <text [attr.x]="zone.position.x + getZoneRadius(zone) + 8"
                      [attr.y]="zone.position.y - getZoneRadius(zone) + 5"
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size="8"
                      font-weight="700"
                      fill="white"
                      class="wait-text">
                  {{ zone.waitTimeMinutes }}m
                </text>
              </g>
            }
          </g>
        }

        <!-- Zone labels (separate layer) -->
        @for (zone of zones(); track zone.id) {
          <text [attr.x]="zone.position.x"
                [attr.y]="zone.position.y + getZoneRadius(zone) + 12"
                text-anchor="middle"
                font-size="7"
                font-weight="500"
                fill="rgba(255,255,255,0.5)"
                class="zone-label">
            {{ zone.name }}
          </text>
        }
      </svg>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stadium-svg {
      width: 100%;
      max-width: 400px;
      height: auto;
      transition: transform 0.1s ease-out;
    }
    .zone-group {
      cursor: pointer;
      transition: opacity 0.2s;
      outline: none;
    }
    .zone-group.draggable {
      cursor: grab;
    }
    .zone-group.draggable:active {
      cursor: grabbing;
    }
    .zone-group:hover .zone-circle,
    .zone-group.selected .zone-circle {
      stroke-width: 2.5;
      filter: url(#glow);
    }
    .zone-circle {
      transition: fill 0.6s ease, stroke 0.6s ease, r 0.3s ease;
    }
    .zone-circle.pulse {
      animation: zone-pulse 2s ease-in-out infinite;
    }
    @keyframes zone-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }
    .zone-icon {
      pointer-events: none;
      user-select: none;
    }
    .zone-label {
      pointer-events: none;
      user-select: none;
      font-family: var(--font-sans);
    }
    .wait-badge {
      transition: fill 0.6s ease;
    }
    .wait-text {
      pointer-events: none;
      font-family: var(--font-sans);
    }
    .route-line {
      animation: dash-flow 0.8s linear infinite;
    }
    @keyframes dash-flow {
      to { stroke-dashoffset: -20; }
    }
    .highlight-ring {
      animation: ring-expand 0.8s ease-out 2;
      opacity: 0;
    }
    @keyframes ring-expand {
      0% { r: inherit; opacity: 0.9; stroke-width: 3; }
      100% { r: 35; opacity: 0; stroke-width: 1; }
    }
    .highlight-ping {
      animation: ping-bright 0.8s ease-in-out 2;
    }
    @keyframes ping-bright {
      0%, 100% { opacity: 0.4; stroke-width: 2; }
      50% { opacity: 1; stroke-width: 4; }
    }
  `]
})
export class StadiumMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  activeRoute = input<string[]>([]);
  selectedZoneId = input<string>('');
  highlightZoneType = input<string>('');
  isAdminMode = input<boolean>(false);

  zoneClicked = output<Zone>();
  zonePositionChanged = output<{ zoneId: string; x: number; y: number }>();
  backgroundClick = output<{ x: number; y: number }>();

  public simulator = inject(SimulatorService);

  getDensityColor = getDensityColor;
  getDensityLevel = getDensityLevel;

  zones = computed(() => this.simulator.venue().zones);
  connections = computed(() => this.simulator.venue().connections);

  scale = signal(1);
  panX = signal(0);
  panY = signal(0);

  private lastTouchDist = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private isPanning = false;

  private draggedZoneId = signal<string | null>(null);
  private dragOffset = { x: 0, y: 0 };

  routeSegments = computed(() => {
    const route = this.activeRoute();
    if (route.length < 2) return [];
    return Array.from({ length: route.length - 1 }, (_, i) => i);
  });

  ngAfterViewInit(): void {}

  getZonePos(zoneId: string): { x: number; y: number } {
    const zone = this.simulator.venue().zones.find((z: Zone) => z.id === zoneId);
    return zone?.position ?? { x: 200, y: 200 };
  }

  getZoneRadius(zone: Zone): number {
    const baseRadii: Record<string, number> = {
      'entrance': 16, 'concession': 18, 'restroom': 15, 'seating': 28,
      'merchandise': 16, 'corridor': 12, 'vip': 16, 'exit': 14, 'medical': 14,
    };
    return zone.radius ?? baseRadii[zone.type] ?? 14;
  }

  getIconSize(zone: Zone): string {
    const sizes: Record<string, string> = {
      'seating': '14', 'concession': '12', 'restroom': '11', 'entrance': '11',
      'exit': '10', 'merchandise': '11', 'vip': '10', 'medical': '10',
    };
    return sizes[zone.type] ?? '10';
  }

  getZoneIcon(zone: Zone): string {
    const icons: Record<string, string> = {
      'entrance': '🚪', 'concession': '🍔', 'restroom': '🚻', 'seating': '💺',
      'merchandise': '👕', 'corridor': '🚶', 'vip': '⭐', 'exit': '🚪', 'medical': '🏥',
    };
    return zone.customIcon ?? icons[zone.type] ?? '📍';
  }

  getDensityFill(zone: Zone): string {
    const color = getDensityColor(zone.crowdDensity);
    return color + '25';
  }

  getDensityStroke(zone: Zone): string {
    const color = getDensityColor(zone.crowdDensity);
    return color + '80';
  }

  isHighlighted(zone: Zone): boolean {
    const ht = this.highlightZoneType();
    if (!ht) return false;
    const typeMap: Record<string, ZoneType[]> = {
      'food': ['concession'],
      'restroom': ['restroom'],
      'exit': ['entrance', 'exit'],
      'merch': ['merchandise'],
    };
    const matchTypes = typeMap[ht];
    return matchTypes ? matchTypes.includes(zone.type) : false;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
    } else if (event.touches.length === 1) {
      this.isPanning = true;
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this.lastTouchDist > 0) {
        const newScale = this.scale() * (dist / this.lastTouchDist);
        this.scale.set(Math.max(0.8, Math.min(3, newScale)));
      }
      this.lastTouchDist = dist;
    } else if (event.touches.length === 1 && this.isPanning && this.scale() > 1) {
      const deltaX = event.touches[0].clientX - this.lastTouchX;
      const deltaY = event.touches[0].clientY - this.lastTouchY;
      this.panX.update(v => v + deltaX * 0.5);
      this.panY.update(v => v + deltaY * 0.5);
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  onTouchEnd(): void {
    this.lastTouchDist = 0;
    this.isPanning = false;
    this.onMouseUp();
  }

  onZoneClick(zone: Zone, event: MouseEvent): void {
    if (this.draggedZoneId()) return;
    event.stopPropagation();
    this.zoneClicked.emit(zone);
  }

  onSvgClick(event: MouseEvent): void {
    if (this.draggedZoneId()) return;
    const svg = event.currentTarget as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    this.backgroundClick.emit({ x: loc.x, y: loc.y });
  }

  onZoneMouseDown(zone: Zone, event: MouseEvent): void {
    if (!this.isAdminMode()) return;
    event.preventDefault();
    event.stopPropagation();
    this.draggedZoneId.set(zone.id);
    const svgPoint = this.getSVGPoint(event.clientX, event.clientY);
    this.dragOffset = {
      x: svgPoint.x - zone.position.x,
      y: svgPoint.y - zone.position.y
    };
  }

  onMouseMove(event: MouseEvent): void {
    const zoneId = this.draggedZoneId();
    if (!zoneId) return;
    const svgPoint = this.getSVGPoint(event.clientX, event.clientY);
    const newX = Math.round(svgPoint.x - this.dragOffset.x);
    const newY = Math.round(svgPoint.y - this.dragOffset.y);
    const venue = this.simulator.venue();
    const zone = venue.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.position.x = newX;
      zone.position.y = newY;
    }
  }

  onMouseUp(): void {
    const zoneId = this.draggedZoneId();
    if (!zoneId) return;
    const zone = this.simulator.venue().zones.find(z => z.id === zoneId);
    if (zone) {
      this.zonePositionChanged.emit({
        zoneId, x: zone.position.x, y: zone.position.y
      });
    }
    this.draggedZoneId.set(null);
  }

  private getSVGPoint(clientX: number, clientY: number): DOMPoint {
    const svg = this.mapContainer.nativeElement.querySelector('svg') as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()?.inverse());
  }
}
