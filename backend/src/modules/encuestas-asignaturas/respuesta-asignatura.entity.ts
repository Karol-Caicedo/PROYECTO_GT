import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Periodo } from '../periodos/periodo.entity';
import { Asignatura } from '../asignaturas/asignatura.entity';

@Entity('respuestas_asignaturas')
@Unique('uq_respuesta_asig_usuario_periodo', ['usuarioId', 'periodoId'])
@Index('idx_respuestas_asig_periodo', ['periodoId'])
@Index('idx_respuestas_asig_semestre', ['semestreAlResponder'])
export class RespuestaAsignatura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'periodo_id' })
  periodoId: string;

  @Column({ name: 'semestre_al_responder', type: 'int' })
  semestreAlResponder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Periodo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: Periodo;

  @OneToMany(() => RespuestaAsignaturaItem, (item) => item.respuestaAsignatura, { cascade: true })
  items: RespuestaAsignaturaItem[];
}

@Entity('respuesta_asignatura_items')
@Index('idx_rai_asignatura', ['asignaturaId'])
@Index('idx_rai_resp_asig', ['respuestaAsignaturaId'])
export class RespuestaAsignaturaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'respuesta_asignatura_id' })
  respuestaAsignaturaId: string;

  @Column({ name: 'asignatura_id' })
  asignaturaId: string;

  @Column({ name: 'tiene_dificultad', default: false })
  tieneDificultad: boolean;

  @Column({ name: 'nivel_satisfaccion', type: 'int' })
  nivelSatisfaccion: number;

  @ManyToOne(() => RespuestaAsignatura, (ra) => ra.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'respuesta_asignatura_id' })
  respuestaAsignatura: RespuestaAsignatura;

  @ManyToOne(() => Asignatura, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignatura_id' })
  asignatura: Asignatura;
}
