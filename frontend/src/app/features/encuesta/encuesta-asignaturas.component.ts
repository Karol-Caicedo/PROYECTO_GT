import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiService } from '../../shared/ui/ui.service';

interface Asignatura {
  id: string;
  nombre: string;
  codigo?: string;
  semestre: number;
  activo?: boolean;
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
  todasAsignaturas: Asignatura[];
  inscripcionIds: string[];
  asignaturasInscritas: Asignatura[];
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
    MatFormFieldModule,
    MatInputModule,
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
    .banner-instrucciones p { margin: 0; color: var(--texto-secundario); font-size: var(--t-secundario); line-height: 1.4; }

    /* Barra de pasos / stepper */
    .barra-pasos {
      display: flex; gap: var(--esp-2); margin-bottom: var(--esp-4); border-bottom: 2px solid var(--borde);
      padding-bottom: var(--esp-2);
    }
    .btn-paso {
      background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: var(--esp-2);
      padding: var(--esp-2) var(--esp-4); border-radius: var(--radio-s); font-weight: 700;
      font-size: var(--t-cuerpo); color: var(--texto-secundario); transition: all var(--transicion-rapida);
    }
    .btn-paso.activo {
      color: var(--azul-900); background: var(--azul-50); border-bottom: 3px solid var(--azul-500);
      margin-bottom: -10px;
    }
    .btn-paso:disabled { opacity: 0.5; cursor: not-allowed; }
    .circulo-num {
      width: 24px; height: 24px; border-radius: 50%; background: var(--borde);
      display: inline-flex; align-items: center; justify-content: center; font-size: 12px;
      color: var(--texto-secundario); font-weight: 800;
    }
    .btn-paso.activo .circulo-num { background: var(--azul-500); color: #fff; }

    /* Filtros paso 1 */
    .filtros-seleccion {
      display: flex; gap: var(--esp-3); flex-wrap: wrap; align-items: center; margin-bottom: var(--esp-4);
    }
    .chips-semestres {
      display: flex; gap: var(--esp-1); flex-wrap: wrap; align-items: center;
    }
    .chip-filtro-sem {
      border: 1px solid var(--borde); background: var(--superficie); border-radius: 20px;
      padding: 4px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      color: var(--texto-secundario); transition: all var(--transicion-rapida);
    }
    .chip-filtro-sem:hover { border-color: var(--azul-500); color: var(--azul-900); }
    .chip-filtro-sem.activo { background: var(--azul-500); color: #fff; border-color: var(--azul-500); }

    /* Grid selector materias en curso */
    .grid-selector {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--esp-3);
      margin-bottom: var(--esp-6);
    }
    .card-seleccionable {
      border: 2px solid var(--borde); border-radius: var(--radio-m); padding: var(--esp-3) var(--esp-4);
      background: var(--superficie); cursor: pointer; display: flex; align-items: center; gap: var(--esp-3);
      transition: all var(--transicion-rapida); user-select: none;
    }
    .card-seleccionable:hover { border-color: var(--azul-300); background: #f8fafc; }
    .card-seleccionable.seleccionada {
      border-color: var(--azul-500); background: #eff6ff; box-shadow: 0 2px 8px rgba(30, 64, 175, 0.1);
    }
    .icono-check {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--borde);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: transparent; transition: all var(--transicion-rapida);
    }
    .card-seleccionable.seleccionada .icono-check {
      background: var(--azul-500); border-color: var(--azul-500); color: #fff;
    }
    .info-materia-sel { flex: 1; min-width: 0; }
    .nombre-materia-sel { font-weight: 700; font-size: 14px; color: var(--azul-900); margin-bottom: 2px; }
    .meta-materia-sel { display: flex; align-items: center; gap: var(--esp-2); font-size: 12px; color: var(--texto-secundario); }
    .badge-sem { background: var(--azul-100); color: var(--azul-900); padding: 1px 6px; border-radius: 4px; font-weight: 700; }

    /* Barra flotante inferior de selección */
    .barra-accion-seleccion {
      position: sticky; bottom: var(--esp-4); background: var(--superficie);
      border: 1px solid var(--borde); border-radius: var(--radio-m); padding: var(--esp-3) var(--esp-5);
      display: flex; justify-content: space-between; align-items: center; gap: var(--esp-3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12); z-index: 10;
    }

    /* Paso 2: Evaluación */
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
    .barra-envio { margin-top: var(--esp-6); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--esp-3); }

