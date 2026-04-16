import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { of } from 'rxjs';

// Mock Firebase functions
vi.mock('@angular/fire/auth', async () => {
  const actual = await vi.importActual('@angular/fire/auth');
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    authState: vi.fn().mockReturnValue(of(null))
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAuth = {};
    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should return true on successful login', async () => {
      (signInWithEmailAndPassword as any).mockResolvedValue({ user: {} });
      const result = await service.login('test@test.com', 'password');
      expect(result).toBe(true);
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    it('should return false on failed login', async () => {
      (signInWithEmailAndPassword as any).mockRejectedValue(new Error('Auth failed'));
      const result = await service.login('test@test.com', 'wrong');
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call signOut and navigate to login', async () => {
      (signOut as any).mockResolvedValue(undefined);
      await service.logout();
      expect(signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/login']);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if current user is set', () => {
      service.currentUser.set({ uid: '123' } as any);
      expect(service.isLoggedIn).toBe(true);
    });

    it('should return false if current user is null', () => {
      service.currentUser.set(null);
      expect(service.isLoggedIn).toBe(false);
    });
  });
});
