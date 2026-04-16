# Feature Documentation: Admin Control Panel

## Overview
The Admin Control Panel is the "Command Center" of the Stadium. It allows stadium operators to manipulate crowd data, trigger emergency events, and update the stadium layout without affecting live users until the changes are verified.

---

## 1. Key Components & Files

### **Architecture**
- **`src/app/features/admin/`**: The root module for all administrative features.
- **`src/app/guards/admin.guard.ts`**: Protects all administrative routes via Firebase Auth check.

### **Core Components**
- **`dashboard/`**: Overview of stadium occupancy and active alerts.
- **`stadium-editor/`**: A "What You See Is What You Get" (WYSIWYG) interface for managing zones.
- **`event-triggers/`**: Quick-action buttons for Match Events (Goal, Kickoff, evacuation).

---

## 2. The "Draft & Publish" Workflow
To prevent accidental disruptions, we implemented a two-stage deployment system:

1. **Draft Mode (`stadiums/draft`)**:
   - Admins can freely move markers, rename zones, and test density scenarios.
   - These changes are saved to a separate Firestore document.
   - Normal spectators NEVER see these changes.
2. **Preview**:
   - Admins can see a "Live Preview" on the same page showing how the changes will look to fans.
3. **Publishing (`stadiums/default`)**:
   - When the Admin clicks **"Publish Live"**, the contents of `draft` are atomically copied to the `default` document.
   - This triggers the Real-time Sync broadcast to every fan's phone simultaneously.

---

## 3. Operations & Controls

### **Crowd Density Sliders**
- Granular control (0-100%) for every single stand and gate.
- Manual override: Disables automatic simulation to ensure the Admin's settings are strictly enforced.

### **Event Broadcasting**
- A specialized interface for sending system-wide notifications.
- Preset templates for standard match events (e.g., "Full Time - Please exit via designated gates").

### **Map Configuration**
- Ability to crop the satellite view map.
- Coordinate adjustment for SVG elements to ensure perfect alignment with real-world geography.

---

## 4. Security
- **Authentication**: Linked to Firebase Auth (Social or Email login).
- **Authorization**: Only users with the `admin` flag in their profile can access this panel.
- **Audit Log**: Every "Publish" action is recorded with a timestamp and the Admin's ID (optional enhancement).

---

## 5. Mobile Responsiveness
The Admin Panel is fully responsive, allowing stadium staff to manage markers and density from a tablet or phone while moving throughout the venue.
