import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VenueService } from '../../services/venue.service';
import { SimulatorService } from '../../services/simulator.service';
import { getDensityColor, getDensityLevel } from '../../models/venue.model';

@Component({
  selector: 'app-navigation-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (route(); as r) {
      <div class="nav-panel animate-slide-up">
        <div class="nav-header">
          <div class="nav-info">
            <span class="nav-badge">🧭 Navigating</span>
            <h3 class="nav-destination">{{ destinationName() }}</h3>
          </div>
          <button class="cancel-btn" (click)="cancel.emit()">Cancel</button>
        </div>

        <div class="nav-stats">
          <div class="stat">
            <span class="stat-value">{{ formatTime(r.estimatedTime) }}</span>
            <span class="stat-label">Est. Time</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">{{ r.totalDistance }}m</span>
            <span class="stat-label">Distance</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value congestion"
                  [style.color]="getDensityColor(r.congestionScore)">
              {{ getCongestionLabel(r.congestionScore) }}
            </span>
            <span class="stat-label">Route Traffic</span>
          </div>
        </div>

        <div class="nav-steps no-scrollbar">
          @for (step of r.steps; track step.fromZone + step.toZone; let i = $index; let last = $last) {
            <div class="step" [class.active]="i === 0">
              <div class="step-indicator">
                <div class="step-dot" [style.background]="getDensityColor(step.density)"></div>
                @if (!last) {
                  <div class="step-line"></div>
                }
              </div>
              <div class="step-content">
                <span class="step-direction">{{ step.direction }}</span>
                <span class="step-detail">{{ step.distance }}m • {{ getZoneName(step.toZone) }}</span>
              </div>
              <div class="step-density-badge"
                   [style.background]="getDensityColor(step.density) + '20'"
                   [style.color]="getDensityColor(step.density)">
                {{ getDensityLevel(step.density) }}
              </div>
            </div>
          }
          <!-- Destination -->
          <div class="step destination">
            <div class="step-indicator">
              <div class="step-dot destination-dot">📍</div>
            </div>
            <div class="step-content">
              <span class="step-direction">Arrive at {{ destinationName() }}</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .nav-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-bg-card);
      border-radius: 24px 24px 0 0;
      padding: 20px 20px max(20px, env(safe-area-inset-bottom));
      z-index: 45;
      max-height: 45vh;
      border-top: 1px solid var(--color-border);
    }

    .nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .nav-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
      padding: 3px 10px;
      border-radius: 99px;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .nav-destination {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 6px 0 0;
    }

    .cancel-btn {
      padding: 8px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .nav-stats {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      margin-bottom: 16px;
    }

    .stat {
      flex: 1;
      text-align: center;
    }

    .stat-value {
      display: block;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-divider {
      width: 1px;
      height: 30px;
      background: var(--color-border);
    }

    .nav-steps {
      max-height: 150px;
      overflow-y: auto;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
    }

    .step.active .step-direction {
      color: var(--color-text-primary);
      font-weight: 600;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2px;
    }

    .step-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .step-line {
      width: 2px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      margin-top: 4px;
    }

    .destination-dot {
      width: auto;
      height: auto;
      font-size: 1rem;
      background: none;
    }

    .step-content {
      flex: 1;
    }

    .step-direction {
      display: block;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .step-detail {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      margin-top: 2px;
      display: block;
    }

    .step-density-badge {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 8px;
      text-transform: capitalize;
      flex-shrink: 0;
    }
  `]
})
export class NavigationPanelComponent {
  route = input<any>(null);
  destinationId = input<string>('');
  cancel = output<void>();

  private simulator = inject(SimulatorService);

  getDensityColor = getDensityColor;
  getDensityLevel = getDensityLevel;

  destinationName = computed(() => {
    const zone = this.simulator.venue().zones.find(
      (z: any) => z.id === this.destinationId()
    );
    return zone?.name ?? 'Destination';
  });

  getZoneName(zoneId: string): string {
    const zone = this.simulator.venue().zones.find((z: any) => z.id === zoneId);
    return zone?.name ?? zoneId;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  }

  getCongestionLabel(score: number): string {
    if (score < 0.3) return 'Clear';
    if (score < 0.6) return 'Moderate';
    return 'Congested';
  }
}
