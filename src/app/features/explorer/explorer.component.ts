import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorService } from '../../services/simulator.service';
import { VenueService } from '../../services/venue.service';
import { AlertService } from '../../services/alert.service';
import { StatsService } from '../../services/stats.service';
import { LocationService } from '../../services/location.service';
import { Zone, NavigationRoute } from '../../models/venue.model';

import { StadiumMapComponent } from '../map/stadium-map.component';
import { EarthMapComponent } from '../google-map/earth-map.component';
import { ZoneDetailComponent } from '../zone-detail/zone-detail.component';
import { AlertBannerComponent } from '../alerts/alert-banner.component';
import { QuickActionsComponent, QuickActionType } from '../quick-actions/quick-actions.component';
import { FindNearestComponent } from '../find-nearest/find-nearest.component';
import { NavigationPanelComponent } from '../navigation/navigation-panel.component';
import { StatsComponent } from '../stats/stats.component';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    CommonModule,
    StadiumMapComponent,
    EarthMapComponent,
    ZoneDetailComponent,
    AlertBannerComponent,
    QuickActionsComponent,
    FindNearestComponent,
    NavigationPanelComponent,
    StatsComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Top Bar -->
      <header class="top-bar glass-strong" role="banner">
        <div class="top-bar-left">
          <span class="app-logo-sm" role="img" aria-label="Stadium Icon">🏟️</span>
          <div>
            <h1 class="app-title-sm">Stadium<span class="hl">Flow</span></h1>
            <span class="event-badge">{{ eventPhaseLabel() }}</span>
          </div>
        </div>
        <div class="top-bar-right">
          <!-- Map View Toggle -->
          <nav class="map-toggle" aria-label="Map view selection">
            <button class="toggle-btn"
                    [class.active]="mapView() === 'stadium'"
                    [ariaPressed]="mapView() === 'stadium'"
                    (click)="setMapView('stadium')"
                    aria-label="Switch to Schematic Stadium Map"
                    title="Stadium Map">
              🗺️
            </button>
            <button class="toggle-btn"
                    [class.active]="mapView() === 'earth'"
                    [ariaPressed]="mapView() === 'earth'"
                    (click)="setMapView('earth')"
                    aria-label="Switch to Satellite Earth View"
                    title="Earth View">
              🛰️
            </button>
          </nav>
          <!-- Distance indicator -->
          @if (locationService.distanceLabel()) {
            <span class="distance-badge animate-fade-in" aria-live="polite">
              <span class="sr-only">Distance: </span>
              📍 {{ locationService.distanceLabel() }}
            </span>
          }
          <button class="stats-btn" (click)="toggleStats()" title="My Stats" aria-label="Open my statistics">
            📊
          </button>
          <div class="live-indicator animate-live-pulse" role="status">
            <span class="live-dot-sm" aria-hidden="true"></span>
            LIVE
          </div>
        </div>
      </header>

      <!-- Alert Banner -->
      <app-alert-banner />

      <!-- Map Area -->
      <main class="map-area" role="main">
        @if (mapView() === 'stadium') {
          <app-stadium-map
            [activeRoute]="activeRoutePath()"
            [selectedZoneId]="selectedZone()?.id ?? ''"
            [highlightZoneType]="highlightZoneType()"
            (zoneClicked)="onZoneClicked($event)" />
        } @else {
          <app-earth-map
            [activeRoute]="activeRoutePath()"
            [highlightZoneType]="highlightZoneType()"
            (gateClicked)="onEarthZoneClicked($event)" />
        }
      </main>

      <!-- Quick Actions Bar -->
      <nav class="bottom-bar glass-strong" aria-label="Quick Actions">
        <app-quick-actions (actionClicked)="onQuickAction($event)" />
      </nav>

      <!-- Zone Detail Sheet -->
      @if (selectedZone()) {
        <app-zone-detail
          [zone]="selectedZone()"
          (close)="closeZoneDetail()"
          (navigate)="navigateToZone($event)" />
      }

      <!-- Find Nearest Sheet -->
      @if (showFindNearest()) {
        <app-find-nearest
          [searchType]="findNearestType()"
          (close)="closeFindNearest()"
          (navigateTo)="navigateToZone($event)" />
      }

      <!-- Navigation Panel -->
      @if (activeRoute()) {
        <app-navigation-panel
          [route]="activeRoute()"
          [destinationId]="navigationDestinationId()"
          (cancel)="cancelNavigation()" />
      }

      <!-- Stats Sheet -->
      @if (showStats()) {
        <app-stats (close)="toggleStats()" />
      }

      <!-- Reroute Alert Banner -->
      @if (showRerouteAlert()) {
        <div class="reroute-overlay animate-slide-down" role="alert" aria-live="assertive">
          <div class="reroute-card glass-strong">
            <span class="reroute-icon" aria-hidden="true">🔄</span>
            <div class="reroute-text">
              <span class="reroute-title">Route Updated!</span>
              <span class="reroute-desc">A zone on your path got busy. We found a faster route.</span>
            </div>
            <button class="reroute-dismiss" (click)="dismissReroute()">OK</button>
          </div>
        </div>
      }
    </div>

  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      overflow: hidden;
      position: relative;
    }

    /* ─── Top Bar ─── */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      padding-top: max(12px, env(safe-area-inset-top));
      position: relative;
      z-index: 40;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .app-logo-sm { font-size: 1.4rem; }

    .app-title-sm {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .hl {
      background: linear-gradient(135deg, #6366f1, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .event-badge {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stats-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .stats-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 700;
      color: #4ade80; /* Brighter green */
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 99px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .live-dot-sm {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
    }

    @media (max-width: 480px) {
      .top-bar { padding: 8px; }
      .top-bar-left { gap: 6px; }
      .top-bar-right { gap: 6px; }
      .app-logo-sm { font-size: 1.1rem; }
      .app-title-sm { font-size: 0.95rem; }
      .event-badge { font-size: 0.55rem; letter-spacing: 0; }
      .distance-badge { font-size: 0.55rem; padding: 3px 5px; }
      .stats-btn { width: 32px; height: 32px; font-size: 0.85rem; }
      .live-indicator { display: none; }
    }

    .map-toggle {
      display: flex;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.03);
    }

    .toggle-btn {
      width: 34px;
      height: 30px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      padding: 0;
    }

    .toggle-btn.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(139, 92, 246, 0.35));
      box-shadow: inset 0 0 12px rgba(99, 102, 241, 0.2);
    }

    .toggle-btn:not(.active):hover { background: rgba(255, 255, 255, 0.06); }

    .distance-badge {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      padding: 3px 8px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      white-space: nowrap;
    }

    .map-area { flex: 1; overflow: hidden; position: relative; z-index: 10; }

    .bottom-bar {
      position: relative;
      z-index: 30;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      border-top: 1px solid var(--color-border);
    }

    .reroute-overlay {
      position: fixed;
      top: 80px;
      left: 16px;
      right: 16px;
      z-index: 55;
    }

    .reroute-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .reroute-icon { font-size: 1.4rem; }

    .reroute-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .reroute-title { font-weight: 700; font-size: 0.85rem; color: var(--color-text-primary); }
    .reroute-desc { font-size: 0.75rem; color: var(--color-text-secondary); }

    .reroute-dismiss {
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid rgba(99, 102, 241, 0.5);
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      font-family: var(--font-sans);
    }
  `]
})
export class ExplorerComponent implements OnInit, OnDestroy {
  public simulator = inject(SimulatorService);
  private venueService = inject(VenueService);
  private alertService = inject(AlertService);
  private statsService = inject(StatsService);
  locationService = inject(LocationService);

  // ─── State ─────────────────────────────────────────────
  selectedZone = signal<Zone | null>(null);
  showFindNearest = signal(false);
  findNearestType = signal<string>('food');
  activeRoute = signal<NavigationRoute | null>(null);
  navigationDestinationId = signal<string>('');
  showStats = signal(false);
  showRerouteAlert = signal(false);
  highlightZoneType = signal('');
  mapView = signal<'stadium' | 'earth'>('earth');

  private rerouteCheckInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Computed ──────────────────────────────────────────
  eventPhaseLabel = computed(() => {
    const phase = this.simulator.eventPhase();
    const labels: Record<string, string> = {
      'pre-game': '⏳ Pre-Match',
      'active': '⚡ In Play',
      'halftime': '⏸️ Innings Break',
      'post-game': '🏁 Match Over'
    };
    return labels[phase] ?? phase;
  });

  activeRoutePath = computed(() => {
    const route = this.activeRoute();
    return route?.path ?? [];
  });

  ngOnInit(): void {
    // Start tracking when entering explorer
    this.locationService.startTracking();

    // Welcome alert
    setTimeout(() => {
      this.alertService.push({
        message: 'Welcome to the stadium! Tap any spot to view live details.',
        severity: 'info',
        icon: '👋',
        duration: 5000
      });
    }, 500);

    this.startRerouteMonitor();
  }

  ngOnDestroy(): void {
    this.locationService.stopTracking();
    if (this.rerouteCheckInterval) clearInterval(this.rerouteCheckInterval);
  }

  onZoneClicked(zone: Zone): void {
    this.selectedZone.set(zone);
    this.showFindNearest.set(false);
    this.statsService.track({
      type: 'zone_view',
      zoneId: zone.id,
      zoneName: zone.name,
    });
  }

  closeZoneDetail(): void { this.selectedZone.set(null); }

  onQuickAction(type: QuickActionType): void {
    this.findNearestType.set(type);
    this.showFindNearest.set(true);
    this.selectedZone.set(null);
    this.highlightZoneType.set(type);
    setTimeout(() => this.highlightZoneType.set(''), 1800);
    this.statsService.track({ type: 'quick_action', detail: type });
  }

  closeFindNearest(): void { this.showFindNearest.set(false); }

  navigateToZone(zoneId: string): void {
    const entrances = this.simulator.venue().zones.filter(z => z.type === 'entrance');
    const fromZone = entrances[0]?.id || this.simulator.venue().zones[0]?.id;
    if (!fromZone) return;

    const route = this.venueService.calculateRoute(fromZone, zoneId);
    if (route) {
      this.activeRoute.set(route);
      this.navigationDestinationId.set(zoneId);
      this.statsService.track({ type: 'navigation', zoneId });
      this.statsService.trackDistanceWalked(route.totalDistance);
      if (route.congestionScore < 0.5) this.statsService.trackBusyZoneAvoided(30);
    }
    this.selectedZone.set(null);
    this.showFindNearest.set(false);
  }

  cancelNavigation(): void {
    this.activeRoute.set(null);
    this.navigationDestinationId.set('');
  }

  toggleStats(): void { this.showStats.update(v => !v); }
  setMapView(view: 'stadium' | 'earth'): void { this.mapView.set(view); }

  onEarthZoneClicked(zoneId: string): void {
    const zone = this.venueService.getZone(zoneId);
    if (zone) this.onZoneClicked(zone);
  }

  dismissReroute(): void { this.showRerouteAlert.set(false); }

  private startRerouteMonitor(): void {
    this.rerouteCheckInterval = setInterval(() => {
      const route = this.activeRoute();
      if (!route || route.path.length < 2) return;
      const venue = this.simulator.venue();
      let needsReroute = false;
      for (const zoneId of route.path) {
        const zone = venue.zones.find(z => z.id === zoneId);
        if (zone && zone.crowdDensity > 0.8 && zone.trend === 'rising') {
          needsReroute = true;
          break;
        }
      }
      if (needsReroute) {
        const destId = this.navigationDestinationId();
        const newRoute = this.venueService.calculateRoute('gate-north', destId);
        if (newRoute && newRoute.estimatedTime < route.estimatedTime) {
          this.activeRoute.set(newRoute);
          this.showRerouteAlert.set(true);
          this.statsService.trackBusyZoneAvoided(Math.abs(route.estimatedTime - newRoute.estimatedTime));
          setTimeout(() => this.showRerouteAlert.set(false), 5000);
        }
      }
    }, 6000);
  }
}
