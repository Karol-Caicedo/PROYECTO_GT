import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RespuestaAsignatura, RespuestaAsignaturaItem } from './respuesta-asignatura.entity';
import { InscripcionAsignatura } from './inscripcion-asignatura.entity';
import { Asignatura } from '../asignaturas/asignatura.entity';
import { Periodo } from '../periodos/periodo.entity';
import { PeriodosService } from '../periodos/periodos.service';
import { User } from '../users/user.entity';
import { ResponderEncuestaAsignaturaDto, GuardarInscripcionesDto } from './encuesta-asignatura.dto';

@Injectable()
export class EncuestasAsignaturasService {
  constructor(
    @InjectRepository(RespuestaAsignatura) private resp: Repository<RespuestaAsignatura>,
    @InjectRepository(RespuestaAsignaturaItem) private respItems: Repository<RespuestaAsignaturaItem>,
    @InjectRepository(InscripcionAsignatura) private inscripcionesRepo: Repository<InscripcionAsignatura>,
    @InjectRepository(Asignatura) private asignaturasRepo: Repository<Asignatura>,
    @InjectRepository(Periodo) private periodosRepo: Repository<Periodo>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private periodosService: PeriodosService,
  ) {}

  async obtenerEstadoParaEstudiante(userId: string) {
    const periodo = await this.periodosService.activo();
    if (!periodo) {
      return {
        activa: false,
        periodo: null,
        todasAsignaturas: [],
        inscripcionIds: [],
        asignaturasInscritas: [],
        yaRespondio: false,
        miRespuesta: null,
      };
    }

    const activa = this.periodosService.esEncuestaAsignaturasVigente(periodo);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Todas las materias activas del pensum académico (sin sesgo de semestre)
    const todasAsignaturas = await this.asignaturasRepo.find({
      where: { activo: true },
      order: { semestre: 'ASC', nombre: 'ASC' },
    });

    const miRespuesta = await this.miRespuesta(userId, periodo.id);
    const yaRespondio = !!miRespuesta;

    // Inscripciones actuales del estudiante en el periodo activo
    const inscripciones = await this.inscripcionesRepo.find({
      where: { usuarioId: userId, periodoId: periodo.id },
      relations: ['asignatura'],
      order: { createdAt: 'ASC' },
    });

    const inscripcionIds = inscripciones.map((i) => i.asignaturaId);
    let asignaturasInscritas = inscripciones.map((i) => i.asignatura).filter(Boolean);

    // Si ya respondió, sus materias evaluadas son las de su respuesta
    if (yaRespondio && miRespuesta?.items?.length) {
      const idsRespondidos = miRespuesta.items.map((it) => it.asignaturaId);
      asignaturasInscritas = todasAsignaturas.filter((a) => idsRespondidos.includes(a.id));
    }

    return {
      activa,
      periodo,
      todasAsignaturas,
      inscripcionIds,
      asignaturasInscritas,
      yaRespondio,
      miRespuesta,
    };
  }

  async guardarInscripciones(userId: string, dto: GuardarInscripcionesDto) {
    const periodo = await this.periodosService.activo();
    if (!periodo) {
      throw new BadRequestException('No hay periodo académico activo');
    }

    const ya = await this.resp.findOne({ where: { usuarioId: userId, periodoId: periodo.id } });
    if (ya) {
      throw new BadRequestException('Ya enviaste tu encuesta para este periodo y no puedes modificar tus materias');
    }

    const uniqueIds = Array.from(new Set(dto.asignaturaIds || []));
    if (uniqueIds.length === 0) {
      throw new BadRequestException('Debes seleccionar al menos una materia que estés cursando');
    }

    const asignaturasValidas = await this.asignaturasRepo.find({
      where: { id: In(uniqueIds), activo: true },
    });

    if (asignaturasValidas.length !== uniqueIds.length) {
      throw new BadRequestException('Algunas de las materias seleccionadas no existen o están inactivas');
    }

    // Limpiar inscripciones previas de este estudiante en este periodo y guardar las nuevas
    await this.inscripcionesRepo.delete({ usuarioId: userId, periodoId: periodo.id });

    const nuevas = uniqueIds.map((asigId) =>
      this.inscripcionesRepo.create({
        usuarioId: userId,
        periodoId: periodo.id,
        asignaturaId: asigId,
      }),
    );
    await this.inscripcionesRepo.save(nuevas);

    return this.obtenerEstadoParaEstudiante(userId);
  }

