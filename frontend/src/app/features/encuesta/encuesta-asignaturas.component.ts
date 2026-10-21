import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiService } from '../../shared/ui/ui.service';

interface Asignatura {
  id: string;
  nombre: string;
  semestre: number;
}

interface ItemEvaluacion {
  asignaturaId: string;
  tieneDificultad: boolean;
  nivelSatisfaccion: number;
}

interface MiRespuestaItem {
  id: string;
  asignaturaId: string;
  tieneDificultad: boolean;
  nivelSatisfaccion: number;
  asignatura?: Asignatura;
}

interface EstadoEncuestaAsignatura {
  activa: boolean;
  periodo: { id: string; nombre: string; activo: boolean } | null;
  asignaturas: Asignatura[];
  yaRespondio: boolean;
  miRespuesta: {
    id: string;
    createdAt: string;
    semestreAlResponder: number;
    items: MiRespuestaItem[];
  } | null;
}

const NIVELES = [
  { valor: 1, label: '1 - Muy baja', descripcion: 'Muy insatisfecho' },
  { valor: 2, label: '2 - Baja', descripcion: 'Insatisfecho' },
  { valor: 3, label: '3 - Regular', descripcion: 'Aceptable' },
  { valor: 4, label: '4 - Alta', descripcion: 'Satisfecho' },
  { valor: 5, label: '5 - Excelente', descripcion: 'Muy satisfecho' },
];

