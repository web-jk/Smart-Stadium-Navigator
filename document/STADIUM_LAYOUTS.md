# Feature Documentation: Interactive Stadium Stadium Layouts

## Overview
StadiumFlow provides two primary ways to visualize the venue: a **Schematic SVG View** for rapid tactical overview and an **Earth (Satellite) View** for realistic spatial context and external surroundings navigation.

---

## 1. Key Components & Files

### **Schematic View (SVG Map)**
- **`src/app/features/map/stadium-map/`**: The main SVG container.
- **`src/app/features/map/zone/`**: Individual reactive zone components within the SVG.
- **Logic**: Uses coordinate-mapped paths to represent stands, gates, and amenities.

### **Earth View (Satellite Map)**
- **`src/app/features/explorer/explorer.component.ts`**: Integration logic for Leaflet.js.
- **`src/app/services/location.service.ts`**: Handles GPS to SVG coordinate transformation.
- **Logic**: Renders a high-resolution satellite tile layer with interactive overlays.

---

## 2. Feature Details

### **1. Schematic SVG View**
The Schematic view is the default interface. It is lightweight, fast, and highly stylized.
- **Dynamic Coloring**: Each zone path changes color based on `crowdDensity` (Green < 40%, Yellow < 70%, Red > 70%).
- **Interactive Tapping**: Clicking a zone opens a `ZoneDetail` panel with specific capacity, wait times, and rapid actions.
- **Pinch-to-Zoom**: Implemented via custom SVG transform logic for mobile usability.

### **2. Earth (Satellite) View**
Triggered by the "Explore Stadium" button, this view leverages specialized spatial data.
- **Base Layer**: Mapbox/Leaflet Satellite tiles.
- **Custom Overlays**: We draw the stadium schematic *on top* of the satellite image, meticulously aligned using GeoJSON latitude/longitude offsets.
- **Amenity Markers**: Uses custom icons for Food, Restrooms, and First Aid that scale with zoom level.
- **Sync**: If an admin updates a zone's density, both the SVG map and the Earth View markers update simultaneously.

---

## 3. Coordinate Mapping Engine
One of the project's most complex logic pieces is the **Unified Coordinate System**.
- **The Problem**: SVG uses 0-1000 pixels; Leaflet uses Global Lat/Lng.
- **The Solution**: The `LocationService` uses a **Linear Transformation Matrix**.
  - We define 4 "Anchor Points" in the stadium (e.g., Corner of North Stand).
  - We map their SVG (x, y) to their real-world (lat, lng).
  - Every other point is calculated via interpolation, ensuring markers placed in one view appear perfectly in the other.

---

## 4. Animation & UX
- **Pulse Effect**: When a search is performed, the target zone pulses using CSS `@keyframes`.
- **Transitions**: Smooth cross-fades when switching between Schematic and Earth views.
- **Clustering**: In Earth view, if many amenities are close together, they cluster to prevent UI clutter.

---

## 5. Integration Points
- **Admin**: Admins use the Earth View to drag-and-drop new amenities or gate locations precisely.
- **Navigation**: Search results highlight the fastest route path directly on the SVG or Satellite map.
