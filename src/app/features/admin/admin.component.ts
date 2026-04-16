import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulatorService } from '../../services/simulator.service';
import { AlertService } from '../../services/alert.service';
import { 
  Zone, 
  EventPhase, 
  getDensityLevel, 
  getDensityColor, 
  getDensityLabel 
} from '../../models/venue.model';
import { AuthService } from '../../services/auth.service';
import { StadiumMapComponent } from '../map/stadium-map.component';
import { EarthMapComponent } from '../google-map/earth-map.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, StadiumMapComponent, EarthMapComponent],
  template: `
    <div class="admin-shell">
      <!-- Header -->
      <header class="admin-header glass-strong">
        <div class="header-left">
          <span class="admin-badge">🔒 ADMIN</span>
          <h1 class="admin-title">StadiumFlow <span class="hl">Control</span></h1>
        </div>
        <div class="header-right">
          <div class="connected-badge">
            <span class="connected-dot"></span>
            {{ connectedClients() }} clients
          </div>
          <button class="header-btn" (click)="goBack()">← Back</button>
          <button class="header-btn danger" (click)="resetVenue()">Reset System</button>
          <button class="header-btn" (click)="logout()">Sign Out</button>
        </div>
      </header>

      <div class="admin-body">
        @if (!venue().isInitialized) {
          <!-- STEP 1: INITIAL SEARCH & SETUP -->
          <section class="admin-card setup-card animate-fade-in">
            <div class="setup-header">
              <h2 class="card-title">🚀 Initialize New Stadium</h2>
              <p class="card-desc">Search for your venue or jump to coordinates to start building.</p>
            </div>
            
            <div class="setup-map-container">
              <app-earth-map 
                [isAdminMode]="true"
                (locationSelected)="onBaseLocationSelected($event)" />
              
              @if (pendingLocation()) {
                <div class="setup-modal glass-strong animate-slide-up">
                  <h3 class="modal-title">Venue Details</h3>
                  <div class="modal-body">
                    <div class="input-group">
                      <label>Stadium Name</label>
                      <input type="text" #nameInput placeholder="e.g. Wembley Stadium" 
                             (input)="venueNameForInit.set(nameInput.value)" />
                    </div>
                    <div class="coords-display">
                      📍 {{ pendingLocation()?.lat?.toFixed(5) }}, {{ pendingLocation()?.lng?.toFixed(5) }}
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button class="cancel-btn" (click)="pendingLocation.set(null)">Cancel</button>
                    <button class="init-btn" [disabled]="!venueNameForInit()" (click)="confirmInitialize()">
                      Initialize Stadium
                    </button>
                  </div>
                </div>
              }
            </div>
          </section>
        } @else {
          <!-- STEP 2: FULL DASHBOARD -->
          
          <!-- Map Viewer -->
          <section class="admin-card full-width map-viewer-card">
            <div class="card-header-flex">
              <div class="header-main">
                <h2 class="card-title">🗺️ {{ venue().name }} — Live View</h2>
                <div class="view-toggle-pills">
                  <button class="view-pill" [class.active]="!showSatellite()" (click)="showSatellite.set(false)">Schematic</button>
                  <button class="view-pill" [class.active]="showSatellite()" (click)="showSatellite.set(true)">Satellite</button>
                </div>
              </div>
              <div class="card-actions">
                @if (designMode()) {
                  <button class="add-spot-btn" [class.active]="isPlacingSpot()" (click)="togglePlacementMode()">
                    <span class="btn-icon">{{ isPlacingSpot() ? '📍' : '➕' }}</span> 
                    {{ isPlacingSpot() ? 'Cancel' : 'Add Spot' }}
                  </button>
                  <div class="save-publish-group animate-slide-left">
                    <button class="btn-save" (click)="saveDraft()">💾 Save</button>
                    <button class="btn-publish" (click)="publishToLive()">🟢 Publish Live</button>
                  </div>
                }
                <div class="design-mode-control">
                  <span class="design-label" [class.active]="designMode()">Design Mode</span>
                  <button class="toggle-switch" [class.active]="designMode()" (click)="toggleDesignMode()">
                    <div class="switch-handle"></div>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="admin-map-container" [class.design-active]="designMode()">
              @if (showSatellite()) {
                <app-earth-map 
                  [isAdminMode]="designMode() || isPlacingSpot()"
                  (locationSelected)="onBaseLocationSelected($event)"
                  (gateClicked)="onZoneClickedById($event)" />
              } @else {
                <app-stadium-map 
                  [isAdminMode]="designMode()"
                  (zoneClicked)="onZoneClicked($event)"
                  (zonePositionChanged)="onZoneMoved($event)"
                  (backgroundClick)="onSchematicClick($event)" />
              }
            
              @if (designMode() && selectedZoneForEdit()) {
                <div class="property-sidebar animate-slide-left">
                  <div class="sidebar-header">
                    <span class="sidebar-title">Edit Zone</span>
                    <button class="close-sidebar" (click)="selectedZoneForEdit.set(null)">✕</button>
                  </div>
                  <div class="sidebar-scroll">
                    <div class="edit-group">
                      <label class="edit-label">Name</label>
                      <input type="text" class="edit-input" [value]="selectedZoneForEdit()?.name" (input)="updateZoneName($any($event.target).value)" />
                    </div>
                    <div class="edit-group">
                      <label class="edit-label">Size ({{ selectedZoneForEdit()?.radius }})</label>
                      <input type="range" class="edit-slider" min="10" max="60" [value]="selectedZoneForEdit()?.radius ?? 15" (input)="updateZoneRadius($any($event.target).value)" />
                    </div>
                    <div class="edit-group">
                      <label class="edit-label">Icon</label>
                      <div class="icon-grid-sm">
                        @for (icon of zoneIcons; track icon) {
                          <button class="icon-btn-sm" [class.active]="selectedZoneForEdit()?.customIcon === icon" (click)="updateZoneIcon(icon)">{{ icon }}</button>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="sidebar-footer">
                    <button class="delete-btn-full" (click)="deleteZone(selectedZoneForEdit()!.id)">🗑️ Delete Spot</button>
                  </div>
                </div>
              }

              @if (isPlacingSpot()) {
                <div class="design-overlay animate-fade-in" style="z-index: 2000;">
                  <div class="design-badge" style="background: #22c55e;">📍 PLACEMENT MODE</div>
                  <div class="design-hint">Click on the {{ showSatellite() ? 'map' : 'schematic' }} to place your spot</div>
                </div>
              }
            </div>
          </section>

          <div class="admin-grid-2">
            <!-- Event Phase -->
            <section class="admin-card">
              <h2 class="card-title">🎬 Event Phase</h2>
              <div class="phase-buttons">
                @for (p of phases; track p.value) {
                  <button class="phase-btn" [class.active]="currentPhase() === p.value" (click)="setPhase(p.value)">
                    <span>{{ p.icon }}</span> <span>{{ p.label }}</span>
                  </button>
                }
              </div>
            </section>

            <!-- Stats -->
            <section class="admin-card">
              <h2 class="card-title">📊 Venue Overview</h2>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ venue().currentAttendance | number }}</span>
                  <span class="stat-label">Attendance</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value" [style.color]="avgDensityColor()">{{ (avgDensity() * 100).toFixed(0) }}%</span>
                  <span class="stat-label">Avg Density</span>
                </div>
              </div>
            </section>
          </div>

          <!-- Triggers & Notifications -->
          <div class="admin-grid-2">
             <section class="admin-card">
              <h2 class="card-title">⚡ Triggers</h2>
              <div class="trigger-buttons">
                @for (trig of triggers; track trig.event) {
                  <button class="trigger-btn" [class]="'trigger-' + trig.color" (click)="fireEvent(trig.event)">
                    <span>{{ trig.icon }}</span> <span>{{ trig.label }}</span>
                  </button>
                }
              </div>
            </section>

            <section class="admin-card">
              <h2 class="card-title">✉️ Broadcast Notification</h2>
              <div class="notification-form">
                <input type="text" class="custom-input" placeholder="Type message..." 
                       [value]="customMessage()" (input)="customMessage.set($any($event.target).value)" (keyup.enter)="sendCustomNotification()" />
                <button class="send-btn" [disabled]="!customMessage()" (click)="sendCustomNotification()">🚀 Send</button>
              </div>
            </section>
          </div>

          <!-- Density Sliders -->
          <section class="admin-card full-width">
            <h2 class="card-title">🎚️ Zone Density Control</h2>
            <div class="zone-grid">
              @for (z of zones(); track z.id) {
                <div class="zone-slider-card">
                  <div class="zone-slider-header">
                    <span>{{ getZoneIcon(z.type) }}</span>
                    <span>{{ z.name }}</span>
                    <span [style.color]="getDensityColor(z.crowdDensity)">{{ (z.crowdDensity * 100).toFixed(0) }}%</span>
                  </div>
                  <input type="range" min="0" max="100" [value]="z.crowdDensity * 100" (input)="onDensityChange(z.id, $event)" />
                </div>
              }
            </div>
          </section>
        }
      </div>

       <!-- Add Zone Modal -->
       @if (showAddZoneModal()) {
        <div class="modal-overlay animate-fade-in">
          <div class="admin-card add-zone-modal animate-slide-up">
            <h2 class="modal-title">Enter Spot Details</h2>
            <div class="modal-body">
              <div class="input-group">
                <label>Name</label>
                <input type="text" #zName placeholder="e.g. North Burger" />
              </div>
              <div class="input-group">
                <label>Category</label>
                <select #zType class="styled-select">
                  <option value="concession">🍔 Concession</option>
                  <option value="restroom">🚻 Restroom</option>
                  <option value="merchandise">👕 Merchandise</option>
                  <option value="entrance">🚪 Entrance</option>
                  <option value="vip">⭐ VIP</option>
                  <option value="medical">🏥 Medical</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" (click)="showAddZoneModal.set(false)">Cancel</button>
              <button class="init-btn" (click)="addNewZone(zName.value, zType.value)">Create Spot</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-shell { min-height: 100vh; background: var(--color-bg-primary); color: white; }
    .glass-strong { background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); }
    .admin-header { display: flex; justify-content: space-between; padding: 16px 24px; position: sticky; top: 0; z-index: 1000; }
    .header-right { display: flex; gap: 12px; align-items: center; }
    .header-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 6px 14px; border-radius: 99px; cursor: pointer; font-size: 0.8rem; }
    .header-btn.danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
    .admin-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; max-width: 1400px; margin: 0 auto; }
    .admin-card { background: rgba(30, 30, 30, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 24px; }
    .full-width { width: 100%; }
    .map-viewer-card { padding: 0; overflow: hidden; }
    .card-header-flex { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .card-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .save-publish-group { display: flex; gap: 8px; margin-right: 16px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 16px; }
    .btn-save { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 6px 16px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
    .btn-publish { background: #16a34a; border: none; color: white; padding: 6px 16px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700; box-shadow: 0 0 10px rgba(22,163,74,0.3); }
    .setup-map-container { height: 500px; position: relative; border-radius: 12px; overflow: hidden; margin-top: 16px; border: 1px solid rgba(255,255,255,0.1); }
    .admin-map-container { height: 500px; position: relative; background: #000; border-bottom: 2px solid transparent; transition: border-color 0.3s; }
    .admin-map-container.design-active { border-color: #6366f1; }
    .view-toggle-pills { display: flex; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 99px; }
    .view-pill { background: none; border: none; color: #777; padding: 4px 12px; border-radius: 99px; cursor: pointer; font-size: 0.75rem; }
    .view-pill.active { background: #6366f1; color: white; }
    .add-spot-btn { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 8px 16px; border-radius: 99px; cursor: pointer; font-size: 0.8rem; font-weight: 700; }
    .add-spot-btn.active { background: #ef4444; color: white; border-color: #ef4444; }
    .admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .phase-buttons { display: flex; gap: 10px; }
    .phase-btn { flex: 1; display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; cursor: pointer; color: #888; }
    .phase-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
    .stats-grid { display: flex; gap: 40px; margin-top: 10px; }
    .stat-item { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #777; }
    .trigger-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .trigger-btn { padding: 10px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: 0.75rem; color: white; }
    .trigger-green { background: #166534; } .trigger-blue { background: #1e40af; } .trigger-amber { background: #92400e; } .trigger-red { background: #991b1b; }
    .notification-form { display: flex; gap: 10px; }
    .custom-input { flex: 1; background: #222; border: 1px solid #444; padding: 10px; border-radius: 10px; color: white; }
    .send-btn { background: #6366f1; border: none; padding: 0 20px; border-radius: 10px; color: white; cursor: pointer; font-weight: 700; }
    .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .zone-slider-card { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; }
    .zone-slider-header { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; }
    .property-sidebar { position: absolute; right: 0; top: 0; bottom: 0; width: 260px; background: rgba(20,20,20,0.95); border-left: 1px solid #333; z-index: 1001; padding: 20px; }
    .edit-group { margin-bottom: 20px; }
    .edit-label { display: block; font-size: 0.7rem; color: #777; margin-bottom: 6px; }
    .edit-input { width: 100%; background: #222; border: 1px solid #444; padding: 8px; border-radius: 8px; color: white; }
    .icon-grid-sm { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
    .icon-btn-sm { padding: 6px; background: none; border: 1px solid transparent; cursor: pointer; }
    .icon-btn-sm.active { border-color: #6366f1; border-radius: 4px; }
    .design-overlay { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); text-align: center; }
    .design-badge { padding: 4px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 800; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .setup-modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2000; padding: 24px; border-radius: 16px; width: 340px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .modal-title { margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 700; }
    .input-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 0.75rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-group input, .input-group select { background: #222; border: 1px solid #444; padding: 10px; border-radius: 8px; color: white; width: 100%; box-sizing: border-box; }
    .coords-display { font-size: 0.8rem; color: #818cf8; margin-bottom: 16px; background: rgba(99,102,241,0.1); padding: 8px; border-radius: 8px; text-align: center; border: 1px solid rgba(99,102,241,0.2); }
    .modal-footer { display: flex; gap: 10px; margin-top: 24px; }
    .cancel-btn { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; color: white; cursor: pointer; font-weight: 600; }
    .add-zone-modal { width: 340px; }
    .init-btn { flex: 2; background: #6366f1; padding: 12px; border: none; border-radius: 10px; color: white; font-weight: 700; cursor: pointer; }
    .delete-btn-full { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; width: 100%; padding: 10px; border-radius: 8px; cursor: pointer; margin-top: 20px; }
    .design-mode-control { display: flex; align-items: center; gap: 10px; }
    .toggle-switch { width: 40px; height: 20px; background: #444; border-radius: 20px; position: relative; border: none; cursor: pointer; }
    .toggle-switch.active { background: #6366f1; }
    .switch-handle { width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.2s; }
    .toggle-switch.active .switch-handle { left: 22px; }
  `]
})
export class AdminComponent implements OnInit, OnDestroy {
  private simulator = inject(SimulatorService);
  private auth = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  // Core signals
  venue = computed(() => this.simulator.venue());
  zones = computed(() => this.simulator.venue().zones);
  currentPhase = computed(() => this.simulator.eventPhase());
  connectedClients = signal(0);
  
