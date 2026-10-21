import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RespuestaAsignatura, RespuestaAsignaturaItem } from './respuesta-asignatura.entity';
import { Asignatura } from '../asignaturas/asignatura.entity';
import { Periodo } from '../periodos/periodo.entity';
import { PeriodosService } from '../periodos/periodos.service';
import { User } from '../users/user.entity';
import { ResponderEncuestaAsignaturaDto } from './encuesta-asignatura.dto';

@Injectable()
export class EncuestasAsignaturasService {
  constructor(
    @InjectRepository(RespuestaAsignatura) private resp: Repository<RespuestaAsignatura>,
    @InjectRepository(RespuestaAsignaturaItem) private respItems: Repository<RespuestaAsignaturaItem>,
    @InjectRepository(Asignatura) private asignaturasRepo: Repository<Asignatura>,
    @InjectRepository(Periodo) private periodosRepo: Repository<Periodo>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private periodosService: PeriodosService,
  ) {}

  async obtenerEstadoParaEstudiante(userId: string) {
    const periodo = await this.periodosService.activo();
    if (!periodo) {
      return { activa: false, periodo: null, asignaturas: [], yaRespondio: false, miRespuesta: null };
    }

    const activa = this.periodosService.esEncuestaAsignaturasVigente(periodo);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const semestre = user.semestre || 1;
    const asignaturas = await this.asignaturasRepo.find({
      where: { semestre, activo: true },
      order: { nombre: 'ASC' },
    });

    const miRespuesta = await this.miRespuesta(userId, periodo.id);
    const yaRespondio = !!miRespuesta;

    return {
      activa,
      periodo,
      asignaturas,
      yaRespondio,
      miRespuesta,
    };
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
      throw new BadRequestException('Debes evaluar las asignaturas de tu semestre');
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

    // Verificar que las asignaturas existan y pertenezcan al semestre
    const ids = dto.items.map((i) => i.asignaturaId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay asignaturas duplicadas en la respuesta');
    }

    const asigsValidas = await this.asignaturasRepo.find({
      where: { id: In(ids), activo: true, semestre: user.semestre },
    });
    if (asigsValidas.length !== ids.length) {
      throw new BadRequestException('Algunas asignaturas no corresponden a tu semestre o no están activas');
    }

    const r = await this.resp.save(
      this.resp.create({
        usuarioId: userId,
        periodoId: periodo.id,
        semestreAlResponder: user.semestre,
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
