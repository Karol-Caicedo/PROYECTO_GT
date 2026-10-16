import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Auth } from '../../common/auth.decorator';
import { UsersService } from './users.service';
import { CrearUsuarioDto, CambiarClaveDto } from './user.dto';

/** Gestión de usuarios por Proyección Social (el registro público está deshabilitado). */
@ApiTags('usuarios')
@Controller('usuarios')
@Auth('ADMIN')
export class UsersController {
  constructor(private users: UsersService, private config: ConfigService) { }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (sin hashes de clave)' })
  async listar() {
    const todos = await this.users.findAll();
    return todos.map(({ passwordHash: _p, ...resto }) => resto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario (estudiante o admin)' })
  async crear(@Body() dto: CrearUsuarioDto) {
    const dominio = this.config.get('ALLOWED_EMAIL_DOMAIN', '@gmail.com');
    if (!dto.correo.toLowerCase().endsWith(String(dominio).toLowerCase())) {
      throw new BadRequestException(`Debe usar su correo institucional (${dominio})`);
    }
    const existe = await this.users.findByCorreo(dto.correo);
    if (existe) throw new BadRequestException('Este correo ya está registrado');
    const user = await this.users.create({
      correo: dto.correo,
      nombre: dto.nombre,
      passwordHash: await bcrypt.hash(dto.password, 10),
      proveedorAuth: 'local',
      semestre: dto.semestre,
      rol: dto.rol,
      aceptoDatosAt: null,
    });
    const { passwordHash: _p, ...resto } = user;
    return resto;
  }

  @Patch(':id/clave')
  @ApiOperation({ summary: 'Restablecer la clave de un usuario' })
  async cambiarClave(@Param('id') id: string, @Body() dto: CambiarClaveDto) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    if (user.proveedorAuth !== 'local') user.proveedorAuth = 'local';
    await this.users.save(user);
    return { mensaje: 'Contraseña actualizada.' };
  }
}