  // UI States
  showSatellite = signal(false);
  designMode = signal(false);
  isPlacingSpot = signal(false);
  showAddZoneModal = signal(false);
  selectedZoneForEdit = signal<Zone | null>(null);
  
  // Forms/Pending
  pendingLocation = signal<{ lat: number; lng: number } | null>(null);
  pendingPlacement = signal<{ x?: number, y?: number, lat?: number, lng?: number } | null>(null);
  venueNameForInit = signal('');
  customMessage = signal('');
  selectedSeverity = signal<'info' | 'success' | 'warning' | 'critical'>('info');
  selectedIcon = signal('🔔');
  
  private clientInterval: any;

  zoneIcons = ['🍔', '🚻', '👕', '⭐', '🏥', '🚶', '🚪', '🎟️', '🍟', '🍻', '🥤'];
  phases = [
    { value: 'pre-game', label: 'Pre-Match', icon: '🎟️' },
    { value: 'active', label: 'In Play', icon: '🏏' },
    { value: 'halftime', label: 'Innings Break', icon: '🥪' },
    { value: 'post-game', label: 'Match Over', icon: '🏁' }
  ];
  triggers = [
    { event: 'goal', label: 'Wicket!', icon: '☝️', color: 'red' },
    { event: 'halftime', label: 'Innings Break', icon: '🥤', color: 'blue' },
    { event: 'end-halftime', label: 'Resume Play', icon: '🏏', color: 'green' },
    { event: 'rain', label: 'Rain Delay', icon: '🌧️', color: 'amber' },
    { event: 'post-game', label: 'Final Over', icon: '🏁', color: 'red' }
  ];

