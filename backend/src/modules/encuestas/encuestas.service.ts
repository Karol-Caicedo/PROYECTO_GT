import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Respuesta, RespuestaTema } from './respuesta.entity';
import { Sugerencia } from './sugerencia.entity';
import { Tema } from '../temas/tema.entity';
import { Periodo } from '../periodos/periodo.entity';
import { User } from '../users/user.entity';
import { CrearEncuestaDto } from './encuesta.dto';

@Injectable()
export class EncuestasService {
  constructor(
    @InjectRepository(Respuesta) private resp: Repository<Respuesta>,
    @InjectRepository(RespuestaTema) private rt: Repository<RespuestaTema>,
    @InjectRepository(Sugerencia) private sug: Repository<Sugerencia>,
    @InjectRepository(Tema) private temas: Repository<Tema>,
    @InjectRepository(Periodo) private periodos: Repository<Periodo>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  /** Valida reglas críticas: una respuesta por periodo, máx 5 en selección, 1-5 en calificación. */
  validar(items: { temaId: string; puntaje?: number }[], modo: string) {
    const ids = items.map((i) => i.temaId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Hay temas duplicados');
    if (modo === 'seleccion') {
      if (items.length < 1 || items.length > 5)
        throw new BadRequestException('En este periodo debes elegir entre 1 y 5 temas');
      for (const i of items) {
        if (i.puntaje !== undefined && i.puntaje !== null)
          throw new BadRequestException('En modo selección no se envían puntajes');
      }
    } else {
      if (items.length < 1) throw new BadRequestException('Debes calificar al menos un tema');
      for (const i of items) {
        if (!Number.isInteger(i.puntaje) || (i.puntaje as number) < 1 || (i.puntaje as number) > 5)
          throw new BadRequestException('Cada tema debe calificarse de 1 a 5');
      }
    }
  }

  async periodoActivoOrFail() {
    const p = await this.periodos.findOne({ where: { activo: true } });
    if (!p) throw new BadRequestException('No hay periodo académico activo con encuesta abierta');
    return p;
  }

  /** Temas activos en orden aleatorio distinto por usuario (semilla = userId+periodo). */
  async temasAleatorios(userId: string, periodoId: string) {
    const lista = await this.temas.find({ where: { activo: true }, order: { nombre: 'ASC' } });
    const seedStr = userId + periodoId;
    let seed = 0;
    for (const c of seedStr) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const arr = [...lista];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async miRespuesta(userId: string, periodoId?: string) {
    const periodo = periodoId
      ? await this.periodos.findOne({ where: { id: periodoId } })
      : await this.periodos.findOne({ where: { activo: true } });
    if (!periodo) return null;
    const r = await this.resp.findOne({ where: { usuarioId: userId, periodoId: periodo.id }, relations: ['temas'] });
    if (!r) return null;
    const temasIds = r.temas.map((t) => t.temaId);
    const info = temasIds.length ? await this.temas.find({ where: { id: In(temasIds) } }) : [];
    const sug = await this.sug.findOne({ where: { respuestaId: r.id } });
    return { ...r, temasDetalle: info, sugerencia: sug?.texto ?? null };
  }

  async responder(userId: string, dto: CrearEncuestaDto) {
    const periodo = await this.periodoActivoOrFail();
    this.validar(dto.items, periodo.modoEncuesta);
    const ya = await this.resp.findOne({ where: { usuarioId: userId, periodoId: periodo.id } });
    if (ya) throw new BadRequestException('Ya respondiste la encuesta de este periodo (puedes editarla)');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const activos = await this.temas.find({ where: { activo: true } });
    const idsActivos = new Set(activos.map((t) => t.id));
    for (const i of dto.items) if (!idsActivos.has(i.temaId)) throw new BadRequestException('Uno de los temas no está activo');

    const r = await this.resp.save(
      this.resp.create({ usuarioId: userId, periodoId: periodo.id, semestreAlResponder: user.semestre }),
    );
    await this.rt.save(
      dto.items.map((i) =>
        this.rt.create({
          respuestaId: r.id,
          temaId: i.temaId,
          puntaje: periodo.modoEncuesta === 'calificacion' ? (i.puntaje as number) : null,
        }),
      ),
    );
    if (dto.sugerencia?.trim()) {
      await this.sug.save(this.sug.create({ respuestaId: r.id, texto: dto.sugerencia.trim(), estado: 'nueva' }));
    }
    return this.miRespuesta(userId, periodo.id);
  }

  async editar(userId: string, dto: CrearEncuestaDto) {
    const periodo = await this.periodoActivoOrFail();
    this.validar(dto.items, periodo.modoEncuesta);
    const r = await this.resp.findOne({ where: { usuarioId: userId, periodoId: periodo.id } });
    if (!r) throw new NotFoundException('Aún no has respondido la encuesta de este periodo');
    const activos = await this.temas.find({ where: { activo: true } });
    const idsActivos = new Set(activos.map((t) => t.id));
    for (const i of dto.items) if (!idsActivos.has(i.temaId)) throw new BadRequestException('Uno de los temas no está activo');
    await this.rt.delete({ respuestaId: r.id });
    await this.rt.save(
      dto.items.map((i) =>
        this.rt.create({
          respuestaId: r.id,
          temaId: i.temaId,
          puntaje: periodo.modoEncuesta === 'calificacion' ? (i.puntaje as number) : null,
        }),
      ),
    );
    if (dto.sugerencia !== undefined) {
      await this.sug.delete({ respuestaId: r.id });
      if (dto.sugerencia?.trim())
        await this.sug.save(this.sug.create({ respuestaId: r.id, texto: dto.sugerencia.trim(), estado: 'nueva' }));
    }
    return this.miRespuesta(userId, periodo.id);
  }

  // ---- Sugerencias (admin) ----
  listarSugerencias(estado?: string) {
    const qb = this.sug.createQueryBuilder('s')
      .leftJoinAndMapOne('s.respuesta', Respuesta, 'r', 'r.id = s.respuestaId')
      .orderBy('s.createdAt', 'DESC');
    if (estado) qb.where('s.estado = :e', { e: estado });
    return qb.getMany();
  }

  async cambiarEstadoSugerencia(id: string, estado: string) {
    if (!['nueva', 'revisada', 'aceptada'].includes(estado)) throw new BadRequestException('Estado inválido');
    const s = await this.sug.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sugerencia no encontrada');
    s.estado = estado as never;
    return this.sug.save(s);
  }

  async convertirSugerencia(id: string) {
    const s = await this.sug.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sugerencia no encontrada');
    const nombre = s.texto.trim().slice(0, 120);
    let tema = await this.temas.findOne({ where: { nombre } });
    if (!tema) tema = await this.temas.save(this.temas.create({ nombre, descripcion: `Propuesto por estudiantes: ${s.texto}`, activo: true }));
    s.estado = 'aceptada';
    await this.sug.save(s);
    return tema;
  }
}
