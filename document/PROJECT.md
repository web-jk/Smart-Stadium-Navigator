# 🏟️ StadiumFlow — Smart Stadium Navigator

> **One-Line Pitch:** *"Scan. Navigate. Skip the lines — StadiumFlow turns your phone into a real-time stadium GPS that finds you the fastest food, cleanest restroom, and best route through the crowd."*

---

## Project Overview

A **zero-install mobile-first web app** for real-time crowd navigation at large sporting venues. Users scan a QR code at any gate → browser opens instantly → live heatmap of crowd density, wait times, and AI-powered navigation that routes through the least congested paths.

**Tech Stack:** Angular 21 | Tailwind CSS 4 | TypeScript | Standalone Components | Signals

---

## Current Project Structure

```
e:\ANGULAR\smart-stadium\
├── src/
│   ├── index.html                 ✅ Mobile-first HTML (safe-area, theme-color, Google Fonts)
│   ├── styles.css                 ✅ Design system (Tailwind @theme, glassmorphism, animations, mobile polish)
│   ├── main.ts                    ✅ Bootstrap
│   └── app/
│       ├── app.ts                 ✅ Main orchestrator + stats tracking + smart reroute monitor
│       ├── app.html               ✅ Empty (inline template in app.ts)
│       ├── app.css                ✅ Empty (inline styles in app.ts)
│       ├── app.config.ts          ✅ Angular config (provideRouter)
│       ├── app.routes.ts          ✅ Routes: /admin (lazy-loaded)
│       │
│       ├── models/
│       │   └── venue.model.ts     ✅ All interfaces: Venue, Zone, NavigationRoute, etc.
│       │                             + utility functions: getDensityLevel, getDensityColor, getDensityLabel
│       │
│       ├── data/
│       │   └── stadium.data.ts    ✅ Full venue: 20 zones, 40+ connections
│       │                             Zones: 4 gates, 4 food, 4 restrooms, 4 seating, merch, VIP, medical
│       │
│       ├── services/
│       │   ├── simulator.service.ts  ✅ Real-time crowd sim (adjustable tick rate, event triggers)
│       │   ├── venue.service.ts      ✅ Dijkstra routing + findNearest recommendations
│       │   ├── alert.service.ts      ✅ Toast notifications with auto-dismiss
│       │   └── stats.service.ts      ✅ Client-side user action tracking + personal stats
│       │
│       └── features/
│           ├── splash/
│           │   └── splash.component.ts      ✅ Animated splash with gradient orbs, LIVE badge
│           ├── map/
│           │   └── stadium-map.component.ts ✅ SVG map, heatmap zones, route overlay, touch zoom
│           ├── zone-detail/
│           │   └── zone-detail.component.ts ✅ Bottom sheet + predictive wait time sparkline
│           ├── quick-actions/
│           │   └── quick-actions.component.ts ✅ FAB buttons: Food, Restroom, Exit, Shop
│           ├── find-nearest/
│           │   └── find-nearest.component.ts  ✅ Ranked results list, sorted by wait+walk
│           ├── navigation/
│           │   └── navigation-panel.component.ts ✅ Step-by-step directions, route stats
│           ├── alerts/
│           │   └── alert-banner.component.ts    ✅ Glassmorphism toast notifications
│           ├── admin/
│           │   └── admin.component.ts           ✅ Demo control panel (phase, triggers, sliders)
│           └── stats/
│               └── stats.component.ts           ✅ Personal stats dashboard / share card
```

---

## What's Complete (Phase 1 + Phase 2) ✅

### Screens
| Screen | Component | Status |
|--------|-----------|--------|
| Splash | `SplashComponent` | ✅ Animated orbs, LIVE badge, shimmer CTA |
| Stadium Map | `StadiumMapComponent` | ✅ 20 zones, density colors, wait badges, route overlay |
| Zone Detail | `ZoneDetailComponent` | ✅ Bottom sheet with crowd bar, trend, amenities, **predictive wait times** |
| Quick Actions | `QuickActionsComponent` | ✅ Food 🍔, Restroom 🚻, Exit 🚪, Shop 👕 |
| Find Nearest | `FindNearestComponent` | ✅ Ranked results with ⚡ best option |
| Navigation | `NavigationPanelComponent` | ✅ Directions, distance, time, congestion |
| Alerts | `AlertBannerComponent` | ✅ Auto-dismiss toasts |
| **Admin Control** | `AdminComponent` | ✅ Phase selector, event triggers, density sliders, speed control |
| **Personal Stats** | `StatsComponent` | ✅ Minutes saved, distance, zones explored, share badge |

### Services
| Service | Status | Key Methods |
|---------|--------|-------------|
| `SimulatorService` | ✅ | `start()`, `stop()`, `triggerEvent()`, `setPhase()`, `setZoneDensity()` |
| `VenueService` | ✅ | `findNearest()`, `calculateRoute()`, `getZone()` |
| `AlertService` | ✅ | `push()`, `dismiss()`, `goalScored()`, `halftimeStarted()`, etc. |
| `StatsService` | ✅ | `track()`, `trackBusyZoneAvoided()`, `trackDistanceWalked()`, `stats` |

### User Flow (Working)
```
QR Scan → Splash Screen → "Explore Stadium" → Map View → Tap Zone → Zone Detail
                                              ↓                         ↓
                                    Quick Action (Food/Restroom/Exit/Shop)  Predictive Wait Times
                                              ↓
                                    Find Nearest Results → Navigate
                                              ↓
                                    Navigation Panel + Route on Map
                                              ↓
                                    Smart Reroute Alert (auto)

/admin → Admin Control Panel → Phase + Triggers + Density Sliders + Speed
📊 button → Personal Stats Dashboard
```

