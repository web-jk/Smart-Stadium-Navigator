import { Venue, Zone } from '../models/venue.model';

const MCA_CENTER = { lat: 18.6745, lng: 73.7063 };

export const STADIUM_DATA: Venue = {
  id: 'mca-pune-stadium',
  name: 'MCA International Stadium (Pune)',
  type: 'stadium',
  capacity: 37406,
  currentAttendance: 0,
  eventName: 'Cricket IPL Match',
  eventPhase: 'pre-game',
  isInitialized: true,
  viewBounds: {
    north: 18.6760,
    south: 18.6730,
    east: 73.7078,
    west: 73.7048
  },
  center: MCA_CENTER,
  zones: [
    {
      id: 'z-north',
      name: 'Hill End (North Stand)',
      type: 'seating',
      svgPathId: '',
      position: { x: 200, y: 50 },
      geoPos: { lat: 18.675625, lng: 73.7063 },
      capacity: 8000,
      crowdDensity: 0.2,
      previousDensity: 0.2,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-south',
      name: 'Pavilion End (South Stand)',
      type: 'seating',
      svgPathId: '',
      position: { x: 200, y: 350 },
      geoPos: { lat: 18.673375, lng: 73.7063 },
      capacity: 8000,
      crowdDensity: 0.1,
      previousDensity: 0.1,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-east',
      name: 'East Stand',
      type: 'seating',
      svgPathId: '',
      position: { x: 350, y: 200 },
      geoPos: { lat: 18.6745, lng: 73.707425 },
      capacity: 12000,
      crowdDensity: 0.3,
      previousDensity: 0.3,
      waitTimeMinutes: 0,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-west',
      name: 'West Stand (Corporate/VIP)',
      type: 'vip',
      svgPathId: '',
      position: { x: 50, y: 200 },
      geoPos: { lat: 18.6745, lng: 73.705175 },
      capacity: 5000,
      crowdDensity: 0.4,
      previousDensity: 0.4,
      waitTimeMinutes: 2,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-food-east',
      name: 'East Concession',
      type: 'concession',
      svgPathId: '',
      position: { x: 310, y: 100 },
      geoPos: { lat: 18.67525, lng: 73.707125 },
      capacity: 1000,
      crowdDensity: 0.1,
      previousDensity: 0.1,
      waitTimeMinutes: 1,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-rest-south',
      name: 'South Restrooms',
      type: 'restroom',
      svgPathId: '',
      position: { x: 100, y: 310 },
      geoPos: { lat: 18.673675, lng: 73.70555 },
      capacity: 500,
      crowdDensity: 0.05,
      previousDensity: 0.05,
      waitTimeMinutes: 1,
      trend: 'stable',
      amenities: [],
      isOpen: true
    },
    {
      id: 'z-gate-north',
      name: 'North Gate Entrance',
      type: 'entrance',
      svgPathId: '',
      position: { x: 200, y: 20 },
      geoPos: { lat: 18.67585, lng: 73.7063 },
      capacity: 2000,
      crowdDensity: 0.8,
      previousDensity: 0.8,
      waitTimeMinutes: 12,
      trend: 'falling',
      amenities: [],
      isOpen: true
    }
  ],
  connections: []
};
