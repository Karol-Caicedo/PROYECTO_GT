import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PeriodosService } from './periodos.service';
import { mockRepository } from '../../test/test-utils';

function buildService() {
  const repo = mockRepository();
  const svc = new PeriodosService(repo as never);
  return { svc, repo };
}

const P = { id: 'p-1', nombre: '2026-1', activo: false, modoEncuesta: 'seleccion' };

describe('PeriodosService (un solo activo a la vez)', () => {
  test('create activo desactiva los demás y usa modo por defecto', async () => {
    const { svc, repo } = buildService();
    await svc.create({ nombre: '2026-1', fechaInicio: '2026-01-01', fechaFin: '2026-06-01', activo: true } as never);
    expect(repo.update).toHaveBeenCalledWith({ activo: true }, { activo: false });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ modoEncuesta: 'seleccion' }));
  });

  test('create inactivo no toca los demás y respeta modo calificacion', async () => {
    const { svc, repo } = buildService();
    await svc.create({ nombre: '2026-2', fechaInicio: '2026-07-01', fechaFin: '2026-12-01', activo: false, modoEncuesta: 'calificacion' } as never);
    expect(repo.update).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ modoEncuesta: 'calificacion' }));
  });

  test('update inexistente → 404', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(svc.update('x', {} as never)).rejects.toThrow(NotFoundException);
  });

  test('update que activa desactiva el anterior; si ya estaba activo no', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue({ ...P, activo: false });
    await svc.update('p-1', { activo: true } as never);
    expect(repo.update).toHaveBeenCalledWith({ activo: true }, { activo: false });

    const c2 = buildService();
    c2.repo.findOne.mockResolvedValue({ ...P, activo: true });
    await c2.svc.update('p-1', { activo: true } as never);
    expect(c2.repo.update).not.toHaveBeenCalled();
  });

  test('remove: inexistente → 404; activo → 400; inactivo → ok', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(svc.remove('x')).rejects.toThrow(NotFoundException);
    repo.findOne.mockResolvedValue({ ...P, activo: true });
    await expect(svc.remove('p-1')).rejects.toThrow(BadRequestException);
    expect(repo.remove).not.toHaveBeenCalled();
    repo.findOne.mockResolvedValue({ ...P, activo: false });
    await expect(svc.remove('p-1')).resolves.toEqual({ ok: true });
  });

  test('activar: inexistente → 404; desactiva otros y marca activo', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(svc.activar('x')).rejects.toThrow(NotFoundException);
    const p = { ...P, activo: false };
    repo.findOne.mockResolvedValue(p);
    await svc.activar('p-1');
    expect(repo.update).toHaveBeenCalledWith({ activo: true }, { activo: false });
    expect(p.activo).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(p);
  });

  test('activo delega el filtro al repositorio', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue(P);
    await expect(svc.activo()).resolves.toBe(P);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { activo: true } });
  });
});
