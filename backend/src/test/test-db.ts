/** Helper de integración: DataSource real contra Postgres de Docker (BD de test aislada). */
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { User } from '../modules/users/user.entity';
import { Periodo } from '../modules/periodos/periodo.entity';
import { Tema } from '../modules/temas/tema.entity';
import { Respuesta, RespuestaTema } from '../modules/encuestas/respuesta.entity';
import { Capacitacion, CapacitacionSemestre } from '../modules/capacitaciones/capacitacion.entity';
import { ClicCapacitacion } from '../modules/capacitaciones/clic.entity';
import { RecordatorioEnviado } from '../modules/recordatorios/recordatorio.entity';
import { PasswordReset } from '../modules/auth/password-reset.entity';
import { Asignatura } from '../modules/asignaturas/asignatura.entity';
import { RespuestaAsignatura, RespuestaAsignaturaItem } from '../modules/encuestas-asignaturas/respuesta-asignatura.entity';
import { InscripcionAsignatura } from '../modules/encuestas-asignaturas/inscripcion-asignatura.entity';

export const ENTIDADES_TEST = [
  User,
  Periodo,
  Tema,
  Respuesta,
  RespuestaTema,
  Capacitacion,
  CapacitacionSemestre,
  ClicCapacitacion,
  RecordatorioEnviado,
  PasswordReset,
  Asignatura,
  RespuestaAsignatura,
  RespuestaAsignaturaItem,
  InscripcionAsignatura,
];

const TEST_DB = process.env.TEST_DB_NAME || 'intereses_db_test';

function pgBase() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

export async function ensureTestDatabase() {
  const client = new Client({ ...pgBase(), database: 'postgres' });
  await client.connect();
  try {
    const r = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
    if (r.rowCount === 0) await client.query(`CREATE DATABASE "${TEST_DB}"`);
  } finally {
    await client.end();
  }
}

export function createTestDataSource() {
  return new DataSource({
    type: 'postgres',
    ...pgBase(),
    username: pgBase().user,
    database: TEST_DB,
    entities: ENTIDADES_TEST,
    synchronize: true,
  });
}

const TABLAS = [
  'recuperacion_claves',
  'recordatorios_enviados',
  'clics_capacitacion',
  'capacitacion_semestres',
  'capacitaciones',
  'inscripciones_asignaturas',
  'respuesta_asignatura_items',
  'respuestas_asignaturas',
  'asignaturas',
  'respuesta_temas',
  'respuestas',
  'periodos',
  'temas',
  'usuarios',
];

export async function truncateAll(ds: DataSource) {
  await ds.query(`TRUNCATE ${TABLAS.join(', ')} RESTART IDENTITY CASCADE`);
}
