import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  styles: [`
    .fondo { min-height: calc(100vh - 65px); display: grid; place-items: center; padding: var(--esp-6) var(--esp-2);
      background:
        linear-gradient(color-mix(in srgb, var(--azul-900) 62%, transparent), color-mix(in srgb, var(--azul-900) 42%, transparent)),
        url('/assets/fondo.jpeg') center / cover no-repeat;
    }
    .tarjeta.mat-mdc-card { width: 100%; max-width: 460px; padding: var(--esp-4); background: var(--superficie); }
    .logo { display: block; height: 84px; width: auto; max-width: 100%; margin: 0 auto var(--esp-2); }
    h1 { font-size: var(--t-titulo-md); color: var(--azul-900); text-align: center; margin: 0; }
    .sub { text-align: center; color: var(--texto-secundario); font-size: var(--t-secundario); margin: var(--esp-1) 0 var(--esp-5); }
    .divisor { display: flex; align-items: center; gap: var(--esp-2); color: var(--texto-secundario); font-size: var(--t-secundario); margin: var(--esp-4) 0; }
    .divisor::before, .divisor::after { content: ''; flex: 1; border-top: 1px solid var(--borde); }
    .sso { display: flex; gap: var(--esp-2); flex-wrap: wrap; }
    .sso a { flex: 1 1 140px; }
    .pie { text-align: center; margin-top: var(--esp-4); font-size: var(--t-secundario); }
    .pie a { color: var(--azul-700); font-weight: 700; }
    form { display: flex; flex-direction: column; align-items: center; width: 100%; }
    mat-form-field { width: 100%; display: block; margin: 0 auto; }
    .full-width { width: 100%; }
    button.full-width { margin-top: var(--esp-2); width: 100%; }
  `],
  template: `
    <div class="fondo">
      <mat-card class="tarjeta">
        <mat-card-content>
          <img class="logo" src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
          <h1>SIGICE</h1>
          <p class="sub">Ingeniería de Sistemas · Proyección Social</p>
          <form [formGroup]="form" (ngSubmit)="entrar()">
            <mat-form-field class="full-width"><mat-label>Correo institucional</mat-label>
              <input matInput formControlName="correo" type="email" autocomplete="username" placeholder="usuario@gmail.com" />
              @if (form.controls.correo.invalid && form.controls.correo.touched) { <mat-error>Escribe un correo válido</mat-error> }
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" type="password" autocomplete="current-password" />
              @if (form.controls.password.invalid && form.controls.password.touched) { <mat-error>Escribe tu contraseña</mat-error> }
            </mat-form-field>
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid || cargando()">
              {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>
          @if (sso()) {
            <div class="divisor" aria-hidden="true">o continúa con tu cuenta institucional</div>
            <div class="sso">
              <a mat-stroked-button color="primary" [href]="api + '/auth/google'">Google</a>
              <a mat-stroked-button color="primary" [href]="api + '/auth/microsoft'">Microsoft</a>
            </div>
          }
          <p class="pie"><a routerLink="/auth/recuperar">¿Olvidaste tu contraseña?</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  api = environment.apiUrl;
  error = signal('');
  cargando = signal(false);
  sso = signal(false);
  form = this.fb.group({ correo: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  async ngOnInit() {
    try {
      const s = await this.auth.ssoStatus();
      this.sso.set(!!s?.enabled);
    } catch { /* SSO apagado */ }
  }

  async entrar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.ingresar(this.form.value.correo!, this.form.value.password!);
      const u = this.auth.usuario();
      this.router.navigate([u?.rol === 'ADMIN' ? '/admin/dashboard' : '/encuesta']);
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Credenciales inválidas');
    } finally {
      this.cargando.set(false);
    }
  }
}
