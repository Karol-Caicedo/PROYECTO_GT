import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sso_codes')
@Index('idx_sso_codes_hash', ['codigoHash'], { unique: true })
export class SsoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_hash', type: 'char', length: 64 })
  codigoHash: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  datos: Record<string, unknown> | null;

  @Column({ name: 'expira_at', type: 'timestamptz' })
  expiraAt: Date;

  @Column({ name: 'usado_at', type: 'timestamptz', nullable: true })
  usadoAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
