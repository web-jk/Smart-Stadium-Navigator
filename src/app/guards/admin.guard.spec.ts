import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { adminGuard } from './admin.guard';
import { of } from 'rxjs';
import { ExecutionContext } from '@angular/router';

// Mock authState function
vi.mock('@angular/fire/auth', async () => {
  const actual = await vi.importActual('@angular/fire/auth');
  return {
    ...actual,
    authState: vi.fn()
  };
});

describe('adminGuard', () => {
  let mockRouter: any;
  let mockAuth: any;

  beforeEach(() => {
    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue('url-tree')
    };
    mockAuth = {};

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth }
      ]
    });
  });

  it('should allow access if user is authenticated', async () => {
    (authState as any).mockReturnValue(of({ uid: '123' }));
    
    const result = await (TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)) as any).toPromise();
    expect(result).toBe(true);
  });

  it('should redirect if user is not authenticated', async () => {
    (authState as any).mockReturnValue(of(null));
    
    const result = await (TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)) as any).toPromise();
    expect(result).toBe('url-tree');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
  });
});
