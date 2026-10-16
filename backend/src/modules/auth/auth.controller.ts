import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, CompleteSsoDto, SolicitarRecuperacionDto, RestablecerClaveDto } from './auth.dto';
import { Auth } from '../../common/auth.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('recuperar')
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  recuperar(@Body() dto: SolicitarRecuperacionDto) {
    return this.auth.solicitarRecuperacion(dto.correo);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('restablecer')
  @ApiOperation({ summary: 'Restablecer contraseña con token de un solo uso' })
  restablecer(@Body() dto: RestablecerClaveDto) {
    return this.auth.restablecerClave(dto.token, dto.password);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
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
  miSemestre(@Req() req: { user: { id: string } }, @Body() b: { semestre: number }) {
    return this.auth.actualizarMiSemestre(req.user.id, Number(b.semestre));
  }

  @Get('sso-status')
  @ApiOperation({ summary: 'Indica si el SSO institucional está habilitado' })
  ssoStatus() {
    return { enabled: this.auth.ssoEnabled() };
  }

  // ---- Google OAuth ----
  @Get('google')
  @ApiOperation({ summary: 'Iniciar sesión con Google institucional' })
  @UseGuards(AuthGuard('google'))
  google() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCb(@Req() req: { user: { correo: string; nombre: string; proveedorId: string } }, @Res() res: Response) {
    const r = await this.auth.loginSso(req.user, 'google');
    const frontend = this.config.get('FRONTEND_URL', 'http://localhost:4200');
    if ((r as { necesitaCompletar?: boolean }).necesitaCompletar) {
      const t = (r as { temp: string }).temp;
      return res.redirect(`${frontend}/auth/sso-completar?temp=${encodeURIComponent(t)}`);
    }
    const token = (r as { access_token: string }).access_token;
    return res.redirect(`${frontend}/auth/sso-callback?token=${encodeURIComponent(token)}`);
  }

  // ---- Microsoft OAuth ----
  @Get('microsoft')
  @ApiOperation({ summary: 'Iniciar sesión con Microsoft institucional' })
  @UseGuards(AuthGuard('microsoft'))
  microsoft() {
    return;
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftCb(@Req() req: { user: { correo: string; nombre: string; proveedorId: string } }, @Res() res: Response) {
    const r = await this.auth.loginSso(req.user, 'microsoft');
    const frontend = this.config.get('FRONTEND_URL', 'http://localhost:4200');
    if ((r as { necesitaCompletar?: boolean }).necesitaCompletar) {
      const t = (r as { temp: string }).temp;
      return res.redirect(`${frontend}/auth/sso-completar?temp=${encodeURIComponent(t)}`);
    }
    const token = (r as { access_token: string }).access_token;
    return res.redirect(`${frontend}/auth/sso-callback?token=${encodeURIComponent(token)}`);
  }

  @Post('sso/completar')
  @ApiOperation({ summary: 'Completar registro SSO (semestre + Ley 1581)' })
  completar(@Query('temp') tempQ: string, @Body() dto: CompleteSsoDto, @Req() req: { query: Record<string, string>; body: Record<string, string> }) {
    const temp = tempQ || req.body?.temp || (req.query as { temp?: string })?.temp || '';
    return this.auth.completarSso(String(temp), { semestre: dto.semestre, aceptoDatos: dto.aceptoDatos });
  }
}
