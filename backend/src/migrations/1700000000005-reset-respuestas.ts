import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetRespuestas1700000000005 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query('TRUNCATE TABLE "respuesta_temas", "respuestas" CASCADE;');
    const tieneTablaAsig = await q.hasTable('respuestas_asignaturas');
    if (tieneTablaAsig) {
      await q.query('TRUNCATE TABLE "respuesta_asignatura_items", "respuestas_asignaturas" CASCADE;');
    }
  }

  public async down(_q: QueryRunner): Promise<void> {
    // No-op
  }
}
