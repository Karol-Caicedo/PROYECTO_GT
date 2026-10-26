import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ActualizarSemestreDto, CompletarSsoDto, LoginDto, SolicitarRecuperacionDto, RestablecerClaveDto } from './auth.dto';
import { SsoEnabledGuard } from './sso-enabled.guard';
import { Auth } from '../../common/auth.decorator';
import { Public } from '../../common/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('recuperar')
  @Public()
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  recuperar(@Body() dto: SolicitarRecuperacionDto) {
    return this.auth.solicitarRecuperacion(dto.correo);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('restablecer')
  @Public()
  @ApiOperation({ summary: 'Restablecer contraseña con token de un solo uso' })
  restablecer(@Body() dto: RestablecerClaveDto) {
    return this.auth.restablecerClave(dto.token, dto.password);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Inicio de sesión con correo y contraseña' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.correo, dto.password);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@Req() req: { user: { id: string } }) {
    return this.auth.me(req.user.id);
  }

  @Patch('mi-semestre')
  @Auth()
  @ApiOperation({ summary: 'Confirmar o actualizar semestre actual (1-9)' })
  miSemestre(@Req() req: { user: { id: string } }, @Body() dto: ActualizarSemestreDto) {
    return this.auth.actualizarMiSemestre(req.user.id, dto.semestre);
  }

  @Get('sso-status')
  @Public()
  @ApiOperation({ summary: 'Indica si el SSO institucional está habilitado' })
  ssoStatus() {
    return { enabled: this.auth.ssoEnabled() };
  }

  // ---- Google OAuth ----
  @Get('google')
  @Public()
  @ApiOperation({ summary: 'Iniciar sesión con Google institucional' })
  @UseGuards(SsoEnabledGuard, AuthGuard('google'))
  google() {
    return;
  }

  @Get('google/callback')
  @Public()
  @UseGuards(SsoEnabledGuard, AuthGuard('google'))
  async googleCb(@Req() req: { user: { correo: string; nombre: string; proveedorId: string } }, @Res() res: Response) {
    const r = await this.auth.loginSso(req.user, 'google');
    return this.redirigirSso(res, r);
  }

  // ---- Microsoft OAuth ----
  @Get('microsoft')
  @Public()
  @ApiOperation({ summary: 'Iniciar sesión con Microsoft institucional' })
  @UseGuards(SsoEnabledGuard, AuthGuard('microsoft'))
  microsoft() {
    return;
  }

  @Get('microsoft/callback')
  @Public()
  @UseGuards(SsoEnabledGuard, AuthGuard('microsoft'))
  async microsoftCb(@Req() req: { user: { correo: string; nombre: string; proveedorId: string } }, @Res() res: Response) {
    const r = await this.auth.loginSso(req.user, 'microsoft');
    return this.redirigirSso(res, r);
  }

  @Post('sso/completar')
  @Public()
  @UseGuards(SsoEnabledGuard)
  @ApiOperation({ summary: 'Completar registro SSO (semestre + Ley 1581)' })
  completar(@Body() dto: CompletarSsoDto) {
    return this.auth.completarSso(dto.temp, { semestre: dto.semestre, aceptoDatos: dto.aceptoDatos });
  }

  private redirigirSso(
    res: Response,
    r: { necesitaCompletar?: boolean; temp?: string; access_token?: string },
  ) {
    const frontend = this.config.get('FRONTEND_URL', 'http://localhost:4200');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    if (r.necesitaCompletar) {
      return res.redirect(`${frontend}/auth/sso-completar#temp=${encodeURIComponent(String(r.temp))}`);
    }
    return res.redirect(`${frontend}/auth/sso-callback#token=${encodeURIComponent(String(r.access_token))}`);
  }
}
