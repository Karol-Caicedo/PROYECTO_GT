import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Capacitacion, CapacitacionSemestre } from './capacitacion.entity';
import { ClicCapacitacion } from './clic.entity';
import { ActualizarCapacitacionDto, CapacitacionDto } from './capacitacion.dto';

export interface CapacitacionViewer {
  id: string;
  rol: string;
  semestre: number;
}

@Injectable()
export class CapacitacionesService {
  constructor(
    @InjectRepository(Capacitacion) private cap: Repository<Capacitacion>,
    @InjectRepository(CapacitacionSemestre) private sem: Repository<CapacitacionSemestre>,
    @InjectRepository(ClicCapacitacion) private clic: Repository<ClicCapacitacion>,
  ) {}

  /** Filtro de vigencia: publicada + dentro de ventana visible. Lógica pura y testeable. */
  static esVigente(c: { estado: string; visibleDesde?: string | Date | null; visibleHasta?: string | Date | null }, ahora = new Date()) {
    if (c.estado !== 'publicado') return false;
    if (c.visibleDesde && new Date(c.visibleDesde) > ahora) return false;
    if (c.visibleHasta && new Date(c.visibleHasta) < ahora) return false;
    return true;
  }

  async listarAdmin(estado?: string, semestre?: number) {
    const qb = this.cap.createQueryBuilder('c')
      .leftJoinAndMapMany('c.semestres', CapacitacionSemestre, 's', 's.capacitacionId = c.id')
      .orderBy('c.createdAt', 'DESC');
    if (estado) qb.andWhere('c.estado = :e', { e: estado });
    if (semestre) qb.andWhere('s.semestre = :s', { s: semestre });
    const lista = await qb.getMany();
    const ids = lista.map((c) => c.id);
    const conteos = await this.conteoClics(ids) as { capacitacionId: string; total: string }[];
    const mapa = new Map(conteos.map((x) => [x.capacitacionId, Number(x.total)]));
    return lista.map((c) => ({ ...c, clics: mapa.get(c.id) ?? 0 }));
  }

  async mias(semestre: number) {
    const ahora = new Date();
    const todas = await this.cap.createQueryBuilder('c')
      .leftJoinAndMapMany('c.semestres', CapacitacionSemestre, 's', 's.capacitacionId = c.id')
      .where('c.estado = :e', { e: 'publicado' })
      .andWhere('(c.visibleDesde IS NULL OR c.visibleDesde <= :ahora)', { ahora })
      .andWhere('(c.visibleHasta IS NULL OR c.visibleHasta >= :ahora)', { ahora })
      .andWhere('s.semestre = :sem', { sem: semestre })
      .orderBy('c.fechaEvento', 'ASC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC')
      .getMany();
    return todas;
  }

  async crear(dto: CapacitacionDto, imagenUrl: string | null, createdBy: string) {
    const c = await this.cap.save(
      this.cap.create({
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? '',
        enlace: dto.enlace ?? '',
        imagenUrl,
        temaId: dto.temaId || null,
        fechaEvento: dto.fechaEvento ? new Date(dto.fechaEvento) : null,
        modalidad: dto.modalidad ?? 'virtual',
        visibleDesde: dto.visibleDesde ? new Date(dto.visibleDesde) : null,
        visibleHasta: dto.visibleHasta ? new Date(dto.visibleHasta) : null,
        estado: dto.estado ?? 'borrador',
        createdBy,
      }),
    );
    const sems = dto.semestres?.length ? dto.semestres : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    await this.sem.save(sems.map((s) => this.sem.create({ capacitacionId: c.id, semestre: Number(s) })));
    return this.detalle(c.id);
  }

  async puedeVer(c: Capacitacion, viewer: CapacitacionViewer) {
    if (viewer.rol === 'ADMIN') return true;
    if (!CapacitacionesService.esVigente(c)) return false;
    const semestres = c.semestres ?? await this.sem.find({ where: { capacitacionId: c.id } });
    return semestres.some((s) => Number(s.semestre) === Number(viewer.semestre));
  }

