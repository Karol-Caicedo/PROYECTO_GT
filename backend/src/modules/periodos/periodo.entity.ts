import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type ModoEncuesta = 'seleccion' | 'calificacion';

@Entity('periodos')
export class Periodo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: string;

  @Column({ default: false })
  activo: boolean;

  @Column({ name: 'modo_encuesta', default: 'seleccion' })
  modoEncuesta: ModoEncuesta;
}
