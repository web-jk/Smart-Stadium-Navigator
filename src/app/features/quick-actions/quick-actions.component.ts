import { Component, output } from '@angular/core';

export type QuickActionType = 'food' | 'restroom' | 'exit' | 'merch';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  template: `
    <div class="quick-actions">
      <button class="action-btn food" (click)="actionClicked.emit('food')">
        <span class="action-icon">🍔</span>
        <span class="action-label">Food</span>
      </button>
      <button class="action-btn restroom" (click)="actionClicked.emit('restroom')">
        <span class="action-icon">🚻</span>
        <span class="action-label">Restroom</span>
      </button>
      <button class="action-btn exit" (click)="actionClicked.emit('exit')">
        <span class="action-icon">🚪</span>
        <span class="action-label">Exit</span>
      </button>
      <button class="action-btn merch" (click)="actionClicked.emit('merch')">
        <span class="action-icon">👕</span>
        <span class="action-label">Shop</span>
      </button>
    </div>
  `,
  styles: [`
    .quick-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      border-radius: 16px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      cursor: pointer;
      transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
      min-width: 68px;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card);
    }

    .action-btn:active {
      transform: scale(0.95);
    }

    .action-btn.food {
      border-color: rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.08);
    }

    .action-btn.restroom {
      border-color: rgba(59, 130, 246, 0.3);
      background: rgba(59, 130, 246, 0.08);
    }

    .action-btn.exit {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(34, 197, 94, 0.08);
    }

    .action-btn.merch {
      border-color: rgba(139, 92, 246, 0.3);
      background: rgba(139, 92, 246, 0.08);
    }

    .action-icon {
      font-size: 1.5rem;
    }

    .action-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  `]
})
export class QuickActionsComponent {
  actionClicked = output<QuickActionType>();
}
