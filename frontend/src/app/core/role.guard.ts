import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = route.data?.['rol'] as string | undefined;
  if (rol && auth.usuario()?.rol !== rol) {
    router.navigate(['/encuesta']);
    return false;
  }
  return true;
};
