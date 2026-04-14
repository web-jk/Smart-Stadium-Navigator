import { Injectable, computed } from '@angular/core';
import { SimulatorService } from './simulator.service';
import {
  Zone,
  ZoneType,
  NavigationRoute,
  RouteStep,
  SmartRecommendation,
  getDensityLevel
} from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class VenueService {

  constructor(private simulator: SimulatorService) {}

  /** Get all zones */
  readonly zones = computed(() => this.simulator.venue().zones);

  /** Get a specific zone by ID */
  getZone(zoneId: string): Zone | undefined {
    return this.simulator.venue().zones.find(z => z.id === zoneId);
  }

  /** Find nearest zones of a type, sorted by wait time then distance */
  findNearest(
    type: ZoneType | 'food',
    fromZoneId?: string
  ): SmartRecommendation[] {
    const venue = this.simulator.venue();
    const targetTypes: ZoneType[] = type === 'food' ? ['concession'] : [type];

    const candidates = venue.zones.filter(z =>
      targetTypes.includes(z.type) && z.isOpen
    );

    return candidates
      .map(zone => {
        const distance = fromZoneId
          ? this.estimateDistance(fromZoneId, zone.id)
          : 100; // default if no location
        const walkTime = Math.round(distance / 1.2); // ~1.2 m/s walking speed

        return {
          zone,
          distance,
          estimatedWalkTime: walkTime,
          reason: this.getRecommendationReason(zone, walkTime)
        } as SmartRecommendation;
      })
      .sort((a, b) => {
        // Sort by combined score: wait time + walk time
        const scoreA = a.zone.waitTimeMinutes * 60 + a.estimatedWalkTime;
        const scoreB = b.zone.waitTimeMinutes * 60 + b.estimatedWalkTime;
        return scoreA - scoreB;
      });
  }

  /** Calculate a navigation route using Dijkstra's algorithm (crowd-aware) */
  calculateRoute(fromZoneId: string, toZoneId: string): NavigationRoute | null {
    const venue = this.simulator.venue();
    const zones = venue.zones;
    const connections = venue.connections;

    // Build adjacency list (bidirectional)
    const adj = new Map<string, { to: string; distance: number; time: number }[]>();
    for (const conn of connections) {
      if (!adj.has(conn.from)) adj.set(conn.from, []);
      if (!adj.has(conn.to)) adj.set(conn.to, []);
      adj.get(conn.from)!.push({ to: conn.to, distance: conn.distance, time: conn.travelTime });
      adj.get(conn.to)!.push({ to: conn.from, distance: conn.distance, time: conn.travelTime });
    }

    // Dijkstra with crowd-aware edge weights
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const visited = new Set<string>();

    for (const zone of zones) {
      dist.set(zone.id, Infinity);
    }
    dist.set(fromZoneId, 0);

    while (true) {
      // Find unvisited node with minimum distance
      let minDist = Infinity;
      let current = '';
      for (const [id, d] of dist) {
        if (!visited.has(id) && d < minDist) {
          minDist = d;
          current = id;
        }
      }

      if (!current || current === toZoneId) break;
      visited.add(current);

      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.to)) continue;

        // Weight = time + density penalty (congested zones cost more)
        const targetZone = zones.find(z => z.id === neighbor.to);
        const densityPenalty = targetZone ? targetZone.crowdDensity * 60 : 0; // up to 60s penalty
        const weight = neighbor.time + densityPenalty;

        const newDist = (dist.get(current) ?? Infinity) + weight;
        if (newDist < (dist.get(neighbor.to) ?? Infinity)) {
          dist.set(neighbor.to, newDist);
          prev.set(neighbor.to, current);
        }
      }
    }

    // Reconstruct path
    if (!prev.has(toZoneId) && fromZoneId !== toZoneId) return null;

    const path: string[] = [];
    let current = toZoneId;
    while (current) {
      path.unshift(current);
      current = prev.get(current) ?? '';
      if (current === fromZoneId) {
        path.unshift(fromZoneId);
        break;
      }
    }

    if (path[0] !== fromZoneId) return null;

    // Build steps
    const steps: RouteStep[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    let congestionSum = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i];
      const toId = path[i + 1];
      const conn = connections.find(
        c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
      );
      const targetZone = zones.find(z => z.id === toId);

      const distance = conn?.distance ?? 50;
      const density = targetZone?.crowdDensity ?? 0.3;

      steps.push({
        fromZone: fromId,
        toZone: toId,
        direction: this.getDirection(fromId, toId),
        distance,
        density
      });

      totalDistance += distance;
      totalTime += (conn?.travelTime ?? 40) * (1 + density * 0.5); // crowd slows you down
      congestionSum += density;
    }

    return {
      path,
      totalDistance,
      estimatedTime: Math.round(totalTime),
      congestionScore: steps.length > 0 ? congestionSum / steps.length : 0,
      steps
    };
  }

  private estimateDistance(fromId: string, toId: string): number {
    const venue = this.simulator.venue();
    const fromZone = venue.zones.find(z => z.id === fromId);
    const toZone = venue.zones.find(z => z.id === toId);
    if (!fromZone || !toZone) return 200;

    const dx = fromZone.position.x - toZone.position.x;
    const dy = fromZone.position.y - toZone.position.y;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }

  private getDirection(fromId: string, toId: string): string {
    const venue = this.simulator.venue();
    const from = venue.zones.find(z => z.id === fromId);
    const to = venue.zones.find(z => z.id === toId);
    if (!from || !to) return 'Continue ahead';

    const dx = to.position.x - from.position.x;
    const dy = to.position.y - from.position.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'Head East →' : 'Head West ←';
    } else {
      return dy > 0 ? 'Head South ↓' : 'Head North ↑';
    }
  }

  private getRecommendationReason(zone: Zone, walkTimeSec: number): string {
    const level = getDensityLevel(zone.crowdDensity);
    const walkMin = Math.round(walkTimeSec / 60);

    if (level === 'low' && walkMin <= 2) return '⚡ Fastest option — low crowd, close by';
    if (level === 'low') return '✅ Low crowd — worth the walk';
    if (level === 'medium' && walkMin <= 1) return '👍 Moderate crowd but very close';
    if (level === 'medium') return '⏱️ Moderate crowds — decent option';
    if (level === 'high') return '⚠️ Busy — consider alternatives';
    return '🔴 Very busy — long wait expected';
  }
}
