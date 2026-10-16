import { NotFoundException } from '@nestjs/common';
import { TemasService } from './temas.service';
import { mockRepository } from '../../test/test-utils';

function buildService() {
  const repo = mockRepository();
  const svc = new TemasService(repo as never);
  return { svc, repo };
}

describe('TemasService', () => {
  test('activos filtra y ordena; todos no filtra', async () => {
    const { svc, repo } = buildService();
    await svc.activos();
    expect(repo.find).toHaveBeenCalledWith({ where: { activo: true }, order: { nombre: 'ASC' } });
    await svc.todos();
    expect(repo.find).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
  });

  test('crear usa activo=true por defecto', async () => {
    const { svc, repo } = buildService();
    await svc.crear({ nombre: 'IA' });
    expect(repo.create).toHaveBeenCalledWith({ nombre: 'IA', activo: true });
    await svc.crear({ nombre: 'IoT', activo: false });
    expect(repo.create).toHaveBeenCalledWith({ nombre: 'IoT', activo: false });
  });

  test('actualizar/eliminar inexistente → 404', async () => {
    const { svc, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(svc.actualizar('x', { nombre: 'Y' })).rejects.toThrow(NotFoundException);
    await expect(svc.eliminar('x')).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.remove).not.toHaveBeenCalled();
  });

  test('actualizar mezcla cambios y eliminar retorna ok', async () => {
    const { svc, repo } = buildService();
    const t = { id: 't-1', nombre: 'Viejo', activo: true };
    repo.findOne.mockResolvedValue(t);
    await svc.actualizar('t-1', { nombre: 'Nuevo' });
    expect(repo.save).toHaveBeenCalledWith({ id: 't-1', nombre: 'Nuevo', activo: true });
    await expect(svc.eliminar('t-1')).resolves.toEqual({ ok: true });
  });
});
