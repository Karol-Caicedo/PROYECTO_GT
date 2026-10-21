import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('asignaturas')
@Index('idx_asignaturas_semestre', ['semestre'])
@Index('idx_asignaturas_activo', ['activo'])
export class Asignatura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'int' })
  semestre: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
