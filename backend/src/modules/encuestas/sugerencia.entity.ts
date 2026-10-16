import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Respuesta } from './respuesta.entity';

export type EstadoSugerencia = 'nueva' | 'revisada' | 'aceptada';

@Entity('sugerencias')
@Index('idx_sugerencias_estado', ['estado'])
export class Sugerencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'respuesta_id' })
  respuestaId: string;

  @Column({ type: 'text' })
  texto: string;

  @Column({ default: 'nueva' })
  estado: EstadoSugerencia;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Respuesta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'respuesta_id' })
  respuesta: Respuesta;
}
