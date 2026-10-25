import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Unique, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Periodo } from '../periodos/periodo.entity';
import { Asignatura } from '../asignaturas/asignatura.entity';

@Entity('inscripciones_asignaturas')
@Unique('uq_inscripcion_usuario_periodo_asig', ['usuarioId', 'periodoId', 'asignaturaId'])
@Index('idx_inscripcion_usuario', ['usuarioId'])
@Index('idx_inscripcion_periodo', ['periodoId'])
@Index('idx_inscripcion_asignatura', ['asignaturaId'])
export class InscripcionAsignatura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'periodo_id' })
  periodoId: string;

  @Column({ name: 'asignatura_id' })
  asignaturaId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Periodo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: Periodo;

  @ManyToOne(() => Asignatura, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura: Asignatura;
}
