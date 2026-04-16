import {
  Component,
  signal,
  input,
  output,
  inject,
  OnDestroy,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../services/location.service';
import { SimulatorService } from '../../services/simulator.service';
import { Zone, getDensityColor } from '../../models/venue.model';

// Leaflet type declarations (loaded via CDN)
declare const L: any;

@Component({
  selector: 'app-earth-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="earth-map-wrapper">
      <div class="map-mount" #mapMount></div>

      <div class="map-controls">
        <div class="tile-toggle glass-strong">
          <button class="tile-btn" [class.active]="tileMode() === 'satellite'" (click)="setTileMode('satellite')">🛰️ Satellite</button>
          <button class="tile-btn" [class.active]="tileMode() === 'street'" (click)="setTileMode('street')">🗺️ Street</button>
        </div>
        <button class="recenter-btn glass-strong" (click)="recenterMap()" title="Re-center on stadium">🏟️</button>
      </div>

      <div class="location-bar glass-strong">
        @if (locationService.isTracking() && locationService.currentPosition()) {
          <div class="location-status active">
            <span class="loc-dot pulse-dot"></span>
            <span class="loc-text">📍 {{ locationService.distanceLabel() }}</span>
            <span class="loc-accuracy">±{{ locationService.currentPosition()?.accuracy?.toFixed(0) }}m</span>
          </div>
        } @else if (locationService.locationError()) {
          <div class="location-status error">
            <span class="loc-text">🔴 {{ locationService.locationError() }}</span>
          </div>
        } @else {
          <div class="location-status pending">
            <span class="loc-text">📡 Acquiring location...</span>
          </div>
        }
      </div>

      @if (isAdminMode()) {
        <div class="search-overlay animate-fade-in">
          <div class="search-box glass-strong">
            <input type="text" #searchInput placeholder="Search stadium or enter lat, lng..." 
                   (keyup.enter)="searchLocation(searchInput.value)" />
            <button class="search-go" (click)="searchLocation(searchInput.value)" [disabled]="isSearching()">
              @if (isSearching()) {
                <span class="search-spinner"></span>
              } @else {
                🔍
              }
            </button>
          </div>
          @if (searchError()) {
            <div class="search-error animate-slide-up">{{ searchError() }}</div>
          }
          @if (!simulator.venue().isInitialized && !searchError()) {
            <div class="init-prompt animate-pulse">Click place on map to set stadium center</div>
          }
        </div>
      }

      <div class="zone-legend glass-strong">
        <div class="legend-item"><span class="legend-dot" style="background: #22c55e"></span><span>Low</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #f59e0b"></span><span>Moderate</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #ef4444"></span><span>Busy</span></div>
        <div class="legend-item"><span class="legend-dot" style="background: #dc2626"></span><span>Very Busy</span></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; }
    .earth-map-wrapper { width: 100%; height: 100%; position: relative; overflow: hidden; }
    .map-mount { width: 100%; height: 100%; z-index: 0; }
    .map-controls { position: absolute; top: 12px; right: 12px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
    .tile-toggle { display: flex; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12); }
    .tile-btn { padding: 8px 12px; border: none; background: transparent; color: rgba(255, 255, 255, 0.6); font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
    .tile-btn.active { background: #6366f1; color: white; }
    .recenter-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; }
    .location-bar { position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 1000; border-radius: 14px; padding: 10px 16px; border: 1px solid rgba(255, 255, 255, 0.1); }
    .location-status { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
    .location-status.active .loc-text { color: #22c55e; font-weight: 600; }
    .loc-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
    .pulse-dot { animation: gpsPulse 2s ease-in-out infinite; }
    @keyframes gpsPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); } 50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } }
    .search-overlay { position: absolute; top: 12px; left: 12px; z-index: 1100; display: flex; flex-direction: column; gap: 12px; max-width: 320px; width: calc(100% - 100px); }
    .search-box { display: flex; padding: 4px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); overflow: hidden; }
    .search-box input { flex: 1; background: transparent; border: none; padding: 8px 12px; color: white; font-size: 0.85rem; outline: none; }
    .search-go { background: rgba(255,255,255,0.05); border: none; color: white; padding: 0 12px; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; min-width: 40px; }
    .search-go:disabled { opacity: 0.5; cursor: not-allowed; }
    .search-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .search-error { background: rgba(239, 68, 68, 0.9); color: white; padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; align-self: flex-start; margin-top: -4px; }
    .init-prompt { background: #6366f1; color: white; padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; align-self: flex-start; }
    .zone-legend { position: absolute; bottom: 60px; left: 12px; z-index: 1000; border-radius: 12px; padding: 8px 12px; display: flex; gap: 10px; border: 1px solid rgba(255, 255, 255, 0.1); }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.6rem; color: var(--color-text-secondary); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    :host ::ng-deep .gate-marker-icon { background: transparent; border: none; }
    :host ::ng-deep .gate-dot { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; font-size: 0.75rem; font-weight: 700; color: white; border: 2px solid rgba(255, 255, 255, 0.5); }
    :host ::ng-deep .stadium-label { background: transparent !important; border: none !important; font-family: var(--font-display) !important; font-weight: 800 !important; font-size: 14px !important; color: white !important; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
    :host ::ng-deep .route-path-anim { animation: dash-leaf 0.8s linear infinite; }
    @keyframes dash-leaf { to { stroke-dashoffset: -36; } }
    :host ::ng-deep .pulse-marker .gate-dot {
      animation: gate-dot-pulse 0.8s ease-in-out infinite alternate;
      box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
    }
    @keyframes gate-dot-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.7); filter: brightness(1); color: white; }
      100% { transform: scale(1.4); box-shadow: 0 0 0 10px rgba(255,255,255,0); filter: brightness(1.2); color: white; }
    }
  `]
})
export class EarthMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapMount') mapMount!: ElementRef<HTMLDivElement>;

  isAdminMode = input<boolean>(false);
  gateClicked = output<string>();
  locationSelected = output<{ lat: number; lng: number }>();
  activeRoute = input<string[]>([]);
  highlightZoneType = input<string>('');

  locationService = inject(LocationService);
  simulator = inject(SimulatorService);

  tileMode = signal<'satellite' | 'street'>('satellite');
  isSearching = signal(false);
  searchError = signal<string | null>(null);

  private map: any = null;
  private userMarker: any = null;
  private userAccuracyCircle: any = null;
  private currentTileLayer: any = null;
  private referenceLayer: any = null; // New layer for labels/boundaries
  private polylineLayer: any = null;
  private markersMap = new Map<string, any>();

  constructor() {
    effect(() => {
      const pos = this.locationService.currentPosition();
      if (pos) this.updateUserMarker(pos.lat, pos.lng, pos.accuracy);
    });

    effect(() => this.drawRoute(this.activeRoute()));
    effect(() => this.refreshMarkers(this.simulator.venue().zones));
    effect(() => this.updateHighlights(this.highlightZoneType()));
  }

  private readonly ZONE_ICONS: Record<string, string> = {
    'concession': '🍔', 'restroom': '🚻', 'merchandise': '👕', 'vip': '⭐', 'medical': '🏥', 'seating': '💺', 'entrance': '🚪',
  };

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    if (!this.mapMount?.nativeElement || typeof L === 'undefined') return;

    const venue = this.simulator.venue();
    const center = venue.center || { lat: 20, lng: 0 };
    const zoom = venue.isInitialized ? 18 : 3;

    this.map = L.map(this.mapMount.nativeElement, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
    });

    this.map.on('click', (e: any) => {
      if (this.isAdminMode()) this.locationSelected.emit(e.latlng);
    });

    this.applyTileLayer('satellite');

    if (venue.isInitialized && venue.center) {
      L.marker([venue.center.lat, venue.center.lng], {
        icon: L.divIcon({ className: 'stadium-label', html: `🏟️ ${venue.name}`, iconSize: [200, 20], iconAnchor: [100, 10] }),
        interactive: false,
      }).addTo(this.map);
    }

    this.refreshMarkers(venue.zones);
  }

  private applyTileLayer(mode: 'satellite' | 'street'): void {
    if (this.currentTileLayer && this.map) this.map.removeLayer(this.currentTileLayer);
    if (this.referenceLayer && this.map) this.map.removeLayer(this.referenceLayer);
    
    if (mode === 'satellite') {
      // Base Imagery
      this.currentTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(this.map);
      
      // HYBRID OVERLAY: Reference labels (cities, names, boundaries)
      this.referenceLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.8 } // Slightly transparent for better blending
      ).addTo(this.map);
    } else {
      // Dark street map style (labels integrated)
      this.currentTileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(this.map);
    }
  }

  setTileMode(mode: 'satellite' | 'street'): void {
    this.tileMode.set(mode);
    this.applyTileLayer(mode);
  }

  recenterMap(): void {
    const center = this.simulator.venue().center;
    if (center && this.map) this.map.setView([center.lat, center.lng], 18);
  }

  async searchLocation(query: string): Promise<void> {
    if (!query.trim() || !this.map) return;
    
    this.isSearching.set(true);
    this.searchError.set(null);

    const coordReg = /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/;
    const match = query.match(coordReg);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      this.map.setView([lat, lng], 17);
      this.isSearching.set(false);
      return;
    }

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      
      if (data?.length > 0) {
        const { lat, lon } = data[0];
        this.map.setView([parseFloat(lat), parseFloat(lon)], 17);
      } else {
        this.searchError.set('No results found for "' + query + '"');
        setTimeout(() => this.searchError.set(null), 3000);
      }
    } catch (err) {
      this.searchError.set('Search failed. Check your connection.');
      setTimeout(() => this.searchError.set(null), 3000);
    } finally {
      this.isSearching.set(false);
    }
  }

  private refreshMarkers(zones: Zone[]): void {
    if (!this.map) return;
    const currentIds = zones.map(z => z.id);
    this.markersMap.forEach((_, id) => {
      if (!currentIds.includes(id)) { this.map.removeLayer(this.markersMap.get(id)); this.markersMap.delete(id); }
    });

    zones.forEach(zone => {
      if (!zone.geoPos) return;
      const color = getDensityColor(zone.crowdDensity);
      const emoji = zone.customIcon || this.ZONE_ICONS[zone.type] || '📍';
      const isGate = zone.type === 'entrance' || zone.type === 'exit';
      const icon = L.divIcon({
        className: 'gate-marker-icon',
        html: `<div class="gate-dot" style="background: ${color}; width: ${isGate ? 32 : 26}px; height: ${isGate ? 32 : 26}px; font-size: ${isGate ? 0.75 : 0.65}rem;">${isGate ? '🚪' : emoji}</div>`,
        iconSize: isGate ? [32, 32] : [26, 26],
        iconAnchor: isGate ? [16, 16] : [13, 13],
      });

      if (this.markersMap.has(zone.id)) {
        const marker = this.markersMap.get(zone.id);
        marker.setLatLng([zone.geoPos.lat, zone.geoPos.lng]).setIcon(icon);
        if (this.isAdminMode()) marker.dragging.enable(); else marker.dragging.disable();
      } else {
        const marker = L.marker([zone.geoPos.lat, zone.geoPos.lng], { 
          icon, 
          draggable: this.isAdminMode() 
        }).addTo(this.map)
          .bindPopup(`<div style="text-align:center"><strong>${emoji} ${zone.name}</strong></div>`);
        
        marker.on('click', () => this.gateClicked.emit(zone.id));
        
        marker.on('dragstart', () => {
          this.map.dragging.disable();
        });

        marker.on('dragend', (event: any) => {
          this.map.dragging.enable();
          const newPos = event.target.getLatLng();
          this.simulator.updateZoneProperties(zone.id, { geoPos: { lat: newPos.lat, lng: newPos.lng } });
        });

        this.markersMap.set(zone.id, marker);
      }
    });
  }

  private updateHighlights(ht: string): void {
    const typeMap: Record<string, string[]> = { 'food': ['concession'], 'restroom': ['restroom'], 'exit': ['entrance', 'exit'], 'merch': ['merchandise'] };
    const matchTypes = typeMap[ht] || [];
    this.markersMap.forEach((marker, zoneId) => {
      const zone = this.simulator.venue().zones.find(z => z.id === zoneId);
      const el = marker.getElement();
      if (el && zone) matchTypes.includes(zone.type) ? el.classList.add('pulse-marker') : el.classList.remove('pulse-marker');
    });
  }

  private drawRoute(route: string[]): void {
    if (this.polylineLayer) this.map.removeLayer(this.polylineLayer);
    this.polylineLayer = null;
    if (!route || route.length < 2 || !this.map) return;
    const latlngs: [number, number][] = [];
    route.forEach(id => {
      const zone = this.simulator.venue().zones.find(z => z.id === id);
      if (zone?.geoPos) latlngs.push([zone.geoPos.lat, zone.geoPos.lng]);
    });
    if (latlngs.length >= 2) this.polylineLayer = L.polyline(latlngs, { color: '#06b6d4', weight: 6, opacity: 0.95, dashArray: '12, 10', className: 'route-path-anim' }).addTo(this.map);
  }

  private updateUserMarker(lat: number, lng: number, accuracy: number): void {
    if (!this.map) return;
    if (!this.userMarker) {
      const icon = L.divIcon({ className: 'user-location-marker', html: `<div class="user-dot-outer"><div class="user-dot-inner"></div></div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      this.userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
    } else this.userMarker.setLatLng([lat, lng]);
    if (!this.userAccuracyCircle) this.userAccuracyCircle = L.circle([lat, lng], { radius: accuracy, color: '#4285F4', weight: 1, opacity: 0.3, fillOpacity: 0.08 }).addTo(this.map);
    else this.userAccuracyCircle.setLatLng([lat, lng]).setRadius(accuracy);
  }
}
