# Feature Documentation: Smart Navigation & Routing

## Overview
The Smart Navigation feature helps fans find the most efficient path to their seat, food stalls, or restrooms, taking into account real-time crowd congestion and queuing times.

---

## 1. Key Components & Files

### **Services**
- **`src/app/services/location.service.ts`**: Handles the underlying pathfinding graph and geometry calculations.
- **`src/app/services/venue.service.ts`**: Provides the data for entrances, exits, and amenity locations.

### **Components**
- **`src/app/features/navigation/route-view/`**: Renders the visualized path (SVG polyline or Leaflet Polyline).
- **`src/app/features/navigation/search-bar/`**: Smart search for stadium locations.
- **`src/app/features/find-nearest/`**: Quick-action logic for finding the closest restroom/food.

---

## 2. Technical Implementation

### **The Pathfinding Algorithm**
We use a **Weighted Dijkstra's Algorithm** for routing within the stadium:
- **Nodes**: Strategic "Waypoints" (Gates, Stand entrances, concourse intersections).
- **Edges**: Paths between waypoints.
- **Dynamic Weights**: Unlike static GPS, our edges change weight based on `SimulatorService` data:
  - `Weight = Distance + (CrowdDensity * CongestionPenalty)`.
  - This ensures users are routed *around* a congested gate, even if it's slightly further away.

### **Types of Search**
1. **Direct Search**: "Where is Block A?" -> Highlights the exact SVG path.
2. **Category Search**: "Food" -> Shows all food stalls with wait times.
3. **Smart Routine**: "Show me the way to Seat 40, bypassing the busy South Gate."

---

## 3. Real-time Integration
- **Congestion Awareness**: As the Admin increases density in the "North Concourse," the navigation engine automatically updates ongoing routes to suggest the "East Concourse" instead.
- **ETA Calculation**: Displayed ETAs are updated every 10 seconds based on live queue data from the `StatsService`.

---

## 4. Visual Presentation
- **SVG Pathing**: A dashed, animated line `stroke-dasharray` is drawn on the Schematic Map.
- **Turn-by-Turn**: Simplified instructions are provided bottom-of-screen (e.g., "Enter through Gate 3, take the 1st left").
- **Wayfinding Markers**: Pulsing "You Are Here" and "Destination" markers.

---

## 5. Deployment Notes
- Navigation waypoints are stored in `src/app/data/stadium-graph.json` (or similar).
- Admins can modify the graph structure in the Admin Panel to account for temporary construction or blocked zones.
