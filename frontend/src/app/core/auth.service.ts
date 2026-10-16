import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  semestre: number;
  rol: 'ESTUDIANTE' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;

  token = signal<string | null>(localStorage.getItem('token'));
  usuario = signal<Usuario | null>(null);
  logueado = computed(() => !!this.token());
  esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  async cargarPerfil() {
    if (!this.token()) return;
    try {
      const u = await this.http.get<Usuario>(`${this.base}/me`).toPromise();
      if (u) this.usuario.set(u);
    } catch {
      this.salir(false);
    }
  }

  guardarSesion(access_token: string) {
    localStorage.setItem('token', access_token);
    this.token.set(access_token);
  }

  async ingresar(correo: string, password: string) {
    const r = await this.http.post<{ access_token: string }>(`${this.base}/login`, { correo, password }).toPromise();
    this.guardarSesion(r!.access_token);
    await this.cargarPerfil();
  }

  solicitarRecuperacion(correo: string) {
    return this.http.post<{ mensaje: string }>(`${this.base}/recuperar`, { correo }).toPromise();
  }

  restablecerClave(token: string, password: string) {
    return this.http.post<{ mensaje: string }>(`${this.base}/restablecer`, { token, password }).toPromise();
  }

  salir(redirigir = true) {
    localStorage.removeItem('token');
    this.token.set(null);
    this.usuario.set(null);
    if (redirigir) this.router.navigate(['/auth/login']);
  }

  ssoStatus() {
    return this.http.get<{ enabled: boolean }>(`${this.base}/sso-status`).toPromise();
  }

  actualizarSemestre(semestre: number) {
    return this.http.patch<Usuario>(`${this.base}/mi-semestre`, { semestre }).toPromise().then((u) => {
      if (u) this.usuario.set(u);
      return u;
    });
  }

  completarSso(temp: string, semestre: number, aceptoDatos: boolean) {
    return this.http
      .post<{ access_token: string }>(`${this.base}/sso/completar?temp=${encodeURIComponent(temp)}`, { semestre, aceptoDatos })
      .toPromise()
      .then((r) => {
        this.guardarSesion(r!.access_token);
        return this.cargarPerfil();
      });
  }
}
