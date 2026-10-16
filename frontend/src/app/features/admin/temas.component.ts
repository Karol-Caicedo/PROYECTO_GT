import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

interface Tema { id: string; nombre: string; descripcion?: string; activo: boolean }

@Component({
  selector: 'app-temas-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, PageHeaderComponent, StatusChipComponent],
  styles: [`
    .dos-columnas { display: grid; grid-template-columns: 340px 1fr; gap: var(--esp-4); align-items: start; }
    @media (max-width: 900px) { .dos-columnas { grid-template-columns: 1fr; } }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Temas de interés" subtitulo="Se muestran en orden aleatorio en la encuesta del estudiante"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Temas' }]" />
      <div class="dos-columnas">
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Nuevo tema</h2>
          <form [formGroup]="form" (ngSubmit)="crear()">
            <mat-form-field class="full-width"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" maxlength="120" /></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Descripción corta</mat-label><input matInput formControlName="descripcion" maxlength="200" /></mat-form-field>
            <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid">Crear tema</button>
          </form>
        </mat-card-content></mat-card>
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Temas ({{ temas().length }})</h2>
          @if (!temas().length) {
            <p class="texto-secundario">Aún no hay temas. Crea el primero con el formulario.</p>
          } @else {
            <div class="tabla-responsive"><table mat-table [dataSource]="temas()">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let t"><b>{{ t.nombre }}</b><br /><small style="color:var(--texto-secundario)">{{ t.descripcion }}</small></td></ng-container>
              <ng-container matColumnDef="activo"><th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let t"><app-status-chip [estado]="t.activo ? 'activo' : 'inactivo'" /></td></ng-container>
              <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let t">
                <div class="acciones">
                  <button mat-icon-button (click)="toggle(t)" [attr.aria-label]="t.activo ? 'Desactivar tema' : 'Activar tema'" [title]="t.activo ? 'Desactivar' : 'Activar'">
                    <span class="material-symbols-outlined" aria-hidden="true">{{ t.activo ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                  <button mat-icon-button color="warn" (click)="eliminar(t)" aria-label="Eliminar tema" title="Eliminar">
                    <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                  </button>
                </div>
              </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['nombre','activo','acc']"></tr>
              <tr mat-row *matRowDef="let r; columns: ['nombre','activo','acc']"></tr>
            </table></div>
          }
        </mat-card-content></mat-card>
      </div>
    </div>
  `,
})
export class TemasAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;
  temas = signal<Tema[]>([]);
  form = this.fb.group({ nombre: ['', Validators.required], descripcion: [''] });

  async ngOnInit() { await this.cargar(); }
  async cargar() {
    const r = await this.http.get<Tema[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.temas.set(r || []);
  }
  async crear() {
    await this.http.post(`${this.api}/temas`, this.form.value).toPromise();
    this.form.reset();
    await this.cargar();
    this.ui.exito('Tema creado.');
  }
  async toggle(t: Tema) {
    await this.http.patch(`${this.api}/temas/${t.id}`, { nombre: t.nombre, activo: !t.activo }).toPromise();
    await this.cargar();
    this.ui.exito(t.activo ? 'Tema desactivado.' : 'Tema activado.');
  }
  async eliminar(t: Tema) {
    const ok = await this.ui.confirmar({ titulo: 'Eliminar tema', mensaje: `¿Eliminar "${t.nombre}"?`, textoConfirmar: 'Eliminar', peligro: true });
    if (!ok) return;
    await this.http.delete(`${this.api}/temas/${t.id}`).toPromise();
    await this.cargar();
    this.ui.exito('Tema eliminado.');
  }
}
