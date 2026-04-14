import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulatorService } from '../../services/simulator.service';
import { AlertService } from '../../services/alert.service';
import { EventPhase, getDensityLevel, getDensityColor, getDensityLabel } from '../../models/venue.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
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
          <button class="back-btn" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" (click)="logout()">
            Sign Out
          </button>
          <button class="back-btn" (click)="goBack()">
            ← Back to App
          </button>
        </div>
      </header>

      <div class="admin-body">
        <!-- Row 1: Phase + Stats -->
        <div class="admin-grid-2">
          <!-- Event Phase Selector -->
          <section class="admin-card">
            <h2 class="card-title">
              <span class="card-icon">🎬</span> Event Phase
            </h2>
            <p class="card-desc">Control the game phase — crowd behavior shifts automatically.</p>
            <div class="phase-buttons">
              @for (phase of phases; track phase.value) {
                <button
                  class="phase-btn"
                  [class.active]="currentPhase() === phase.value"
                  (click)="setPhase(phase.value)">
                  <span class="phase-emoji">{{ phase.icon }}</span>
                  <span class="phase-label">{{ phase.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Venue Stats -->
          <section class="admin-card">
            <h2 class="card-title">
              <span class="card-icon">📊</span> Venue Overview
            </h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ venue().currentAttendance | number }}</span>
                <span class="stat-label">Attendance</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ venue().capacity | number }}</span>
                <span class="stat-label">Capacity</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" [style.color]="avgDensityColor()">
                  {{ (avgDensity() * 100).toFixed(0) }}%
                </span>
                <span class="stat-label">Avg Density</span>
              </div>
              <div class="stat-item">
                <span class="stat-value hot-zones-count">{{ hotZonesCount() }}</span>
                <span class="stat-label">Hot Zones</span>
              </div>
            </div>
            <div class="occupancy-bar-wrapper">
              <span class="stat-label">Overall Occupancy</span>
              <div class="occupancy-bar">
                <div class="occupancy-fill"
                     [style.width.%]="(venue().currentAttendance / venue().capacity) * 100"
                     [style.background]="'linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)'">
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Row 2: Event Triggers + Speed -->
        <div class="admin-grid-2">
          <!-- Event Triggers -->
          <section class="admin-card">
            <h2 class="card-title">
              <span class="card-icon">⚡</span> Event Triggers
            </h2>
            <p class="card-desc">Fire instant events — watch the map react in real-time.</p>
            <div class="trigger-buttons">
              @for (trigger of triggers; track trigger.event) {
                <button class="trigger-btn" [class]="'trigger-' + trigger.color"
                        (click)="fireEvent(trigger.event)">
                  <span class="trigger-icon">{{ trigger.icon }}</span>
                  <span class="trigger-label">{{ trigger.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Custom Notification -->
          <section class="admin-card">
            <h2 class="card-title">
              <span class="card-icon">✉️</span> Custom Notification
            </h2>
            <p class="card-desc">Broadcast a custom message to all connected users instantly.</p>
            
            <div class="notification-form">
              <div class="input-group">
                <input 
                  type="text" 
                  class="custom-input" 
                  placeholder="Type your message here..." 
                  [value]="customMessage()"
                  (input)="customMessage.set($any($event.target).value)"
                  (keyup.enter)="sendCustomNotification()"
                />
              </div>

              <div class="notification-meta-grid">
                <div class="meta-select-group">
                  <span class="meta-label-sm">Severity</span>
                  <div class="severity-tabs">
                    @for (opt of severityOptions; track opt.value) {
                      <button 
                        class="sev-tab" 
                        [class.active]="selectedSeverity() === opt.value"
                        [class]="'sev-' + opt.value"
                        (click)="selectedSeverity.set(opt.value)">
                        {{ opt.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="meta-select-group">
                  <span class="meta-label-sm">Icon</span>
                  <div class="icon-picker">
                    @for (icon of icons; track icon) {
                      <button 
                        class="icon-opt" 
                        [class.active]="selectedIcon() === icon"
                        (click)="selectedIcon.set(icon)">
                        {{ icon }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <button 
                class="send-btn" 
                [disabled]="!customMessage().trim()"
                (click)="sendCustomNotification()">
                <span class="send-icon">🚀</span>
                Broadcast to All Clients
              </button>
            </div>
          </section>
        </div>

        <!-- Row 3: Simulator Speed -->
        <section class="admin-card full-width" style="margin-bottom: 16px;">
          <h2 class="card-title">
            <span class="card-icon">⏱️</span> Simulator Speed & Control
          </h2>
          <div class="speed-row">
            <div class="speed-buttons" style="margin-bottom: 0; flex: 1;">
              @for (speed of speedOptions; track speed.value) {
                <button class="speed-btn"
                        [class.active]="currentSpeed() === speed.value"
                        (click)="setSpeed(speed.value)">
                  {{ speed.label }}
                </button>
              }
            </div>
            <div class="speed-info-bubble">
              <span class="speed-label">Tick interval:</span>
              <span class="speed-value">{{ (3000 / currentSpeed()) }}ms</span>
            </div>
          </div>
        </section>

        <!-- Row 3: Per-Zone Density Control -->
        <section class="admin-card full-width">
          <h2 class="card-title">
            <span class="card-icon">🎚️</span> Zone Density Control
          </h2>
          <p class="card-desc">Manually adjust crowd density for any zone. Changes are applied instantly.</p>

          <div class="zone-grid">
            @for (zone of zones(); track zone.id) {
              <div class="zone-slider-card">
                <div class="zone-slider-header">
                  <span class="zone-icon-sm">{{ getZoneIcon(zone.type) }}</span>
                  <span class="zone-name-sm">{{ zone.name }}</span>
                  <span class="zone-density-badge"
                        [style.color]="getDensityColor(zone.crowdDensity)"
                        [style.borderColor]="getDensityColor(zone.crowdDensity) + '44'">
                    {{ (zone.crowdDensity * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="slider-wrapper">
                  <div class="slider-track">
                    <div class="slider-fill"
                         [style.width.%]="zone.crowdDensity * 100"
                         [style.background]="getDensityColor(zone.crowdDensity)">
                    </div>
                  </div>
                  <input type="range"
                         class="density-slider"
                         min="0" max="100" step="1"
                         [value]="zone.crowdDensity * 100"
                         (input)="onDensityChange(zone.id, $event)" />
                </div>
                <div class="zone-slider-meta">
                  <span class="zone-meta-label" [style.color]="getDensityColor(zone.crowdDensity)">
                    {{ getDensityLabel(zone.crowdDensity) }}
                  </span>
                  <span class="zone-meta-wait">
                    @if (zone.waitTimeMinutes > 0) {
                      ~{{ zone.waitTimeMinutes }}min wait
                    } @else {
                      No wait
                    }
                  </span>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      min-height: 100dvh;
      background: var(--color-bg-primary);
      display: flex;
      flex-direction: column;
    }

    /* ─── Header ─── */
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      padding-top: max(16px, env(safe-area-inset-top));
      position: sticky;
      top: 0;
      z-index: 50;
      flex-wrap: wrap;
      gap: 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .admin-badge {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 4px 10px;
      border-radius: 99px;
    }

    .admin-title {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }

    .hl {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .connected-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #22c55e;
      padding: 5px 12px;
      border-radius: 99px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .connected-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      animation: live-pulse 2s ease-in-out infinite;
    }

    @keyframes live-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    }

    .back-btn {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--color-border);
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .back-btn:hover {
      color: var(--color-text-primary);
      background: rgba(255, 255, 255, 0.08);
    }

    /* ─── Body ─── */
    .admin-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px 40px;
    }

    .admin-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .admin-grid-2 {
        grid-template-columns: 1fr;
      }
    }

    /* ─── Card ─── */
    .admin-card {
      background: var(--color-bg-card);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--color-border);
    }

    .admin-card.full-width {
      margin-bottom: 16px;
    }

    .card-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon { font-size: 1rem; }

    .card-desc {
      font-size: 0.78rem;
      color: var(--color-text-muted);
      margin: 0 0 16px;
      line-height: 1.4;
    }

    /* ─── Phase Buttons ─── */
    .phase-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .phase-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 10px;
      border-radius: 14px;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.03);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.25s;
      font-family: var(--font-sans);
    }

    .phase-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .phase-btn.active {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.5);
      color: var(--color-text-primary);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
    }

    .phase-emoji { font-size: 1.5rem; }
    .phase-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ─── Stats ─── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 12px;
      border: 1px solid var(--color-border);
      text-align: center;
    }

    .stat-value {
      display: block;
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }

    .hot-zones-count { color: #ef4444; }

    .stat-label {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .occupancy-bar-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .occupancy-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .occupancy-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.6s ease;
    }

    /* ─── Trigger Buttons ─── */
    .trigger-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .trigger-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.03);
      color: var(--color-text-primary);
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.25s;
    }

    .trigger-btn:hover { transform: translateY(-1px); }
    .trigger-btn:active { transform: translateY(0); }

    .trigger-amber { border-color: rgba(245, 158, 11, 0.3); }
    .trigger-amber:hover { background: rgba(245, 158, 11, 0.1); box-shadow: 0 0 16px rgba(245, 158, 11, 0.15); }

    .trigger-blue { border-color: rgba(59, 130, 246, 0.3); }
    .trigger-blue:hover { background: rgba(59, 130, 246, 0.1); box-shadow: 0 0 16px rgba(59, 130, 246, 0.15); }

    .trigger-green { border-color: rgba(34, 197, 94, 0.3); }
    .trigger-green:hover { background: rgba(34, 197, 94, 0.1); box-shadow: 0 0 16px rgba(34, 197, 94, 0.15); }

    .trigger-red { border-color: rgba(239, 68, 68, 0.3); }
    .trigger-red:hover { background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 16px rgba(239, 68, 68, 0.15); }

    .trigger-icon { font-size: 1.3rem; }
    .trigger-label { flex: 1; text-align: left; }

    /* ─── Speed ─── */
    .speed-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }

    .speed-btn {
      flex: 1;
      padding: 12px 8px;
      border-radius: 12px;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.03);
      color: var(--color-text-secondary);
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s;
    }

    .speed-btn:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .speed-btn.active {
      background: rgba(34, 197, 94, 0.12);
      border-color: rgba(34, 197, 94, 0.5);
      color: #22c55e;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.15);
    }

    .speed-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .speed-row {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .speed-info-bubble {
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 16px;
      border-radius: 99px;
      border: 1px solid var(--color-border);
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* ─── Notification Form ─── */
    .notification-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .custom-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      padding: 12px 16px;
      border-radius: 12px;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .custom-input:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(0, 0, 0, 0.3);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }

    .notification-meta-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .meta-select-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .meta-label-sm {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .severity-tabs {
      display: flex;
      gap: 6px;
    }

    .sev-tab {
      flex: 1;
      padding: 8px 4px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .sev-tab.active.sev-info { background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #60a5fa; }
    .sev-tab.active.sev-success { background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #4ade80; }
    .sev-tab.active.sev-warning { background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #fbbf24; }

    .icon-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .icon-opt {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      cursor: pointer;
      font-size: 1.1rem;
      transition: all 0.2s;
    }

    .icon-opt:hover { background: rgba(255, 255, 255, 0.08); }
    .icon-opt.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
      transform: scale(1.1);
    }

    .send-btn {
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .send-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
      background: linear-gradient(135deg, #7477f3, #5a52ef);
    }

    .send-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }

    .send-icon { font-size: 1.1rem; }

    .speed-label { color: var(--color-text-muted); }
    .speed-value {
      color: var(--color-text-primary);
      font-weight: 600;
      font-family: var(--font-display);
    }

    /* ─── Zone Sliders ─── */
    .zone-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    @media (max-width: 640px) {
      .zone-grid {
        grid-template-columns: 1fr;
      }
    }

    .zone-slider-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      padding: 14px;
      border: 1px solid var(--color-border);
      transition: border-color 0.2s;
    }

    .zone-slider-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }

    .zone-slider-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .zone-icon-sm { font-size: 1rem; }
    .zone-name-sm {
      flex: 1;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .zone-density-badge {
      font-size: 0.8rem;
      font-weight: 800;
      font-family: var(--font-display);
      padding: 2px 8px;
      border-radius: 8px;
      border: 1px solid;
      background: rgba(255, 255, 255, 0.03);
    }

    .slider-wrapper {
      position: relative;
      height: 20px;
      margin-bottom: 8px;
    }

    .slider-track {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 6px;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      overflow: hidden;
      pointer-events: none;
    }

    .slider-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.15s ease, background 0.3s ease;
    }

    .density-slider {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      margin: 0;
    }

    .density-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-text-primary);
      border: 2px solid var(--color-bg-card);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .density-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-text-primary);
      border: 2px solid var(--color-bg-card);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .zone-slider-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .zone-meta-label {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .zone-meta-wait {
      font-size: 0.72rem;
      color: var(--color-text-muted);
    }
  `]
})
export class AdminComponent implements OnInit, OnDestroy {
  private simulator = inject(SimulatorService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // ─── Phase Control ─────────────────────────────────────────
  phases = [
    { value: 'pre-game' as EventPhase, label: 'Pre-Game', icon: '⏳' },
    { value: 'active' as EventPhase, label: 'Active', icon: '⚡' },
    { value: 'halftime' as EventPhase, label: 'Halftime', icon: '⏸️' },
    { value: 'post-game' as EventPhase, label: 'Post-Game', icon: '🏁' },
  ];

  // ─── Triggers ──────────────────────────────────────────────
  triggers = [
    { event: 'goal' as const, label: 'Goal Scored!', icon: '⚽', color: 'amber' },
    { event: 'halftime' as const, label: 'Start Halftime', icon: '⏸️', color: 'blue' },
    { event: 'end-halftime' as const, label: 'End Halftime', icon: '▶️', color: 'green' },
    { event: 'rain' as const, label: 'Rain Delay', icon: '🌧️', color: 'blue' },
    { event: 'post-game' as const, label: 'Post-Game Rush', icon: '🏁', color: 'red' },
  ];

  // ─── Speed ─────────────────────────────────────────────────
  speedOptions = [
    { value: 1, label: '1×' },
    { value: 2, label: '2×' },
    { value: 5, label: '5×' },
    { value: 10, label: '10×' },
  ];

  // ─── Custom Notification ───────────────────────────────────
  customMessage = signal('');
  selectedSeverity = signal<'info' | 'warning' | 'success'>('info');
  selectedIcon = signal('📢');
  
  severityOptions = [
    { value: 'info' as const, label: 'Info', icon: 'ℹ️' },
    { value: 'success' as const, label: 'Success', icon: '✅' },
    { value: 'warning' as const, label: 'Warning', icon: '⚠️' },
  ];

  icons = ['📢', '🚨', '🎫', '🌭', '🚻', '🌧️', '⚽', '🏆'];

  currentSpeed = signal(1);
  connectedClients = signal(0);
  private clientInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Computed ──────────────────────────────────────────────
  venue = computed(() => this.simulator.venue());
  zones = computed(() => this.simulator.venue().zones);
  currentPhase = computed(() => this.simulator.eventPhase());

  avgDensity = computed(() => {
    const z = this.zones();
    return z.reduce((sum, zone) => sum + zone.crowdDensity, 0) / z.length;
  });

  avgDensityColor = computed(() => getDensityColor(this.avgDensity()));

  hotZonesCount = computed(() =>
    this.zones().filter(z => getDensityLevel(z.crowdDensity) === 'high' || getDensityLevel(z.crowdDensity) === 'critical').length
  );

  // Expose to template
  getDensityColor = getDensityColor;
  getDensityLabel = getDensityLabel;

  ngOnInit(): void {
    // We completely stop the automatic simulator tick. Admin ONLY manipulates manually.
    // this.simulator.start();

    // Simulate connected clients fluctuation
    this.connectedClients.set(Math.floor(Math.random() * 200) + 800);
    this.clientInterval = setInterval(() => {
      this.connectedClients.update(v => v + Math.floor(Math.random() * 40) - 20);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.clientInterval) clearInterval(this.clientInterval);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout();
  }

  setPhase(phase: EventPhase): void {
    this.simulator.setPhase(phase);

    // Fire matching alert
    if (phase === 'halftime') this.alertService.halftimeStarted();
    if (phase === 'active') this.alertService.halftimeEnding();
  }

  fireEvent(event: 'goal' | 'halftime' | 'rain' | 'end-halftime' | 'post-game'): void {
    this.simulator.triggerEvent(event);

    // Fire matching alert
    switch (event) {
      case 'goal': this.alertService.goalScored(); break;
      case 'halftime': this.alertService.halftimeStarted(); break;
      case 'end-halftime': this.alertService.halftimeEnding(); break;
      case 'rain': this.alertService.rainAlert(); break;
      case 'post-game':
        this.alertService.push({
          message: '🏁 Game over! Exit gates are getting crowded',
          severity: 'warning',
          icon: '🏁',
          duration: 7000
        });
        break;
    }
  }

  setSpeed(multiplier: number): void {
    this.currentSpeed.set(multiplier);
    // Stop and restart with new tick rate
    this.simulator.stop();
    (this.simulator as any).tickRate = 3000 / multiplier;
    // this.simulator.start(); // Disabled to allow purely manual control
  }

  onDensityChange(zoneId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber / 100;
    this.simulator.setZoneDensity(zoneId, value);
  }

  getZoneIcon(type: string): string {
    const icons: Record<string, string> = {
      'entrance': '🚪', 'concession': '🍔', 'restroom': '🚻',
      'seating': '💺', 'merchandise': '👕', 'vip': '⭐',
      'exit': '🚪', 'medical': '🏥', 'corridor': '🚶'
    };
    return icons[type] ?? '📍';
  }

  sendCustomNotification(): void {
    const message = this.customMessage().trim();
    if (!message) return;

    this.alertService.push({
      message,
      severity: this.selectedSeverity(),
      icon: this.selectedIcon(),
      duration: 6000
    });

    // Reset message
    this.customMessage.set('');
  }
}
