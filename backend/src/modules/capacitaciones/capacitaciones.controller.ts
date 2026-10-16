import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Auth } from '../../common/auth.decorator';
import { CapacitacionesService } from './capacitaciones.service';
import { CapacitacionDto } from './capacitacion.dto';
import { MailService } from '../mail/mail.service';

function storage() {
  const dir = process.env.UPLOADS_DIR || './uploads';
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return diskStorage({
    destination: dir,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

function fileFilter(_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  if (!ok) return cb(new BadRequestException('Solo se permiten imágenes jpg, png o webp'), false);
  cb(null, true);
}

@ApiTags('capacitaciones')
@Controller('capacitaciones')
export class CapacitacionesController {
  constructor(private svc: CapacitacionesService, private mail: MailService) {}

  @Get('mias')
  @Auth('ESTUDIANTE')
  @ApiOperation({ summary: 'Capacitaciones vigentes dirigidas a mi semestre' })
  mias(@Req() req: { user: { semestre: number } }) {
    return this.svc.mias(Number(req.user.semestre));
  }

  @Get()
  @Auth('ADMIN')
  todas(@Query('estado') estado?: string, @Query('semestre') semestre?: string) {
    return this.svc.listarAdmin(estado, semestre ? Number(semestre) : undefined);
  }

  @Get(':id')
  @Auth('ADMIN', 'ESTUDIANTE')
  una(@Param('id') id: string) {
    return this.svc.detalle(id);
  }

  @Post()
  @Auth('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imagen', { storage: storage(), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }))
  crear(@Body() dto: CapacitacionDto, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: { user: { id: string } }) {
    const url = file ? `/uploads/${file.filename}` : null;
    return this.svc.crear(dto, url, req.user.id);
  }

  @Patch(':id')
  @Auth('ADMIN')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imagen', { storage: storage(), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }))
  actualizar(@Param('id') id: string, @Body() dto: Partial<CapacitacionDto>, @UploadedFile() file: Express.Multer.File | undefined) {
    const url = file ? `/uploads/${file.filename}` : undefined;
    return this.svc.actualizar(id, dto as CapacitacionDto, url ?? undefined);
  }

  @Delete(':id')
  @Auth('ADMIN')
  eliminar(@Param('id') id: string) {
    return this.svc.eliminar(id);
  }

  @Post(':id/clic')
  @Auth('ESTUDIANTE', 'ADMIN')
  @ApiOperation({ summary: 'Registra el clic y devuelve el enlace para redirigir' })
  clic(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.svc.registrarClic(id, req.user.id);
  }

  @Post(':id/notificar')
  @Auth('ADMIN')
  @ApiOperation({ summary: 'Notificar por correo a estudiantes de los semestres destino' })
  async notificar(@Param('id') id: string) {
    const cap = await this.svc.detalle(id);
    const destinatarios = await this.svc.destinatarios(id);
    if (!destinatarios.length) return { enviados: 0, mensaje: 'No hay estudiantes en los semestres destino' };
    const html = `<h2>${cap.titulo}</h2><p>${cap.descripcion}</p><p><b>Modalidad:</b> ${cap.modalidad}</p>${cap.fechaEvento ? `<p><b>Fecha:</b> ${cap.fechaEvento}</p>` : ''}<p><a href="${cap.enlace}">Ver más / Inscribirme</a></p>`;
    const r = await this.mail.enviar(destinatarios, `Nueva capacitación: ${cap.titulo}`, html);
    return { enviados: destinatarios.length, ...r };
  }
}
