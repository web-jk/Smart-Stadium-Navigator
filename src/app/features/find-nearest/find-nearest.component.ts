import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VenueService } from '../../services/venue.service';
import { ZoneType, getDensityColor, getDensityLevel } from '../../models/venue.model';

@Component({
  selector: 'app-find-nearest',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sheet-backdrop" (click)="close.emit()"></div>
    <div class="find-sheet animate-slide-up">
      <div class="handle-bar"></div>

      <div class="sheet-header">
        <h2 class="sheet-title">
          {{ getTypeIcon(searchType()) }} Find Nearest {{ getTypeLabel(searchType()) }}
        </h2>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      <div class="results-list">
        @for (rec of recommendations(); track rec.zone.id; let i = $index) {
          <div class="result-card animate-fade-in"
               [style.animation-delay]="(i * 80) + 'ms'"
               (click)="navigateTo.emit(rec.zone.id)">

            <div class="result-rank" [class.best]="i === 0">
              {{ i === 0 ? '⚡' : '#' + (i + 1) }}
            </div>

            <div class="result-info">
              <div class="result-name">{{ rec.zone.name }}</div>
              <div class="result-reason">{{ rec.reason }}</div>
              <div class="result-meta">
                @if (rec.zone.amenities.length > 0) {
                  <span class="amenity-preview">
                    @for (a of rec.zone.amenities.slice(0, 3); track a.id) {
                      <span>{{ a.icon }}</span>
                    }
                  </span>
                }
              </div>
            </div>

            <div class="result-stats">
              @if (rec.zone.waitTimeMinutes > 0) {
                <div class="stat-wait" [style.color]="getDensityColor(rec.zone.crowdDensity)">
                  ~{{ rec.zone.waitTimeMinutes }}m
                </div>
              }
              <div class="stat-walk">
                🚶 {{ Math.ceil(rec.estimatedWalkTime / 60) }}min walk
              </div>
            </div>

            <div class="result-arrow">→</div>
          </div>
        }

        @if (recommendations().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <p>No results found nearby</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 49;
    }

    .find-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-bg-card);
      border-radius: 24px 24px 0 0;
      padding: 12px 20px max(20px, env(safe-area-inset-bottom));
      z-index: 50;
      max-height: 70vh;
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

    .sheet-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
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

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .result-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      opacity: 0;
      animation: fade-in 0.3s ease-out forwards;
    }

    @keyframes fade-in {
      to { opacity: 1; }
    }

    .result-card:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(4px);
    }

    .result-card:active {
      transform: scale(0.98);
    }

    .result-rank {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }

    .result-rank.best {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      font-size: 1.1rem;
    }

    .result-info {
      flex: 1;
      min-width: 0;
    }

    .result-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--color-text-primary);
    }

    .result-reason {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }

    .result-meta {
      margin-top: 4px;
    }

    .amenity-preview {
      display: inline-flex;
      gap: 2px;
      font-size: 0.8rem;
    }

    .result-stats {
      text-align: right;
      flex-shrink: 0;
    }

    .stat-wait {
      font-size: 1rem;
      font-weight: 800;
      font-family: var(--font-display);
    }

    .stat-walk {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .result-arrow {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--color-text-muted);
    }

    .empty-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 10px;
    }
  `]
})
export class FindNearestComponent {
  searchType = input<string>('food');
  close = output<void>();
  navigateTo = output<string>();

  Math = Math;

  private venueService = inject(VenueService);

  getDensityColor = getDensityColor;

  recommendations = computed(() => {
    const type = this.searchType();
    const zoneType = this.mapToZoneType(type);
    return this.venueService.findNearest(zoneType as any);
  });

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'food': '🍔', 'restroom': '🚻', 'exit': '🚪', 'merch': '👕'
    };
    return icons[type] ?? '📍';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'food': 'Food', 'restroom': 'Restroom', 'exit': 'Exit', 'merch': 'Shop'
    };
    return labels[type] ?? type;
  }

  private mapToZoneType(type: string): string {
    const map: Record<string, string> = {
      'food': 'food', 'restroom': 'restroom', 'exit': 'entrance', 'merch': 'merchandise'
    };
    return map[type] ?? type;
  }
}
