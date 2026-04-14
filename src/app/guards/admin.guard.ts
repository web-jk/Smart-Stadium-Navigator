import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // We use authState to determine if someone is logged in
  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        return router.createUrlTree(['/admin/login']);
      }
    })
  );
};
