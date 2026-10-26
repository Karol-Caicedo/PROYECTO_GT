import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

function respuestaFalsa() {
  return {
    setHeader: jest.fn(),
    redirect: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('H-01 SSO sin credenciales en la URL', () => {
  const auth = {
    loginSso: jest.fn(),
    crearCodigoSso: jest.fn(),
    intercambiarCodigoSso: jest.fn(),
  };
  const config = new ConfigService({ FRONTEND_URL: 'https://app.example', AUTH_SSO_ENABLED: 'true' });
  const controller = new AuthController(auth as never, config);

  beforeEach(() => {
    jest.clearAllMocks();
    auth.loginSso.mockResolvedValue({ necesitaCompletar: false, access_token: 'jwt-no-debe-ir-en-url' });
    auth.crearCodigoSso.mockResolvedValue('codigo-aleatorio');
  });

  test('el callback redirige sin token ni temp y entrega el código en cookie HttpOnly', async () => {
    const res = respuestaFalsa();
    await controller.googleCb(
      { user: { correo: 'a@unipacifico.edu.co', nombre: 'A', proveedorId: 'g-1' } },
      res as never,
    );

    const destino = String(res.redirect.mock.calls[0][0]);
    expect(destino).toBe('https://app.example/auth/sso-callback');
    expect(destino).not.toContain('token');
    expect(destino).not.toContain('temp');
    expect(res.cookie).toHaveBeenCalledWith(
      'sigice_sso_code',
      'codigo-aleatorio',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/api/auth/sso', maxAge: 60000 }),
    );
    expect(auth.crearCodigoSso).toHaveBeenCalledWith(expect.objectContaining({ correo: 'a@unipacifico.edu.co' }), 'google');
  });

  test('el exchange exige la cookie del código', () => {
    const conExchange = controller as unknown as { exchange: (req: unknown, res: unknown) => unknown };
    expect(conExchange.exchange).toBeDefined();
    expect(() => conExchange.exchange({ headers: {} }, respuestaFalsa())).toThrow(/código/i);
  });

  test('el exchange consume el código, limpia la cookie y devuelve JSON', async () => {
    auth.intercambiarCodigoSso.mockResolvedValue({ access_token: 'jwt', necesitaCompletar: false });
    const conExchange = controller as unknown as { exchange: (req: unknown, res: unknown) => Promise<unknown> };
    const res = respuestaFalsa();
    const r = await conExchange.exchange({ headers: { cookie: 'sigice_sso_code=codigo-aleatorio' } }, res);

    expect(auth.intercambiarCodigoSso).toHaveBeenCalledWith('codigo-aleatorio');
    expect(res.clearCookie).toHaveBeenCalledWith('sigice_sso_code', expect.any(Object));
    expect(r).toEqual({ access_token: 'jwt', necesitaCompletar: false });
  });
});
