import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tema } from './tema.entity';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TemaDto {
  @IsString()
  nombre: string;
  @IsOptional()
  @IsString()
  descripcion?: string;
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

@Injectable()
export class TemasService {
  constructor(@InjectRepository(Tema) private repo: Repository<Tema>) {}

  activos() {
    return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }
  todos() {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }
  crear(dto: TemaDto) {
    return this.repo.save(this.repo.create({ ...dto, activo: dto.activo ?? true }));
  }
  async actualizar(id: string, dto: TemaDto) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Tema no encontrado');
    Object.assign(t, dto);
    return this.repo.save(t);
  }
  async eliminar(id: string) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Tema no encontrado');
    await this.repo.remove(t);
    return { ok: true };
  }
}
