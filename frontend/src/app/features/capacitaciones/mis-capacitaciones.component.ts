import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

interface Cap {
  id: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  imagenUrl?: string;
  fechaEvento?: string;
  modalidad: string;
  semestres?: { semestre: number }[];
}

@Component({
  selector: 'app-detalle-capacitacion-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, StatusChipComponent],
  styles: [`
    .dialogo-detalle {
      max-width: 600px;
      width: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .detalle-img {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      display: block;
      background: var(--azul-50);
    }
    .cuerpo-detalle {
      padding: var(--esp-5);
      display: flex;
      flex-direction: column;
      gap: var(--esp-3);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--esp-2);
      align-items: center;
    }
    .fecha {
      display: inline-flex;
      align-items: center;
      gap: var(--esp-1);
      font-size: var(--t-secundario);
      font-weight: 700;
      color: var(--azul-700);
      background: var(--azul-50);
      padding: 4px 10px;
      border-radius: var(--radio-pildora);
    }
    .titulo {
      margin: 0;
      font-size: var(--t-titulo-md, 22px);
      font-weight: 700;
      color: var(--azul-900);
      line-height: 1.3;
    }
    .desc {
      margin: 0;
      font-size: var(--t-base, 15px);
      color: var(--texto);
      line-height: 1.6;
      white-space: pre-line;
      max-height: 240px;
      overflow-y: auto;
    }
    .acciones-dialogo {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--esp-3);
      padding: var(--esp-3) var(--esp-5) var(--esp-5);
      border-top: 1px solid var(--borde, #e2e8f0);
    }
    .btn-enlace {
      display: inline-flex;
      align-items: center;
      gap: var(--esp-1);
    }
  `],
  template: `
    <div class="dialogo-detalle">
      @if (c.imagenUrl) {
        <img class="detalle-img" [src]="img(c.imagenUrl)" [alt]="'Imagen de ' + c.titulo" />
      }
      <div class="cuerpo-detalle">
        <div class="meta">
          <app-status-chip [estado]="c.modalidad" />
          @if (c.fechaEvento) {
            <span class="fecha"><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">event</span>{{ c.fechaEvento | date:'mediumDate' }}</span>
          }
        </div>
        <h2 class="titulo">{{ c.titulo }}</h2>
        @if (c.descripcion) {
          <p class="desc">{{ c.descripcion }}</p>
        } @else {
          <p class="desc texto-secundario" style="font-style:italic">Sin descripción adicional disponible.</p>
        }
      </div>
      <div class="acciones-dialogo">
        <button mat-button type="button" (click)="ref.close()">Cerrar</button>
        @if (c.enlace) {
          <button mat-raised-button color="primary" class="btn-enlace" (click)="irAlEnlace()">
            <span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">open_in_new</span>
            Abrir enlace
          </button>
        }
      </div>
    </div>
  `
})
export class DetalleCapacitacionDialogComponent {
  ref = inject<MatDialogRef<DetalleCapacitacionDialogComponent>>(MatDialogRef);
  data = inject<{ cap: Cap }>(MAT_DIALOG_DATA);
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private origen = environment.apiUrl.replace(/\/api\/?$/, '');

  get c(): Cap { return this.data.cap; }

  img(url: string) {
    return url.startsWith('http') ? url : `${this.origen}${url}`;
  }

  async irAlEnlace() {
    const c = this.c;
    if (!c.enlace) return;
    try {
      const r = await this.http.post<{ enlace: string }>(`${this.api}/capacitaciones/${c.id}/clic`, {}).toPromise();
      window.open(r?.enlace || c.enlace, '_blank', 'noopener');
    } catch {
      window.open(c.enlace, '_blank', 'noopener');
    }
  }
}

