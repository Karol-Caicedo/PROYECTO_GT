import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }
  async validate(_a: string, _r: string, profile: { id: string; emails?: { value: string }[]; displayName?: string }) {
    return {
      proveedorId: profile.id,
      correo: profile.emails?.[0]?.value?.toLowerCase(),
      nombre: profile.displayName || profile.emails?.[0]?.value,
    };
  }
}