  avgDensity = computed(() => {
    const z = this.zones();
    return z.length ? z.reduce((sum, zone) => sum + zone.crowdDensity, 0) / z.length : 0;
  });
  avgDensityColor = computed(() => getDensityColor(this.avgDensity()));

  // Expose to template
  getDensityColor = getDensityColor;
  getDensityLevel = getDensityLevel;
  getDensityLabel = getDensityLabel;

  ngOnInit() {
    this.connectedClients.set(Math.floor(Math.random() * 200) + 800);
    this.clientInterval = setInterval(() => {
      this.connectedClients.update(v => v + Math.floor(Math.random() * 20) - 10);
    }, 5000);
  }

  ngOnDestroy() {
    if (this.clientInterval) clearInterval(this.clientInterval);
  }

  // ─── Header Actions ────────────────────────────────────────
  goBack() { this.router.navigate(['/']); }
  logout() { this.auth.logout(); this.router.navigate(['/']); }
  resetVenue() {
    if (window.confirm('⚠️ Reset entire stadium? This wipes all spots and data.')) {
      this.simulator.resetToInitialState();
      this.alertService.push({ 
        message: '♻️ System Reset Successfully', 
        severity: 'warning', 
        icon: '🧹',
        duration: 5000 
      });
    }
  }

  // ─── Search & Deployment ──────────────────────────────────
  onBaseLocationSelected(coords: { lat: number; lng: number }) {
    if (!this.venue().isInitialized) {
      this.pendingLocation.set(coords);
    } else if (this.isPlacingSpot()) {
      this.pendingPlacement.set(coords);
      this.isPlacingSpot.set(false);
      this.showAddZoneModal.set(true);
    } else if (this.designMode()) {
       this.simulator.updateZoneProperties(this.selectedZoneForEdit()?.id || '', { geoPos: coords });
    }
  }

