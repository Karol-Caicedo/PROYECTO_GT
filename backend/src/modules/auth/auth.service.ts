import { createHash, randomBytes } from 'crypto';
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto, CompleteSsoDto } from './auth.dto';
import { PasswordReset } from './password-reset.entity';
import { ResendService } from '../mail/resend.service';

export const RECUPERACION_TTL_MS = 60 * 60 * 1000; // 1 hora

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectRepository(PasswordReset) private resets: Repository<PasswordReset>,
    private resend: ResendService,
  ) { }

  static hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  ssoEnabled() {
    return (this.config.get('AUTH_SSO_ENABLED', 'false') + '').trim().toLowerCase() === 'true';
  }

  private validarDominio(correo: string) {
    const dominio = this.config.get('ALLOWED_EMAIL_DOMAIN', '@gmail.com');
    if (!correo.toLowerCase().endsWith(dominio.toLowerCase())) {
      throw new BadRequestException(`Debe usar su correo institucional (${dominio})`);
    }
  }

  private firmar(user: { id: string; correo: string; rol: string; semestre: number }) {
    return {
      access_token: this.jwt.sign({ sub: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre }),
      user,
    };
  }

  async register(dto: RegisterDto) {
    this.validarDominio(dto.correo);
    const correo = dto.correo.toLowerCase();
    const existe = await this.users.findByCorreo(correo);
    if (existe) throw new BadRequestException('Este correo ya está registrado');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      correo,
      nombre: dto.nombre,
      passwordHash: hash,
      passwordPlano: dto.password,
      proveedorAuth: 'local',
      semestre: dto.semestre,
      rol: 'ESTUDIANTE',
      aceptoDatosAt: new Date(),
    });
    return this.firmar({ id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre });
  }

  async login(correo: string, password: string) {
    const user = await this.users.findByCorreo(correo);
    if (!user || !user.passwordHash) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.firmar({ id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre });
  }

  async me(userId: string) {
    const u = await this.users.findById(userId);
    if (!u) throw new UnauthorizedException('No autenticado');
    const { passwordHash: _p, passwordPlano: _pp, ...resto } = u;
    return resto;
  }

  async actualizarMiSemestre(userId: string, semestre: number) {
    if (semestre < 1 || semestre > 9) throw new BadRequestException('Semestre inválido (1-9)');
    const u = await this.users.findById(userId);
    if (!u) throw new UnauthorizedException('No autenticado');
    u.semestre = semestre;
    await this.users.save(u);
    return this.me(userId);
  }

  /** Flujo SSO: busca o crea usuario; si es nuevo retorna { necesitaCompletar: true, temp } */
  async loginSso(perfil: { correo: string; nombre: string; proveedorId: string }, proveedor: string) {
    if (!perfil.correo) throw new BadRequestException('La cuenta SSO no devolvió un correo válido');
    this.validarDominio(perfil.correo);
    let user = await this.users.findByCorreo(perfil.correo);
    if (!user) {
      // No se puede crear sin semestre + consentimiento: se emite token temporal
      const temp = this.jwt.sign(
        { correo: perfil.correo, nombre: perfil.nombre, proveedorId: perfil.proveedorId, proveedor, ssoPending: true },
        { expiresIn: '15m' },
      );
      return { necesitaCompletar: true, temp, correo: perfil.correo, nombre: perfil.nombre };
    }
    if (!user.proveedorId) {
      user.proveedorId = perfil.proveedorId;
      user.proveedorAuth = proveedor;
      await this.users.save(user);
    }
    return { ...this.firmar({ id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre }), necesitaCompletar: false };
  }

  /**
   * Solicita recuperación de contraseña. Respuesta siempre genérica para no
   * revelar si el correo existe. Solo usuarios con clave local la reciben por correo.
   */
  async solicitarRecuperacion(correo: string) {
    const user = await this.users.findByCorreo((correo || '').trim());
    if (user) {
      await this.resets.update({ usuarioId: user.id, usadoAt: null }, { usadoAt: new Date() });
      const token = randomBytes(32).toString('hex');
      await this.resets.save(
        this.resets.create({
          usuarioId: user.id,
          tokenHash: AuthService.hashToken(token),
          expiraAt: new Date(Date.now() + RECUPERACION_TTL_MS),
          usadoAt: null,
        }),
      );
      const frontend = this.config.get('FRONTEND_URL', 'http://localhost:4200');
      const url = `${frontend}/auth/restablecer?token=${token}`;
      try {
        await this.resend.enviarRecuperacion(user.correo, user.nombre, url);
      } catch (error) {
        // No se propaga: la respuesta debe ser idéntica exista o no el correo
        // (si fallara solo aquí, un atacante distinguiría cuentas registradas).
        // El detalle queda en el log para el administrador (ver ResendService).
        const logger = new Logger(AuthService.name);
        logger.error(`No se pudo enviar recuperación a ${user.correo}: ${(error as Error).message}`);
      }
    }
    return { mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' };
  }

  /** Consume un token válido (una sola vez, 1h) y fija la nueva clave. */
  async restablecerClave(token: string, password: string) {
    if (!password || password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }
    const registro = await this.resets.findOne({ where: { tokenHash: AuthService.hashToken(token || '') } });
    if (!registro || registro.usadoAt || registro.expiraAt.getTime() < Date.now()) {
      throw new BadRequestException('El enlace es inválido o ya venció. Solicita uno nuevo.');
    }
    const user = await this.users.findById(registro.usuarioId);
    if (!user) throw new BadRequestException('El enlace es inválido o ya venció. Solicita uno nuevo.');
    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordPlano = password;
    if (user.proveedorAuth !== 'local') user.proveedorAuth = 'local';
    await this.users.save(user);
    registro.usadoAt = new Date();
    await this.resets.save(registro);
    return { mensaje: 'Contraseña actualizada. Ya puedes ingresar con tu nueva clave.' };
  }

  async completarSso(tempToken: string, dto: CompleteSsoDto) {
    let payload: { correo: string; nombre: string; proveedorId: string; proveedor: string; ssoPending?: boolean };
    try {
      payload = this.jwt.verify(tempToken);
    } catch {
      throw new BadRequestException('Token temporal inválido o vencido');
    }
    if (!payload?.ssoPending) throw new BadRequestException('Token temporal inválido');
    this.validarDominio(payload.correo);
    const existe = await this.users.findByCorreo(payload.correo);
    if (existe) throw new BadRequestException('Este correo ya está registrado');
    const user = await this.users.create({
      correo: payload.correo,
      nombre: payload.nombre,
      passwordHash: null,
      proveedorAuth: payload.proveedor,
      proveedorId: payload.proveedorId,
      semestre: dto.semestre,
      rol: 'ESTUDIANTE',
      aceptoDatosAt: new Date(),
    });
    return this.firmar({ id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre });
  }
}
