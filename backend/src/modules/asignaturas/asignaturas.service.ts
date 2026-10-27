import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignatura } from './asignatura.entity';
import { AsignaturaDto, ActualizarAsignaturaDto } from './asignatura.dto';

@Injectable()
export class AsignaturasService {
  constructor(@InjectRepository(Asignatura) private repo: Repository<Asignatura>) {}

  private respuesta(a: Asignatura) {
    return {
      id: a.id,
      nombre: a.nombre,
      codigo: a.codigo ?? null,
      semestre: a.semestre,
      activo: a.activo,
    };
  }

  async activos(semestre?: number) {
    const where: { activo: boolean; semestre?: number } = { activo: true };
    if (semestre) where.semestre = semestre;
    const asignaturas = await this.repo.find({ where, order: { semestre: 'ASC', nombre: 'ASC' } });
    return asignaturas.map((a) => this.respuesta(a));
  }

  async todos(semestre?: number) {
    const where: { semestre?: number } = {};
    if (semestre) where.semestre = semestre;
    const asignaturas = await this.repo.find({ where, order: { semestre: 'ASC', nombre: 'ASC' } });
    return asignaturas.map((a) => this.respuesta(a));
  }

  async crear(dto: AsignaturaDto) {
    const asignatura = await this.repo.save(this.repo.create({ ...dto, activo: dto.activo ?? true }));
    return this.respuesta(asignatura);
  }

  async actualizar(id: string, dto: ActualizarAsignaturaDto) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asignatura no encontrada');
    Object.assign(a, dto);
    return this.respuesta(await this.repo.save(a));
  }

  async eliminar(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asignatura no encontrada');
    await this.repo.remove(a);
    return { ok: true };
  }

  async cambiarEstadoTodas(activo: boolean, semestre?: number) {
    const qb = this.repo.createQueryBuilder().update(Asignatura).set({ activo });
    if (semestre) {
      qb.where('semestre = :semestre', { semestre });
    }
    await qb.execute();
    return { ok: true, activo, semestre };
  }
}
