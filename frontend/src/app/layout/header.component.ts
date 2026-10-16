import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../core/auth.service';
import { LayoutService } from './layout.service';

/** Encabezado blanco con franja institucional, logo y perfil de usuario alineado a la derecha. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatToolbarModule, MatButtonModule, MatIconButton, MatMenuModule, MatChipsModule],
  styles: [`
    .cabecera {
      background: var(--superficie);
      color: var(--texto);
      border-bottom: 1px solid var(--borde);
      padding: 0 var(--esp-4);
      min-height: 64px;
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    .marca { display: flex; align-items: center; gap: var(--esp-3); text-decoration: none; color: inherit; min-width: 0; flex-shrink: 1; }
    .marca > span:last-child { min-width: 0; }
    .marca img { height: 42px; width: auto; max-width: 100%; }
    .nombre-usuario { overflow: hidden; text-overflow: ellipsis; max-width: 160px; font-weight: 600; }
    .toolbar-spacer { flex: 1 1 auto; }
    .perfil-usuario {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: var(--esp-2);
      flex-shrink: 0;
    }
    @media (max-width: 600px) {
      .cabecera { padding: 0 var(--esp-2); }
      .marca img { height: 34px; }
      .marca .nombre { font-size: var(--t-secundario); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 38vw; display: inline-block; vertical-align: bottom; }
      .nombre-usuario { display: none; }
      .chip-sem { font-size: 12px; padding: 2px var(--esp-2); }
    }
    .marca .nombre { font-size: var(--t-cuerpo); font-weight: 800; color: var(--azul-900); line-height: 1.2; }
    .marca .sub { font-size: 12px; color: var(--texto-secundario); line-height: 1.2; }
    .chip-sem { background: var(--verde-100); color: var(--verde-900); font-weight: 700; }
    .btn-menu { margin-right: var(--esp-1); }
    @media (max-width: 900px) {
      .marca .sub { display: none; }
    }
  `],
  template: `
    <div class="franja-marca" aria-hidden="true"></div>
    <mat-toolbar class="cabecera">
      @if (auth.logueado()) {
        <button mat-icon-button class="btn-menu" (click)="layout.alternarMenu()"
          [attr.aria-label]="layout.menuEfectivo() ? 'Cerrar menú' : 'Abrir menú'"
          [attr.aria-expanded]="layout.menuEfectivo()">
          <span class="material-symbols-outlined" aria-hidden="true">{{ layout.menuEfectivo() ? 'close' : 'menu' }}</span>
        </button>
      }
      <a class="marca" [routerLink]="auth.esAdmin() ? '/admin/dashboard' : '/encuesta'" aria-label="Inicio · SIGICE">
        <img src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
        <span>
          <span class="nombre">SIGICE</span><br />
          <span class="sub">Ingeniería de Sistemas · Proyección Social</span>
        </span>
      </a>

      <span class="toolbar-spacer"></span>

      @if (auth.logueado()) {
        <div class="perfil-usuario">
          <mat-chip class="chip-sem" aria-label="Tu semestre actual">S{{ auth.usuario()?.semestre }}</mat-chip>
          <button mat-button [matMenuTriggerFor]="menu" [attr.aria-label]="'Cuenta de ' + auth.usuario()?.nombre">
            <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>&nbsp;<span class="nombre-usuario">{{ auth.usuario()?.nombre }}</span>
          </button>
          <mat-menu #menu="matMenu">
            <p style="padding:0 16px;font-size:14px;color:var(--texto-secundario)">{{ auth.usuario()?.correo }}</p>
            <button mat-menu-item (click)="salir()"><span class="material-symbols-outlined" aria-hidden="true">logout</span>&nbsp;Cerrar sesión</button>
          </mat-menu>
        </div>
      }
    </mat-toolbar>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  layout = inject(LayoutService);
  private router = inject(Router);

  salir() {
    this.auth.salir();
    this.layout.restablecerMenu();
    this.router.navigate(['/auth/login']);
  }
}