    /* Confirmación éxito */
    .confirmacion-exito { text-align: center; padding: var(--esp-8) var(--esp-4); }
    .confirmacion-exito .icono-grande { font-size: 72px; color: var(--verde-500); }
    .confirmacion-exito h2 { color: var(--azul-900); font-size: var(--t-titulo-md); margin: var(--esp-3) 0 var(--esp-2); }
    .confirmacion-exito p { color: var(--texto-secundario); max-width: 540px; margin: 0 auto var(--esp-5); }
    .tabla-mi-respuesta { width: 100%; border-collapse: collapse; margin-top: var(--esp-4); text-align: left; }
    .tabla-mi-respuesta th, .tabla-mi-respuesta td { padding: var(--esp-3); border-bottom: 1px solid var(--borde); }
    .tabla-mi-respuesta th { color: var(--texto-secundario); font-size: var(--t-secundario); }
  `],
  template: `
    <div class="pagina">
      <app-page-header
        titulo="Encuesta de asignaturas"
        subtitulo="Identifica las materias que estás cursando, señala aquellas con dificultad y evalúa tu satisfacción académica"
        [miga]="[{ texto: 'Inicio', ruta: '/encuesta' }, { texto: 'Encuesta Materias' }]"
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
              mensaje="La encuesta de asignaturas no está habilitada en este momento para el periodo actual. Te avisaremos cuando se abra."
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
              El comité de Proyección Social utilizará esta información para coordinar monitorías y refuerzos académicos focalizados.
            </p>

            <div style="max-width:700px; margin: 0 auto">
              <h3 style="color:var(--azul-900); text-align:left; margin-bottom:var(--esp-2)">Resumen de tus materias evaluadas</h3>
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
                        @if (item.asignatura?.semestre) {
                          <span style="font-size:12px; color:var(--texto-secundario); margin-left:6px">
                            (Pensum S{{ item.asignatura?.semestre }})
                          </span>
                        }
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
        <!-- Navegación entre pasos -->
        <div class="barra-pasos">
          <button
            type="button"
            class="btn-paso"
            [class.activo]="pasoActual() === 'seleccion'"
            (click)="pasoActual.set('seleccion')"
          >
            <span class="circulo-num">1</span>
            <span>Mis materias en curso ({{ inscripcionesSeleccionadas().size }})</span>
          </button>

          <button
            type="button"
            class="btn-paso"
            [class.activo]="pasoActual() === 'evaluacion'"
            (click)="irAEvaluacion()"
            [disabled]="inscripcionesSeleccionadas().size === 0"
          >
            <span class="circulo-num">2</span>
            <span>Evaluar dificultad y satisfacción</span>
          </button>
        </div>

