import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Zone, getDensityLevel, getDensityColor, getDensityLabel } from '../../models/venue.model';
import { SimulatorService } from '../../services/simulator.service';

@Component({
  selector: 'app-zone-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (zone(); as z) {
      <div class="sheet-backdrop" (click)="close.emit()"></div>
      <div class="bottom-sheet animate-slide-up">
        <!-- Handle bar -->
        <div class="handle-bar"></div>

        <!-- Header -->
        <div class="sheet-header">
          <div class="zone-info">
            <span class="zone-icon">{{ getZoneIcon(z.type) }}</span>
            <div>
              <h2 class="zone-name">{{ z.name }}</h2>
              <span class="zone-type">{{ z.type | titlecase }}</span>
            </div>
          </div>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <!-- Status Row -->
        <div class="status-row">
          <!-- Crowd Level -->
          <div class="status-card">
            <span class="status-label">Crowd Level</span>
            <div class="density-bar-wrapper">
              <div class="density-bar">
                <div class="density-fill"
                     [style.width.%]="z.crowdDensity * 100"
                     [style.background]="getDensityColor(z.crowdDensity)">
                </div>
              </div>
              <span class="density-label" [style.color]="getDensityColor(z.crowdDensity)">
                {{ getDensityLabel(z.crowdDensity) }}
              </span>
            </div>
          </div>

          <!-- Wait Time -->
          @if (z.waitTimeMinutes > 0) {
            <div class="status-card">
              <span class="status-label">Wait Time</span>
              <div class="wait-display">
                <span class="wait-value" [style.color]="getDensityColor(z.crowdDensity)">
                  ~{{ z.waitTimeMinutes }}
                </span>
                <span class="wait-unit">min</span>
              </div>
            </div>
          }

          <!-- Trend -->
          <div class="status-card">
            <span class="status-label">Trend</span>
            <div class="trend-display">
              <span class="trend-icon" [class]="'trend-' + z.trend">
                {{ z.trend === 'rising' ? '↑' : z.trend === 'falling' ? '↓' : '→' }}
              </span>
              <span class="trend-text">{{ z.trend | titlecase }}</span>
            </div>
          </div>
        </div>

        <!-- Predictive Wait Times -->
        @if (z.waitTimeMinutes > 0) {
          <div class="predict-section">
            <span class="section-label">⚡ Predicted Wait Times</span>
            <div class="predict-row">
              @for (p of getPredictions(z); track p.label) {
                <div class="predict-item">
                  <div class="predict-bar-wrapper">
                    <div class="predict-bar-bg">
                      <div class="predict-bar-fill"
                           [style.height.%]="(p.value / 25) * 100"
                           [style.background]="getDensityColor(p.density)"></div>
                    </div>
                    <span class="predict-value" [style.color]="getDensityColor(p.density)">
                      {{ p.value }}m
                    </span>
                  </div>
                  <span class="predict-label">{{ p.label }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Amenities -->
        @if (z.amenities.length > 0) {
          <div class="amenities-section">
            <span class="section-label">Amenities</span>
            <div class="amenity-chips">
              @for (amenity of z.amenities; track amenity.id) {
                <span class="amenity-chip">
                  {{ amenity.icon }} {{ amenity.name }}
                </span>
              }
            </div>
          </div>
        }

        <!-- Navigate Button -->
        <button class="navigate-btn" (click)="navigate.emit(z.id)">
          <span class="nav-icon">🧭</span>
          Navigate Here
          <span class="nav-arrow">→</span>
        </button>
      </div>
    }
  `,
  styles: [`
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 49;
      animation: fade-in 0.2s ease-out;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .bottom-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-bg-card);
      border-radius: 24px 24px 0 0;
      padding: 12px 20px max(20px, env(safe-area-inset-bottom));
      z-index: 50;
      max-height: 65vh;
      overflow-y: auto;
      border-top: 1px solid var(--color-border);
    }

    .handle-bar {
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      margin: 0 auto 16px;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .zone-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .zone-icon {
      font-size: 1.8rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 14px;
    }

    .zone-name {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }

    .zone-type {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-text-secondary);
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .status-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .status-card {
      flex: 1;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 14px;
      padding: 12px;
      border: 1px solid var(--color-border);
    }

    .status-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 8px;
    }

    .density-bar-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .density-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      overflow: hidden;
    }

    .density-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease, background 0.6s ease;
    }

    .density-label {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .wait-display {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .wait-value {
      font-size: 1.5rem;
      font-weight: 800;
      font-family: var(--font-display);
    }

    .wait-unit {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .trend-display {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .trend-icon {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .trend-rising { color: #ef4444; }
    .trend-falling { color: #22c55e; }
    .trend-stable { color: var(--color-text-secondary); }

    .trend-text {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .section-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 10px;
    }

    .amenities-section {
      margin-bottom: 20px;
    }

    /* ─── Predictive Wait Times ─── */
    .predict-section {
      margin-bottom: 20px;
    }

    .predict-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .predict-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .predict-bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
    }

    .predict-bar-bg {
      width: 100%;
      height: 48px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .predict-bar-fill {
      width: 100%;
      border-radius: 8px 8px 0 0;
      transition: height 0.4s ease, background 0.4s ease;
      min-height: 4px;
    }

    .predict-value {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 700;
    }

    .predict-label {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .amenity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .amenity-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 99px;
      font-size: 0.8rem;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }

    .navigate-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-family: var(--font-sans);
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.3s;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    .navigate-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
    }

    .navigate-btn:active {
      transform: translateY(0);
    }

    .nav-icon { font-size: 1.2rem; }
    .nav-arrow {
      margin-left: auto;
      font-size: 1.1rem;
    }
  `]
})
export class ZoneDetailComponent {
  private simulator = inject(SimulatorService);

  zone = input<Zone | null>(null);
  close = output<void>();
  navigate = output<string>();

  getDensityColor = getDensityColor;
  getDensityLabel = getDensityLabel;

  getZoneIcon(type: string): string {
    const icons: Record<string, string> = {
      'entrance': '🚪', 'concession': '🍔', 'restroom': '🚻',
      'seating': '💺', 'merchandise': '👕', 'vip': '⭐',
      'exit': '🚪', 'medical': '🏥', 'corridor': '🚶'
    };
    return icons[type] ?? '📍';
  }

  /** Generate predicted wait times for +Now, +10min, +20min, +30min */
  getPredictions(zone: Zone): { label: string; value: number; density: number }[] {
    const trendMultiplier = zone.trend === 'rising' ? 0.08 : zone.trend === 'falling' ? -0.06 : 0.01;
    const phase = this.simulator.eventPhase();

    // Phase-aware adjustment
    const phaseBoost = phase === 'halftime' ? 0.04 : phase === 'post-game' ? 0.02 : 0;

    const predictions = [0, 10, 20, 30].map((min, i) => {
      const futureDensity = Math.max(0.05, Math.min(0.98,
        zone.crowdDensity + (trendMultiplier + phaseBoost) * (i)
      ));
      const futureWait = Math.round(Math.max(0, Math.min(25,
        zone.waitTimeMinutes + (trendMultiplier * 20 * i) + (phaseBoost * 10 * i)
      )));

      return {
        label: min === 0 ? 'Now' : `+${min}m`,
        value: futureWait,
        density: futureDensity
      };
    });

    return predictions;
  }
}
