import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-sso-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<p style="padding:24px">Validando tu cuenta institucional…</p>`,
})
export class SsoCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  async ngOnInit() {
    const fragment = new URLSearchParams(this.route.snapshot.fragment ?? '');
    const token = fragment.get('token') ?? this.route.snapshot.queryParamMap.get('token');
    if (fragment.has('token')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (token) {
      this.auth.guardarSesion(token);
      await this.auth.cargarPerfil();
      const u = this.auth.usuario();
      this.router.navigate([u?.rol === 'ADMIN' ? '/admin/dashboard' : '/encuesta']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
