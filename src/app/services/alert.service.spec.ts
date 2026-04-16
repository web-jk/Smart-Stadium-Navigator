import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { Firestore } from '@angular/fire/firestore';
import { NgZone } from '@angular/core';

describe('AlertService', () => {
  let service: AlertService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = {}; // Minimal mock for testing local behavior

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: Firestore, useValue: mockFirestore },
        { 
          provide: NgZone, 
          useValue: { run: (fn: Function) => fn() } 
        }
      ]
    });
    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('alert management', () => {
    it('should push a local alert and auto-dismiss it', fakeAsync(() => {
      service.push({
        message: 'Test Alert',
        severity: 'info',
        icon: '🔔',
        duration: 1000
      });

      expect(service.alerts().length).toBe(1);
      expect(service.alerts()[0].message).toBe('Test Alert');

      tick(1500); // Wait for auto-dismiss
      expect(service.alerts().length).toBe(0);
    }));

    it('should dismiss an alert manually by ID', () => {
      service.push({
        message: 'Manual Dismiss',
        severity: 'info',
        icon: '🔔'
      });
      const id = service.alerts()[0].id;
      
      service.dismiss(id);
      expect(service.alerts().length).toBe(0);
    });

    it('should clear all alerts', () => {
      service.push({ message: 'A1', severity: 'info', icon: '1' });
      service.push({ message: 'A2', severity: 'info', icon: '2' });
      service.clearAll();
      expect(service.alerts().length).toBe(0);
    });
  });

  describe('pre-built alerts', () => {
    it('should trigger goalScored alert', () => {
      service.goalScored();
      expect(service.alerts().length).toBe(1);
      expect(service.alerts()[0].message).toContain('WICKET');
    });

    it('should trigger rainAlert', () => {
      service.rainAlert();
      expect(service.alerts()[0].message).toContain('Rain detected');
    });
  });
});
