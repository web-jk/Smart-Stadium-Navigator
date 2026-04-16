# Feature Documentation: Notification System

## Overview
The Notification System provides real-time, synchronized alerts to all connected users and administrators. It is designed to handle stadium-wide announcements, emergency alerts, and event triggers (like goals or full-time whistles) with sub-second latency and optional audio feedback.

---

## 1. Key Components & Files

### **Services**
- **`src/app/services/alert.service.ts`**: The central engine for managing notifications.
  - Handles Firestore listeners for real-time updates.
  - Manages the local notification queue using Angular Signals (`alerts`).
  - Provides methods for both clients (reading) and admins (broadcasting).
- **`src/app/services/simulator.service.ts`**: Often triggers system-level alerts based on crowd density or automated events.

### **Components**
- **`src/app/features/alerts/alert-toast/`**: Displays individual toast notifications with animations.
- **`src/app/features/alerts/alert-container/`**: A floating container that manages the stacking and lifecycle of active alerts.
- **`src/app/features/admin/components/notification-sender/`**: UI for administrators to type and broadcast custom messages.

### **Data & Assets**
- **Assets**: `public/assets/sounds/notification.mp3` (or similar) for audible alerts.
- **Collection**: `stadiums/default/notifications` (Firestore).

---

## 2. Technical Workflow

### **Admin Broadcast Flow**
1. **Input**: Administrator types a message or selects a preset (e.g., "Goal Scored!").
2. **Execution**: `AlertService.broadcastNotification(message, type, duration)` is called.
3. **Firestore Write**: A new document is added to the `notifications` sub-collection in Firestore with a server timestamp.
4. **Immediate Feedback**: The Admin UI reflects the "Sent" status immediately.

### **Spectator Receive Flow**
1. **Subscription**: Upon app initialization, `AlertService` starts a Firestore `onSnapshot` listener on the `notifications` collection.
2. **Filtering**: The listener specifically looks for documents created *after* the current session started (using the `added` change type).
3. **Signal Update**: New notifications are added to the `alerts` Signal.
4. **UI Trigger**: The `AlertContainer` component (bound to the Signal) injects a new `AlertToast` component into the DOM.
5. **Audio Feedback**: The `playNotificationSound()` method is triggered, playing a curated alert sound.
6. **Auto-Cleanup**: After the specified `duration` (default 5s), the notification is spliced from the Signal, triggering an exit animation.

---

## 3. Real-time Synchronization Details
The sync is handled via Firestore's Real-time SDK. Because `AlertService` runs globally as a provided-in-root service:
- It maintains a single source of truth.
- It survives route changes.
- It uses `NgZone.run()` to ensure the UI updates instantly even when Firebase events occur outside the Angular execution context.

---

## 4. Features & Controls
- **Types of Alerts**: `info`, `warning`, `error`, `success`.
- **Custom Broadcast**: Admins can send arbitrary text.
- **Persistent Logic**: The system ensures no duplicate notifications are shown if the client reconnects briefly.
- **Audio Toggle**: Users can (optionally) mute notification sounds in the settings (if implemented).

---

## 5. Integration Points
- **Admin Panel**: "Quick Actions" buttons (Goal, Full Time, Gate Closed) are hardwired to `AlertService`.
- **Crowd Density**: If a zone reaches >90% (Critical), the `SimulatorService` automatically triggers a system-wide warning through the `AlertService`.
