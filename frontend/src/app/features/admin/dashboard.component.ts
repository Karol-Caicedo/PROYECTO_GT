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

type GraficoDashboard = 'top' | 'tasa' | 'calor' | 'declarado' | 'comparativo';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, BaseChartDirective, PageHeaderComponent, MetricCardComponent],
  styles: [`
    .barra-filtros { margin-bottom: var(--esp-8); }
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
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
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
      <app-page-header titulo="Dashboard de intereses" subtitulo="Proyección Social · datos agregados, sin respuestas individuales"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Dashboard' }]">
        <button class="btn-acento" (click)="exportar()" aria-label="Exportar datos del dashboard a CSV">
          <span class="material-symbols-outlined" aria-hidden="true" style="vertical-align:-4px">download</span>&nbsp;Exportar CSV
        </button>
      </app-page-header>

      <div class="barra-filtros" role="group" aria-label="Filtros del dashboard">
        <mat-form-field subscriptSizing="dynamic"><mat-label>Periodo</mat-label><mat-select [value]="periodoId()" (selectionChange)="periodoId.set($event.value); cargar()">
          @for (p of periodos(); track p.id) { <mat-option [value]="p.id">{{ p.nombre }} {{ p.activo ? '(activo)' : '' }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field subscriptSizing="dynamic"><mat-label>Semestre</mat-label><mat-select [value]="semestre()" (selectionChange)="semestre.set($event.value); cargar()">
          <mat-option [value]="''">Todos</mat-option>
          @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">Semestre {{ s }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field subscriptSizing="dynamic"><mat-label>Gráfico</mat-label><mat-select [value]="grafico()" (selectionChange)="grafico.set($event.value)" aria-label="Gráfico que se muestra en el dashboard">
          @for (g of opcionesGrafico; track g.id) {
            <mat-option [value]="g.id">{{ g.id === 'top' ? 'Top 10 de temas (' + (modo() === 'calificacion' ? 'promedio' : 'votos') + ')' : g.texto }}</mat-option>
          }
        </mat-select></mat-form-field>
      </div>

      @if (cargando()) {
        <div class="metricas" role="status" aria-label="Cargando métricas">
          <div class="skeleton" style="height:110px"></div><div class="skeleton" style="height:110px"></div><div class="skeleton" style="height:110px"></div><div class="skeleton" style="height:110px"></div>
        </div>
        <div class="skeleton" style="height:340px"></div>
      } @else if (fallo()) {
        <mat-card><mat-card-content class="estado-vacio" role="alert">
          <span class="material-symbols-outlined icono-grande" aria-hidden="true">cloud_off</span>
          <h3>No se pudieron cargar los datos</h3>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button mat-raised-button color="primary" (click)="cargar()">Reintentar</button>
        </mat-card-content></mat-card>
      } @else {
        <div class="metricas">
          <app-metric-card icono="how_to_reg" [valor]="resumen()?.totalRespuestas ?? '–'" etiqueta="Total de respuestas" acento="azul" />
          <app-metric-card icono="group" [valor]="resumen()?.totalEstudiantes ?? '–'" etiqueta="Estudiantes registrados" acento="azul" />
          <app-metric-card icono="percent" [valor]="(tasaGlobal() * 100).toFixed(1) + ' %'" etiqueta="Tasa de respuesta global" acento="verde" />
          <app-metric-card icono="emoji_events" [valor]="resumen()?.top1?.nombre || '–'" [etiqueta]="'Tema n.º 1' + (resumen()?.top1 ? ' · ' + resumen()?.top1?.valor + (modo() === 'calificacion' ? ' prom.' : ' votos') : '')" acento="azul" />
        </div>

        <p class="sr-only" aria-live="polite">Gráfico mostrado: {{ textoGrafico() }}</p>

        @switch (grafico()) {
          @case ('top') {
            <mat-card class="mt grafico-entrada"><mat-card-content>
              <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">leaderboard</span>Top 10 de temas ({{ modo() === 'calificacion' ? 'promedio' : 'votos' }})</h2>
              <p class="desc-grafico">Los temas con más interés declarado en el periodo y filtro elegidos.</p>
              @if (top().length) { <div class="grafico alto"><canvas baseChart [data]="topData()" [options]="hbar" [type]="'bar'" role="img" [attr.aria-label]="'Top 10 de temas por ' + (modo() === 'calificacion' ? 'promedio' : 'votos') + ' con el filtro seleccionado'"></canvas></div> }
              @else { <p class="texto-secundario">Aún no hay respuestas para este filtro.</p> }
            </mat-card-content></mat-card>
          }

          @case ('tasa') {
            <mat-card class="mt grafico-entrada"><mat-card-content>
              <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">group</span>Tasa de respuesta por semestre</h2>
              <p class="desc-grafico">Estudiantes que respondieron frente al total registrado en cada semestre.</p>
              @if (tasa().length) {
                <div class="grafico"><canvas baseChart [data]="tasaData()" [options]="vbar" [type]="'bar'" role="img" aria-label="Tasa de respuesta por semestre"></canvas></div>
                @for (t of tasa(); track t.semestre) {
                  @if (t.respondieron < 10) {
                    <div class="alerta-advertencia" role="note">
                      <span class="material-symbols-outlined" aria-hidden="true">info</span>
                      <span>Semestre {{ t.semestre }}: solo {{ t.respondieron }} respuestas — <b>muestra pequeña, interpretar con cuidado</b>.</span>
                    </div>
                  }
                }
              } @else {
                <p class="texto-secundario">Aún no hay respuestas para este filtro.</p>
              }
            </mat-card-content></mat-card>
          }

          @case ('calor') {
            <mat-card class="mt grafico-entrada"><mat-card-content>
              <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">grid_on</span>Mapa de calor temas × semestres</h2>
              <p class="desc-grafico">Intensidad del interés por tema en cada semestre. Los números acompañan al color.</p>
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

          @case ('declarado') {
            <mat-card class="mt grafico-entrada"><mat-card-content>
              <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">compare</span>Interés declarado vs. real</h2>
              <p class="desc-grafico">Azul = lo elegido en la encuesta · Verde = clics reales en capacitaciones del tema.</p>
              @if (dvr().length) {
                <div class="grafico alto"><canvas baseChart [data]="dvrData()" [options]="vbar" [type]="'bar'" role="img" aria-label="Interés declarado en la encuesta frente a clics reales"></canvas></div>
              } @else {
                <p class="texto-secundario">Aún no hay respuestas para este filtro.</p>
              }
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
                <div class="grafico mt"><canvas baseChart [data]="compData()" [options]="line" [type]="'line'" role="img" aria-label="Evolución del tema seleccionado entre periodos"></canvas></div>
              } @else {
                <p class="texto-secundario">No hay datos de este tema en los periodos registrados.</p>
              }
            </mat-card-content></mat-card>
          }
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  periodos = signal<{ id: string; nombre: string; activo: boolean }[]>([]);
  todosTemas = signal<{ id: string; nombre: string }[]>([]);
  periodoId = signal('');
  semestre = signal<string | number>('');
  modo = signal('');
  resumen = signal<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null } | null>(null);
  top = signal<{ nombre: string; valor: number }[]>([]);
  tasa = signal<{ semestre: number; respondieron: number; total: number; tasa: number }[]>([]);
  heat = signal<Record<string, Record<number, number>>>({});
  dvr = signal<{ nombre: string; declarado: number; clics: number }[]>([]);
  comp = signal<{ periodo: string; valor: number }[]>([]);
  temaComp = signal('');
  cargando = signal(true);
  fallo = signal(false);
  grafico = signal<GraficoDashboard>('top');
  opcionesGrafico: { id: GraficoDashboard; texto: string }[] = [
    { id: 'top', texto: 'Top 10 de temas' },
    { id: 'tasa', texto: 'Tasa de respuesta por semestre' },
    { id: 'calor', texto: 'Mapa de calor temas × semestres' },
    { id: 'declarado', texto: 'Interés declarado vs. real' },
    { id: 'comparativo', texto: 'Comparativo entre periodos' },
  ];

  hbar: ChartConfiguration['options'] = opcionesBarrasHorizontales();
  vbar: ChartConfiguration['options'] = opcionesBarrasVerticales();
  line: ChartConfiguration['options'] = opcionesLinea();

  topData = () => ({
    labels: this.top().map((t) => t.nombre),
    datasets: [{ label: this.modo() === 'calificacion' ? 'Promedio' : 'Votos', data: this.top().map((t) => t.valor), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  tasaData = () => ({
    labels: this.tasa().map((t) => `S${t.semestre} (${(t.tasa * 100).toFixed(0)} %)`),
    datasets: [{ label: 'Tasa de respuesta (%)', data: this.tasa().map((t) => +(t.tasa * 100).toFixed(1)), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  dvrData = () => ({
    labels: this.dvr().map((d) => d.nombre),
    datasets: [
      { label: 'Declarado (encuesta)', data: this.dvr().map((d) => d.declarado), backgroundColor: GRAFICOS.azul, borderRadius: 6 },
      { label: 'Real (clics)', data: this.dvr().map((d) => d.clics), backgroundColor: GRAFICOS.verde, borderRadius: 6 },
    ],
  });
  compData = () => ({
    labels: this.comp().map((c) => c.periodo),
    datasets: [{ label: 'Evolución del tema', data: this.comp().map((c) => c.valor), borderColor: GRAFICOS.azul, backgroundColor: GRAFICOS.azul, fill: false }],
  });
  heatFilas = () => Object.keys(this.heat());
  tasaGlobal = () => this.resumen()?.tasaGlobal ?? 0;
  textoGrafico = () => this.grafico() === 'top'
    ? `Top 10 de temas (${this.modo() === 'calificacion' ? 'promedio' : 'votos'})`
    : this.opcionesGrafico.find((g) => g.id === this.grafico())?.texto ?? '';

  maxCalor(): number {
    return Math.max(1, ...Object.values(this.heat()).flatMap((r) => Object.values(r)));
  }
  celda(tema: string, s: number) {
    return colorMapaCalor(this.heat()[tema]?.[s], this.maxCalor());
  }

  async ngOnInit() {
    const ps = await this.http.get<{ id: string; nombre: string; activo: boolean }[]>(`${this.api}/periodos`).toPromise().catch(() => []);
    this.periodos.set(ps || []);
    const activo = (ps || []).find((p) => p.activo);
    if (activo) this.periodoId.set(activo.id);
    const temas = await this.http.get<{ id: string; nombre: string }[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.todosTemas.set(temas || []);
    if (temas?.length) this.temaComp.set(temas[0].id);
    await this.cargar();
    await this.cargarComp();
  }

  qs() {
    const p = this.periodoId() ? `periodoId=${this.periodoId()}` : '';
    const s = this.semestre() ? `&semestre=${this.semestre()}` : '';
    return `?${p}${s}`;
  }

  async cargar() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const q = this.qs();
      const [top, tasa, heat, dvr, resumen] = await Promise.all([
        this.http.get<{ modo: string; items: { nombre: string; valor: number }[] }>(`${this.api}/dashboard/top-temas${q}`).toPromise().catch(() => null),
        this.http.get<{ porSemestre: { semestre: number; respondieron: number; total: number; tasa: number }[] }>(`${this.api}/dashboard/tasa-respuesta${q}`).toPromise().catch(() => null),
        this.http.get<{ matriz: Record<string, Record<number, number>> }>(`${this.api}/dashboard/heatmap${q}`).toPromise().catch(() => null),
        this.http.get<{ items: { nombre: string; declarado: number; clics: number }[] }>(`${this.api}/dashboard/declarado-vs-real${q}`).toPromise().catch(() => null),
        this.http.get<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null }>(`${this.api}/dashboard/resumen${q}`).toPromise().catch(() => null),
      ]);
      if (!top || !tasa || !heat || !dvr || !resumen) { this.fallo.set(true); return; }
      this.top.set(top.items); this.modo.set(top.modo);
      this.tasa.set(tasa.porSemestre);
      this.heat.set(heat.matriz);
      this.dvr.set(dvr.items);
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

  exportar() {
    window.open(`${this.api}/dashboard/export${this.qs()}`, '_blank');
  }
}
