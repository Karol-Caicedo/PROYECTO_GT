import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../../common/auth.decorator';
import { PeriodosService } from './periodos.service';
import { CreatePeriodoDto } from './periodo.dto';

@ApiTags('periodos')
@Controller('periodos')
export class PeriodosController {
  constructor(private svc: PeriodosService) {}

  @Get('activo')
  @ApiOperation({ summary: 'Periodo académico activo' })
  activo() {
    return this.svc.activo();
  }

  @Get()
  @Auth('ADMIN')
  listar() {
    return this.svc.findAll();
  }

  @Post()
  @Auth('ADMIN')
  crear(@Body() dto: CreatePeriodoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Auth('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: CreatePeriodoDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/activar')
  @Auth('ADMIN')
  activar(@Param('id') id: string) {
    return this.svc.activar(id);
  }

  @Patch(':id/encuesta-asignaturas')
  @Auth('ADMIN')
  @ApiOperation({ summary: 'Configurar o activar encuesta de asignaturas para el periodo' })
  configurarEncuestaAsignaturas(
    @Param('id') id: string,
    @Body() dto: { encuestaAsignaturasActiva: boolean; fechaInicioAsignaturas?: string | null; fechaFinAsignaturas?: string | null },
  ) {
    return this.svc.configurarEncuestaAsignaturas(id, dto);
  }

  @Delete(':id')
  @Auth('ADMIN')
  eliminar(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