  confirmInitialize() {
    if (this.pendingLocation()) {
      this.simulator.initializeVenue(this.venueNameForInit(), this.pendingLocation()!.lat, this.pendingLocation()!.lng);
      this.pendingLocation.set(null);
    }
  }

  // ─── Placement & Spots ─────────────────────────────────────
  togglePlacementMode() {
    this.isPlacingSpot.update(v => !v);
    if (this.isPlacingSpot()) this.designMode.set(false);
  }

  onSchematicClick(coords: { x: number, y: number }) {
    if (this.isPlacingSpot()) {
      this.pendingPlacement.set(coords);
      this.isPlacingSpot.set(false);
      this.showAddZoneModal.set(true);
    }
  }

  addNewZone(name: string, type: string) {
    if (!name.trim()) return;
    this.simulator.addZone(type as any, name, this.pendingPlacement() || undefined);
    this.showAddZoneModal.set(false);
    this.pendingPlacement.set(null);
  }

  deleteZone(id: string) {
    if (confirm('Delete this spot?')) {
      this.simulator.deleteZone(id);
      this.selectedZoneForEdit.set(null);
    }
  }

  // ─── Live Controls ─────────────────────────────────────────
  setPhase(phase: string) { this.simulator.setPhase(phase as any); }
  fireEvent(event: any) { this.simulator.triggerEvent(event); }
  onDensityChange(id: string, event: Event) {
    this.simulator.setZoneDensity(id, (event.target as HTMLInputElement).valueAsNumber / 100);
  }

