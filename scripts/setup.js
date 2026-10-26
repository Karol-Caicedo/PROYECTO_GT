#!/usr/bin/env node
/**
 * Setup del proyecto desde la raíz:
 *   1. Verifica Node 20+ y Docker.
 *   2. Crea .env desde .env.example (sin sobrescribir).
 *   3. npm install en backend y frontend.
 *   4. Levanta postgres + adminer y espera a que esté sano.
 *   5. Corre migraciones y seed (admin + 20 temas).
 *
 * Uso: npm run setup
 */
const { execSync } = require('child_process');
const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const run = (cmd, opts = {}) =>
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });

const step = (n, msg) => console.log(`\n=== [${n}] ${msg} ===`);

try {
  step(1, 'Verificando requisitos');
  const nodeMajor = Number(process.version.slice(1).split('.')[0]);
  if (nodeMajor < 20) throw new Error(`Se requiere Node >= 20 (actual: ${process.version})`);
  run('docker --version');
  run('docker compose version');

  step(2, 'Archivo .env');
  const env = path.join(ROOT, '.env');
  if (!fs.existsSync(env)) {
    fs.copyFileSync(path.join(ROOT, '.env.example'), env);
    const contenido = fs
      .readFileSync(env, 'utf8')
      .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`);
    fs.writeFileSync(env, contenido);
    console.log('Creado .env desde .env.example con un JWT_SECRET aleatorio.');
  } else {
    console.log('.env ya existe, no se toca.');
  }

  step(3, 'Instalando dependencias (backend + frontend)');
  run('npm --prefix backend install');
  run('npm --prefix frontend install');

  step(4, 'Levantando Postgres + Adminer');
  run('docker compose up -d postgres adminer');
  console.log('Esperando a que Postgres esté sano...');
  execSync(
    'until docker exec intereses-postgres pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-intereses_db} >/dev/null 2>&1; do sleep 2; done',
    { cwd: ROOT, stdio: 'inherit', shell: '/bin/bash' }
  );

  step(5, 'Migraciones');
  run('npm --prefix backend run migration:run');

  step(6, 'Seed (admin + 20 temas)');
  run('npm --prefix backend run seed');

  console.log(`
Listo. Ahora ejecuta desde la raíz:
  npm run dev        # backend http://localhost:3000/api (+/api/docs) y frontend http://localhost:4200
`);
} catch (err) {
  console.error('\nSetup falló:', err.message);
  process.exit(1);
}
