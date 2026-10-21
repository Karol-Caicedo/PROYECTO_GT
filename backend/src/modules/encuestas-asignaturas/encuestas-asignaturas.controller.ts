import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../../common/auth.decorator';
import { EncuestasAsignaturasService } from './encuestas-asignaturas.service';
import { ResponderEncuestaAsignaturaDto } from './encuesta-asignatura.dto';

@ApiTags('encuestas-asignaturas')
@Controller('encuestas-asignaturas')
export class EncuestasAsignaturasController {
  constructor(private svc: EncuestasAsignaturasService) {}

  @Get('estado')
  @Auth('ESTUDIANTE', 'ADMIN')
  @ApiOperation({ summary: 'Obtener estado de la encuesta de asignaturas para el estudiante actual' })
  estado(@Req() req: { user: { id: string } }) {
    return this.svc.obtenerEstadoParaEstudiante(req.user.id);
  }

  @Get('mi-respuesta')
  @Auth('ESTUDIANTE', 'ADMIN')
  @ApiOperation({ summary: 'Obtener la respuesta enviada por el estudiante en el periodo' })
  miRespuesta(@Req() req: { user: { id: string } }, @Query('periodoId') periodoId?: string) {
    return this.svc.miRespuesta(req.user.id, periodoId);
  }

  @Post()
  @Auth('ESTUDIANTE')
  @ApiOperation({ summary: 'Enviar respuesta a la encuesta de asignaturas (no modificable)' })
  responder(@Req() req: { user: { id: string } }, @Body() dto: ResponderEncuestaAsignaturaDto) {
    return this.svc.responder(req.user.id, dto);
  }
}
