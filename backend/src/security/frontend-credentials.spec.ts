import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const FRONTEND_SRC = join(__dirname, '..', '..', '..', 'frontend', 'src');
const PATRON_CREDENCIAL_EN_LOCALSTORAGE =
  /localStorage\s*\.\s*(?:getItem|setItem)\s*\(\s*['"`](?:token|access_token|password|contrasena|contraseña|passwordPlano)['"`]/i;

function archivosTs(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivosTs(ruta) : ruta.endsWith('.ts') ? [ruta] : [];
  });
}

describe('C-01 credenciales en el navegador', () => {
  test('ningún archivo del frontend guarda token o contraseña en localStorage', () => {
    const infractores = archivosTs(FRONTEND_SRC)
      .filter((ruta) => PATRON_CREDENCIAL_EN_LOCALSTORAGE.test(readFileSync(ruta, 'utf8')))
      .map((ruta) => relative(FRONTEND_SRC, ruta));

    expect(infractores).toEqual([]);
  });
});
