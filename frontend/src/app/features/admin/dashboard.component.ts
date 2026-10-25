import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';
import {
  GRAFICOS, colorMapaCalor,
  opcionesBarrasHorizontales, opcionesBarrasVerticales, opcionesLinea,
} from '../../core/charts.config';

type TipoDashboard = 'temas' | 'materias';
type GraficoTemas = 'top' | 'tasa' | 'calor' | 'comparativo';
type GraficoMaterias = 'top' | 'satisfaccion' | 'tasa' | 'calor' | 'comparativo';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    BaseChartDirective,
    PageHeaderComponent,
    MetricCardComponent,
  ],
  styles: [`
    .tabs-tipo-dashboard {
      display: flex; gap: var(--esp-2); margin-bottom: var(--esp-4);
      background: var(--azul-50); padding: 4px; border-radius: var(--radio-m);
      width: fit-content; border: 1px solid var(--borde);
    }
    .btn-tab-dashboard {
      display: inline-flex; align-items: center; gap: var(--esp-2);
      padding: var(--esp-2) var(--esp-4); border-radius: var(--radio-s);
      border: none; background: transparent; color: var(--texto-secundario);
      font-weight: 600; font-size: var(--t-cuerpo); cursor: pointer;
      transition: all var(--transicion-rapida); min-height: 40px;
    }
    .btn-tab-dashboard.activo {
      background: var(--superficie); color: var(--azul-900);
      box-shadow: var(--sombra-1); font-weight: 700;
    }
    .barra-filtros { margin-bottom: var(--esp-6); display: flex; gap: var(--esp-3); flex-wrap: wrap; }
    .metricas { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--esp-4); margin-bottom: var(--esp-5); }
    .grafico { height: 320px; position: relative; }
    .grafico.alto { height: 380px; }
    .titulo-grafico { font-size: var(--t-titulo-sm); color: var(--azul-900); margin: 0; display: flex; gap: var(--esp-2); align-items: center; }
    .titulo-grafico .material-symbols-outlined { color: var(--azul-500); }
    .desc-grafico { font-size: var(--t-secundario); color: var(--texto-secundario); margin: var(--esp-1) 0 var(--esp-4); }
    .tabla-calor { border-collapse: separate; border-spacing: 3px; }
    .tabla-calor th { font-size: 12px; color: var(--texto-secundario); padding: var(--esp-1); }
    .tabla-calor td:first-child { font-size: var(--t-secundario); font-weight: 600; color: var(--azul-900); max-width: 220px; }
    .celda-calor { min-width: 44px; min-height: 40px; display: grid; place-items: center; border-radius: var(--radio-s); font-weight: 700; font-size: var(--t-secundario); border: 1px solid var(--borde); }
    .leyenda-calor { display: flex; align-items: center; gap: var(--esp-2); font-size: 12px; color: var(--texto-secundario); margin-top: var(--esp-3); }
    .leyenda-calor .barra { width: 120px; height: 10px; border-radius: 999px; background: linear-gradient(90deg, var(--superficie), var(--azul-500), var(--azul-900)); border: 1px solid var(--borde); }
    .resumen-recordatorios { display: flex; gap: var(--esp-4); flex-wrap: wrap; margin-top: var(--esp-2); }
    .resumen-recordatorios > div { background: var(--azul-50); padding: var(--esp-3); border-radius: var(--radio-s); min-width: 140px; }
    .resumen-recordatorios .valor { display: block; font-size: 20px; font-weight: 700; color: var(--azul-900); }
    .resumen-recordatorios .etiqueta { font-size: 12px; color: var(--texto-secundario); }
    .grafico-entrada { animation: grafico-entrada 180ms ease-out; }
    @keyframes grafico-entrada { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @media (max-width: 600px) {
      .grafico { height: 280px; }
      .grafico.alto { height: 320px; }
      .barra-filtros mat-form-field { flex: 1 1 100%; }
      .tabla-calor td:first-child { max-width: 140px; }
    }
  `],
  template: `
    <div class="pagina">
      <app-page-header
        titulo="Dashboard institucional"
        subtitulo="Monitoreo de intereses tecnológicos y evaluación de asignaturas del programa"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Dashboard' }]"
      />

      <!-- Selector de Tipo de Dashboard: Temas vs Materias -->
      <div class="tabs-tipo-dashboard" role="tablist">
        <button
          type="button"
          class="btn-tab-dashboard"
          [class.activo]="tipoDashboard() === 'temas'"
          (click)="setTipoDashboard('temas')"
        >
          <span class="material-symbols-outlined">interests</span>
          Temas de Capacitación
        </button>

        <button
          type="button"
          class="btn-tab-dashboard"
          [class.activo]="tipoDashboard() === 'materias'"
          (click)="setTipoDashboard('materias')"
        >
          <span class="material-symbols-outlined">menu_book</span>
          Asignaturas / Materias
        </button>
      </div>

      <!-- Filtros generales -->
      <div class="barra-filtros" role="group" aria-label="Filtros del dashboard">
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Periodo</mat-label>
          <mat-select [value]="periodoId()" (selectionChange)="periodoId.set($event.value); recargar()">
            @for (p of periodos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }} {{ p.activo ? '(activo)' : '' }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Semestre</mat-label>
          <mat-select [value]="semestre()" (selectionChange)="semestre.set($event.value); recargar()">
            <mat-option [value]="''">Todos los semestres</mat-option>
            @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
              <mat-option [value]="s">Semestre {{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (tipoDashboard() === 'temas') {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Gráfico</mat-label>
            <mat-select [value]="graficoTemas()" (selectionChange)="graficoTemas.set($event.value)">
              @for (g of opcionesGraficoTemas; track g.id) {
                <mat-option [value]="g.id">{{ g.texto }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Gráfico de asignaturas</mat-label>
            <mat-select [value]="graficoMaterias()" (selectionChange)="graficoMaterias.set($event.value)">
              @for (g of opcionesGraficoMaterias; track g.id) {
                <mat-option [value]="g.id">{{ g.texto }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>

      <!-- Estado cargando / fallo -->
      @if (cargando()) {
        <div class="metricas" role="status" aria-label="Cargando métricas">
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
        </div>
        <div class="skeleton" style="height:340px"></div>
      } @else if (fallo()) {
        <mat-card>
          <mat-card-content class="estado-vacio" role="alert">
            <span class="material-symbols-outlined icono-grande" aria-hidden="true">cloud_off</span>
            <h3>No se pudieron cargar los datos</h3>
            <p>Revisa tu conexión o vuelve a intentarlo.</p>
            <button mat-raised-button color="primary" (click)="recargar()">Reintentar</button>
          </mat-card-content>
        </mat-card>
      } @else {

        <!-- ========================================== -->
        <!-- DASHBOARD 1: TEMAS DE CAPACITACIÓN        -->
        <!-- ========================================== -->
        @if (tipoDashboard() === 'temas') {
          <div class="metricas">
            <app-metric-card icono="how_to_reg" [valor]="resumen()?.totalRespuestas ?? '0'" etiqueta="Total de respuestas" acento="azul" />
            <app-metric-card icono="group" [valor]="resumen()?.totalEstudiantes ?? '0'" etiqueta="Estudiantes registrados" acento="azul" />
            <app-metric-card icono="percent" [valor]="(tasaGlobal() * 100).toFixed(1) + ' %'" etiqueta="Tasa de respuesta global" acento="verde" />
            <app-metric-card icono="emoji_events" [valor]="resumen()?.top1?.nombre || '–'" [etiqueta]="'Tema n.º 1' + (resumen()?.top1 ? ' · ' + resumen()?.top1?.valor + (modo() === 'calificacion' ? ' prom.' : ' votos') : '')" acento="azul" />
          </div>

          @switch (graficoTemas()) {
            @case ('top') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">leaderboard</span>Top 5 de temas ({{ modo() === 'calificacion' ? 'promedio' : 'votos' }})</h2>
                <p class="desc-grafico">Los temas con más interés declarado en el periodo y filtro elegidos.</p>
                @if (top().length) {
                  <div class="grafico alto"><canvas baseChart [data]="topData()" [options]="hbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay respuestas de estudiantes registradas para este periodo/filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('tasa') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">group</span>Tasa de respuesta por semestre</h2>
                <p class="desc-grafico">Estudiantes que respondieron frente al total registrado en cada semestre.</p>
                @if (tasa().length) {
                  <div class="grafico alto"><canvas baseChart [data]="tasaData()" [options]="vbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay datos para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('calor') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">grid_on</span>Mapa de calor temas × semestres</h2>
                <p class="desc-grafico">Intensidad del interés por tema en cada semestre.</p>
                @if (heatFilas().length) {
                  <div style="overflow:auto"><table class="tabla-calor">
                    <tr><th scope="col">Tema</th>@for (s of [1,2,3,4,5,6,7,8,9]; track s) { <th scope="col">S{{s}}</th> }</tr>
                    @for (tema of heatFilas(); track tema) {
                      <tr><td>{{ tema }}</td>
                        @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                          <td><div class="celda-calor" [style.background]="celda(tema, s).fondo" [style.color]="celda(tema, s).texto">{{ heat()[tema]?.[s] ?? 0 }}</div></td>
                        }</tr>
                    }
                  </table></div>
                  <div class="leyenda-calor" aria-hidden="true"><span>Menor</span><span class="barra"></span><span>Mayor</span></div>
                } @else { <p class="texto-secundario">Aún no hay respuestas para este filtro.</p> }
              </mat-card-content></mat-card>
            }


            @case ('comparativo') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">show_chart</span>Comparativo entre periodos</h2>
                <p class="desc-grafico">Evolución del tema seleccionado a lo largo de los periodos.</p>
                <mat-form-field subscriptSizing="dynamic"><mat-label>Tema</mat-label><mat-select [value]="temaComp()" (selectionChange)="temaComp.set($event.value); cargarComp()">
                  @for (t of todosTemas(); track t.id) { <mat-option [value]="t.id">{{ t.nombre }}</mat-option> }
                </mat-select></mat-form-field>
                @if (comp().length) {
                  <div class="grafico mt"><canvas baseChart [data]="compData()" [options]="line" [type]="'line'"></canvas></div>
                } @else {
                  <p class="texto-secundario">No hay datos de este tema en los periodos registrados.</p>
                }
              </mat-card-content></mat-card>
            }
          }
        }

        <!-- ========================================== -->
        <!-- DASHBOARD 2: ASIGNATURAS / MATERIAS        -->
        <!-- ========================================== -->
        @if (tipoDashboard() === 'materias') {
          <div class="metricas">
            <app-metric-card icono="menu_book" [valor]="resumenMaterias()?.totalRespuestas ?? '0'" etiqueta="Respuestas de materias" acento="azul" />
            <app-metric-card icono="group" [valor]="resumenMaterias()?.totalEstudiantes ?? '0'" etiqueta="Estudiantes registrados" acento="azul" />
            <app-metric-card icono="percent" [valor]="((resumenMaterias()?.tasaGlobal || 0) * 100).toFixed(1) + ' %'" etiqueta="Tasa de respuesta global" acento="verde" />
            <app-metric-card
              icono="warning"
              [valor]="resumenMaterias()?.top1?.nombre || 'Ninguna'"
              [etiqueta]="'Mayor dificultad' + (resumenMaterias()?.top1 ? ' · ' + resumenMaterias()?.top1?.valor + ' reportes' : '')"
              acento="azul"
            />
          </div>

          @switch (graficoMaterias()) {
            @case ('top') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">warning</span>Top 5 de asignaturas con dificultad reportada</h2>
                <p class="desc-grafico">Materias donde los estudiantes han solicitado mayor apoyo y refuerzo académico.</p>
                @if (topMaterias().length) {
                  <div class="grafico alto"><canvas baseChart [data]="topMateriasData()" [options]="hbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay reportes de dificultad registrados en las asignaturas para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('satisfaccion') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">star</span>Satisfacción académica promedio por asignatura</h2>
                <p class="desc-grafico">Promedio de satisfacción reportado por los estudiantes (escala de 1 a 5).</p>
                @if (satisfaccionMaterias().length) {
                  <div class="grafico alto"><canvas baseChart [data]="satisfaccionMateriasData()" [options]="hbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay evaluaciones de satisfacción para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('tasa') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">group</span>Tasa de respuesta en encuesta de materias</h2>
                <p class="desc-grafico">Estudiantes que completaron la encuesta de materias frente al total de su semestre.</p>
                @if (tasaMaterias().length) {
                  <div class="grafico alto"><canvas baseChart [data]="tasaMateriasData()" [options]="vbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay respuestas para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('calor') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">grid_on</span>Mapa de calor de dificultades: Asignatura × Semestre</h2>
                <p class="desc-grafico">Concentración de dificultades académicas por materia a través de los semestres.</p>
                @if (heatFilasMaterias().length) {
                  <div style="overflow:auto"><table class="tabla-calor">
                    <tr><th scope="col">Asignatura</th>@for (s of [1,2,3,4,5,6,7,8,9]; track s) { <th scope="col">S{{s}}</th> }</tr>
                    @for (asig of heatFilasMaterias(); track asig) {
                      <tr><td>{{ asig }}</td>
                        @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                          <td><div class="celda-calor" [style.background]="celdaMaterias(asig, s).fondo" [style.color]="celdaMaterias(asig, s).texto">{{ heatMaterias()[asig]?.[s] ?? 0 }}</div></td>
                        }</tr>
                    }
                  </table></div>
                  <div class="leyenda-calor" aria-hidden="true"><span>Menos dificultad</span><span class="barra"></span><span>Mayor dificultad</span></div>
                } @else {
                  <p class="texto-secundario">Aún no hay datos de dificultad registrados para la matriz.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('comparativo') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">show_chart</span>Comparativo de asignatura entre periodos</h2>
                <p class="desc-grafico">Evolución de reportes de dificultad y satisfacción de una asignatura a lo largo del tiempo.</p>
                <mat-form-field subscriptSizing="dynamic">
                  <mat-label>Seleccionar asignatura</mat-label>
                  <mat-select [value]="asigComp()" (selectionChange)="asigComp.set($event.value); cargarCompMaterias()">
                    @for (a of todasAsignaturas(); track a.id) {
                      <mat-option [value]="a.id">{{ a.nombre }} (Semestre {{ a.semestre }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                @if (compMaterias().length) {
                  <div class="grafico mt"><canvas baseChart [data]="compMateriasData()" [options]="line" [type]="'line'"></canvas></div>
                } @else {
                  <p class="texto-secundario">No hay registros históricos de esta asignatura en los periodos evaluados.</p>
                }
              </mat-card-content></mat-card>
            }
          }
        }

      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  tipoDashboard = signal<TipoDashboard>('temas');
  periodos = signal<{ id: string; nombre: string; activo: boolean }[]>([]);
  periodoId = signal('');
  semestre = signal<string | number>('');

  cargando = signal(true);
  fallo = signal(false);

  // TEMAS
  modo = signal('');
  todosTemas = signal<{ id: string; nombre: string }[]>([]);
  temaComp = signal('');
  resumen = signal<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null } | null>(null);
  top = signal<{ nombre: string; valor: number }[]>([]);
  tasa = signal<{ semestre: number; respondieron: number; total: number; tasa: number }[]>([]);
  heat = signal<Record<string, Record<number, number>>>({});
  comp = signal<{ periodo: string; valor: number }[]>([]);
  graficoTemas = signal<GraficoTemas>('top');
  opcionesGraficoTemas: { id: GraficoTemas; texto: string }[] = [
    { id: 'top', texto: 'Top 5 de temas' },
    { id: 'tasa', texto: 'Tasa de respuesta por semestre' },
    { id: 'calor', texto: 'Mapa de calor temas × semestres' },
    { id: 'comparativo', texto: 'Comparativo entre periodos' },
  ];

  // MATERIAS / ASIGNATURAS
  todasAsignaturas = signal<{ id: string; nombre: string; semestre: number }[]>([]);
  asigComp = signal('');
  resumenMaterias = signal<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null } | null>(null);
  topMaterias = signal<{ asignaturaId: string; nombre: string; semestre: number; valor: number; promedioSatisfaccion: number }[]>([]);
  satisfaccionMaterias = signal<{ asignaturaId: string; nombre: string; semestre: number; promedio: number }[]>([]);
  tasaMaterias = signal<{ semestre: number; respondieron: number; total: number; tasa: number }[]>([]);
  heatMaterias = signal<Record<string, Record<number, number>>>({});
  compMaterias = signal<{ periodo: string; promedio: number; dificultadCount: number }[]>([]);
  graficoMaterias = signal<GraficoMaterias>('top');
  opcionesGraficoMaterias: { id: GraficoMaterias; texto: string }[] = [
    { id: 'top', texto: 'Top 5 dificultad reportada' },
    { id: 'satisfaccion', texto: 'Satisfacción promedio por asignatura' },
    { id: 'tasa', texto: 'Tasa de respuesta por semestre' },
    { id: 'calor', texto: 'Mapa de calor Asignatura × Semestre' },
    { id: 'comparativo', texto: 'Comparativo entre periodos' },
  ];

  // Opciones Chart.js
  hbar: ChartConfiguration['options'] = opcionesBarrasHorizontales();
  vbar: ChartConfiguration['options'] = opcionesBarrasVerticales();
  line: ChartConfiguration['options'] = opcionesLinea();

  // Data bindings Temas
  topData = () => ({
    labels: this.top().map((t) => t.nombre),
    datasets: [{ label: this.modo() === 'calificacion' ? 'Promedio' : 'Votos', data: this.top().map((t) => t.valor), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  tasaData = () => ({
    labels: this.tasa().map((t) => `S${t.semestre}`),
    datasets: [
      { label: 'Registrados', data: this.tasa().map((t) => t.total), backgroundColor: GRAFICOS.azulClaro, borderColor: GRAFICOS.azul, borderWidth: 1, borderRadius: 6 },
      { label: 'Respondieron', data: this.tasa().map((t) => t.respondieron), backgroundColor: GRAFICOS.azul, borderRadius: 6 },
    ],
  });

  compData = () => ({
    labels: this.comp().map((c) => c.periodo),
    datasets: [{ label: 'Evolución del tema', data: this.comp().map((c) => c.valor), borderColor: GRAFICOS.azul, backgroundColor: GRAFICOS.azul, fill: false }],
  });
  heatFilas = () => Object.keys(this.heat());
  tasaGlobal = () => this.resumen()?.tasaGlobal ?? 0;

  // Data bindings Materias
  topMateriasData = () => ({
    labels: this.topMaterias().map((t) => t.nombre),
    datasets: [{ label: 'Reportes de dificultad', data: this.topMaterias().map((t) => t.valor), backgroundColor: '#f59e0b', borderRadius: 6 }],
  });
  satisfaccionMateriasData = () => ({
    labels: this.satisfaccionMaterias().map((s) => s.nombre),
    datasets: [{ label: 'Promedio de satisfacción (1 a 5)', data: this.satisfaccionMaterias().map((s) => s.promedio), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  tasaMateriasData = () => ({
    labels: this.tasaMaterias().map((t) => `S${t.semestre}`),
    datasets: [
      { label: 'Registrados', data: this.tasaMaterias().map((t) => t.total), backgroundColor: GRAFICOS.azulClaro, borderColor: GRAFICOS.azul, borderWidth: 1, borderRadius: 6 },
      { label: 'Respondieron', data: this.tasaMaterias().map((t) => t.respondieron), backgroundColor: GRAFICOS.azul, borderRadius: 6 },
    ],
  });
  compMateriasData = () => ({
    labels: this.compMaterias().map((c) => c.periodo),
    datasets: [
      { label: 'Reportes de dificultad', data: this.compMaterias().map((c) => c.dificultadCount), borderColor: '#f59e0b', backgroundColor: '#f59e0b', fill: false },
      { label: 'Satisfacción promedio', data: this.compMaterias().map((c) => c.promedio), borderColor: GRAFICOS.azul, backgroundColor: GRAFICOS.azul, fill: false },
    ],
  });
  heatFilasMaterias = () => Object.keys(this.heatMaterias());

  maxCalor(): number {
    return Math.max(1, ...Object.values(this.heat()).flatMap((r) => Object.values(r)));
  }
  celda(tema: string, s: number) {
    return colorMapaCalor(this.heat()[tema]?.[s], this.maxCalor());
  }

  maxCalorMaterias(): number {
    return Math.max(1, ...Object.values(this.heatMaterias()).flatMap((r) => Object.values(r)));
  }
  celdaMaterias(asig: string, s: number) {
    return colorMapaCalor(this.heatMaterias()[asig]?.[s], this.maxCalorMaterias());
  }

  async ngOnInit() {
    const ps = await this.http.get<{ id: string; nombre: string; activo: boolean }[]>(`${this.api}/periodos`).toPromise().catch(() => []);
    this.periodos.set(ps || []);
    const activo = (ps || []).find((p) => p.activo);
    if (activo) this.periodoId.set(activo.id);

    const temas = await this.http.get<{ id: string; nombre: string }[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.todosTemas.set(temas || []);
    if (temas?.length) this.temaComp.set(temas[0].id);

    const asigs = await this.http.get<{ id: string; nombre: string; semestre: number }[]>(`${this.api}/asignaturas/admin/todas`).toPromise().catch(() => []);
    this.todasAsignaturas.set(asigs || []);
    if (asigs?.length) this.asigComp.set(asigs[0].id);

    await this.recargar();
  }

  setTipoDashboard(tipo: TipoDashboard) {
    this.tipoDashboard.set(tipo);
    this.recargar();
  }

  async recargar() {
    if (this.tipoDashboard() === 'temas') {
      await this.cargarTemas();
      await this.cargarComp();
    } else {
      await this.cargarMaterias();
      await this.cargarCompMaterias();
    }
  }

  qs() {
    const p = this.periodoId() ? `periodoId=${this.periodoId()}` : '';
    const s = this.semestre() ? `&semestre=${this.semestre()}` : '';
    return `?${p}${s}`;
  }

  async cargarTemas() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const q = this.qs();
      const [top, tasa, heat, resumen] = await Promise.all([
        this.http.get<{ modo: string; items: { nombre: string; valor: number }[] }>(`${this.api}/dashboard/top-temas${q}`).toPromise().catch(() => null),
        this.http.get<{ porSemestre: { semestre: number; respondieron: number; total: number; tasa: number }[] }>(`${this.api}/dashboard/tasa-respuesta${q}`).toPromise().catch(() => null),
        this.http.get<{ matriz: Record<string, Record<number, number>> }>(`${this.api}/dashboard/heatmap${q}`).toPromise().catch(() => null),
        this.http.get<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null }>(`${this.api}/dashboard/resumen${q}`).toPromise().catch(() => null),
      ]);
      if (!top || !tasa || !heat || !resumen) { this.fallo.set(true); return; }
      this.top.set(top.items);
      this.modo.set(top.modo);
      this.tasa.set(tasa.porSemestre);
      this.heat.set(heat.matriz);
      this.resumen.set(resumen);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarComp() {
    if (!this.temaComp()) return;
    const r = await this.http.get<{ periodo: string; valor: number }[]>(`${this.api}/dashboard/comparativo?temaId=${this.temaComp()}`).toPromise().catch(() => []);
    this.comp.set(r || []);
  }

  async cargarMaterias() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const q = this.qs();
      const [top, tasa, heat, satisfaccion, resumen] = await Promise.all([
        this.http.get<{ items: { asignaturaId: string; nombre: string; semestre: number; valor: number; promedioSatisfaccion: number }[] }>(`${this.api}/dashboard-materias/top-asignaturas${q}`).toPromise().catch(() => null),
        this.http.get<{ porSemestre: { semestre: number; respondieron: number; total: number; tasa: number }[] }>(`${this.api}/dashboard-materias/tasa-respuesta${q}`).toPromise().catch(() => null),
        this.http.get<{ matriz: Record<string, Record<number, number>> }>(`${this.api}/dashboard-materias/heatmap${q}`).toPromise().catch(() => null),
        this.http.get<{ items: { asignaturaId: string; nombre: string; semestre: number; promedio: number }[] }>(`${this.api}/dashboard-materias/satisfaccion${q}`).toPromise().catch(() => null),
        this.http.get<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null }>(`${this.api}/dashboard-materias/resumen${q}`).toPromise().catch(() => null),
      ]);

      if (!top || !tasa || !heat || !satisfaccion || !resumen) { this.fallo.set(true); return; }
      this.topMaterias.set(top.items || []);
      this.tasaMaterias.set(tasa.porSemestre || []);
      this.heatMaterias.set(heat.matriz || {});
      this.satisfaccionMaterias.set(satisfaccion.items || []);
      this.resumenMaterias.set(resumen);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarCompMaterias() {
    if (!this.asigComp()) return;
    const r = await this.http.get<{ periodo: string; promedio: number; dificultadCount: number }[]>(`${this.api}/dashboard-materias/comparativo?asignaturaId=${this.asigComp()}`).toPromise().catch(() => []);
    this.compMaterias.set(r || []);
  }
}
