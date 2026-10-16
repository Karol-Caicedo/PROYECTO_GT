import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/auth.decorator';
import { TemasService, TemaDto } from './temas.service';

@ApiTags('temas')
@Controller('temas')
export class TemasController {
  constructor(private svc: TemasService) {}

  @Get()
  activos() {
    return this.svc.activos();
  }

  @Get('admin/todos')
  @Auth('ADMIN')
  todos() {
    return this.svc.todos();
  }

  @Post()
  @Auth('ADMIN')
  crear(@Body() dto: TemaDto) {
    return this.svc.crear(dto);
  }

  @Patch(':id')
  @Auth('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: TemaDto) {
    return this.svc.actualizar(id, dto);
  }

  @Delete(':id')
  @Auth('ADMIN')
  eliminar(@Param('id') id: string) {
    return this.svc.eliminar(id);
  }
}
