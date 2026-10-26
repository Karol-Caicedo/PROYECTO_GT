import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AllExceptionsFilter } from '../../common/all-exceptions.filter';
import { CapacitacionesController } from './capacitaciones.controller';
import { CapacitacionesService } from './capacitaciones.service';
import { MailService } from '../mail/mail.service';

const servicio = {
  detallePara: jest.fn().mockResolvedValue({ id: 'mock' }),
  registrarClic: jest.fn().mockResolvedValue({ enlace: 'https://x.co' }),
  actualizar: jest.fn().mockResolvedValue({ id: 'mock' }),
  eliminar: jest.fn().mockResolvedValue({ ok: true }),
  detalle: jest.fn().mockResolvedValue({ id: 'mock', titulo: 'T', descripcion: 'D', modalidad: 'virtual', enlace: 'https://x.co' }),
  destinatarios: jest.fn().mockResolvedValue([]),
};

@Module({
  controllers: [CapacitacionesController],
  providers: [
    { provide: CapacitacionesService, useValue: servicio },
    { provide: MailService, useValue: { enviar: jest.fn().mockResolvedValue({ simulado: true }) } },
  ],
})
class CapacitacionesTestModule {}

describe('H-04 capacitaciones: IDs inválidos', () => {
  let app: INestApplication;
  let base = '';

  beforeAll(async () => {
    app = await NestFactory.create(CapacitacionesTestModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
    const direccion = app.getHttpServer().address();
    const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
    base = `http://127.0.0.1:${puerto}/api/capacitaciones`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ['GET', '/no-es-uuid'],
    ['PATCH', '/no-es-uuid'],
    ['DELETE', '/no-es-uuid'],
    ['POST', '/no-es-uuid/clic'],
    ['POST', '/no-es-uuid/notificar'],
  ])('%s %s responde 400 sin llamar al servicio', async (metodo, ruta) => {
    const res = await fetch(`${base}${ruta}`, { method: metodo });
    expect(res.status).toBe(400);
    expect(servicio.detallePara).not.toHaveBeenCalled();
    expect(servicio.registrarClic).not.toHaveBeenCalled();
    expect(servicio.actualizar).not.toHaveBeenCalled();
    expect(servicio.eliminar).not.toHaveBeenCalled();
    expect(servicio.detalle).not.toHaveBeenCalled();
  });

  test.each([
    ['estado inventado', { estado: 'inventado' }],
    ['semestres duplicados', { semestres: [4, 4] }],
    ['semestres fuera de rango', { semestres: [10] }],
    ['fecha inválida', { fechaEvento: 'no-es-fecha' }],
    ['campo no permitido', { createdBy: '123e4567-e89b-42d3-a456-426614174000' }],
  ])('PATCH rechaza %s con 400', async (_caso, body) => {
    const res = await fetch(`${base}/123e4567-e89b-42d3-a456-426614174000`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
    expect(servicio.actualizar).not.toHaveBeenCalled();
  });
});
