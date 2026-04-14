import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-backdrop" (click)="close.emit()"></div>
    <div class="stats-sheet animate-slide-up">
      <div class="handle-bar"></div>

      <!-- Header -->
      <div class="stats-header">
        <div>
          <h2 class="stats-title">Your Game Day Stats</h2>
          <span class="stats-subtitle">Session: {{ stats().sessionDurationMin }} min</span>
        </div>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      <!-- Main Stats Grid -->
      <div class="stats-card-grid">
        <div class="stat-hero-card gradient-green">
          <span class="stat-hero-icon">⏱️</span>
          <span class="stat-hero-value">{{ stats().estimatedTimeSavedMin }}</span>
          <span class="stat-hero-label">Minutes Saved</span>
        </div>
        <div class="stat-hero-card gradient-blue">
          <span class="stat-hero-icon">🚶</span>
          <span class="stat-hero-value">{{ formattedDistance() }}</span>
          <span class="stat-hero-label">Distance Walked</span>
        </div>
        <div class="stat-hero-card gradient-amber">
          <span class="stat-hero-icon">🚫</span>
          <span class="stat-hero-value">{{ stats().busyZonesAvoided }}</span>
          <span class="stat-hero-label">Busy Zones Avoided</span>
        </div>
        <div class="stat-hero-card gradient-violet">
          <span class="stat-hero-icon">📍</span>
          <span class="stat-hero-value">{{ stats().uniqueZones.length }}</span>
          <span class="stat-hero-label">Zones Explored</span>
        </div>
      </div>

      <!-- Activity Breakdown -->
      <div class="activity-section">
        <span class="section-label">Activity Breakdown</span>
        <div class="activity-bars">
          <div class="activity-bar-item">
            <span class="bar-label">🧭 Navigations</span>
            <div class="bar-track">
              <div class="bar-fill gradient-blue" [style.width.%]="getBarPercent(stats().navigationsUsed, 10)"></div>
            </div>
            <span class="bar-value">{{ stats().navigationsUsed }}</span>
          </div>
          <div class="activity-bar-item">
            <span class="bar-label">⚡ Quick Actions</span>
            <div class="bar-track">
              <div class="bar-fill gradient-amber" [style.width.%]="getBarPercent(stats().quickActionsUsed, 10)"></div>
            </div>
            <span class="bar-value">{{ stats().quickActionsUsed }}</span>
          </div>
          <div class="activity-bar-item">
            <span class="bar-label">👁️ Zone Views</span>
            <div class="bar-track">
              <div class="bar-fill gradient-green" [style.width.%]="getBarPercent(stats().zonesVisited, 20)"></div>
            </div>
            <span class="bar-value">{{ stats().zonesVisited }}</span>
          </div>
        </div>
      </div>

      <!-- Share Badge -->
      <div class="share-badge glass">
        <div class="badge-content">
          <span class="badge-emoji">🏟️</span>
          <div class="badge-text">
            <span class="badge-title">Smart Fan Badge Earned!</span>
            <span class="badge-desc">
              You navigated like a pro — {{ stats().estimatedTimeSavedMin }} min saved, {{ stats().busyZonesAvoided }} crowds beaten.
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 59;
      animation: fade-in 0.2s ease-out;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .stats-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--color-bg-card);
      border-radius: 24px 24px 0 0;
      padding: 12px 20px max(20px, env(safe-area-inset-bottom));
      z-index: 60;
      max-height: 85vh;
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

    .stats-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .stats-title {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }

    .stats-subtitle {
      font-size: 0.75rem;
      color: var(--color-text-muted);
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

    /* ─── Hero Cards ─── */
    .stats-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-hero-card {
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .gradient-green { background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05)); }
    .gradient-blue { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)); }
    .gradient-amber { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)); }
    .gradient-violet { background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05)); }

    .stat-hero-icon { font-size: 1.6rem; }
    .stat-hero-value {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      line-height: 1;
    }
    .stat-hero-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: center;
    }

    /* ─── Activity Breakdown ─── */
    .activity-section {
      margin-bottom: 20px;
    }

    .section-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 12px;
    }

    .activity-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-bar-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bar-label {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      width: 130px;
      flex-shrink: 0;
    }

    .bar-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.6s ease;
      min-width: 4px;
    }

    .bar-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-primary);
      font-family: var(--font-display);
      width: 30px;
      text-align: right;
    }

    /* ─── Share Badge ─── */
    .share-badge {
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 8px;
    }

    .badge-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .badge-emoji { font-size: 2rem; }

    .badge-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .badge-title {
      font-family: var(--font-display);
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .badge-desc {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
  `]
})
export class StatsComponent {
  private statsService = inject(StatsService);
  close = output<void>();

  stats = this.statsService.stats;

  formattedDistance = computed(() => {
    const m = this.stats().totalDistanceWalkedM;
    if (m >= 1000) return (m / 1000).toFixed(1) + 'km';
    return m + 'm';
  });

  getBarPercent(value: number, max: number): number {
    return Math.min(100, (value / max) * 100);
  }
}
