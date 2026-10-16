import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Periodo } from '../periodos/periodo.entity';
import { Tema } from '../temas/tema.entity';

@Entity('respuestas')
@Unique('uq_respuesta_usuario_periodo', ['usuarioId', 'periodoId'])
@Index('idx_respuestas_periodo', ['periodoId'])
@Index('idx_respuestas_semestre', ['semestreAlResponder'])
export class Respuesta {
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

  @OneToMany(() => RespuestaTema, (rt) => rt.respuesta, { cascade: true })
  temas: RespuestaTema[];
}

@Entity('respuesta_temas')
@Index('idx_rt_tema', ['temaId'])
export class RespuestaTema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'respuesta_id' })
  respuestaId: string;

  @Column({ name: 'tema_id' })
  temaId: string;

  @Column({ type: 'int', nullable: true })
  puntaje: number | null;

  @ManyToOne(() => Respuesta, (r) => r.temas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'respuesta_id' })
  respuesta: Respuesta;

  @ManyToOne(() => Tema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tema_id' })
  tema: Tema;
}
