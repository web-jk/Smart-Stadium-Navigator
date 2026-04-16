# Feature Documentation: Real-Time Synchronization (The "Sync Engine")

## Overview
The Sync Engine is the heartbeat of the Smart Stadium Navigator. it ensures that every user is looking at the exact same stadium state (crowd levels, gate statuses, and event phases) as configured by the Administrators in real-time.

---

## 1. Key Components & Files

### **Services**
- **`src/app/services/simulator.service.ts`**: The primary gatekeeper of the Stadium State.
  - Holds the `venue` Signal.
  - Manages the `onSnapshot` listener to Firestore.
  - Handles the "Draft vs Live" logic.
- **`src/app/services/venue.service.ts`**: Handles low-level Firestore CRUD operations and data modeling.

### **Firestore Structure**
- **Document**: `stadiums/default` - The active live state.
- **Document**: `stadiums/draft` - The working state for administrators.

---

## 2. Technical Architecture

### **The "Single Source of Truth" Pattern**
We follow a unidirectional data flow:
1. **Cloud State**: Firestore holds the ground truth.
2. **Local State**: `SimulatorService` mirrors the Cloud State in an Angular Signal.
3. **UI Components**: All components (Maps, Stats, Detailed Views) react to the Signal.

### **Reactivity with Angular Signals**
Signals were chosen over Observables for:
- **Synchronous Access**: Easy to read current state without async piping everywhere.
- **Granular Updates**: Only components reading specific properties of the venue re-render when they change.

---

## 3. The Synchronization Lifecycle

### **Step 1: The Administrative "Push"**
When an Admin changes the crowd density of "East Stand":
- `AdminControlComponent` calls `SimulatorService.setZoneDensity('east-stand', 85)`.
- The service performs a `setDoc` or `updateDoc` call to Firestore.

### **Step 2: The Socket Broadcast**
- Firebase Firestore detects the change and publishes an update event to all active clients via a persistent WebSocket connection.

### **Step 3: The Client "Pull" (onSnapshot)**
- The `SimulatorService` on every user's device receives the snapshot.
- We use `NgZone.run()` to bring the async execution back into Angular's Change Detection loop.
- The `venue` Signal is updated: `this.venue.set(snapshot.data())`.

### **Step 4: The Visual Update**
- **SVG Map**: Re-renders the color fill of the "East Stand" path to dark orange.
- **Stats Dashboard**: Updates the total stadium occupancy count.
- **Navigation**: If a route was passing through that zone, wait times are recalculated.

---

## 4. Performance Optimizations
- **Differential Updates**: We only sync the fields that changed to save bandwidth.
- **Debounced Writes**: Admin changes are debounced (approx 300ms) to prevent Firestore write limits during rapid slider movement.
- **Offline Persistence**: If the user enters a tunnel with poor reception, Firestore's offline cache keeps the map interactive until connection is restored.

---

## 5. Security & Isolation
- **Write Permissions**: Only authenticated 'Admin' UIDs can write to the `stadiums/` collection.
- **Read Permissions**: Anonymous read access allowed for spectators to ensure zero friction for fans.
- **Environment Isolation**: The `environments/` files handle different Firebase Project IDs for Development and Production.
