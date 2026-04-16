import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alerts-container" role="region" aria-label="Notifications">
      @for (alert of alertService.alerts(); track alert.id) {
        <div class="alert-toast animate-slide-down"
             role="alert"
             aria-live="polite"
             [class.alert-info]="alert.severity === 'info'"
             [class.alert-warning]="alert.severity === 'warning'"
             [class.alert-success]="alert.severity === 'success'"
             (click)="alertService.dismiss(alert.id)">
          <span class="alert-icon" aria-hidden="true">{{ alert.icon }}</span>
          <span class="alert-message">{{ alert.message }}</span>
          <button class="alert-dismiss" 
                  (click)="$event.stopPropagation(); alertService.dismiss(alert.id)"
                  aria-label="Dismiss notification">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .alerts-container {
      position: fixed;
      top: max(12px, env(safe-area-inset-top));
      left: 12px;
      right: 12px;
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .alert-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 16px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid;
      pointer-events: all;
      cursor: pointer;
      box-shadow: var(--shadow-elevated);
    }

    .alert-info {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.3);
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .alert-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .alert-message {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-text-primary);
      flex: 1;
    }

    .alert-dismiss {
      background: none;
      border: none;
      color: var(--color-text-muted);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 4px;
      flex-shrink: 0;
    }
  `]
})
export class AlertBannerComponent {
  alertService = inject(AlertService);
}
