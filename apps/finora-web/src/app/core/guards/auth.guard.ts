import { inject } from '@angular/core'; import { CanActivateFn, Router } from '@angular/router'; import { map } from 'rxjs'; import { AuthService } from '../auth/auth.service';
export const authGuard:CanActivateFn=()=>{const auth=inject(AuthService),router=inject(Router);return auth.isAuthenticated()?true:auth.restore().pipe(map(user=>user?true:router.createUrlTree(['/login'])));};
