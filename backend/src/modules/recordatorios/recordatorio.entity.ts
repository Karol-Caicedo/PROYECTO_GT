import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('recordatorios_enviados')
@Index('idx_rec_user_periodo', ['usuarioId', 'periodoId'])
export class RecordatorioEnviado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'periodo_id' })
  periodoId: string;

  @Column({ type: 'int' })
  numero: number;

  @CreateDateColumn({ name: 'enviado_at' })
  enviadoAt: Date;
}
