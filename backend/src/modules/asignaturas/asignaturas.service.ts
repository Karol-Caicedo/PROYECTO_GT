import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignatura } from './asignatura.entity';
import { AsignaturaDto, ActualizarAsignaturaDto } from './asignatura.dto';

@Injectable()
export class AsignaturasService {
  constructor(@InjectRepository(Asignatura) private repo: Repository<Asignatura>) {}

  activos(semestre?: number) {
    const where: { activo: boolean; semestre?: number } = { activo: true };
    if (semestre) where.semestre = semestre;
    return this.repo.find({ where, order: { semestre: 'ASC', nombre: 'ASC' } });
  }

  todos(semestre?: number) {
    const where: { semestre?: number } = {};
    if (semestre) where.semestre = semestre;
    return this.repo.find({ where, order: { semestre: 'ASC', nombre: 'ASC' } });
  }

  crear(dto: AsignaturaDto) {
    return this.repo.save(this.repo.create({ ...dto, activo: dto.activo ?? true }));
  }

  async actualizar(id: string, dto: ActualizarAsignaturaDto) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asignatura no encontrada');
    Object.assign(a, dto);
    return this.repo.save(a);
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
