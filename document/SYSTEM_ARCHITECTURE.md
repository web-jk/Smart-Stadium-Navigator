# StadiumFlow: System architecture & Real-time Sync

This document provides a comprehensive overview of how **StadiumFlow** handles authentication, real-time data broadcasting, and how the Admin Panel perfectly synchronizes with thousands of connected spectator clients.

---

## 1. Core Services Used

The application utilizes a Serverless architecture powered completely by Google Firebase and Angular 21 native Reactivity (Signals).

*   **Angular 21 (Reactivity Engine):** Handles the DOM and state management using `Signals`.
*   **Firebase Authentication:** Provides Email/Password based authentication security.
*   **Firebase Cloud Firestore:** Acts as the realtime NoSQL Database and Pub/Sub mechanism to broadcast data to all users with sub-second latency.
*   **Leaflet.js:** Powers the 2D Satellite View map rendering.

---

## 2. How Authentication Works

Authentication is completely centralized around security guards and Firebase's Auth SDK.

1.  **AuthService (`auth.service.ts`)**: 
    The `AuthService` leverages `@angular/fire/auth`. It exposes an Angular `Signal` called `currentUser`, which automatically observes Firebase's `onAuthStateChanged`. 
2.  **Access Control (`admin.guard.ts`)**: 
    When a user attempts to navigate to `http://localhost:4200/admin`, the Angular Router intercepts the request using `adminGuard`. If `currentUser` is null, it instantly redirects the traffic to `/admin/login`.
3.  **Firebase Security Rules**: 
    To protect the database at the network layer, our Firestore security rules dictate:
    *   `allow read: if true;` (Normal users can endlessly read the database).
    *   `allow write: if request.auth != null;` (Only logged-in Admins have permission to overwrite the map state or fire notifications).

---

## 3. Real-Time Data Synchronization Lifecycle

The synchronization system guarantees that when an Admin moves a slider, the exact value updates seamlessly on every active spectator's phone. Here is how the loop works securely:

### Phase 1: The Admin Write Trigger
When an Admin accesses the `AdminControl` panel and dragging the **Zone Density Slider**:
1. It calls `SimulatorService.setZoneDensity(zoneId, value)`.
2. The Service updates its local `this.venue()` Signal immediately so the Admin Interface feels instantaneous.
3. It immediately invokes `this.syncToFirestore()`.
4. `syncToFirestore()` packages the entire structured JSON object and performs a `setDoc()` call to the exact Firestore path: `stadiums/default`.

### Phase 2: Firebase Socket Broadcast
1. Google's Cloud Firestore receives the `setDoc` payload.
2. It validates the Auth Token of the Admin against our Security Rules.
3. Operations pass, so Firestore natively broadcasts this new JSON differential payload over an active Web-Socket connection (`/Listen/channel`) to **ALL** actively connected web clients globally.

### Phase 3: The Client UI Response
On the Spectator's device (the normal map view):
1. Upon first load, the client's `SimulatorService` binds an `onSnapshot` listener to the `stadiums/default` document.
2. When the Firestore broadcast is received, the `onSnapshot` callback fires exactly with the data the Admin just pushed.
3. **The NgZone Fix**: Because Firebase websockets run *outside* of the Angular engine, we explicitly wrap the data intake using `NgZone.run()`. This forces Angular to acknowledge the new data immediately without waiting for the user to touch the screen limitlessly.
4. `this.venue.set(snapshot.data())` updates the Global Signal.

### Phase 4: Map Visual Updates
Both the SVG Map and the Satellite Leaflet Map are reactive listeners to the `this.venue` Signal.
*   **SVG Map (`stadium-map.component.ts`)**: Uses an `@for` loop that perfectly tracks `computed(() => this.simulator.venue().zones)`. Angular's hyper-fast change detection instantly recalculates the new density colors (e.g. #ef4444 Red) and changes the SVG bindings.
*   **Satellite Map (`earth-map.component.ts`)**: We planted an `effect()` hook that fires immediately whenever `this.venue()` changes. It sweeps through all active Leaflet markers, re-calculating their inline HTML and tooltips, producing an instant red flash update.

---

## 4. Real-time Notifications (AlertService)

Just like the Zone density, we also implemented synchronized push-notifications:
1. When the Admin clicks "Goal Scored!" it triggers the `AlertService` to write an event dictionary to a sub-collection: `stadiums/default/notifications/{id}`.
2. Every Spectator client has a second `onSnapshot` listener watching this exact collection.
3. As soon as the document writes, the Spectator clients pull the new document, push it into their local `alerts` Signal queue, and immediately pop open a UI Toast Banner reading "Goal Scored! Concessions are busy!".

---

## 5. Elimination of Background Drift
Originally, a `Simulation Tick` interval ran constantly to create randomized, realistic crowd movements. This was disabled to give the Admin **100% Manual Sovereignty** over the Map UI. If the Admin sets a Gate to 50%, it remains exactly and perpetually at 50% across all screens until explicitly moved again.
