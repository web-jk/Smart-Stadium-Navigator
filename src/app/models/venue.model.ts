export interface Venue {
  id: string;
  name: string;
  type: 'stadium' | 'arena';
  capacity: number;
  currentAttendance: number;
  eventName: string;
  eventPhase: EventPhase;
  zones: Zone[];
  connections: ZoneConnection[];
  center?: { lat: number; lng: number }; // Stadium center coords
  isInitialized?: boolean;               // For blank-start flow
  viewBounds?: {                         // ROI for schematic alignment
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export type EventPhase = 'pre-game' | 'active' | 'halftime' | 'post-game';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  svgPathId: string;
  position: { x: number; y: number };
  capacity: number;
  crowdDensity: number;       // 0.0 - 1.0
  previousDensity: number;
  waitTimeMinutes: number;
  trend: 'rising' | 'falling' | 'stable';
  amenities: Amenity[];
  isOpen: boolean;
  radius?: number;     // Optional override for map circle size
  customIcon?: string; // Optional override for marker icon
  geoPos?: { lat: number; lng: number }; // Precise GPS coords for satellite map
}

export type ZoneType =
  | 'entrance'
  | 'concession'
  | 'restroom'
  | 'seating'
  | 'merchandise'
  | 'corridor'
  | 'vip'
  | 'exit'
  | 'medical';

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  icon: string;
}

export type AmenityType = 'food' | 'drinks' | 'restroom' | 'atm' | 'merchandise' | 'info' | 'medical' | 'water';

export interface ZoneConnection {
  from: string;    // zone id
  to: string;      // zone id
  distance: number; // in meters
  travelTime: number; // base travel time in seconds
}

export type DensityLevel = 'low' | 'medium' | 'high' | 'critical';

export function getDensityLevel(density: number): DensityLevel {
  if (density < 0.3) return 'low';
  if (density < 0.6) return 'medium';
  if (density < 0.85) return 'high';
  return 'critical';
}

export function getDensityLabel(density: number): string {
  const level = getDensityLevel(density);
  switch (level) {
    case 'low': return 'Low Crowd';
    case 'medium': return 'Moderate';
    case 'high': return 'Busy';
    case 'critical': return 'Very Busy';
  }
}

export function getDensityColor(density: number): string {
  const level = getDensityLevel(density);
  switch (level) {
    case 'low': return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    case 'critical': return '#dc2626';
  }
}

export interface NavigationRoute {
  path: string[];          // ordered zone IDs
  totalDistance: number;    // meters
  estimatedTime: number;   // seconds
  congestionScore: number; // 0-1
  steps: RouteStep[];
}

export interface RouteStep {
  fromZone: string;
  toZone: string;
  direction: string;
  distance: number;
  density: number;
}

export interface SmartRecommendation {
  zone: Zone;
  distance: number;
  estimatedWalkTime: number;
  reason: string;
}

export interface RealTimeUpdate {
  type: 'zone-update' | 'alert' | 'event-change';
  timestamp: number;
  data: ZoneUpdate | AlertData | EventChangeData;
}

export interface ZoneUpdate {
  zoneId: string;
  crowdDensity: number;
  waitTimeMinutes: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface AlertData {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  icon: string;
  duration: number; // ms
}

export interface EventChangeData {
  phase: EventPhase;
  label: string;
}