@Component({
  selector: 'app-mis-capacitaciones',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, PageHeaderComponent, EmptyStateComponent, StatusChipComponent],
  styles: [`
    .grid-caps { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--esp-4); }
    .cap { display: flex; flex-direction: column; overflow: hidden; transition: box-shadow var(--transicion-media), transform var(--transicion-media); }
    .cap:hover { box-shadow: var(--sombra-2); }
    .portada { aspect-ratio: 16 / 9; width: 100%; object-fit: cover; display: block; background: var(--azul-50); }
    .portada-placeholder {
      aspect-ratio: 16 / 9; display: grid; place-items: center;
      background: linear-gradient(135deg, var(--azul-500), var(--verde-500));
    }
    .portada-placeholder .material-symbols-outlined { font-size: 56px; color: var(--superficie); opacity: 0.9; }
    .cuerpo { display: flex; flex-direction: column; gap: var(--esp-2); padding: var(--esp-4); flex: 1; }
    .fecha { display: flex; align-items: center; gap: var(--esp-1); font-size: var(--t-secundario); font-weight: 700; color: var(--azul-700); }
    .titulo { font-size: var(--t-titulo-sm); color: var(--azul-900); margin: 0; }
    .desc { font-size: var(--t-secundario); color: var(--texto-secundario); margin: 0; flex: 1; }
    .acciones { padding: 0 var(--esp-4) var(--esp-4); }
    .cargando { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--esp-4); }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Capacitaciones para tu semestre"
        subtitulo="Oportunidades vigentes seleccionadas para ti por Proyección Social"
        [miga]="[{ texto: 'Inicio', ruta: '/capacitaciones' }, { texto: 'Capacitaciones' }]" />

      @if (cargando()) {
        <div class="cargando" role="status" aria-label="Cargando capacitaciones">
          <div class="skeleton" style="height:280px"></div><div class="skeleton" style="height:280px"></div><div class="skeleton" style="height:280px"></div>
        </div>
      } @else if (fallo()) {
        <mat-card><mat-card-content class="estado-vacio" role="alert">
          <span class="material-symbols-outlined icono-grande" aria-hidden="true">cloud_off</span>
          <h3>No se pudieron cargar</h3><p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button mat-raised-button color="primary" (click)="cargar()">Reintentar</button>
        </mat-card-content></mat-card>
      } @else if (!caps().length) {
        <app-empty-state icono="school" titulo="Aún no hay capacitaciones para tu semestre"
          mensaje="Proyección Social publicará aquí las próximas oportunidades. Vuelve pronto." />
      } @else {
        <div class="grid-caps">
          @for (c of caps(); track c.id) {
            <mat-card class="cap">
              @if (c.imagenUrl) {
                <img class="portada" [src]="img(c.imagenUrl)" [alt]="'Imagen de ' + c.titulo" loading="lazy" />
              } @else {
                <div class="portada-placeholder" role="img" [attr.aria-label]="'Sin imagen para ' + c.titulo">
                  <span class="material-symbols-outlined" aria-hidden="true">school</span>
                </div>
              }
              <div class="cuerpo">
                <div style="display:flex;gap:8px;align-items:center">
                  <app-status-chip [estado]="c.modalidad" />
                  @if (c.fechaEvento) {
                    <span class="fecha"><span class="material-symbols-outlined" aria-hidden="true">event</span>{{ c.fechaEvento | date:'mediumDate' }}</span>
                  }
                </div>
                <h2 class="titulo">{{ c.titulo }}</h2>
                @if (c.descripcion) {
                  <p class="desc">{{ c.descripcion.slice(0, 140) }}{{ c.descripcion.length > 140 ? '…' : '' }}</p>
                }
              </div>
              <div class="acciones">
                <button mat-raised-button color="primary" class="full-width" (click)="verDetalle(c)">Ver más</button>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class MisCapacitacionesComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private api = environment.apiUrl;
  private origen = environment.apiUrl.replace(/\/api\/?$/, '');
  caps = signal<Cap[]>([]);
  cargando = signal(true);
  fallo = signal(false);

  async ngOnInit() { await this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const r = await this.http.get<Cap[]>(`${this.api}/capacitaciones/mias`).toPromise();
      this.caps.set(r || []);
    } catch {
      this.fallo.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  img(url: string) {
    return url.startsWith('http') ? url : `${this.origen}${url}`;
  }

  verDetalle(c: Cap) {
    this.dialog.open(DetalleCapacitacionDialogComponent, {
      data: { cap: c },
      width: '600px',
      maxWidth: '92vw',
    });
  }
}
