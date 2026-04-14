import { Venue } from '../models/venue.model';

export const STADIUM_DATA: Venue = {
  id: 'stadium-a',
  name: 'MCA Stadium, Pune',
  type: 'stadium',
  capacity: 37000,
  currentAttendance: 32500,
  eventName: 'IPL Finals 2026',
  eventPhase: 'active',
  zones: [
    // === ENTRANCES (Gates) ===
    {
      id: 'gate-north',
      name: 'North Gate',
      type: 'entrance',
      svgPathId: 'zone-gate-north',
      position: { x: 200, y: 30 },
      capacity: 5000,
      crowdDensity: 0.35,
      previousDensity: 0.35,
      waitTimeMinutes: 2,
      trend: 'stable',
      amenities: [
        { id: 'info-n', name: 'Info Desk', type: 'info', icon: 'ℹ️' }
      ],
      isOpen: true
    },
    {
      id: 'gate-south',
      name: 'South Gate',
      type: 'entrance',
      svgPathId: 'zone-gate-south',
      position: { x: 200, y: 370 },
      capacity: 5000,
      crowdDensity: 0.55,
      previousDensity: 0.55,
      waitTimeMinutes: 5,
      trend: 'stable',
      amenities: [
        { id: 'info-s', name: 'Info Desk', type: 'info', icon: 'ℹ️' }
      ],
      isOpen: true
    },
    {
      id: 'gate-east',
      name: 'East Gate',
      type: 'entrance',
      svgPathId: 'zone-gate-east',
      position: { x: 370, y: 200 },
      capacity: 4000,
      crowdDensity: 0.20,
      previousDensity: 0.20,
      waitTimeMinutes: 1,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'gate-west',
      name: 'West Gate',
      type: 'entrance',
      svgPathId: 'zone-gate-west',
      position: { x: 30, y: 200 },
      capacity: 4000,
      crowdDensity: 0.70,
      previousDensity: 0.70,
      waitTimeMinutes: 8,
      trend: 'rising',
      amenities: [],
      isOpen: true
    },

    // === CONCESSIONS / FOOD ===
    {
      id: 'food-north',
      name: 'North Food Court',
      type: 'concession',
      svgPathId: 'zone-food-north',
      position: { x: 140, y: 80 },
      capacity: 800,
      crowdDensity: 0.45,
      previousDensity: 0.45,
      waitTimeMinutes: 6,
      trend: 'stable',
      amenities: [
        { id: 'f1', name: 'Burgers & Fries', type: 'food', icon: '🍔' },
        { id: 'f2', name: 'Cold Drinks', type: 'drinks', icon: '🥤' }
      ],
      isOpen: true
    },
    {
      id: 'food-south',
      name: 'South Food Plaza',
      type: 'concession',
      svgPathId: 'zone-food-south',
      position: { x: 260, y: 320 },
      capacity: 1000,
      crowdDensity: 0.78,
      previousDensity: 0.78,
      waitTimeMinutes: 14,
      trend: 'rising',
      amenities: [
        { id: 'f3', name: 'Pizza Station', type: 'food', icon: '🍕' },
        { id: 'f4', name: 'Nachos & Wings', type: 'food', icon: '🌮' },
        { id: 'f5', name: 'Craft Beer Bar', type: 'drinks', icon: '🍺' }
      ],
      isOpen: true
    },
    {
      id: 'food-east',
      name: 'East Snack Bar',
      type: 'concession',
      svgPathId: 'zone-food-east',
      position: { x: 340, y: 140 },
      capacity: 500,
      crowdDensity: 0.25,
      previousDensity: 0.25,
      waitTimeMinutes: 3,
      trend: 'falling',
      amenities: [
        { id: 'f6', name: 'Hot Dogs', type: 'food', icon: '🌭' },
        { id: 'f7', name: 'Soft Drinks', type: 'drinks', icon: '🥤' }
      ],
      isOpen: true
    },
    {
      id: 'food-west',
      name: 'West Grill',
      type: 'concession',
      svgPathId: 'zone-food-west',
      position: { x: 60, y: 270 },
      capacity: 600,
      crowdDensity: 0.60,
      previousDensity: 0.60,
      waitTimeMinutes: 9,
      trend: 'stable',
      amenities: [
        { id: 'f8', name: 'BBQ Grill', type: 'food', icon: '🥩' },
        { id: 'f9', name: 'Beverages', type: 'drinks', icon: '☕' }
      ],
      isOpen: true
    },

    // === RESTROOMS ===
    {
      id: 'restroom-ne',
      name: 'NE Restroom',
      type: 'restroom',
      svgPathId: 'zone-restroom-ne',
      position: { x: 310, y: 80 },
      capacity: 200,
      crowdDensity: 0.30,
      previousDensity: 0.30,
      waitTimeMinutes: 2,
      trend: 'stable',
      amenities: [
        { id: 'r1', name: 'Restrooms', type: 'restroom', icon: '🚻' },
        { id: 'w1', name: 'Water Fountain', type: 'water', icon: '💧' }
      ],
      isOpen: true
    },
    {
      id: 'restroom-nw',
      name: 'NW Restroom',
      type: 'restroom',
      svgPathId: 'zone-restroom-nw',
      position: { x: 90, y: 80 },
      capacity: 200,
      crowdDensity: 0.72,
      previousDensity: 0.72,
      waitTimeMinutes: 10,
      trend: 'rising',
      amenities: [
        { id: 'r2', name: 'Restrooms', type: 'restroom', icon: '🚻' }
      ],
      isOpen: true
    },
    {
      id: 'restroom-se',
      name: 'SE Restroom',
      type: 'restroom',
      svgPathId: 'zone-restroom-se',
      position: { x: 310, y: 320 },
      capacity: 200,
      crowdDensity: 0.50,
      previousDensity: 0.50,
      waitTimeMinutes: 5,
      trend: 'stable',
      amenities: [
        { id: 'r3', name: 'Restrooms', type: 'restroom', icon: '🚻' },
        { id: 'w2', name: 'Water Fountain', type: 'water', icon: '💧' }
      ],
      isOpen: true
    },
    {
      id: 'restroom-sw',
      name: 'SW Restroom',
      type: 'restroom',
      svgPathId: 'zone-restroom-sw',
      position: { x: 90, y: 320 },
      capacity: 200,
      crowdDensity: 0.88,
      previousDensity: 0.88,
      waitTimeMinutes: 15,
      trend: 'rising',
      amenities: [
        { id: 'r4', name: 'Restrooms', type: 'restroom', icon: '🚻' }
      ],
      isOpen: true
    },

    // === MERCHANDISE ===
    {
      id: 'merch-main',
      name: 'Team Store',
      type: 'merchandise',
      svgPathId: 'zone-merch-main',
      position: { x: 60, y: 140 },
      capacity: 400,
      crowdDensity: 0.55,
      previousDensity: 0.55,
      waitTimeMinutes: 7,
      trend: 'stable',
      amenities: [
        { id: 'm1', name: 'Official Merchandise', type: 'merchandise', icon: '👕' },
        { id: 'a1', name: 'ATM', type: 'atm', icon: '🏧' }
      ],
      isOpen: true
    },

    // === SEATING SECTIONS ===
    {
      id: 'seating-north',
      name: 'North Stand',
      type: 'seating',
      svgPathId: 'zone-seating-north',
      position: { x: 200, y: 120 },
      capacity: 20000,
      crowdDensity: 0.85,
      previousDensity: 0.85,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'seating-south',
      name: 'South Stand',
      type: 'seating',
      svgPathId: 'zone-seating-south',
      position: { x: 200, y: 280 },
      capacity: 20000,
      crowdDensity: 0.90,
      previousDensity: 0.90,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'seating-east',
      name: 'East Stand',
      type: 'seating',
      svgPathId: 'zone-seating-east',
      position: { x: 300, y: 200 },
      capacity: 15000,
      crowdDensity: 0.80,
      previousDensity: 0.80,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'seating-west',
      name: 'West Stand',
      type: 'seating',
      svgPathId: 'zone-seating-west',
      position: { x: 100, y: 200 },
      capacity: 15000,
      crowdDensity: 0.75,
      previousDensity: 0.75,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },

    // === VIP ===
    {
      id: 'vip-lounge',
      name: 'VIP Lounge',
      type: 'vip',
      svgPathId: 'zone-vip',
      position: { x: 340, y: 260 },
      capacity: 500,
      crowdDensity: 0.30,
      previousDensity: 0.30,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [
        { id: 'v1', name: 'Premium Dining', type: 'food', icon: '🥂' },
        { id: 'v2', name: 'Private Restroom', type: 'restroom', icon: '🚻' }
      ],
      isOpen: true
    },

    // === MEDICAL ===
    {
      id: 'medical-center',
      name: 'Medical Center',
      type: 'medical',
      svgPathId: 'zone-medical',
      position: { x: 200, y: 200 },
      capacity: 50,
      crowdDensity: 0.10,
      previousDensity: 0.10,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [
        { id: 'med1', name: 'First Aid', type: 'medical', icon: '🏥' }
      ],
      isOpen: true
    }
  ],
  connections: [
    // North Gate connections
    { from: 'gate-north', to: 'food-north', distance: 50, travelTime: 40 },
    { from: 'gate-north', to: 'restroom-ne', distance: 80, travelTime: 60 },
    { from: 'gate-north', to: 'restroom-nw', distance: 80, travelTime: 60 },
    { from: 'gate-north', to: 'seating-north', distance: 60, travelTime: 45 },

    // South Gate connections
    { from: 'gate-south', to: 'food-south', distance: 50, travelTime: 40 },
    { from: 'gate-south', to: 'restroom-se', distance: 80, travelTime: 60 },
    { from: 'gate-south', to: 'restroom-sw', distance: 80, travelTime: 60 },
    { from: 'gate-south', to: 'seating-south', distance: 60, travelTime: 45 },

    // East Gate connections
    { from: 'gate-east', to: 'food-east', distance: 40, travelTime: 30 },
    { from: 'gate-east', to: 'restroom-ne', distance: 70, travelTime: 55 },
    { from: 'gate-east', to: 'restroom-se', distance: 70, travelTime: 55 },
    { from: 'gate-east', to: 'seating-east', distance: 50, travelTime: 40 },
    { from: 'gate-east', to: 'vip-lounge', distance: 60, travelTime: 45 },

    // West Gate connections
    { from: 'gate-west', to: 'food-west', distance: 40, travelTime: 30 },
    { from: 'gate-west', to: 'restroom-nw', distance: 70, travelTime: 55 },
    { from: 'gate-west', to: 'restroom-sw', distance: 70, travelTime: 55 },
    { from: 'gate-west', to: 'seating-west', distance: 50, travelTime: 40 },
    { from: 'gate-west', to: 'merch-main', distance: 30, travelTime: 25 },

    // Food-Food cross links
    { from: 'food-north', to: 'food-east', distance: 120, travelTime: 90 },
    { from: 'food-south', to: 'food-west', distance: 120, travelTime: 90 },

    // Food-Restroom adjacencies
    { from: 'food-north', to: 'restroom-nw', distance: 40, travelTime: 30 },
    { from: 'food-east', to: 'restroom-ne', distance: 40, travelTime: 30 },
    { from: 'food-south', to: 'restroom-se', distance: 40, travelTime: 30 },
    { from: 'food-west', to: 'restroom-sw', distance: 40, travelTime: 30 },

    // Seating cross links
    { from: 'seating-north', to: 'seating-east', distance: 100, travelTime: 75 },
    { from: 'seating-north', to: 'seating-west', distance: 100, travelTime: 75 },
    { from: 'seating-south', to: 'seating-east', distance: 100, travelTime: 75 },
    { from: 'seating-south', to: 'seating-west', distance: 100, travelTime: 75 },

    // Seating to concessions
    { from: 'seating-north', to: 'food-north', distance: 60, travelTime: 45 },
    { from: 'seating-south', to: 'food-south', distance: 60, travelTime: 45 },
    { from: 'seating-east', to: 'food-east', distance: 50, travelTime: 40 },
    { from: 'seating-west', to: 'food-west', distance: 50, travelTime: 40 },

    // VIP connections
    { from: 'vip-lounge', to: 'seating-east', distance: 40, travelTime: 30 },
    { from: 'vip-lounge', to: 'food-south', distance: 60, travelTime: 45 },
    { from: 'vip-lounge', to: 'restroom-se', distance: 50, travelTime: 35 },

    // Medical center (central, connected to key zones)
    { from: 'medical-center', to: 'seating-north', distance: 80, travelTime: 60 },
    { from: 'medical-center', to: 'seating-south', distance: 80, travelTime: 60 },
    { from: 'medical-center', to: 'seating-east', distance: 80, travelTime: 60 },
    { from: 'medical-center', to: 'seating-west', distance: 80, travelTime: 60 },

    // Merchandise adjacencies
    { from: 'merch-main', to: 'food-west', distance: 50, travelTime: 35 },
    { from: 'merch-main', to: 'restroom-nw', distance: 60, travelTime: 45 },
    { from: 'merch-main', to: 'seating-west', distance: 50, travelTime: 40 }
  ]
};
