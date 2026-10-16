import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

interface Sug { id: string; texto: string; estado: string }

@Component({
  selector: 'app-sugerencias-admin',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, PageHeaderComponent, EmptyStateComponent, StatusChipComponent],
  styles: [`
    .tarjeta-sug { margin-top: var(--esp-3); }
    .tarjeta-sug blockquote { margin: 0 0 var(--esp-3); font-size: var(--t-cuerpo); color: var(--texto); border-left: 4px solid var(--azul-100); padding-left: var(--esp-3); }
    .fila-sug { display: flex; gap: var(--esp-2); align-items: center; justify-content: space-between; flex-wrap: wrap; }
    .acciones { display: flex; gap: var(--esp-2); flex-wrap: wrap; }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Sugerencias de estudiantes" subtitulo="Ideas escritas en la encuesta que pueden volverse temas oficiales"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Sugerencias' }]" />
      <mat-card><mat-card-content style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
        <mat-form-field subscriptSizing="dynamic"><mat-label>Estado</mat-label><mat-select [formControl]="filtro">
          <mat-option value="">Todas</mat-option><mat-option value="nueva">Nueva</mat-option>
          <mat-option value="revisada">Revisada</mat-option><mat-option value="aceptada">Aceptada</mat-option>
        </mat-select></mat-form-field>
        <button mat-stroked-button color="primary" (click)="cargar()">Filtrar</button>
      </mat-card-content></mat-card>
      @for (s of sugs(); track s.id) {
        <mat-card class="tarjeta-sug"><mat-card-content>
          <div class="fila-sug">
            <app-status-chip [estado]="s.estado" />
          </div>
          <blockquote class="mt">“{{ s.texto }}”</blockquote>
          <div class="acciones">
            @if (s.estado === 'nueva') {
              <button mat-stroked-button color="primary" (click)="estado(s, 'revisada')">Marcar revisada</button>
            }
            @if (s.estado !== 'aceptada') {
              <button mat-raised-button color="primary" (click)="convertir(s)">
                <span class="material-symbols-outlined" aria-hidden="true" style="vertical-align:-4px">add_circle</span>&nbsp;Convertir en tema
              </button>
            }
          </div>
        </mat-card-content></mat-card>
      }
      @if (!sugs().length) {
        <div class="mt"><app-empty-state icono="lightbulb" titulo="Sin sugerencias"
          mensaje="No hay sugerencias con ese filtro. Cuando los estudiantes propongan temas, aparecerán aquí." /></div>
      }
    </div>
  `,
})
export class SugerenciasAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;
  sugs = signal<Sug[]>([]);
  filtro = this.fb.control('');

  async ngOnInit() { await this.cargar(); }
  async cargar() {
    const e = this.filtro.value ? `?estado=${this.filtro.value}` : '';
    const r = await this.http.get<Sug[]>(`${this.api}/sugerencias${e}`).toPromise().catch(() => []);
    this.sugs.set(r || []);
  }
  async estado(s: Sug, estado: string) {
    await this.http.patch(`${this.api}/sugerencias/${s.id}`, { estado }).toPromise();
    await this.cargar();
    this.ui.exito('Sugerencia marcada como revisada.');
  }
  async convertir(s: Sug) {
    const ok = await this.ui.confirmar({ titulo: 'Convertir en tema', mensaje: `Crear el tema "${s.texto.slice(0, 80)}" a partir de esta sugerencia?`, textoConfirmar: 'Crear tema' });
    if (!ok) return;
    await this.http.post(`${this.api}/sugerencias/${s.id}/convertir-tema`, {}).toPromise();
    await this.cargar();
    this.ui.exito('Tema creado desde la sugerencia.');
  }
}