  // ─── Design Mode ───────────────────────────────────────────
  toggleDesignMode() { 
    this.designMode.update(v => !v); 
    this.simulator.setDesignMode(this.designMode());
    if (!this.designMode()) {
      this.selectedZoneForEdit.set(null); 
      this.isPlacingSpot.set(false);
    }
  }

  async saveDraft() {
    await this.simulator.saveDraft();
    this.alertService.push({ message: 'Local Draft Saved Successfully', severity: 'info', icon: '💾', duration: 3000 } as any);
  }

  async publishToLive() {
    if (confirm('Deploy stadium changes to all clients? This will make your current draft the live version.')) {
      await this.simulator.publishToLive();
      this.alertService.push({ message: 'Stadium Published to Live', severity: 'success', icon: '🚀', duration: 5000 } as any);
    }
  }

  onZoneClicked(zone: Zone) { if (this.designMode()) this.selectedZoneForEdit.set(zone); }
  onZoneClickedById(id: string) { 
    const zone = this.zones().find(z => z.id === id);
    if (zone && this.designMode()) this.selectedZoneForEdit.set(zone);
  }
  onZoneMoved(event: any) { this.simulator.updateZonePosition(event.zoneId, event.x, event.y); }

  // ─── Editing ───────────────────────────────────────────────
  updateZoneName(name: string) {
    if (this.selectedZoneForEdit()) this.simulator.updateZoneProperties(this.selectedZoneForEdit()!.id, { name });
  }
  updateZoneRadius(val: string) {
    if (this.selectedZoneForEdit()) this.simulator.updateZoneProperties(this.selectedZoneForEdit()!.id, { radius: parseInt(val, 10) });
  }
  updateZoneIcon(icon: string) {
    if (this.selectedZoneForEdit()) this.simulator.updateZoneProperties(this.selectedZoneForEdit()!.id, { customIcon: icon });
  }

  sendCustomNotification() {
    if (this.customMessage().trim()) {
      this.alertService.push({ 
        message: this.customMessage(), 
        severity: 'info', 
        icon: '📢',
        duration: 5000
      });
      this.customMessage.set('');
    }
  }

  getZoneIcon(type: string): string {
    const icons: Record<string, string> = { 'concession': '🍔', 'restroom': '🚻', 'entrance': '🚪', 'seating': '💺' };
    return icons[type] ?? '📍';
  }
}