@Component({
  selector: 'app-encuesta-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  styles: [`
    .banner-instrucciones {
      background: var(--azul-50); border-left: 4px solid var(--azul-500);
      padding: var(--esp-3) var(--esp-4); border-radius: var(--radio-s);
      margin-bottom: var(--esp-4); display: flex; gap: var(--esp-3); align-items: flex-start;
    }
    .banner-instrucciones .material-symbols-outlined { color: var(--azul-700); font-size: 28px; }
    .banner-instrucciones h3 { margin: 0 0 var(--esp-1); color: var(--azul-900); font-size: var(--t-cuerpo); font-weight: 700; }
    .banner-instrucciones p { margin: 0; color: var(--texto-secundario); font-size: var(--t-secundario); }
    .resumen-seleccion {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
      gap: var(--esp-2); margin-bottom: var(--esp-4);
    }
    .contador-dificultades {
      font-weight: 700; font-size: var(--t-secundario); padding: var(--esp-1) var(--esp-3);
      border-radius: 999px; background: var(--superficie); border: 1px solid var(--borde);
    }
    .contador-dificultades.limite { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
    .grid-asignaturas { display: flex; flex-direction: column; gap: var(--esp-3); }
    .asig-card {
      border: 1px solid var(--borde); border-radius: var(--radio-m);
      padding: var(--esp-4); background: var(--superficie);
      transition: box-shadow var(--transicion-rapida), border-color var(--transicion-rapida);
    }
    .asig-card.con-dificultad { border-color: #f59e0b; background: #fffbeb; }
    .asig-header {
      display: flex; justify-content: space-between; align-items: center;
      gap: var(--esp-2); flex-wrap: wrap; margin-bottom: var(--esp-3);
    }
    .asig-info { display: flex; align-items: center; gap: var(--esp-3); }
    .asig-icono {
      width: 40px; height: 40px; border-radius: var(--radio-m);
      background: var(--azul-100); color: var(--azul-900);
      display: grid; place-items: center; flex-shrink: 0;
    }
    .asig-card.con-dificultad .asig-icono { background: #fde68a; color: #92400e; }
    .asig-nombre { margin: 0; font-size: var(--t-cuerpo); font-weight: 700; color: var(--azul-900); }
    .asig-semestre { font-size: var(--t-secundario); color: var(--texto-secundario); }
    .btn-dificultad {
      display: inline-flex; align-items: center; gap: var(--esp-1);
      padding: var(--esp-2) var(--esp-3); border-radius: var(--radio-s);
      border: 1px solid var(--borde); background: var(--superficie);
      cursor: pointer; font-size: var(--t-secundario); font-weight: 600;
      color: var(--texto-secundario); transition: all var(--transicion-rapida);
    }
    .btn-dificultad:hover { border-color: #f59e0b; color: #b45309; }
    .btn-dificultad.activa { background: #f59e0b; color: #fff; border-color: #d97706; }
    .seccion-satisfaccion { margin-top: var(--esp-3); padding-top: var(--esp-3); border-top: 1px dashed var(--borde); }
    .titulo-satisfaccion { font-size: 13px; font-weight: 600; color: var(--texto-secundario); margin-bottom: var(--esp-2); }
    .escala-satisfaccion { display: flex; gap: var(--esp-2); flex-wrap: wrap; }
    .btn-escala {
      flex: 1 1 80px; min-width: 60px; height: 42px; border-radius: var(--radio-s);
      border: 1px solid var(--borde); background: var(--superficie);
      font-weight: 700; font-size: var(--t-secundario); color: var(--texto);
      cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: all var(--transicion-rapida);
    }
    .btn-escala:hover { border-color: var(--azul-500); }
    .btn-escala.seleccionado { background: var(--azul-500); color: var(--superficie); border-color: var(--azul-500); }
    .barra-envio { margin-top: var(--esp-6); display: flex; justify-content: flex-end; }
    .confirmacion-exito { text-align: center; padding: var(--esp-8) var(--esp-4); }
    .confirmacion-exito .icono-grande { font-size: 72px; color: var(--verde-500); }
    .confirmacion-exito h2 { color: var(--azul-900); font-size: var(--t-titulo-md); margin: var(--esp-3) 0 var(--esp-2); }
    .confirmacion-exito p { color: var(--texto-secundario); max-width: 520px; margin: 0 auto var(--esp-5); }
    .tabla-mi-respuesta { width: 100%; border-collapse: collapse; margin-top: var(--esp-4); text-align: left; }
    .tabla-mi-respuesta th, .tabla-mi-respuesta td { padding: var(--esp-3); border-bottom: 1px solid var(--borde); }
    .tabla-mi-respuesta th { color: var(--texto-secundario); font-size: var(--t-secundario); }
  `],
  template: `
    <div class="pagina">
      <app-page-header
        titulo="Encuesta de asignaturas del semestre"
        subtitulo="Identifica las materias donde presentas dificultad y evalúa tu satisfacción académica"
        [miga]="[{ texto: 'Inicio', ruta: '/encuesta' }, { texto: 'Encuesta Asignaturas' }]"
      />

      @if (cargando()) {
        <mat-card>
          <mat-card-content>
            <p class="texto-secundario">Cargando encuesta de asignaturas...</p>
            <mat-progress-bar mode="indeterminate" />
          </mat-card-content>
        </mat-card>
      } @else if (!estado()?.activa && !estado()?.yaRespondio) {
        <mat-card>
          <mat-card-content>
            <app-empty-state
              icono="event_busy"
              titulo="Encuesta no disponible"
              mensaje="La encuesta de asignaturas no está habilitada para el periodo actual. Te avisaremos cuando se abra."
              textoBoton="Ir a inicio"
              rutaBoton="/encuesta"
            />
          </mat-card-content>
        </mat-card>
      } @else if (estado()?.yaRespondio) {
        <!-- Vista de ya respondió -->
        <mat-card>
          <mat-card-content class="confirmacion-exito">
            <span class="material-symbols-outlined icono-grande" aria-hidden="true">verified</span>
            <h2>¡Ya respondiste la encuesta de asignaturas!</h2>
            <p>
              Tus respuestas fueron registradas exitosamente para el periodo <b>{{ estado()?.periodo?.nombre }}</b>.
              El comité de Proyección Social utilizará esta información para coordinar monitorías y refuerzos académicos.
            </p>

            <div style="max-width:700px; margin: 0 auto">
              <h3 style="color:var(--azul-900); text-align:left; margin-bottom:var(--esp-2)">Resumen de tu evaluación</h3>
              <table class="tabla-mi-respuesta">
                <thead>
                  <tr>
                    <th>Asignatura</th>
                    <th>¿Dificultad?</th>
                    <th>Nivel de satisfacción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of estado()?.miRespuesta?.items; track item.id) {
                    <tr>
                      <td>
                        <b>{{ item.asignatura?.nombre || 'Asignatura' }}</b>
                      </td>
                      <td>
                        @if (item.tieneDificultad) {
                          <span style="color:#d97706; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                            <span class="material-symbols-outlined" style="font-size:18px">warning</span> Sí
                          </span>
                        } @else {
                          <span style="color:var(--texto-secundario)">No</span>
                        }
                      </td>
                      <td>
                        <span style="font-weight:700; color:var(--azul-700)">
                          {{ item.nivelSatisfaccion }} / 5 ({{ etiquetaNivel(item.nivelSatisfaccion) }})
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div style="margin-top:var(--esp-6)">
              <button mat-stroked-button color="primary" routerLink="/encuesta">Volver a inicio</button>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Formulario para responder -->
        <div class="banner-instrucciones">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          <div>
            <h3>Instrucciones de la encuesta</h3>
            <p>
              Evalúa cada una de las asignaturas correspondientes a tu semestre.
              Puedes marcar <b>hasta un máximo de 4 asignaturas</b> en las que sientas que tienes dificultad.
              Califica también tu satisfacción académica con la asignatura del 1 al 5.
            </p>
          </div>
        </div>

        <div class="resumen-seleccion">
          <span class="contador-dificultades" [class.limite]="dificultadesSeleccionadas() === 4">
            Dificultades marcadas: <b>{{ dificultadesSeleccionadas() }} / 4 permitidas</b>
          </span>
          <span class="texto-secundario" style="font-size:var(--t-secundario)">
            Periodo activo: <b>{{ estado()?.periodo?.nombre }}</b>
          </span>
        </div>

        <div class="grid-asignaturas">
          @for (asig of estado()?.asignaturas; track asig.id) {
            <div class="asig-card" [class.con-dificultad]="evaluacion()[asig.id]?.tieneDificultad">
              <div class="asig-header">
                <div class="asig-info">
                  <div class="asig-icono">
                    <span class="material-symbols-outlined">menu_book</span>
                  </div>
                  <div>
                    <h3 class="asig-nombre">{{ asig.nombre }}</h3>
                    <span class="asig-semestre">Semestre {{ asig.semestre }}</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-dificultad"
                  [class.activa]="evaluacion()[asig.id]?.tieneDificultad"
                  (click)="toggleDificultad(asig.id)"
                >
                  <span class="material-symbols-outlined" style="font-size:18px">
                    {{ evaluacion()[asig.id]?.tieneDificultad ? 'check_circle' : 'report_problem' }}
                  </span>
                  {{ evaluacion()[asig.id]?.tieneDificultad ? 'Dificultad reportada' : '¿Presentas dificultad?' }}
                </button>
              </div>

              <div class="seccion-satisfaccion">
                <div class="titulo-satisfaccion">Tu nivel de satisfacción con esta materia:</div>
                <div class="escala-satisfaccion">
                  @for (n of niveles; track n.valor) {
                    <button
                      type="button"
                      class="btn-escala"
                      [class.seleccionado]="evaluacion()[asig.id]?.nivelSatisfaccion === n.valor"
                      (click)="setSatisfaccion(asig.id, n.valor)"
                    >
                      <span>{{ n.valor }}</span>
                      <small style="font-size:10px; font-weight:normal; opacity:0.85">{{ n.descripcion }}</small>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <div class="barra-envio">
          <button
            mat-raised-button
            color="primary"
            style="min-height:48px; font-size:var(--t-cuerpo); padding: 0 var(--esp-5)"
            [disabled]="enviando() || !formularioCompleto()"
            (click)="enviar()"
          >
            <span class="material-symbols-outlined" style="margin-right:8px">send</span>
            {{ enviando() ? 'Enviando...' : 'Enviar evaluación de asignaturas' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class EncuestaAsignaturasComponent implements OnInit {
  private http = inject(HttpClient);
  private ui = inject(UiService);
  private api = environment.apiUrl;

  cargando = signal(true);
  enviando = signal(false);
  estado = signal<EstadoEncuestaAsignatura | null>(null);
  evaluacion = signal<Record<string, ItemEvaluacion>>({});

  niveles = NIVELES;

  dificultadesSeleccionadas = computed(() => {
    return Object.values(this.evaluacion()).filter((e) => e.tieneDificultad).length;
  });

  formularioCompleto = computed(() => {
    const asigs = this.estado()?.asignaturas || [];
    if (!asigs.length) return false;
    const mapa = this.evaluacion();
    return asigs.every((a) => !!mapa[a.id]?.nivelSatisfaccion);
  });

  async ngOnInit() {
    await this.cargarEstado();
  }

  async cargarEstado() {
    this.cargando.set(true);
    try {
      const res = await this.http.get<EstadoEncuestaAsignatura>(`${this.api}/encuestas-asignaturas/estado`).toPromise();
      this.estado.set(res || null);

      if (res?.asignaturas) {
        const inicial: Record<string, ItemEvaluacion> = {};
        for (const a of res.asignaturas) {
          inicial[a.id] = {
            asignaturaId: a.id,
            tieneDificultad: false,
            nivelSatisfaccion: 3, // Valor neutro por defecto
          };
        }
        this.evaluacion.set(inicial);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  toggleDificultad(asigId: string) {
    const mapa = { ...this.evaluacion() };
    const actual = mapa[asigId];
    if (!actual) return;

    if (!actual.tieneDificultad && this.dificultadesSeleccionadas() >= 4) {
      this.ui.info('Solo puedes marcar un máximo de 4 asignaturas con dificultad.');
      return;
    }

    mapa[asigId] = {
      ...actual,
      tieneDificultad: !actual.tieneDificultad,
    };
    this.evaluacion.set(mapa);
  }

  setSatisfaccion(asigId: string, nivel: number) {
    const mapa = { ...this.evaluacion() };
    const actual = mapa[asigId];
    if (!actual) return;

    mapa[asigId] = {
      ...actual,
      nivelSatisfaccion: nivel,
    };
    this.evaluacion.set(mapa);
  }

  etiquetaNivel(v: number): string {
    return NIVELES.find((n) => n.valor === v)?.descripcion || '';
  }

  async enviar() {
    if (!this.formularioCompleto()) {
      this.ui.error('Por favor califica el nivel de satisfacción de todas las materias.');
      return;
    }

    const totalDif = this.dificultadesSeleccionadas();
    const ok = await this.ui.confirmar({
      titulo: 'Enviar evaluación de asignaturas',
      mensaje: `Has marcado ${totalDif} asignatura(s) con dificultad. Una vez enviada la encuesta no podrá ser modificada. ¿Deseas continuar?`,
      textoConfirmar: 'Enviar evaluación',
    });
    if (!ok) return;

    this.enviando.set(true);
    try {
      const items = Object.values(this.evaluacion());
      await this.http.post(`${this.api}/encuestas-asignaturas`, { items }).toPromise();
      this.ui.exito('Evaluación enviada con éxito.');
      await this.cargarEstado();
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al enviar la evaluación.';
      this.ui.error(msg);
    } finally {
      this.enviando.set(false);
    }
  }
}
