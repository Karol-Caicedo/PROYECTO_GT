import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { PasswordReset } from './password-reset.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { MicrosoftStrategy } from './microsoft.strategy';

@Module({
  imports: [
    UsersModule,
    MailModule,
    TypeOrmModule.forFeature([PasswordReset]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: (c.get('JWT_EXPIRES_IN', '12h') as string) as never },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, MicrosoftStrategy],
  exports: [AuthService],
})
export class AuthModule {}
