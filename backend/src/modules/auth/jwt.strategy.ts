import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', 'dev-secret'),
    });
  }
  async validate(payload: { sub: string }) {
    const user = await this.users.findById(payload.sub);
    if (!user) return null;
    return { id: user.id, correo: user.correo, rol: user.rol, semestre: user.semestre, nombre: user.nombre };
  }
}