        @if (pasoActual() === 'seleccion') {
          <!-- PASO 1: Selección de materias que cursa -->
          <div class="banner-instrucciones">
            <span class="material-symbols-outlined" aria-hidden="true">playlist_add_check</span>
            <div>
              <h3>Paso 1: Confirma las materias que estás cursando</h3>
              <p>
                Selecciona todas las asignaturas que tienes matriculadas en el periodo actual (<b>{{ estado()?.periodo?.nombre }}</b>).
                Puedes elegir materias de cualquier semestre del pensum según tu inscripción real.
              </p>
            </div>
          </div>

          <div class="filtros-seleccion">
            <mat-form-field subscriptSizing="dynamic" style="flex:1 1 240px">
              <mat-label>Buscar materia</mat-label>
              <input
                matInput
                [value]="busqueda()"
                (input)="busqueda.set($any($event.target).value)"
                placeholder="Filtrar por nombre o código..."
              />
            </mat-form-field>

            <div class="chips-semestres">
              <button
                type="button"
                class="chip-filtro-sem"
                [class.activo]="filtroSemestre() === ''"
                (click)="filtroSemestre.set('')"
              >
                Todas ({{ estado()?.todasAsignaturas?.length || 0 }})
              </button>
              @for (sem of [1,2,3,4,5,6,7,8,9]; track sem) {
                <button
                  type="button"
                  class="chip-filtro-sem"
                  [class.activo]="filtroSemestre() === sem"
                  (click)="filtroSemestre.set(sem)"
                >
                  Semestre {{ sem }}
                </button>
              }
            </div>
          </div>

          <div class="grid-selector">
            @for (asig of materiasPensumFiltradas(); track asig.id) {
              <div
                class="card-seleccionable"
                [class.seleccionada]="inscripcionesSeleccionadas().has(asig.id)"
                (click)="toggleSeleccionMateria(asig.id)"
              >
                <div class="icono-check">
                  <span class="material-symbols-outlined" style="font-size:18px">check</span>
                </div>
                <div class="info-materia-sel">
                  <div class="nombre-materia-sel">{{ asig.nombre }}</div>
                  <div class="meta-materia-sel">
                    <span class="badge-sem">Semestre {{ asig.semestre }}</span>
                    @if (asig.codigo) {
                      <span>{{ asig.codigo }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          @if (materiasPensumFiltradas().length === 0) {
            <p class="texto-secundario" style="text-align:center; padding: var(--esp-6) 0">
              No se encontraron materias con el filtro aplicado.
            </p>
          }

          <div class="barra-accion-seleccion">
            <div>
              <b style="color:var(--azul-900); font-size:15px">
                {{ inscripcionesSeleccionadas().size }} materia{{ inscripcionesSeleccionadas().size === 1 ? '' : 's' }} seleccionada{{ inscripcionesSeleccionadas().size === 1 ? '' : 's' }}
              </b>
              <p class="texto-secundario" style="margin:2px 0 0; font-size:12px">
                Periodo: {{ estado()?.periodo?.nombre }}
              </p>
            </div>

            <button
              mat-raised-button
              color="primary"
              [disabled]="guardandoInscripciones() || inscripcionesSeleccionadas().size === 0"
              (click)="guardarInscripcionesYAvanzar()"
            >
              <span>{{ guardandoInscripciones() ? 'Guardando...' : 'Continuar a evaluar dificultad →' }}</span>
            </button>
          </div>
        } @else {
          <!-- PASO 2: Encuesta de dificultad y satisfacción sobre las materias inscritas -->
          <div class="banner-instrucciones">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            <div>
              <h3>Paso 2: Evalúa tus asignaturas en curso</h3>
              <p>
                Evalúa cada una de tus <b>{{ materiasParaEvaluar().length }} asignaturas</b> seleccionadas.
                Marca hasta un máximo de <b>4 materias</b> en las que sientas que tienes dificultad.
                Califica también tu satisfacción académica con la materia del 1 al 5.
              </p>
            </div>
          </div>

          <div class="resumen-seleccion">
            <span class="contador-dificultades" [class.limite]="dificultadesSeleccionadas() === 4">
              Dificultades marcadas: <b>{{ dificultadesSeleccionadas() }} / 4 permitidas</b>
            </span>

            <button mat-stroked-button color="primary" (click)="pasoActual.set('seleccion')">
              <span class="material-symbols-outlined" style="font-size:18px; margin-right:4px">edit</span>
              Modificar mis materias en curso ({{ materiasParaEvaluar().length }})
            </button>
          </div>

          <div class="grid-asignaturas">
            @for (asig of materiasParaEvaluar(); track asig.id) {
              <div class="asig-card" [class.con-dificultad]="evaluacion()[asig.id]?.tieneDificultad">
                <div class="asig-header">
                  <div class="asig-info">
                    <div class="asig-icono">
                      <span class="material-symbols-outlined">menu_book</span>
                    </div>
                    <div>
                      <h3 class="asig-nombre">{{ asig.nombre }}</h3>
                      <span class="asig-semestre">Semestre {{ asig.semestre }} del pensum</span>
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
                    {{ evaluacion()[asig.id]?.tieneDificultad ? 'Presento dificultad' : 'Marcar dificultad' }}
                  </button>
                </div>

                <div class="seccion-satisfaccion">
                  <div class="titulo-satisfaccion">¿Cómo evalúas tu satisfacción con esta asignatura?</div>
                  <div class="escala-satisfaccion">
                    @for (n of niveles; track n.valor) {
                      <button
                        type="button"
                        class="btn-escala"
                        [class.seleccionado]="evaluacion()[asig.id]?.nivelSatisfaccion === n.valor"
                        (click)="setSatisfaccion(asig.id, n.valor)"
                        [title]="n.label + ' - ' + n.descripcion"
                      >
                        <span>{{ n.valor }}</span>
                        <small style="font-size:10px; font-weight:500">{{ n.label.split(' - ')[1] }}</small>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="barra-envio">
            <button mat-stroked-button type="button" (click)="pasoActual.set('seleccion')">
              ← Volver a selección de materias
            </button>

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
  guardandoInscripciones = signal(false);

  estado = signal<EstadoEncuestaAsignatura | null>(null);
  pasoActual = signal<'seleccion' | 'evaluacion'>('seleccion');

  filtroSemestre = signal<number | ''>('');
  busqueda = signal('');
  inscripcionesSeleccionadas = signal<Set<string>>(new Set());

  evaluacion = signal<Record<string, ItemEvaluacion>>({});
  niveles = NIVELES;

  materiasPensumFiltradas = computed(() => {
    const list = this.estado()?.todasAsignaturas || [];
    const sem = this.filtroSemestre();
    const q = this.busqueda().toLowerCase().trim();

    return list.filter((a) => {
      const matchSem = sem === '' || a.semestre === Number(sem);
      const matchText = !q || a.nombre.toLowerCase().includes(q) || (a.codigo && a.codigo.toLowerCase().includes(q));
      return matchSem && matchText;
    });
  });

  materiasParaEvaluar = computed(() => {
    const todos = this.estado()?.todasAsignaturas || [];
    const ids = this.inscripcionesSeleccionadas();
    return todos.filter((a) => ids.has(a.id));
  });

  dificultadesSeleccionadas = computed(() => {
    const ids = this.inscripcionesSeleccionadas();
    const ev = this.evaluacion();
    return Object.values(ev).filter((e) => ids.has(e.asignaturaId) && e.tieneDificultad).length;
  });

  formularioCompleto = computed(() => {
    const ids = Array.from(this.inscripcionesSeleccionadas());
    if (ids.length === 0) return false;
    const mapa = this.evaluacion();
    return ids.every((id) => !!mapa[id]?.nivelSatisfaccion);
  });

  private readonly STORAGE_KEY = 'sigice_borrador_encuesta_asig';

  async ngOnInit() {
    await this.cargarEstado();
  }

  async cargarEstado() {
    this.cargando.set(true);
    try {
      const res = await this.http.get<EstadoEncuestaAsignatura>(`${this.api}/encuestas-asignaturas/estado`).toPromise();
      this.estado.set(res || null);

      if (res) {
        const setInscritos = new Set(res.inscripcionIds || []);
        this.inscripcionesSeleccionadas.set(setInscritos);

        // Si ya tiene materias inscritas y no ha respondido, pasar a evaluación directamente
        if (!res.yaRespondio && setInscritos.size > 0) {
          this.pasoActual.set('evaluacion');
        } else {
          this.pasoActual.set('seleccion');
        }

        // Inicializar evaluaciones para materias
        const inicial: Record<string, ItemEvaluacion> = {};
        for (const a of res.todasAsignaturas || []) {
          inicial[a.id] = {
            asignaturaId: a.id,
            tieneDificultad: false,
            nivelSatisfaccion: 3,
          };
        }

        // Cargar borrador si existe
        if (!res.yaRespondio) {
          const guardado = localStorage.getItem(this.STORAGE_KEY);
          if (guardado) {
            try {
              const p = JSON.parse(guardado);
              for (const a of res.todasAsignaturas || []) {
                if (p[a.id]) {
                  inicial[a.id] = {
                    ...inicial[a.id],
                    tieneDificultad: !!p[a.id].tieneDificultad,
                    nivelSatisfaccion: Number(p[a.id].nivelSatisfaccion) || 3,
                  };
                }
              }
            } catch { /* noop */ }
          }
        }

        this.evaluacion.set(inicial);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  toggleSeleccionMateria(asigId: string) {
    const s = new Set(this.inscripcionesSeleccionadas());
    if (s.has(asigId)) {
      s.delete(asigId);
    } else {
      s.add(asigId);
    }
    this.inscripcionesSeleccionadas.set(s);
  }

  irAEvaluacion() {
    if (this.inscripcionesSeleccionadas().size === 0) {
      this.ui.info('Selecciona al menos una materia que estés cursando.');
      return;
    }
    this.pasoActual.set('evaluacion');
  }

  async guardarInscripcionesYAvanzar() {
    const ids = Array.from(this.inscripcionesSeleccionadas());
    if (ids.length === 0) {
      this.ui.info('Selecciona al menos una materia que estés cursando.');
      return;
    }

    this.guardandoInscripciones.set(true);
    try {
      await this.http.post(`${this.api}/encuestas-asignaturas/inscripciones`, { asignaturaIds: ids }).toPromise();
      this.ui.exito('Materias en curso guardadas.');
      this.pasoActual.set('evaluacion');
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al guardar materias en curso.';
      this.ui.error(msg);
    } finally {
      this.guardandoInscripciones.set(false);
    }
  }

  private guardarBorrador() {
    if (this.estado()?.yaRespondio) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.evaluacion()));
    } catch { /* noop */ }
  }

  private limpiarBorrador() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { /* noop */ }
  }

  toggleDificultad(asigId: string) {
    const mapa = { ...this.evaluacion() };
    const actual = mapa[asigId] || { asignaturaId: asigId, tieneDificultad: false, nivelSatisfaccion: 3 };

    if (!actual.tieneDificultad && this.dificultadesSeleccionadas() >= 4) {
      this.ui.info('Solo puedes marcar un máximo de 4 asignaturas con dificultad.');
      return;
    }

    mapa[asigId] = {
      ...actual,
      tieneDificultad: !actual.tieneDificultad,
    };
    this.evaluacion.set(mapa);
    this.guardarBorrador();
  }

  setSatisfaccion(asigId: string, nivel: number) {
    const mapa = { ...this.evaluacion() };
    const actual = mapa[asigId] || { asignaturaId: asigId, tieneDificultad: false, nivelSatisfaccion: 3 };

    mapa[asigId] = {
      ...actual,
      nivelSatisfaccion: nivel,
    };
    this.evaluacion.set(mapa);
    this.guardarBorrador();
  }

  etiquetaNivel(v: number): string {
    return NIVELES.find((n) => n.valor === v)?.descripcion || '';
  }

  async enviar() {
    if (!this.formularioCompleto()) {
      this.ui.error('Por favor califica el nivel de satisfacción de todas las materias inscritas.');
      return;
    }

    const totalDif = this.dificultadesSeleccionadas();
    const idsInscritos = Array.from(this.inscripcionesSeleccionadas());
    const ok = await this.ui.confirmar({
      titulo: 'Enviar evaluación de asignaturas',
      mensaje: `Estás enviando la evaluación de ${idsInscritos.length} materia(s) inscrita(s), con ${totalDif} reporte(s) de dificultad. Una vez enviada la encuesta no podrá ser modificada. ¿Deseas continuar?`,
      textoConfirmar: 'Enviar evaluación',
    });
    if (!ok) return;

    this.enviando.set(true);
    try {
      const mapa = this.evaluacion();
      const items = idsInscritos.map((id) => mapa[id] || { asignaturaId: id, tieneDificultad: false, nivelSatisfaccion: 3 });

      await this.http.post(`${this.api}/encuestas-asignaturas`, { items }).toPromise();
      this.limpiarBorrador();
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
