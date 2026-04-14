import { Component, signal, inject, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SimulatorService } from './services/simulator.service';
import { VenueService } from './services/venue.service';
import { AlertService } from './services/alert.service';
import { StatsService } from './services/stats.service';
import { Zone, NavigationRoute } from './models/venue.model';

import { SplashComponent } from './features/splash/splash.component';
import { StadiumMapComponent } from './features/map/stadium-map.component';
import { ZoneDetailComponent } from './features/zone-detail/zone-detail.component';
import { AlertBannerComponent } from './features/alerts/alert-banner.component';
import { QuickActionsComponent, QuickActionType } from './features/quick-actions/quick-actions.component';
import { FindNearestComponent } from './features/find-nearest/find-nearest.component';
import { NavigationPanelComponent } from './features/navigation/navigation-panel.component';
import { StatsComponent } from './features/stats/stats.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SplashComponent,
    StadiumMapComponent,
    ZoneDetailComponent,
    AlertBannerComponent,
    QuickActionsComponent,
    FindNearestComponent,
    NavigationPanelComponent,
    StatsComponent
  ],
  template: `
    <!-- Only show main app UI on default route -->
    @if (showMainUI()) {
      <!-- Splash Screen -->
      @if (showSplash()) {
        <app-splash (enter)="enterApp()" />
      }

      <!-- Main App -->
      @if (!showSplash()) {
        <div class="app-shell">
          <!-- Top Bar -->
          <header class="top-bar glass-strong">
            <div class="top-bar-left">
              <span class="app-logo-sm">🏟️</span>
              <div>
                <h1 class="app-title-sm">Stadium<span class="hl">Flow</span></h1>
                <span class="event-badge">{{ eventPhaseLabel() }}</span>
              </div>
            </div>
            <div class="top-bar-right">
              <button class="stats-btn" (click)="toggleStats()" title="My Stats">
                📊
              </button>
              <div class="live-indicator animate-live-pulse">
                <span class="live-dot-sm"></span>
                LIVE
              </div>
            </div>
          </header>

          <!-- Alert Banner -->
          <app-alert-banner />

          <!-- Stadium Map (takes full height) -->
          <main class="map-area">
            <app-stadium-map
              [activeRoute]="activeRoutePath()"
              [selectedZoneId]="selectedZone()?.id ?? ''"
              [highlightZoneType]="highlightZoneType()"
              (zoneClicked)="onZoneClicked($event)" />
          </main>

          <!-- Quick Actions Bar -->
          <div class="bottom-bar glass-strong">
            <app-quick-actions (actionClicked)="onQuickAction($event)" />
          </div>

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
            <div class="reroute-overlay animate-slide-down">
              <div class="reroute-card glass-strong">
                <span class="reroute-icon">🔄</span>
                <div class="reroute-text">
                  <span class="reroute-title">Route Updated!</span>
                  <span class="reroute-desc">A zone on your path got busy. We found a faster route.</span>
                </div>
                <button class="reroute-dismiss" (click)="dismissReroute()">OK</button>
              </div>
            </div>
          }
        </div>
      }
    }

    <router-outlet />
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

    .app-logo-sm {
      font-size: 1.4rem;
    }

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
      color: #22c55e;
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

    /* ─── Map Area ─── */
    .map-area {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* ─── Bottom Bar ─── */
    .bottom-bar {
      position: relative;
      z-index: 30;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      border-top: 1px solid var(--color-border);
    }

    /* ─── Reroute Alert ─── */
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

    .reroute-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--color-text-primary);
    }

    .reroute-desc {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

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
export class App implements OnInit, OnDestroy {
  private simulator = inject(SimulatorService);
  private venueService = inject(VenueService);
  private alertService = inject(AlertService);
  private statsService = inject(StatsService);
  private router = inject(Router);

  // ─── State ─────────────────────────────────────────────
  showSplash = signal(true);
  selectedZone = signal<Zone | null>(null);
  showFindNearest = signal(false);
  findNearestType = signal<string>('food');
  activeRoute = signal<NavigationRoute | null>(null);
  navigationDestinationId = signal<string>('');
  showStats = signal(false);
  showRerouteAlert = signal(false);
  showMainUI = signal(true);
  highlightZoneType = signal('');

  private rerouteCheckInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Computed ──────────────────────────────────────────
  eventPhaseLabel = computed(() => {
    const phase = this.simulator.eventPhase();
    const labels: Record<string, string> = {
      'pre-game': '⏳ Pre-Game',
      'active': '⚡ Live Match',
      'halftime': '⏸️ Halftime',
      'post-game': '🏁 Post-Game'
    };
    return labels[phase] ?? phase;
  });

  activeRoutePath = computed(() => {
    const route = this.activeRoute();
    return route?.path ?? [];
  });

  constructor() {
    // Check initial URL immediately
    if (this.router.url.startsWith('/admin')) {
      this.showMainUI.set(false);
    }

    // Track route changes to hide main UI on /admin
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.showMainUI.set(!e.urlAfterRedirects?.startsWith('/admin'));
      });
  }

  ngOnInit(): void {
    // Simulator starts when user enters app
  }

  ngOnDestroy(): void {
    this.simulator.stop();
    if (this.rerouteCheckInterval) clearInterval(this.rerouteCheckInterval);
  }

  // ─── Actions ───────────────────────────────────────────

  enterApp(): void {
    this.showSplash.set(false);
    this.simulator.start();

    // Welcome alert after a brief delay
    setTimeout(() => {
      this.alertService.push({
        message: 'Welcome! Tap zones on the map to see details',
        severity: 'info',
        icon: '👋',
        duration: 4000
      });
    }, 500);

    // Start smart reroute checking
    this.startRerouteMonitor();
  }

  onZoneClicked(zone: Zone): void {
    this.selectedZone.set(zone);
    this.showFindNearest.set(false);

    // Track zone view
    this.statsService.track({
      type: 'zone_view',
      zoneId: zone.id,
      zoneName: zone.name,
    });
  }

  closeZoneDetail(): void {
    this.selectedZone.set(null);
  }

  onQuickAction(type: QuickActionType): void {
    this.findNearestType.set(type);
    this.showFindNearest.set(true);
    this.selectedZone.set(null);

    // Pulse matching zones on map (2 pulses × 0.8s = 1.6s)
    this.highlightZoneType.set(type);
    setTimeout(() => this.highlightZoneType.set(''), 1800);

    // Track
    this.statsService.track({
      type: 'quick_action',
      detail: type,
    });
  }

  closeFindNearest(): void {
    this.showFindNearest.set(false);
  }

  navigateToZone(zoneId: string): void {
    // Use gate-north as default "user location"
    const fromZone = 'gate-north';
    const route = this.venueService.calculateRoute(fromZone, zoneId);

    if (route) {
      this.activeRoute.set(route);
      this.navigationDestinationId.set(zoneId);

      // Track navigation
      this.statsService.track({
        type: 'navigation',
        zoneId,
      });
      this.statsService.trackDistanceWalked(route.totalDistance);

      // Check if we avoided congested zones
      if (route.congestionScore < 0.5) {
        this.statsService.trackBusyZoneAvoided(30);
      }
    }

    // Close sheets
    this.selectedZone.set(null);
    this.showFindNearest.set(false);
  }

  cancelNavigation(): void {
    this.activeRoute.set(null);
    this.navigationDestinationId.set('');
  }

  toggleStats(): void {
    this.showStats.update(v => !v);
  }

  dismissReroute(): void {
    this.showRerouteAlert.set(false);
  }

  // ─── Smart Reroute Monitor ─────────────────────────────
  private startRerouteMonitor(): void {
    this.rerouteCheckInterval = setInterval(() => {
      const route = this.activeRoute();
      if (!route || route.path.length < 2) return;

      const venue = this.simulator.venue();
      let needsReroute = false;

      // Check if any zone on the current path has become very congested
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
          this.statsService.trackBusyZoneAvoided(
            Math.abs(route.estimatedTime - newRoute.estimatedTime)
          );

          // Auto dismiss after 5s
          setTimeout(() => this.showRerouteAlert.set(false), 5000);
        }
      }
    }, 6000); // Check every 6s
  }
}
