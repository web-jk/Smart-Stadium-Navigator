import {
  Component,
  signal,
  input,
  output,
  inject,
  OnInit,
  OnDestroy,
  computed,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../services/location.service';
import { SimulatorService } from '../../services/simulator.service';
import { Zone, getDensityColor, getDensityLevel } from '../../models/venue.model';

// Leaflet type declarations (loaded via CDN)
declare const L: any;

@Component({
  selector: 'app-earth-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="earth-map-wrapper">
      <!-- Map Container -->
      <div class="map-mount" #mapMount></div>

      <!-- Map Controls Overlay -->
      <div class="map-controls">
        <!-- Tile Toggle -->
        <div class="tile-toggle glass-strong">
          <button class="tile-btn"
                  [class.active]="tileMode() === 'satellite'"
                  (click)="setTileMode('satellite')">
            🛰️ Satellite
          </button>
          <button class="tile-btn"
                  [class.active]="tileMode() === 'street'"
                  (click)="setTileMode('street')">
            🗺️ Street
          </button>
        </div>

        <!-- Re-center button -->
        <button class="recenter-btn glass-strong" (click)="recenterMap()" title="Re-center on stadium">
          🏟️
        </button>
      </div>

      <!-- Location Status Bar -->
      <div class="location-bar glass-strong">
        @if (locationService.isTracking() && locationService.currentPosition()) {
          <div class="location-status active">
            <span class="loc-dot pulse-dot"></span>
            <span class="loc-text">📍 {{ locationService.distanceLabel() }}</span>
            <span class="loc-accuracy">±{{ locationService.currentPosition()?.accuracy?.toFixed(0) }}m</span>
          </div>
        } @else if (locationService.locationError()) {
          <div class="location-status error">
            <span class="loc-icon">🔴</span>
            <span class="loc-text">{{ locationService.locationError() }}</span>
          </div>
        } @else {
          <div class="location-status pending">
            <span class="loc-icon">📡</span>
            <span class="loc-text">Acquiring location...</span>
          </div>
        }
      </div>

      <!-- Zone Legend -->
      <div class="zone-legend glass-strong">
        <div class="legend-item">
          <span class="legend-dot" style="background: #22c55e"></span>
          <span>Low</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f59e0b"></span>
          <span>Moderate</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #ef4444"></span>
          <span>Busy</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #dc2626"></span>
          <span>Very Busy</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .earth-map-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .map-mount {
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    /* ─── Map Controls ─── */
    .map-controls {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .tile-toggle {
      display: flex;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .tile-btn {
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tile-btn.active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .tile-btn:not(.active):hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
    }

    .recenter-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.2s;
    }

    .recenter-btn:hover {
      border-color: rgba(99, 102, 241, 0.5);
      background: rgba(99, 102, 241, 0.15);
    }

    /* ─── Location Bar ─── */
    .location-bar {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      z-index: 1000;
      border-radius: 14px;
      padding: 10px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .location-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
    }

    .location-status.active .loc-text {
      color: #22c55e;
      font-weight: 600;
    }

    .location-status.error .loc-text {
      color: #f87171;
    }

    .location-status.pending .loc-text {
      color: var(--color-text-secondary);
    }

    .loc-accuracy {
      margin-left: auto;
      font-size: 0.65rem;
      color: var(--color-text-muted);
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 8px;
      border-radius: 8px;
    }

    .loc-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pulse-dot {
      animation: gpsPulse 2s ease-in-out infinite;
    }

    @keyframes gpsPulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
      50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    }

    .loc-icon { font-size: 0.75rem; }

    /* ─── Zone Legend ─── */
    .zone-legend {
      position: absolute;
      bottom: 60px;
      left: 12px;
      z-index: 1000;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      gap: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.6rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ─── Override Leaflet default styles to match dark theme ─── */
    :host ::ng-deep .leaflet-control-zoom a {
      background: rgba(26, 31, 46, 0.9) !important;
      color: white !important;
      border-color: rgba(255, 255, 255, 0.12) !important;
      backdrop-filter: blur(12px) !important;
    }

    :host ::ng-deep .leaflet-control-zoom a:hover {
      background: rgba(99, 102, 241, 0.3) !important;
    }

    :host ::ng-deep .leaflet-control-attribution {
      background: rgba(26, 31, 46, 0.7) !important;
      color: rgba(255, 255, 255, 0.4) !important;
      font-size: 0.55rem !important;
      backdrop-filter: blur(8px) !important;
    }

    :host ::ng-deep .leaflet-control-attribution a {
      color: rgba(99, 102, 241, 0.7) !important;
    }

    :host ::ng-deep .leaflet-popup-content-wrapper {
      background: rgba(26, 31, 46, 0.95) !important;
      color: white !important;
      border-radius: 14px !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      backdrop-filter: blur(16px) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
    }

    :host ::ng-deep .leaflet-popup-tip {
      background: rgba(26, 31, 46, 0.95) !important;
    }

    :host ::ng-deep .leaflet-popup-content {
      margin: 12px 16px !important;
      font-family: var(--font-sans) !important;
      font-size: 0.8rem !important;
    }

    /* Custom marker styles */
    :host ::ng-deep .user-location-marker {
      background: transparent;
      border: none;
    }

    :host ::ng-deep .user-dot-outer {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(66, 133, 244, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: userPulse 2s ease-in-out infinite;
    }

    :host ::ng-deep .user-dot-inner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #4285F4;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(66, 133, 244, 0.5);
    }

    @keyframes userPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    :host ::ng-deep .gate-marker-icon {
      background: transparent;
      border: none;
    }

    :host ::ng-deep .gate-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s;
    }

    :host ::ng-deep .gate-dot:hover {
      transform: scale(1.15);
    }

    :host ::ng-deep .stadium-label {
      background: transparent !important;
      border: none !important;
      font-family: var(--font-display) !important;
      font-weight: 800 !important;
      font-size: 14px !important;
      color: white !important;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(99, 102, 241, 0.5) !important;
      white-space: nowrap !important;
    }

    :host ::ng-deep .pulse-marker {
      animation: earth-pulse 0.8s ease-out 2;
    }

    @keyframes earth-pulse {
      0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(99, 102, 241, 0.8)); opacity: 0.9; }
      50% { transform: scale(1.4); filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.8)); opacity: 1; }
      100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(99, 102, 241, 0)); opacity: 0.9; }
    }

    :host ::ng-deep .nav-destination-pulse {
      animation: earth-pulse-continuous 1.2s ease-in-out infinite;
    }

    @keyframes earth-pulse-continuous {
      0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(99, 102, 241, 0.8)); opacity: 0.9; }
      50% { transform: scale(1.4); filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.8)); opacity: 1; }
      100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(99, 102, 241, 0)); opacity: 0.9; }
    }

    :host ::ng-deep .route-path-anim {
      animation: leaflet-dash-flow 0.8s linear infinite;
    }

    @keyframes leaflet-dash-flow {
      to { stroke-dashoffset: -36; }
    }
  `]
})
export class EarthMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapMount') mapMount!: ElementRef<HTMLDivElement>;

  gateClicked = output<string>();
  activeRoute = input<string[]>([]);
  highlightZoneType = input<string>('');

  locationService = inject(LocationService);
  private simulator = inject(SimulatorService);

  tileMode = signal<'satellite' | 'street'>('satellite');

  private map: any = null;
  private userMarker: any = null;
  private userAccuracyCircle: any = null;
  private currentTileLayer: any = null;
  private stadiumPolygon: any = null;
  private polylineLayer: any = null;
  private markersMap = new Map<string, any>();

  constructor() {
    // Watch for location changes and update user marker
    effect(() => {
      const pos = this.locationService.currentPosition();
      if (pos) {
        this.updateUserMarker(pos.lat, pos.lng, pos.accuracy);
      }
    });

    // Watch for active route to draw lines
    effect(() => {
      const route = this.activeRoute();
      this.drawRoute(route);
    });

    // Watch for real-time venue changes to update map markers
    effect(() => {
      const zones = this.simulator.venue().zones;
      this.refreshMarkers(zones);
    });

    // Watch for highlights to pop in/out circles
    effect(() => {
      const ht = this.highlightZoneType();
      this.updateHighlights(ht);
    });
  }

  // MCA Stadium Pune - correct coordinates
  private readonly STADIUM_CENTER = { lat: 18.6744, lng: 73.7067 };

  private readonly GATE_GEO: Record<string, { lat: number; lng: number; label: string }> = {
    'gate-north': { lat: 18.6762, lng: 73.7067, label: 'North Gate' },
    'gate-south': { lat: 18.6726, lng: 73.7067, label: 'South Gate' },
    'gate-east':  { lat: 18.6744, lng: 73.7087, label: 'East Gate' },
    'gate-west':  { lat: 18.6744, lng: 73.7047, label: 'West Gate' },
  };

  // Stadium outline polygon (approximate octagonal footprint of MCA Stadium)
  private readonly STADIUM_POLYGON = [
    [18.6762, 73.7052],
    [18.6762, 73.7082],
    [18.6755, 73.7090],
    [18.6733, 73.7090],
    [18.6726, 73.7082],
    [18.6726, 73.7052],
    [18.6733, 73.7044],
    [18.6755, 73.7044],
  ];

  // Zone geo-positions (approximate mappings for concessions, restrooms etc.)
  private readonly ZONE_GEO: Record<string, { lat: number; lng: number }> = {
    'food-north':    { lat: 18.6758, lng: 73.7058 },
    'food-south':    { lat: 18.6730, lng: 73.7076 },
    'food-east':     { lat: 18.6750, lng: 73.7085 },
    'food-west':     { lat: 18.6738, lng: 73.7049 },
    'restroom-ne':   { lat: 18.6757, lng: 73.7080 },
    'restroom-nw':   { lat: 18.6757, lng: 73.7054 },
    'restroom-se':   { lat: 18.6731, lng: 73.7080 },
    'restroom-sw':   { lat: 18.6731, lng: 73.7054 },
    'merch-main':    { lat: 18.6752, lng: 73.7046 },
    'vip-lounge':    { lat: 18.6735, lng: 73.7088 },
    'medical-center':{ lat: 18.6744, lng: 73.7067 },
    'seating-north': { lat: 18.6753, lng: 73.7067 },
    'seating-south': { lat: 18.6735, lng: 73.7067 },
    'seating-east':  { lat: 18.6744, lng: 73.7077 },
    'seating-west':  { lat: 18.6744, lng: 73.7057 },
  };

  private readonly ZONE_ICONS: Record<string, string> = {
    'concession': '🍔',
    'restroom': '🚻',
    'merchandise': '👕',
    'vip': '⭐',
    'medical': '🏥',
    'seating': '💺',

    'entrance': '🚪',
  };

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => this.initMap(), 100);
  }

  private initMap(): void {
    if (!this.mapMount?.nativeElement || typeof L === 'undefined') return;

    this.map = L.map(this.mapMount.nativeElement, {
      center: [this.STADIUM_CENTER.lat, this.STADIUM_CENTER.lng],
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
    });

    // Set initial tile layer
    this.applyTileLayer('satellite');

    // Add stadium polygon (dimmed background)
    this.stadiumPolygon = L.polygon(this.STADIUM_POLYGON, {
      color: '#475569',
      weight: 2,
      opacity: 0.4,
      fillColor: '#6366f1',
      fillOpacity: 0.05,
      dashArray: 'none',
    }).addTo(this.map);

    // Add stadium label
    const stadiumLabel = L.divIcon({
      className: 'stadium-label',
      html: '🏟️ MCA Stadium',
      iconSize: [140, 20],
      iconAnchor: [70, 10],
    });
    L.marker([this.STADIUM_CENTER.lat, this.STADIUM_CENTER.lng], {
      icon: stadiumLabel,
      interactive: false,
    }).addTo(this.map);

    // Add gate markers
    this.addGateMarkers();

    // Add zone markers (food, restroom, etc.)
    this.addZoneMarkers();

    // Give effects a manual initial flush since the map wasn't ready when they first ran
    this.drawRoute(this.activeRoute());
    this.updateHighlights(this.highlightZoneType());
    const pos = this.locationService.currentPosition();
    if (pos) {
      this.updateUserMarker(pos.lat, pos.lng, pos.accuracy);
    }
  }

  private applyTileLayer(mode: 'satellite' | 'street'): void {
    if (this.currentTileLayer && this.map) {
      this.map.removeLayer(this.currentTileLayer);
    }

    if (mode === 'satellite') {
      this.currentTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      );
    } else {
      // Dark street map style
      this.currentTileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }
      );
    }

    if (this.map) {
      this.currentTileLayer.addTo(this.map);
    }
  }

  setTileMode(mode: 'satellite' | 'street'): void {
    this.tileMode.set(mode);
    this.applyTileLayer(mode);
  }

  private addGateMarkers(): void {
    const zones = this.simulator.venue().zones;
    
    for (const [gateId, geo] of Object.entries(this.GATE_GEO)) {
      const zone = zones.find(z => z.id === gateId);
      if (!zone) continue;

      const color = getDensityColor(zone.crowdDensity);
      const icon = L.divIcon({
        className: 'gate-marker-icon',
        html: `<div class="gate-dot" style="background: ${color}">🚪</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon })
        .addTo(this.map)
        .bindPopup(`
          <div style="text-align:center">
            <strong>${geo.label}</strong><br>
            <span style="font-size:0.7rem; color: ${color}">
              Wait: ${zone.waitTimeMinutes}min • ${Math.round(zone.crowdDensity * 100)}% full
            </span>
          </div>
        `);

      marker.on('click', () => this.gateClicked.emit(gateId));
      this.markersMap.set(gateId, marker);
    }
  }

  private refreshMarkers(zones: Zone[]): void {
    if (!this.map) return;

    this.markersMap.forEach((marker, zoneId) => {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;

      const isGate = !!this.GATE_GEO[zoneId];
      const color = getDensityColor(zone.crowdDensity);

      let iconHTML = '';
      let title = '';

      if (isGate) {
        iconHTML = `<div class="gate-dot" style="background: ${color}">🚪</div>`;
        title = this.GATE_GEO[zoneId].label;
      } else {
        const emoji = this.ZONE_ICONS[zone.type] || '📍';
        iconHTML = `<div class="gate-dot" style="background: ${color}; width: 26px; height: 26px; font-size: 0.65rem;">${emoji}</div>`;
        title = `${emoji} ${zone.name}`;
      }

      const newIcon = L.divIcon({
        className: 'gate-marker-icon',
        html: iconHTML,
        iconSize: isGate ? [32, 32] : [26, 26],
        iconAnchor: isGate ? [16, 16] : [13, 13],
      });

      marker.setIcon(newIcon);
      
      marker.setPopupContent(`
        <div style="text-align:center">
          <strong>${title}</strong><br>
          <span style="font-size:0.7rem; color: ${color}">
            ${zone.waitTimeMinutes > 0 ? 'Wait: ' + zone.waitTimeMinutes + 'min • ' : ''}
            ${Math.round(zone.crowdDensity * 100)}% full
          </span>
        </div>
      `);
    });
  }

  private addZoneMarkers(): void {
    const zones = this.simulator.venue().zones;

    for (const [zoneId, geo] of Object.entries(this.ZONE_GEO)) {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) continue;

      const color = getDensityColor(zone.crowdDensity);
      const emoji = this.ZONE_ICONS[zone.type] || '📍';

      const icon = L.divIcon({
        className: 'gate-marker-icon',
        html: `<div class="gate-dot" style="background: ${color}; width: 26px; height: 26px; font-size: 0.65rem;">${emoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([geo.lat, geo.lng], { icon })
        .addTo(this.map)
        .bindPopup(`
          <div style="text-align:center">
            <strong>${emoji} ${zone.name}</strong><br>
            <span style="font-size:0.7rem; color: ${color}">
              ${zone.waitTimeMinutes > 0 ? 'Wait: ' + zone.waitTimeMinutes + 'min • ' : ''}
              ${Math.round(zone.crowdDensity * 100)}% full
            </span>
          </div>
        `);

      marker.on('click', () => this.gateClicked.emit(zoneId));
      this.markersMap.set(zoneId, marker);
    }
  }

  private updateHighlights(ht: string): void {
    const typeMap: Record<string, string[]> = {
      'food': ['concession'],
      'restroom': ['restroom'],
      'exit': ['entrance', 'exit'],
      'merch': ['merchandise'],
    };
    const matchTypes = typeMap[ht] || [];

    const zones = this.simulator.venue().zones;

    this.markersMap.forEach((marker, zoneId) => {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;
      const el = marker.getElement();
      if (!el) return;

      if (matchTypes.includes(zone.type)) {
        el.classList.add('pulse-marker');
      } else {
        el.classList.remove('pulse-marker');
      }
    });
  }

  private drawRoute(route: string[]): void {
    if (this.polylineLayer && this.map) {
      this.map.removeLayer(this.polylineLayer);
      this.polylineLayer = null;
    }

    if (!route || route.length < 2 || !this.map) return;

    const latlngs: [number, number][] = [];
    for (const zId of route) {
      let geo = this.GATE_GEO[zId] || this.ZONE_GEO[zId];
      if (geo) {
        latlngs.push([geo.lat, geo.lng]);
      }
    }

    if (latlngs.length >= 2) {
      this.polylineLayer = L.polyline(latlngs, {
        color: '#06b6d4', // Bright cyan to clearly distinguish from everything
        weight: 6,
        opacity: 0.95,
        dashArray: '12, 10',
        className: 'route-path-anim'
      }).addTo(this.map);
      
      // Optionally bring markers to front above the line and pulse the destination
      const destinationId = route[route.length - 1];
      this.markersMap.forEach((marker, id) => {
         const el = marker.getElement();
         if (el) {
           el.style.zIndex = '1000';
           if (id === destinationId) {
             el.classList.add('nav-destination-pulse');
           } else {
             el.classList.remove('nav-destination-pulse');
           }
         }
      });
    } else {
      // Clear destination pulse if no route
      this.markersMap.forEach(marker => {
         const el = marker.getElement();
         if (el) el.classList.remove('nav-destination-pulse');
      });
    }
  }

  private updateUserMarker(lat: number, lng: number, accuracy: number): void {
    if (!this.map) return;

    // User dot
    if (!this.userMarker) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="user-dot-outer">
            <div class="user-dot-inner"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      this.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(this.map)
        .bindPopup('<strong>📍 You are here</strong>');
    } else {
      this.userMarker.setLatLng([lat, lng]);
    }

    // Accuracy circle
    if (!this.userAccuracyCircle) {
      this.userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#4285F4',
        weight: 1,
        opacity: 0.3,
        fillColor: '#4285F4',
        fillOpacity: 0.08,
      }).addTo(this.map);
    } else {
      this.userAccuracyCircle.setLatLng([lat, lng]);
      this.userAccuracyCircle.setRadius(accuracy);
    }
  }

  recenterMap(): void {
    if (this.map) {
      this.map.flyTo(
        [this.STADIUM_CENTER.lat, this.STADIUM_CENTER.lng],
        17,
        { duration: 1.2 }
      );
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
