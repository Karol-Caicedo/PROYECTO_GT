import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordPlano1700000000002 implements MigrationInterface {
  name = 'PasswordPlano1700000000002';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "password_plano" varchar NULL`);
    await q.query(`UPDATE "usuarios" SET "password_plano" = 'Estudiante123*' WHERE "rol" = 'ESTUDIANTE' AND ("password_plano" IS NULL OR "password_plano" = '')`);
    await q.query(`UPDATE "usuarios" SET "password_plano" = 'Admin123*' WHERE "rol" = 'ADMIN' AND ("password_plano" IS NULL OR "password_plano" = '')`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "password_plano"`);
  }
}
