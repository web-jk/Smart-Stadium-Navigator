import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;  // meters
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService implements OnDestroy {

  // ─── MCA Stadium, Pune coordinates ─────────────────────
  readonly stadiumCenter = { lat: 18.6744, lng: 73.7067 };

  // ─── State (Signals) ──────────────────────────────────
  currentPosition = signal<GeoPosition | null>(null);
  isTracking = signal(false);
  locationError = signal<string>('');
  permissionState = signal<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');

  // ─── Computed ──────────────────────────────────────────
  distanceToStadium = computed(() => {
    const pos = this.currentPosition();
    if (!pos) return null;
    return this.haversineDistance(
      pos.lat, pos.lng,
      this.stadiumCenter.lat, this.stadiumCenter.lng
    );
  });

  distanceLabel = computed(() => {
    const dist = this.distanceToStadium();
    if (dist === null) return '';
    if (dist < 1000) return `${Math.round(dist)}m away`;
    return `${(dist / 1000).toFixed(1)}km away`;
  });

  private watchId: number | null = null;

  // ─── Methods ───────────────────────────────────────────

  startTracking(): void {
    if (!navigator.geolocation) {
      this.permissionState.set('unavailable');
      this.locationError.set('Geolocation is not supported by this browser');
      return;
    }

    this.isTracking.set(true);
    this.locationError.set('');

    // Check permission state if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        this.permissionState.set(result.state as any);
        result.addEventListener('change', () => {
          this.permissionState.set(result.state as any);
        });
      }).catch(() => {
        // permissions API not supported, continue anyway
      });
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition.set({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        this.permissionState.set('granted');
        this.locationError.set('');
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.permissionState.set('denied');
            this.locationError.set('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError.set('Location unavailable');
            break;
          case error.TIMEOUT:
            this.locationError.set('Location request timed out');
            break;
        }
        this.isTracking.set(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking.set(false);
  }

  /** Haversine formula — distance between two lat/lng points in meters */
  private haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }
}
