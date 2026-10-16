import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Periodo } from './periodo.entity';
import { CreatePeriodoDto } from './periodo.dto';

@Injectable()
export class PeriodosService {
  constructor(@InjectRepository(Periodo) private repo: Repository<Periodo>) {}

  findAll() {
    return this.repo.find({ order: { fechaInicio: 'DESC' } });
  }

  async activo(): Promise<Periodo | null> {
    return this.repo.findOne({ where: { activo: true } });
  }

  async create(dto: CreatePeriodoDto) {
    if (dto.activo) await this.repo.update({ activo: true }, { activo: false });
    const p = this.repo.create({ ...dto, modoEncuesta: dto.modoEncuesta ?? 'seleccion' });
    return this.repo.save(p);
  }

  async update(id: string, dto: CreatePeriodoDto) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Periodo no encontrado');
    if (dto.activo && !p.activo) await this.repo.update({ activo: true }, { activo: false });
    Object.assign(p, dto);
    return this.repo.save(p);
  }

  async remove(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Periodo no encontrado');
    if (p.activo) throw new BadRequestException('No se puede eliminar el periodo activo');
    await this.repo.remove(p);
    return { ok: true };
  }

  async activar(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Periodo no encontrado');
    await this.repo.update({ activo: true }, { activo: false });
    p.activo = true;
    return this.repo.save(p);
  }
}
