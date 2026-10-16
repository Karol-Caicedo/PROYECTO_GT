import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EncuestasService } from './encuestas.service';
import { mockRepository, MockRepo } from '../../test/test-utils';

function buildService() {
  const resp = mockRepository();
  const rt = mockRepository();
  const sug = mockRepository();
  const temas = mockRepository();
  const periodos = mockRepository();
  const users = mockRepository();
  const svc = new EncuestasService(resp as never, rt as never, sug as never, temas as never, periodos as never, users as never);
  return { svc, resp, rt, sug, temas, periodos, users };
}

const PERIODO_SEL = { id: 'p-1', nombre: '2026-1', modoEncuesta: 'seleccion', activo: true };
const PERIODO_CAL = { id: 'p-2', nombre: '2026-2', modoEncuesta: 'calificacion', activo: true };
const TEMAS = [{ id: 't-1' }, { id: 't-2' }, { id: 't-3' }, { id: 't-4' }, { id: 't-5' }, { id: 't-6' }];
const USER = { id: 'u-1', semestre: 4 };

describe('EncuestasService', () => {
  describe('validar: modo selección', () => {
    const svc = buildService().svc;
    test.each([
      ['vacío', []],
      ['6 temas', [{ temaId: 'a' }, { temaId: 'b' }, { temaId: 'c' }, { temaId: 'd' }, { temaId: 'e' }, { temaId: 'f' }]],
      ['puntaje 0', [{ temaId: 'a', puntaje: 0 }]],
      ['duplicados', [{ temaId: 'a' }, { temaId: 'a' }]],
    ])('rechaza %s', (_c, items) => {
      expect(() => svc.validar(items as never, 'seleccion')).toThrow(BadRequestException);
    });

    test.each([
      ['1 tema', [{ temaId: 'a' }]],
      ['exactamente 5', [{ temaId: 'a' }, { temaId: 'b' }, { temaId: 'c' }, { temaId: 'd' }, { temaId: 'e' }]],
      ['puntaje null explícito (equivale a ausente)', [{ temaId: 'a', puntaje: null }]],
    ])('acepta %s sin puntajes', (_c, items) => {
      expect(() => svc.validar(items, 'seleccion')).not.toThrow();
    });
  });

  describe('validar: modo calificación', () => {
    const svc = buildService().svc;
    test.each([
      ['vacío', []],
      ['puntaje 0', [{ temaId: 'a', puntaje: 0 }]],
      ['puntaje 6', [{ temaId: 'a', puntaje: 6 }]],
      ['puntaje decimal', [{ temaId: 'a', puntaje: 2.5 }]],
      ['puntaje string', [{ temaId: 'a', puntaje: '3' }]],
      ['puntaje ausente', [{ temaId: 'a' }]],
      ['duplicados calificados', [{ temaId: 'a', puntaje: 3 }, { temaId: 'a', puntaje: 4 }]],
    ])('rechaza %s', (_c, items) => {
      expect(() => svc.validar(items as never, 'calificacion')).toThrow(BadRequestException);
    });

    test('acepta fronteras 1 y 5 y más de 5 temas', () => {
      const items = Array.from({ length: 8 }, (_, i) => ({ temaId: `t-${i}`, puntaje: i % 2 ? 1 : 5 }));
      expect(() => svc.validar(items, 'calificacion')).not.toThrow();
    });
  });

  describe('periodoActivoOrFail', () => {
    test('sin periodo activo → 400', async () => {
      const { svc, periodos } = buildService();
      periodos.findOne.mockResolvedValue(null);
      await expect(svc.periodoActivoOrFail()).rejects.toThrow(/No hay periodo/);
    });
  });

  describe('responder', () => {
    function setup(periodo = PERIODO_SEL, temas = TEMAS) {
      const ctx = buildService();
      ctx.periodos.findOne.mockResolvedValue(periodo);
      ctx.resp.findOne.mockResolvedValue(null);
      ctx.users.findOne.mockResolvedValue(USER);
      ctx.temas.find.mockResolvedValue(temas);
      ctx.resp.save.mockImplementation((e: unknown) => Promise.resolve({ id: 'r-1', ...(e as object) }));
      // miRespuesta: sin respuesta previa simulada → null (evita joins)
      ctx.sug.findOne.mockResolvedValue(null);
      return ctx;
    }

    test('sin periodo activo → 400 y no guarda nada', async () => {
      const { svc, periodos, resp } = buildService();
      periodos.findOne.mockResolvedValue(null);
      await expect(svc.responder('u-1', { items: [{ temaId: 't-1' }] })).rejects.toThrow(BadRequestException);
      expect(resp.save).not.toHaveBeenCalled();
    });

    test('segunda respuesta en el mismo periodo → 400', async () => {
      const ctx = setup();
      ctx.resp.findOne.mockResolvedValue({ id: 'r-previa' });
      await expect(ctx.svc.responder('u-1', { items: [{ temaId: 't-1' }] })).rejects.toThrow(/Ya respondiste/);
      expect(ctx.resp.save).not.toHaveBeenCalled();
    });

    test('usuario inexistente → 404', async () => {
      const ctx = setup();
      ctx.users.findOne.mockResolvedValue(null);
      await expect(ctx.svc.responder('u-1', { items: [{ temaId: 't-1' }] })).rejects.toThrow(NotFoundException);
    });

    test('tema inactivo o inexistente → 400', async () => {
      const ctx = setup();
      await expect(ctx.svc.responder('u-1', { items: [{ temaId: 't-999' }] })).rejects.toThrow(/no está activo/);
      expect(ctx.resp.save).not.toHaveBeenCalled();
    });

    test('guarda semestreAlResponder del momento y puntaje null en selección', async () => {
      const ctx = setup();
      await ctx.svc.responder('u-1', { items: [{ temaId: 't-1' }, { temaId: 't-2' }] });
      expect(ctx.resp.save).toHaveBeenCalledTimes(1);
      expect(ctx.resp.create).toHaveBeenCalledWith({ usuarioId: 'u-1', periodoId: 'p-1', semestreAlResponder: 4 });
      const filas = ctx.rt.save.mock.calls[0][0];
      expect(filas).toHaveLength(2);
      expect(filas[0]).toMatchObject({ respuestaId: 'r-1', temaId: 't-1', puntaje: null });
      expect(ctx.sug.save).not.toHaveBeenCalled();
    });

    test('guarda sugerencia con estado nueva (trim) e ignora texto en blanco', async () => {
      const ctx = setup();
      await ctx.svc.responder('u-1', { items: [{ temaId: 't-1' }], sugerencia: '  Más Rust  ' });
      expect(ctx.sug.save).toHaveBeenCalledTimes(1);
      expect(ctx.sug.create).toHaveBeenCalledWith({ respuestaId: 'r-1', texto: 'Más Rust', estado: 'nueva' });

      const ctx2 = setup();
      await ctx2.svc.responder('u-1', { items: [{ temaId: 't-1' }], sugerencia: '   ' });
      expect(ctx2.sug.save).not.toHaveBeenCalled();
    });

    test('en calificación persiste los puntajes', async () => {
      const ctx = setup(PERIODO_CAL);
      await ctx.svc.responder('u-1', { items: [{ temaId: 't-1', puntaje: 5 }, { temaId: 't-2', puntaje: 2 }] });
      const filas = ctx.rt.save.mock.calls[0][0];
      expect(filas).toEqual([
        { respuestaId: 'r-1', temaId: 't-1', puntaje: 5 },
        { respuestaId: 'r-1', temaId: 't-2', puntaje: 2 },
      ]);
    });
  });

  describe('editar', () => {
    function setup(periodo = PERIODO_SEL) {
      const ctx = buildService();
      ctx.periodos.findOne.mockResolvedValue(periodo);
      ctx.temas.find.mockResolvedValue(TEMAS);
      ctx.sug.findOne.mockResolvedValue(null);
      return ctx;
    }

    test('sin respuesta previa → 404', async () => {
      const ctx = setup();
      ctx.resp.findOne.mockResolvedValue(null);
      await expect(ctx.svc.editar('u-1', { items: [{ temaId: 't-1' }] })).rejects.toThrow(NotFoundException);
    });

    test('reemplaza ítems (delete + save) y conserva sugerencia si no se envía', async () => {
      const ctx = setup();
      ctx.resp.findOne.mockResolvedValue({ id: 'r-1', temas: [] });
      await ctx.svc.editar('u-1', { items: [{ temaId: 't-3' }] });
      expect(ctx.rt.delete).toHaveBeenCalledWith({ respuestaId: 'r-1' });
      expect(ctx.rt.save).toHaveBeenCalledTimes(1);
      expect(ctx.sug.delete).not.toHaveBeenCalled();
    });

    test('sugerencia en blanco elimina la anterior sin crear otra', async () => {
      const ctx = setup();
      ctx.resp.findOne.mockResolvedValue({ id: 'r-1', temas: [] });
      await ctx.svc.editar('u-1', { items: [{ temaId: 't-3' }], sugerencia: '  ' });
      expect(ctx.sug.delete).toHaveBeenCalledWith({ respuestaId: 'r-1' });
      expect(ctx.sug.save).not.toHaveBeenCalled();
    });

    test('nueva sugerencia reemplaza la anterior', async () => {
      const ctx = setup();
      ctx.resp.findOne.mockResolvedValue({ id: 'r-1', temas: [] });
      await ctx.svc.editar('u-1', { items: [{ temaId: 't-3' }], sugerencia: 'Go' });
      expect(ctx.sug.delete).toHaveBeenCalledWith({ respuestaId: 'r-1' });
      expect(ctx.sug.create).toHaveBeenCalledWith({ respuestaId: 'r-1', texto: 'Go', estado: 'nueva' });
    });
  });

  describe('miRespuesta', () => {
    test('sin periodo → null', async () => {
      const { svc, periodos } = buildService();
      periodos.findOne.mockResolvedValue(null);
      await expect(await svc.miRespuesta('u-1')).toBeNull();
    });

    test('sin respuesta → null', async () => {
      const { svc, periodos, resp } = buildService();
      periodos.findOne.mockResolvedValue(PERIODO_SEL);
      resp.findOne.mockResolvedValue(null);
      await expect(await svc.miRespuesta('u-1')).toBeNull();
    });

    test('incluye temasDetalle y texto de sugerencia', async () => {
      const { svc, periodos, resp, temas, sug } = buildService();
      periodos.findOne.mockResolvedValue(PERIODO_SEL);
      resp.findOne.mockResolvedValue({ id: 'r-1', temas: [{ temaId: 't-1' }] });
      temas.find.mockResolvedValue([{ id: 't-1', nombre: 'IA' }]);
      sug.findOne.mockResolvedValue({ texto: 'Más Python' });
      const r = await svc.miRespuesta('u-1');
      expect(r).toMatchObject({ temasDetalle: [{ id: 't-1' }], sugerencia: 'Más Python' });
    });

    test('sin sugerencia → null y sin temas → arreglo vacío', async () => {
      const { svc, periodos, resp, temas, sug } = buildService();
      periodos.findOne.mockResolvedValue(PERIODO_SEL);
      resp.findOne.mockResolvedValue({ id: 'r-1', temas: [] });
      sug.findOne.mockResolvedValue(null);
      const r = await svc.miRespuesta('u-1');
      expect(r).toMatchObject({ temasDetalle: [], sugerencia: null });
      expect(temas.find).not.toHaveBeenCalled();
    });
  });

  describe('temasAleatorios', () => {
    test('determinista por usuario y permutación completa', async () => {
      const { svc, temas } = buildService();
      temas.find.mockResolvedValue(TEMAS);
      const a1 = await svc.temasAleatorios('u-A', 'p-1');
      const a2 = await svc.temasAleatorios('u-A', 'p-1');
      expect(a1.map((t) => t.id).sort()).toEqual(TEMAS.map((t) => t.id).sort());
      expect(a1.map((t) => t.id)).toEqual(a2.map((t) => t.id));
    });

    test('distinto usuario/periodo puede variar el orden', async () => {
      const { svc, temas } = buildService();
      temas.find.mockResolvedValue(TEMAS);
      const ordenes = new Set<string>();
      for (const u of ['u-1', 'u-2', 'u-3', 'u-4', 'u-5']) {
        const r = await svc.temasAleatorios(u, 'p-1');
        ordenes.add(r.map((t) => t.id).join(','));
      }
      expect(ordenes.size).toBeGreaterThan(1);
    });

    test('lista vacía → vacío', async () => {
      const { svc, temas } = buildService();
      temas.find.mockResolvedValue([]);
      await expect(svc.temasAleatorios('u-1', 'p-1')).resolves.toEqual([]);
    });
  });

  describe('sugerencias (admin)', () => {
    let ctx: { svc: EncuestasService; sug: MockRepo; temas: MockRepo };
    beforeEach(() => {
      const c = buildService();
      ctx = { svc: c.svc, sug: c.sug, temas: c.temas };
    });

    test('estado inválido → 400', async () => {
      await expect(ctx.svc.cambiarEstadoSugerencia('s-1', 'borrada')).rejects.toThrow(/Estado inválido/);
    });

    test('sugerencia inexistente → 404 en cambiar y convertir', async () => {
      ctx.sug.findOne.mockResolvedValue(null);
      await expect(ctx.svc.cambiarEstadoSugerencia('x', 'revisada')).rejects.toThrow(NotFoundException);
      await expect(ctx.svc.convertirSugerencia('x')).rejects.toThrow(NotFoundException);
    });

    test('cambiar estado persiste', async () => {
      ctx.sug.findOne.mockResolvedValue({ id: 's-1', estado: 'nueva' });
      await ctx.svc.cambiarEstadoSugerencia('s-1', 'revisada');
      expect(ctx.sug.save).toHaveBeenCalledWith({ id: 's-1', estado: 'revisada' });
    });

    test('convertir crea tema activo y marca aceptada', async () => {
      ctx.sug.findOne.mockResolvedValue({ id: 's-1', texto: '  Rust para backend  ', estado: 'nueva' });
      ctx.temas.findOne.mockResolvedValue(null);
      await ctx.svc.convertirSugerencia('s-1');
      expect(ctx.temas.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Rust para backend', activo: true }),
      );
      expect(ctx.sug.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 's-1', estado: 'aceptada' }),
      );
    });

    test('convertir reutiliza tema existente (no duplica)', async () => {
      const existente = { id: 't-9', nombre: 'Rust para backend' };
      ctx.sug.findOne.mockResolvedValue({ id: 's-1', texto: 'Rust para backend', estado: 'nueva' });
      ctx.temas.findOne.mockResolvedValue(existente);
      const r = await ctx.svc.convertirSugerencia('s-1');
      expect(r).toBe(existente);
      expect(ctx.temas.save).not.toHaveBeenCalled();
    });

    test('convertir trunca nombres a 120 caracteres', async () => {
      ctx.sug.findOne.mockResolvedValue({ id: 's-1', texto: ` ${'x'.repeat(200)} `, estado: 'nueva' });
      ctx.temas.findOne.mockResolvedValue(null);
      await ctx.svc.convertirSugerencia('s-1');
      expect(ctx.temas.create).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'x'.repeat(120) }));
    });
  });
});
