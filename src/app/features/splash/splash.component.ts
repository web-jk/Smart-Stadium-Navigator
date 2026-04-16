import { Component, output } from '@angular/core';

@Component({
  selector: 'app-splash',
  standalone: true,
  template: `
    <div class="splash-container">
      <!-- Background animated gradient orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <main class="splash-content animate-fade-in" role="main">
        <!-- Logo Icon -->
        <div class="logo-wrapper">
          <div class="logo-icon" role="img" aria-label="StadiumFlow Logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z"
                    stroke="url(#splash-grad)" stroke-width="2.5" fill="none"/>
              <ellipse cx="24" cy="24" rx="14" ry="8"
                       stroke="url(#splash-grad)" stroke-width="2" fill="none" opacity="0.7"/>
              <ellipse cx="24" cy="24" rx="8" ry="14"
                       stroke="url(#splash-grad)" stroke-width="2" fill="none" opacity="0.7"/>
              <circle cx="24" cy="24" r="3" fill="url(#splash-grad)"/>
              <!-- Pulsing dot -->
              <circle cx="24" cy="24" r="3" fill="#22c55e" class="pulse-dot"/>
              <defs>
                <linearGradient id="splash-grad" x1="4" y1="4" x2="44" y2="44">
                  <stop stop-color="#6366f1"/>
                  <stop offset="0.5" stop-color="#8b5cf6"/>
                  <stop offset="1" stop-color="#22d3ee"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="live-badge animate-pulse-soft">
            <span class="live-dot" aria-hidden="true"></span>
            LIVE
          </div>
        </div>

        <!-- App Name -->
        <h1 class="app-name">
          Stadium<span class="highlight">Flow</span>
        </h1>

        <!-- Venue Name -->
        <div class="venue-name animate-fade-in">
          <span class="venue-icon" role="img" aria-label="Stadium Icon">🏟️</span>
          MCA Stadium, Pune
        </div>

        <!-- Event Name -->
        <p class="event-name">IPL Finals 2026</p>

        <!-- CTA Button -->
        <button class="cta-button" (click)="enter.emit()" aria-label="Explore Stadium and start navigation">
          <span class="btn-text">Explore Stadium</span>
          <span class="btn-icon" aria-hidden="true">→</span>
          <div class="btn-shimmer"></div>
        </button>

        <!-- Tag line -->
        <p class="tagline">Real-time crowd navigation • No app required</p>
      </main>
    </div>
  `,
  styles: [`
    .splash-container {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
      z-index: 100;
      overflow: hidden;
    }

    /* Animated background orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
      animation: float 8s ease-in-out infinite;
    }

    .orb-1 {
      width: 300px;
      height: 300px;
      background: #6366f1;
      top: -100px;
      right: -80px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 250px;
      height: 250px;
      background: #8b5cf6;
      bottom: -60px;
      left: -60px;
      animation-delay: -3s;
    }

    .orb-3 {
      width: 200px;
      height: 200px;
      background: #22d3ee;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -5s;
      opacity: 0.15;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      33% { transform: translateY(-20px) scale(1.05); }
      66% { transform: translateY(10px) scale(0.95); }
    }

    .splash-content {
      text-align: center;
      padding: 2rem;
      position: relative;
      z-index: 1;
    }

    .logo-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 24px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .pulse-dot {
      animation: live-pulse 2s ease-in-out infinite;
      transform-origin: center;
    }

    @keyframes live-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.6); }
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 4px 12px;
      border-radius: 99px;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .live-dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      animation: live-pulse 2s ease-in-out infinite;
    }

    .app-name {
      font-family: var(--font-display);
      font-size: 2.75rem;
      font-weight: 800;
      color: var(--color-text-primary);
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem;
      line-height: 1.1;
    }

    .highlight {
      background: linear-gradient(135deg, #6366f1, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .venue-name {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 0.35rem;
    }

    .venue-icon {
      font-size: 1.3rem;
    }

    .event-name {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      margin-bottom: 2.5rem;
    }

    .cta-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-family: var(--font-sans);
      font-size: 1.05rem;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.3s;
      box-shadow: 0 4px 24px rgba(99, 102, 241, 0.35);
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.5);
    }

    .cta-button:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 1.2rem;
      transition: transform 0.2s;
    }

    .cta-button:hover .btn-icon {
      transform: translateX(4px);
    }

    .btn-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 60%
      );
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      50%, 100% { transform: translateX(100%); }
    }

    .tagline {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      letter-spacing: 0.02em;
    }

    @media (prefers-reduced-motion: reduce) {
      .orb, .animate-scale-in, .animate-pulse-soft, .animate-fade-in, .pulse-dot, .live-dot, .btn-shimmer {
        animation: none !important;
        transition: none !important;
      }
      .orb { opacity: 0.1; }
    }
  `]
})
export class SplashComponent {
  enter = output<void>();
}