  async miRespuesta(userId: string, periodoId?: string) {
    const periodo = periodoId
      ? await this.periodosRepo.findOne({ where: { id: periodoId } })
      : await this.periodosService.activo();
    if (!periodo) return null;

    const r = await this.resp.findOne({
      where: { usuarioId: userId, periodoId: periodo.id },
      relations: ['items'],
    });
    if (!r) return null;

    const asigIds = r.items.map((i) => i.asignaturaId);
    const asignaturas = asigIds.length ? await this.asignaturasRepo.find({ where: { id: In(asigIds) } }) : [];
    const mapaAsig = new Map(asignaturas.map((a) => [a.id, a]));

    const itemsConDetalle = r.items.map((i) => ({
      ...i,
      asignatura: mapaAsig.get(i.asignaturaId) || null,
    }));

    return {
      ...r,
      items: itemsConDetalle,
    };
  }

  async responder(userId: string, dto: ResponderEncuestaAsignaturaDto) {
    const periodo = await this.periodosService.activo();
    if (!periodo) {
      throw new BadRequestException('No hay periodo académico activo');
    }
    if (!this.periodosService.esEncuestaAsignaturasVigente(periodo)) {
      throw new BadRequestException('La encuesta de asignaturas no está habilitada en este momento');
    }

    const ya = await this.resp.findOne({ where: { usuarioId: userId, periodoId: periodo.id } });
    if (ya) {
      throw new BadRequestException('Ya enviaste tu respuesta para este periodo y no se puede modificar');
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Debes evaluar las asignaturas que estás cursando');
    }

    const dificultades = dto.items.filter((i) => i.tieneDificultad);
    if (dificultades.length > 4) {
      throw new BadRequestException('Solo puedes seleccionar un máximo de 4 asignaturas con dificultad');
    }

    for (const item of dto.items) {
      if (item.nivelSatisfaccion < 1 || item.nivelSatisfaccion > 5) {
        throw new BadRequestException('El nivel de satisfacción debe ser entre 1 y 5');
      }
    }

    const ids = dto.items.map((i) => i.asignaturaId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay asignaturas duplicadas en la respuesta');
    }

    // Verificar que las materias existan y estén activas
    const asigsValidas = await this.asignaturasRepo.find({
      where: { id: In(ids), activo: true },
    });
    if (asigsValidas.length !== ids.length) {
      throw new BadRequestException('Algunas asignaturas seleccionadas no están activas en el periodo');
    }

    // Asegurar que las inscripciones existan para cada materia evaluada
    const inscripcionesActuales = await this.inscripcionesRepo.find({
      where: { usuarioId: userId, periodoId: periodo.id },
    });
    const idsInscritos = new Set(inscripcionesActuales.map((i) => i.asignaturaId));

    const inscripcionesFaltantes = ids.filter((id) => !idsInscritos.has(id));
    if (inscripcionesFaltantes.length > 0) {
      const nuevasInscripciones = inscripcionesFaltantes.map((asigId) =>
        this.inscripcionesRepo.create({
          usuarioId: userId,
          periodoId: periodo.id,
          asignaturaId: asigId,
        }),
      );
      await this.inscripcionesRepo.save(nuevasInscripciones);
    }

    const r = await this.resp.save(
      this.resp.create({
        usuarioId: userId,
        periodoId: periodo.id,
        semestreAlResponder: user.semestre || 1,
      }),
    );

    await this.respItems.save(
      dto.items.map((i) =>
        this.respItems.create({
          respuestaAsignaturaId: r.id,
          asignaturaId: i.asignaturaId,
          tieneDificultad: !!i.tieneDificultad,
          nivelSatisfaccion: i.nivelSatisfaccion,
        }),
      ),
    );

    return this.miRespuesta(userId, periodo.id);
  }
}