---

## Phase 2 — COMPLETE ✅

### Priority 1: Admin Control Panel ✅
**Route:** `/admin` (hidden, access via URL directly)
- ✅ Event phase selector: Pre-Game | Active | Halftime | Post-Game
- ✅ Event triggers: ⚽ Goal! | ⏸️ Halftime | ▶️ End Halftime | 🌧️ Rain | 🏁 Post-Game
- ✅ Per-zone density sliders (20 zones, instant update)
- ✅ Connected clients counter (simulated, fluctuates)
- ✅ Simulator speed control: 1×, 2×, 5×, 10×
- ✅ Venue stats: attendance, capacity, avg density, hot zones count, occupancy bar

### Priority 2: Mobile Viewport Polish ✅
- ✅ Responsive CSS for 375px screens (iPhone SE)
- ✅ Quick action buttons fit 4 across at 375px
- ✅ Bottom sheets capped at 60vh on small screens
- ✅ Touch targets min 44px
- ✅ Overflow prevention via word-wrap / overflow-wrap
- ✅ Zone labels smaller on narrow viewports

### Priority 3: Wow Features ✅

#### Wow Feature 1: Predictive Wait Times ✅
- ✅ Mini bar chart in `ZoneDetailComponent`: Now | +10m | +20m | +30m
- ✅ Linear extrapolation from trend data + phase-aware boost
- ✅ Color-coded bars matching density colors

#### Wow Feature 2: Smart Route Re-routing ✅
- ✅ Auto-reroute monitor checks every 6s
- ✅ Detects congested zones on active path (density > 0.8 + rising)
- ✅ Auto-recalculates route and shows "Route Updated!" overlay
- ✅ Tracks busy zones avoided in stats

#### Wow Feature 3: Personal Stats Dashboard ✅
- ✅ `StatsService` tracks zone views, navigations, quick actions
- ✅ `StatsComponent` bottom sheet with hero cards:
  - Minutes Saved | Distance Walked | Busy Zones Avoided | Zones Explored
- ✅ Activity breakdown bars
- ✅ "Smart Fan Badge" shareable card

---

### Priority 4: Deployment & QR 🚧
- Deploy frontend to Vercel (free tier)
- Generate QR code pointing to deployed URL + venue params
- QR URL format: `https://stadiumflow.vercel.app?venue=stadium-a&gate=B3`
- Use `qrcode` npm package or online generator

---

## Key Design System (styles.css)

### Colors
| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-primary` | `#0a0e1a` | Main background |
| `--color-bg-card` | `#1a1f2e` | Cards, sheets |
| `--color-bg-glass` | `rgba(26,31,46,0.85)` | Glassmorphism |
| `--color-accent-indigo` | `#6366f1` | Primary accent |
| `--color-density-low` | `#22c55e` | Green - low crowd |
| `--color-density-medium` | `#f59e0b` | Yellow - moderate |
| `--color-density-high` | `#ef4444` | Red - busy |
| `--color-density-critical` | `#dc2626` | Dark red - very busy |

### Animations Available
- `animate-pulse-soft` — gentle opacity pulse
- `animate-slide-up` — bottom sheet entrance
- `animate-slide-down` — alert entrance
- `animate-fade-in` — general fade
- `animate-scale-in` — pop-in effect
- `animate-live-pulse` — LIVE dot pulse
- `dash-flow` — animated route dashes

### Utility Classes
- `.glass` / `.glass-strong` — glassmorphism background
- `.density-low/medium/high/critical` — text color per density
- `.density-bg-low/medium/high/critical` — background color per density
- `.pb-safe` — safe-area bottom padding
- `.no-scrollbar` — hide scrollbar

---

## Simulator Engine Details

### How the crowd simulation works:
```
For each zone, every 3 seconds:
  newDensity = (currentDensity × 0.7) + (baseLoad × 0.3) + (randomNoise × 0.15)
  
  where baseLoad = f(zoneType, eventPhase)
  
  Example base loads during "halftime":
    concession: 0.85  (everyone gets food)
    restroom:   0.90  (everyone goes)
    seating:    0.40  (mostly empty)
    merchandise: 0.70 (browsing)
```

### Event Triggers Available:
| Trigger | Effect | Method |
|---------|--------|--------|
| Goal Scored | Concessions +25%, seating +5% | `simulator.triggerEvent('goal')` |
| Halftime | Restrooms +35%, concessions +35%, seating -40% | `simulator.triggerEvent('halftime')` |
| Rain | Indoor zones +30%, seating -35% | `simulator.triggerEvent('rain')` |
| End Halftime | Restrooms -30%, seating +35% | `simulator.triggerEvent('end-halftime')` |
| Post-Game | Gates spike to 90%, seating drops | `simulator.triggerEvent('post-game')` |

---

## How to Run

```bash
cd e:\ANGULAR\smart-stadium
ng serve        # http://localhost:4200
```

## How to Demo

1. Open `localhost:4200` on phone (or use Chrome DevTools mobile mode)
2. See splash → tap "Explore Stadium"
3. Map shows live zones updating every 3s
4. Tap 🍔 Food → see ranked results → tap to navigate
5. Route appears on map with animated dashes
6. Open `/admin` (when built) to trigger events during demo
