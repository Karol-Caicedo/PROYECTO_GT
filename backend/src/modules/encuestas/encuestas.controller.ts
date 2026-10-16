import { Body, Controller, Get, Patch, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../../common/auth.decorator';
import { EncuestasService } from './encuestas.service';
import { CrearEncuestaDto } from './encuesta.dto';

@ApiTags('encuestas')
@Controller()
export class EncuestasController {
  constructor(private svc: EncuestasService) {}

  @Get('encuestas/temas-aleatorios')
  @Auth('ESTUDIANTE', 'ADMIN')
  async aleatorios(@Req() req: { user: { id: string } }) {
    const p = await this.svc.periodoActivoOrFail();
    const temas = await this.svc.temasAleatorios(req.user.id, p.id);
    return { periodo: p, temas };
  }

  @Get('encuestas/mi-respuesta')
  @Auth('ESTUDIANTE', 'ADMIN')
  miRespuesta(@Req() req: { user: { id: string } }, @Query('periodoId') periodoId?: string) {
    return this.svc.miRespuesta(req.user.id, periodoId);
  }

  @Post('encuestas')
  @Auth('ESTUDIANTE')
  @ApiOperation({ summary: 'Responder encuesta del periodo activo' })
  responder(@Req() req: { user: { id: string } }, @Body() dto: CrearEncuestaDto) {
    return this.svc.responder(req.user.id, dto);
  }

  @Patch('encuestas/mi-respuesta')
  @Auth('ESTUDIANTE')
  @ApiOperation({ summary: 'Editar mi respuesta mientras el periodo esté activo' })
  editar(@Req() req: { user: { id: string } }, @Body() dto: CrearEncuestaDto) {
    return this.svc.editar(req.user.id, dto);
  }

  @Get('sugerencias')
  @Auth('ADMIN')
  sugerencias(@Query('estado') estado?: string) {
    return this.svc.listarSugerencias(estado);
  }

  @Patch('sugerencias/:id')
  @Auth('ADMIN')
  estado(@Param('id') id: string, @Body() b: { estado: string }) {
    return this.svc.cambiarEstadoSugerencia(id, b.estado);
  }

  @Post('sugerencias/:id/convertir-tema')
  @Auth('ADMIN')
  convertir(@Param('id') id: string) {
    return this.svc.convertirSugerencia(id);
  }
}