  private async conClics(c: Capacitacion) {
    const clics = await this.clic.count({ where: { capacitacionId: c.id } });
    return { ...c, clics };
  }

  async detalle(id: string) {
    const c = await this.cap.findOne({ where: { id }, relations: ['semestres'] });
    if (!c) throw new NotFoundException('Capacitación no encontrada');
    return this.conClics(c);
  }

  async detallePara(id: string, viewer: CapacitacionViewer) {
    const c = await this.cap.findOne({ where: { id }, relations: ['semestres'] });
    if (!c || !(await this.puedeVer(c, viewer))) {
      throw new NotFoundException('Capacitación no encontrada');
    }
    return this.conClics(c);
  }

  async actualizar(id: string, dto: ActualizarCapacitacionDto, imagenUrl?: string | null) {
    const c = await this.cap.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Capacitación no encontrada');
    Object.assign(c, {
      titulo: dto.titulo ?? c.titulo,
      descripcion: dto.descripcion !== undefined ? (dto.descripcion ?? '') : c.descripcion,
      enlace: dto.enlace !== undefined ? (dto.enlace ?? '') : c.enlace,
      temaId: dto.temaId !== undefined ? dto.temaId || null : c.temaId,
      fechaEvento: dto.fechaEvento !== undefined ? (dto.fechaEvento ? new Date(dto.fechaEvento) : null) : c.fechaEvento,
      modalidad: dto.modalidad ?? c.modalidad,
      visibleDesde: dto.visibleDesde !== undefined ? (dto.visibleDesde ? new Date(dto.visibleDesde) : null) : c.visibleDesde,
      visibleHasta: dto.visibleHasta !== undefined ? (dto.visibleHasta ? new Date(dto.visibleHasta) : null) : c.visibleHasta,
      estado: dto.estado ?? c.estado,
      ...(imagenUrl !== undefined ? { imagenUrl } : {}),
    });
    await this.cap.save(c);
    if (dto.semestres) {
      await this.sem.delete({ capacitacionId: id });
      await this.sem.save(dto.semestres.map((s) => this.sem.create({ capacitacionId: id, semestre: Number(s) })));
    }
    return this.detalle(id);
  }

  async eliminar(id: string) {
    const c = await this.cap.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Capacitación no encontrada');
    await this.cap.remove(c);
    return { ok: true };
  }

  async registrarClic(capacitacionId: string, viewer: CapacitacionViewer) {
    const c = await this.cap.findOne({ where: { id: capacitacionId }, relations: ['semestres'] });
    if (!c || !(await this.puedeVer(c, viewer))) {
      throw new NotFoundException('Capacitación no encontrada');
    }
    await this.clic.save(this.clic.create({ capacitacionId, usuarioId: viewer.id }));
    return { enlace: c.enlace };
  }

  async destinatarios(id: string): Promise<string[]> {
    const sems = await this.sem.find({ where: { capacitacionId: id } });
    if (!sems.length) return [];
    const lista = sems.map((s) => s.semestre);
    // correos de estudiantes de esos semestres
    const rows = await this.cap.manager.query(
      'SELECT correo FROM usuarios WHERE rol = $1 AND semestre = ANY($2)',
      ['ESTUDIANTE', lista],
    );
    return (rows as { correo: string }[]).map((r) => r.correo);
  }

  conteoClics(ids: string[]) {
    if (!ids.length) return Promise.resolve([] as { capacitacionId: string; total: string }[]);
    return this.clic.manager.query(
      'SELECT capacitacion_id AS "capacitacionId", COUNT(*) AS total FROM clics_capacitacion WHERE capacitacion_id = ANY($1) GROUP BY capacitacion_id',
      [ids],
    );
  }

  clicsPorTema(periodoId?: string) {
    // Clics agrupados por tema de la capacitación (para declarado vs real)
    const qb = this.clic.createQueryBuilder('cl')
      .innerJoin(Capacitacion, 'c', 'c.id = cl.capacitacionId')
      .select('c.temaId', 'temaId')
      .addSelect('COUNT(*)', 'total')
      .where('c.temaId IS NOT NULL')
      .groupBy('c.temaId');
    return qb.getRawMany();
  }
}
