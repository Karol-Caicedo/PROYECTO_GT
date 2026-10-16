import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  semestre: number;
  rol: 'ESTUDIANTE' | 'ADMIN';
  proveedorAuth: string;
}

@Component({
  selector: 'app-clave-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <div style="padding: var(--esp-6)">
      <h2 class="titulo-seccion">Nueva clave para {{ nombre }}</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <mat-form-field class="full-width"><mat-label>Contraseña (mínimo 8 caracteres)</mat-label>
          <input matInput formControlName="password" type="password" autocomplete="new-password" />
          @if (form.controls.password.invalid && form.controls.password.touched) { <mat-error>Mínimo 8 caracteres</mat-error> }
        </mat-form-field>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <div style="display:flex;justify-content:flex-end;gap:var(--esp-2)">
          <button mat-button type="button" (click)="ref.close()">Cancelar</button>
          <button mat-raised-button color="primary" [disabled]="form.invalid || cargando()">Guardar</button>
        </div>
      </form>
    </div>
  `,
})
export class ClaveDialogComponent {
  ref = inject<MatDialogRef<ClaveDialogComponent>>(MatDialogRef);
  datos = inject(MAT_DIALOG_DATA) as { id: string; nombre: string };
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  error = signal('');
  cargando = signal(false);
  form = this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]] });
  nombre = this.datos.nombre;

  async guardar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.http.patch(`${this.api}/usuarios/${this.datos.id}/clave`, { password: this.form.value.password }).toPromise();
      this.ref.close(true);
    } catch {
      this.error.set('No se pudo actualizar la clave.');
    } finally {
      this.cargando.set(false);
    }
  }
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatDialogModule, PageHeaderComponent, StatusChipComponent],
  styles: [`
    .dos-columnas { display: grid; grid-template-columns: 340px 1fr; gap: var(--esp-4); align-items: start; }
    @media (max-width: 900px) { .dos-columnas { grid-template-columns: 1fr; } }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Usuarios"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Usuarios' }]" />
      <div class="dos-columnas">
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Nuevo usuario</h2>
          <form [formGroup]="form" (ngSubmit)="crear()">
            <mat-form-field class="full-width"><mat-label>Nombre completo</mat-label><input matInput formControlName="nombre" /></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Correo institucional</mat-label>
              <input matInput formControlName="correo" type="email" placeholder="usuario@gmail.com" />
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Contraseña inicial (mínimo 8)</mat-label>
              <input matInput formControlName="password" type="password" autocomplete="new-password" />
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Semestre</mat-label>
              <mat-select formControlName="semestre">
                @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">Semestre {{ s }}</mat-option> }
              </mat-select></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Rol</mat-label>
              <mat-select formControlName="rol">
                <mat-option value="ESTUDIANTE">Estudiante</mat-option>
                <mat-option value="ADMIN">Administrador</mat-option>
              </mat-select></mat-form-field>
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid || guardando()">
              {{ guardando() ? 'Creando…' : 'Crear usuario' }}
            </button>
          </form>
        </mat-card-content></mat-card>
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Usuarios ({{ usuarios().length }})</h2>
          @if (!usuarios().length) {
            <p class="texto-secundario">Aún no hay usuarios. Crea el primero con el formulario.</p>
          } @else {
            <div class="tabla-responsive"><table mat-table [dataSource]="usuarios()">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let u"><b>{{ u.nombre }}</b><br /><small style="color:var(--texto-secundario)">{{ u.correo }}</small></td></ng-container>
              <ng-container matColumnDef="rol"><th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let u"><app-status-chip [texto]="u.rol === 'ADMIN' ? 'Admin' : 'Estudiante'" [tono]="u.rol === 'ADMIN' ? 'ambar' : 'azul'" /></td></ng-container>
              <ng-container matColumnDef="semestre"><th mat-header-cell *matHeaderCellDef>Sem.</th>
                <td mat-cell *matCellDef="let u">S{{ u.semestre }}</td></ng-container>
              <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let u">
                <div class="acciones">
                  <button mat-icon-button (click)="restablecer(u)" aria-label="Restablecer clave" title="Restablecer clave">
                    <span class="material-symbols-outlined" aria-hidden="true">key</span>
                  </button>
                </div>
              </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['nombre','rol','semestre','acc']"></tr>
              <tr mat-row *matRowDef="let r; columns: ['nombre','rol','semestre','acc']"></tr>
            </table></div>
          }
        </mat-card-content></mat-card>
      </div>
    </div>
  `,
})
export class UsuariosAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private dialog = inject(MatDialog);
  private api = environment.apiUrl;
  usuarios = signal<Usuario[]>([]);
  error = signal('');
  guardando = signal(false);
  form = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    semestre: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
    rol: ['ESTUDIANTE' as 'ESTUDIANTE' | 'ADMIN', Validators.required],
  });

  async ngOnInit() { await this.cargar(); }
  async cargar() {
    const r = await this.http.get<Usuario[]>(`${this.api}/usuarios`).toPromise().catch(() => []);
    this.usuarios.set(r || []);
  }
  async crear() {
    this.error.set('');
    this.guardando.set(true);
    try {
      await this.http.post(`${this.api}/usuarios`, { ...this.form.value, semestre: Number(this.form.value.semestre) }).toPromise();
      this.form.reset({ semestre: 1, rol: 'ESTUDIANTE' });
      await this.cargar();
      this.ui.exito('Usuario creado. Compártele su clave inicial por un canal seguro.');
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo crear el usuario.');
    } finally {
      this.guardando.set(false);
    }
  }
  restablecer(u: Usuario) {
    this.dialog.open(ClaveDialogComponent, { data: { id: u.id, nombre: u.nombre }, width: '440px' })
      .afterClosed().toPromise().then((ok) => {
        if (ok) this.ui.exito('Clave actualizada.');
      });
  }
}
