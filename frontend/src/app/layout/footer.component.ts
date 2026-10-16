import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Pie institucional en Azul 900 con texto blanco. */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    footer { background: var(--azul-900); color: var(--superficie); margin-top: auto; }
    .contenido { max-width: 1160px; margin: 0 auto; padding: var(--esp-5) var(--esp-4); display: flex; flex-wrap: wrap; gap: var(--esp-2) var(--esp-6); align-items: center; justify-content: space-between; }
    .nombre { font-weight: 700; font-size: var(--t-cuerpo); margin: 0; }
    .detalle { font-size: var(--t-secundario); opacity: 0.9; margin: var(--esp-1) 0 0; }
  `],
  template: `
    <footer>
      <div class="contenido">
        <div>
          <p class="nombre">Universidad del Pacífico · Buenaventura</p>
          <p class="detalle">Programa de Ingeniería de Sistemas — Proyección Social</p>
        </div>
        <p class="detalle">© {{ anio }} · SIGICE</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  anio = new Date().getFullYear();
}
