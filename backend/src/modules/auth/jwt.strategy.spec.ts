import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

function buildStrategy(user: Record<string, unknown> | null) {
  const users = { findById: jest.fn().mockResolvedValue(user) };
  const config = new ConfigService({ JWT_SECRET: 'x'.repeat(32) });
  const strategy = new JwtStrategy(config, users as never);
  return { strategy, users };
}

describe('JwtStrategy', () => {
  test('rechaza un token emitido antes de un cambio de contraseña', async () => {
    const { strategy } = buildStrategy({
      id: 'u-1',
      correo: 'est@unipacifico.edu.co',
      rol: 'ESTUDIANTE',
      semestre: 4,
      nombre: 'Est',
      tokenVersion: 2,
    });

    await expect(strategy.validate({ sub: 'u-1', tokenVersion: 1 })).resolves.toBeNull();
  });

  test('acepta el token con la versión vigente', async () => {
    const { strategy } = buildStrategy({
      id: 'u-1',
      correo: 'est@unipacifico.edu.co',
      rol: 'ESTUDIANTE',
      semestre: 4,
      nombre: 'Est',
      tokenVersion: 2,
    });

    await expect(strategy.validate({ sub: 'u-1', tokenVersion: 2 })).resolves.toMatchObject({ id: 'u-1' });
  });

  test('acepta tokens antiguos solo si el usuario sigue en versión 0', async () => {
    const { strategy } = buildStrategy({
      id: 'u-1',
      correo: 'est@unipacifico.edu.co',
      rol: 'ESTUDIANTE',
      semestre: 4,
      nombre: 'Est',
      tokenVersion: 0,
    });

    await expect(strategy.validate({ sub: 'u-1' })).resolves.toMatchObject({ id: 'u-1' });
  });
});
