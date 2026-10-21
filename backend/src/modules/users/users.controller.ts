import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Auth } from '../../common/auth.decorator';
import { UsersService } from './users.service';
import { CrearUsuarioDto, ActualizarUsuarioDto, CambiarClaveDto } from './user.dto';

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
      numeroIdentificacion: dto.numeroIdentificacion || null,
      passwordHash: await bcrypt.hash(dto.password, 10),
      passwordPlano: dto.password,
      proveedorAuth: 'local',
      semestre: dto.rol === 'ADMIN' ? (dto.semestre ?? 1) : (dto.semestre ?? 1),
      rol: dto.rol,
      aceptoDatosAt: null,
    });
    const { passwordHash: _p, ...resto } = user;
    return resto;
  }

  @Post('verificar-admin')
  @ApiOperation({ summary: 'Verificar identidad del administrador para acciones de seguridad' })
  async verificarAdmin(@Req() req: { user?: { id: string } }, @Body() dto: { password?: string }) {
    if (!dto.password) throw new BadRequestException('Debes ingresar tu contraseña');
    if (!req.user?.id) throw new BadRequestException('No autenticado');
    const admin = await this.users.findById(req.user.id);
    if (!admin || !admin.passwordHash) throw new BadRequestException('No se pudo verificar la cuenta');
    const ok = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!ok) throw new BadRequestException('Contraseña incorrecta');
    return { verificado: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un usuario' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.correo && dto.correo.toLowerCase() !== user.correo.toLowerCase()) {
      const dominio = this.config.get('ALLOWED_EMAIL_DOMAIN', '@gmail.com');
      if (!dto.correo.toLowerCase().endsWith(String(dominio).toLowerCase())) {
        throw new BadRequestException(`Debe usar su correo institucional (${dominio})`);
      }
      const existe = await this.users.findByCorreo(dto.correo);
      if (existe && existe.id !== id) {
        throw new BadRequestException('Este correo ya está registrado por otro usuario');
      }
      user.correo = dto.correo.toLowerCase();
    }

    if (dto.nombre) user.nombre = dto.nombre;
    if (dto.numeroIdentificacion !== undefined) user.numeroIdentificacion = dto.numeroIdentificacion || null;
    if (dto.semestre !== undefined && dto.semestre !== null) user.semestre = Number(dto.semestre);
    if (dto.rol) user.rol = dto.rol;
    if (dto.password && dto.password.trim().length > 0) {
      if (dto.password.trim().length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      user.passwordPlano = dto.password.trim();
      if (user.proveedorAuth !== 'local') user.proveedorAuth = 'local';
    }

    await this.users.save(user);
    const { passwordHash: _p, ...resto } = user;
    return resto;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  async eliminar(@Param('id') id: string, @Req() req: { user?: { id: string } }) {
    if (req?.user?.id === id) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.users.remove(id);
    return { ok: true, mensaje: 'Usuario eliminado' };
  }

  @Patch(':id/clave')
  @ApiOperation({ summary: 'Restablecer la clave de un usuario' })
  async cambiarClave(@Param('id') id: string, @Body() dto: CambiarClaveDto) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.passwordPlano = dto.password.trim();
    if (user.proveedorAuth !== 'local') user.proveedorAuth = 'local';
    await this.users.save(user);
    return { mensaje: 'Contraseña actualizada.' };
  }
}

