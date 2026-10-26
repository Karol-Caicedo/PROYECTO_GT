import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { mockUsersService, mockRepository } from '../../test/test-utils';

function mockResend() {
  return { enviarRecuperacion: jest.fn().mockResolvedValue({ simulado: true }) };
}

const DOMINIO = '@unipacifico.edu.co';

function buildService(env: Record<string, string> = {}) {
  const users = mockUsersService();
  const jwt = new JwtService({ secret: 'test-secret' });
  const config = new ConfigService({
    ALLOWED_EMAIL_DOMAIN: DOMINIO,
    AUTH_SSO_ENABLED: 'false',
    ...env,
  });
  const resets = mockRepository();
  const resend = mockResend();
  const svc = new AuthService(users as never, jwt, config, resets as never, resend as never);
  return { svc, users, jwt, resets, resend };
}

const baseUser = {
  id: 'u-1',
  correo: 'est@unipacifico.edu.co',
  nombre: 'Est Uno',
  passwordHash: bcrypt.hashSync('Clave1234', 4),
  proveedorAuth: 'local',
  proveedorId: null,
  semestre: 4,
  rol: 'ESTUDIANTE',
  tokenVersion: 0,
  aceptoDatosAt: new Date(),
};

describe('AuthService', () => {
  describe('ssoEnabled', () => {
    test.each([
      ['true', true],
      ['TRUE', true],
      [' True ', true],
      ['false', false],
      ['', false],
    ])('AUTH_SSO_ENABLED=%j → %s', (valor, esperado) => {
      const { svc } = buildService({ AUTH_SSO_ENABLED: valor });
      expect(svc.ssoEnabled()).toBe(esperado);
    });

    test('sin variable → deshabilitado', () => {
      const users = mockUsersService();
      const svc = new AuthService(users as never, new JwtService({ secret: 'x' }), new ConfigService({}), mockRepository() as never, mockResend() as never);
      expect(svc.ssoEnabled()).toBe(false);
    });
  });

  describe('register', () => {
    test('rechaza correo de otro dominio', async () => {
      const { svc } = buildService();
      await expect(
        svc.register({ correo: 'yo@gmail.com', nombre: 'X', password: 'Clave1234', semestre: 2, aceptoDatos: true }),
      ).rejects.toThrow(BadRequestException);
    });

    test('rechaza correo duplicado', async () => {
      const { svc, users } = buildService();
      users.findByCorreo.mockResolvedValue(baseUser);
      await expect(
        svc.register({ correo: baseUser.correo, nombre: 'X', password: 'Clave1234', semestre: 2, aceptoDatos: true }),
      ).rejects.toThrow(/ya está registrado/);
      expect(users.create).not.toHaveBeenCalled();
    });

    test('crea ESTUDIANTE con hash, rol y fecha de consentimiento', async () => {
      const { svc, users, jwt } = buildService();
      users.findByCorreo.mockResolvedValue(null);
      const r = await svc.register({
        correo: 'NUEVO@unipacifico.edu.co',
        nombre: 'Nuevo',
        password: 'Clave1234',
        semestre: 3,
        aceptoDatos: true,
      });
      expect(users.create).toHaveBeenCalledTimes(1);
      const creado = users.create.mock.calls[0][0] as Record<string, any>;
      expect(creado.correo).toBe('nuevo@unipacifico.edu.co');
      expect(creado.rol).toBe('ESTUDIANTE');
      expect(creado.proveedorAuth).toBe('local');
      expect(creado.aceptoDatosAt).toBeInstanceOf(Date);
      expect(creado.passwordHash).not.toBe('Clave1234');
      expect(await argon2.verify(creado.passwordHash, 'Clave1234')).toBe(true);
      expect(creado).not.toHaveProperty('passwordPlano');
      expect(r.access_token).toBeTruthy();
      expect(jwt.verify(r.access_token)).toMatchObject({
        correo: 'nuevo@unipacifico.edu.co',
        rol: 'ESTUDIANTE',
        semestre: 3,
        tokenVersion: 0,
      });
      expect(r.user).not.toHaveProperty('passwordHash');
      expect(r.user).not.toHaveProperty('tokenVersion');
    });

    test('acepta mayúsculas en el dominio institucional', async () => {
      const { svc, users } = buildService();
      users.findByCorreo.mockResolvedValue(null);
      await svc.register({ correo: 'yo@unipacifico.edu.co', nombre: 'X', password: 'Clave1234', semestre: 1, aceptoDatos: true });
      expect(users.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('credenciales válidas devuelven JWT con sub/rol/semestre', async () => {
      const { svc, users, jwt } = buildService();
      users.findByCorreo.mockResolvedValue(baseUser);
      const r = await svc.login(baseUser.correo, 'Clave1234');
      expect(jwt.verify(r.access_token)).toMatchObject({ sub: 'u-1', tokenVersion: 0 });
      expect(r.user.rol).toBe('ESTUDIANTE');
      expect(r.user).not.toHaveProperty('tokenVersion');
    });

    test.each([
      ['usuario inexistente', null, 'Clave1234'],
      ['clave errada', { ...baseUser }, 'OtraClave99'],
      ['usuario SSO sin password', { ...baseUser, passwordHash: null }, 'Clave1234'],
    ])('rechaza %s con 401', async (_c, user, pass) => {
      const { svc } = buildService();
      svc['users'].findByCorreo = jest.fn().mockResolvedValue(user);
      await expect(svc.login('x@unipacifico.edu.co', pass)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me / actualizarMiSemestre', () => {
    test('me nunca expone passwordHash', async () => {
      const { svc, users } = buildService();
      users.findById.mockResolvedValue(baseUser);
      const me = await svc.me('u-1');
      expect(me).not.toHaveProperty('passwordHash');
      expect(me).not.toHaveProperty('tokenVersion');
      expect(me).toHaveProperty('correo', baseUser.correo);
    });

    test('me con id desconocido → 401', async () => {
      const { svc, users } = buildService();
      users.findById.mockResolvedValue(null);
      await expect(svc.me('nope')).rejects.toThrow(UnauthorizedException);
    });

    test.each([0, 10, -1, 99])('semestre %i inválido → 400', async (s) => {
      const { svc } = buildService();
      await expect(svc.actualizarMiSemestre('u-1', s)).rejects.toThrow(/Semestre inválido/);
    });

    test('actualiza y persiste el semestre', async () => {
      const { svc, users } = buildService();
      const u = { ...baseUser };
      users.findById.mockResolvedValue(u);
      const me = await svc.actualizarMiSemestre('u-1', 7);
      expect(u.semestre).toBe(7);
      expect(users.save).toHaveBeenCalledWith(u);
      expect(me).toHaveProperty('semestre', 7);
    });
  });

  describe('loginSso', () => {
    const perfil = { correo: 'sso@unipacifico.edu.co', nombre: 'SSO User', proveedorId: 'g-1' };

    test('sin correo del proveedor → 400', async () => {
      const { svc } = buildService();
      await expect(svc.loginSso({ correo: '', nombre: 'X', proveedorId: 'g-9' }, 'google')).rejects.toThrow(BadRequestException);
    });

    test('dominio externo → 400', async () => {
      const { svc } = buildService();
      await expect(svc.loginSso({ ...perfil, correo: 'x@gmail.com' }, 'google')).rejects.toThrow(BadRequestException);
    });

    test('usuario nuevo → token temporal con ssoPending (no crea usuario aún)', async () => {
      const { svc, users, jwt } = buildService();
      users.findByCorreo.mockResolvedValue(null);
      const r = await svc.loginSso(perfil, 'google');
      expect(r.necesitaCompletar).toBe(true);
      expect(users.create).not.toHaveBeenCalled();
      const payload = jwt.verify((r as { temp: string }).temp);
      expect(payload).toMatchObject({ correo: perfil.correo, proveedor: 'google', ssoPending: true });
    });

    test('usuario existente sin proveedor → lo vincula y firma JWT', async () => {
      const { svc, users } = buildService();
      const u = { ...baseUser, correo: perfil.correo, proveedorId: null };
      users.findByCorreo.mockResolvedValue(u);
      const r = await svc.loginSso(perfil, 'microsoft');
      expect(r.necesitaCompletar).toBe(false);
      expect(u.proveedorId).toBe('g-1');
      expect(u.proveedorAuth).toBe('microsoft');
      expect(users.save).toHaveBeenCalledWith(u);
      expect((r as { access_token: string }).access_token).toBeTruthy();
    });

    test('usuario ya vinculado → no re-guarda', async () => {
      const { svc, users } = buildService();
      users.findByCorreo.mockResolvedValue({ ...baseUser, proveedorId: 'g-1', proveedorAuth: 'google' });
      await svc.loginSso(perfil, 'google');
      expect(users.save).not.toHaveBeenCalled();
    });
  });

  describe('completarSso', () => {
    const payload = { correo: 'nuevo@unipacifico.edu.co', nombre: 'Nuevo', proveedorId: 'g-2', proveedor: 'google', ssoPending: true };

    test('token basura → 400', async () => {
      const { svc } = buildService();
      await expect(svc.completarSso('no-es-un-jwt', { semestre: 2, aceptoDatos: true })).rejects.toThrow(/inválido o vencido/);
    });

    test('JWT sin marca ssoPending → 400 (no se puede forjar con un access token)', async () => {
      const { svc, jwt } = buildService();
      const falso = jwt.sign({ sub: 'u-1', correo: payload.correo });
      await expect(svc.completarSso(falso, { semestre: 2, aceptoDatos: true })).rejects.toThrow(/inválido/);
    });

    test('flujo válido crea usuario sin password y con consentimiento', async () => {
      const { svc, users, jwt } = buildService();
      users.findByCorreo.mockResolvedValue(null);
      const temp = jwt.sign(payload, { expiresIn: '15m' });
      const r = await svc.completarSso(temp, { semestre: 5, aceptoDatos: true });
      const creado = users.create.mock.calls[0][0] as Record<string, any>;
      expect(creado).toMatchObject({
        correo: payload.correo,
        passwordHash: null,
        proveedorAuth: 'google',
        proveedorId: 'g-2',
        semestre: 5,
        rol: 'ESTUDIANTE',
      });
      expect(creado.aceptoDatosAt).toBeInstanceOf(Date);
      expect(r.access_token).toBeTruthy();
    });

    test('si el correo se registró entretanto → 400', async () => {
      const { svc, users, jwt } = buildService();
      users.findByCorreo.mockResolvedValue(baseUser);
      const temp = jwt.sign(payload, { expiresIn: '15m' });
      await expect(svc.completarSso(temp, { semestre: 5, aceptoDatos: true })).rejects.toThrow(/ya está registrado/);
      expect(users.create).not.toHaveBeenCalled();
    });
  });
});

describe('AuthService recuperación de contraseña', () => {
  const MENSAJE = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

  test('correo inexistente responde genérico sin crear token ni enviar correo', async () => {
    const { svc, users, resets, resend } = buildService();
    users.findByCorreo.mockResolvedValue(null);
    await expect(svc.solicitarRecuperacion('nadie@unipacifico.edu.co')).resolves.toEqual({ mensaje: MENSAJE });
    expect(resets.save).not.toHaveBeenCalled();
    expect(resend.enviarRecuperacion).not.toHaveBeenCalled();
  });

  test('usuario existente invalida tokens previos, guarda hash y envía correo', async () => {
    const { svc, users, resets, resend } = buildService();
    users.findByCorreo.mockResolvedValue(baseUser);
    await expect(svc.solicitarRecuperacion('EST@unipacifico.edu.co')).resolves.toEqual({ mensaje: MENSAJE });
    expect(resets.update).toHaveBeenCalledWith(
      { usuarioId: 'u-1', usadoAt: null },
      expect.objectContaining({ usadoAt: expect.any(Date) }),
    );
    const creado = resets.create.mock.calls[0][0] as Record<string, any>;
    expect(creado.usuarioId).toBe('u-1');
    expect(creado.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(creado.usadoAt).toBeNull();
    expect(creado.expiraAt.getTime()).toBeGreaterThan(Date.now());
    expect(resend.enviarRecuperacion).toHaveBeenCalledTimes(1);
    const [para, nombre, url] = resend.enviarRecuperacion.mock.calls[0];
    expect(para).toBe(baseUser.correo);
    expect(nombre).toBe(baseUser.nombre);
    expect(url).toContain('/auth/restablecer?token=');
  });

  test('restablecer con token válido fija la clave y marca uso único', async () => {
    const { svc, users, resets } = buildService();
    const user = { ...baseUser, passwordHash: 'viejo' };
    const registro = { id: 'r-1', usuarioId: 'u-1', usadoAt: null, expiraAt: new Date(Date.now() + 60000) };
    resets.findOne.mockResolvedValue(registro);
    users.findById.mockResolvedValue(user);
    await expect(svc.restablecerClave('tokencualquiera1234567890', 'NuevaClave1')).resolves.toHaveProperty('mensaje');
    expect(user.passwordHash).not.toBe('viejo');
    expect(await argon2.verify(user.passwordHash, 'NuevaClave1')).toBe(true);
    expect(user.tokenVersion).toBe(1);
    expect(user).not.toHaveProperty('passwordPlano');
    expect(users.save).toHaveBeenCalledWith(user);
    expect(resets.update).toHaveBeenCalledWith(
      { id: 'r-1', usadoAt: expect.anything(), expiraAt: expect.anything() },
      expect.objectContaining({ usadoAt: expect.any(Date) }),
    );
    expect(resets.save).not.toHaveBeenCalled();
  });

  test('si otro proceso ya consumió el token, no cambia la clave', async () => {
    const { svc, users, resets } = buildService();
    const user = { ...baseUser, passwordHash: 'viejo' };
    resets.findOne.mockResolvedValue({ id: 'r-1', usuarioId: 'u-1', usadoAt: null, expiraAt: new Date(Date.now() + 60000) });
    users.findById.mockResolvedValue(user);
    resets.update.mockResolvedValueOnce({ affected: 0 });
    await expect(svc.restablecerClave('tokencualquiera1234567890', 'NuevaClave1')).rejects.toThrow(/inválido o ya venció/);
    expect(user.passwordHash).toBe('viejo');
    expect(users.save).not.toHaveBeenCalled();
  });

  test.each([
    ['token desconocido', null, 'NuevaClave12'],
    ['token ya usado', { usuarioId: 'u-1', usadoAt: new Date(), expiraAt: new Date(Date.now() + 60000) }, 'NuevaClave12'],
    ['token vencido', { usuarioId: 'u-1', usadoAt: null, expiraAt: new Date(Date.now() - 1000) }, 'NuevaClave12'],
  ])('rechaza %s', async (_c, registro, pass) => {
    const { svc, resets } = buildService();
    resets.findOne.mockResolvedValue(registro);
    await expect(svc.restablecerClave('tokencualquiera1234567890', pass as string)).rejects.toThrow(/inválido o ya venció/);
  });

  test('rechaza clave corta sin tocar la BD', async () => {
    const { svc, users } = buildService();
    await expect(svc.restablecerClave('tokencualquiera1234567890', 'corta')).rejects.toThrow(/8 caracteres/);
    expect(users.findById).not.toHaveBeenCalled();
  });
});

describe('AuthService recuperación ante fallo de envío', () => {
  test('si Resend falla, igual responde genérico (no filtra cuentas) y guarda el token', async () => {
    const { svc, users, resets, resend } = buildService();
    users.findByCorreo.mockResolvedValue({
      id: 'u-1', correo: 'est@universidad.edu.co', nombre: 'Est Uno',
    });
    resend.enviarRecuperacion.mockRejectedValue(new Error('No se pudo enviar (Resend 403)'));
    const loggerError = jest.spyOn(require('@nestjs/common').Logger.prototype, 'error').mockImplementation(() => undefined);
    await expect(svc.solicitarRecuperacion('est@universidad.edu.co')).resolves.toEqual({
      mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    });
    expect(resets.save).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalled();
    loggerError.mockRestore();
  });
});
