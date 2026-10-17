import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { User } from './modules/users/user.entity';
import { Periodo } from './modules/periodos/periodo.entity';
import { Tema } from './modules/temas/tema.entity';
import { Respuesta, RespuestaTema } from './modules/encuestas/respuesta.entity';
import { Capacitacion, CapacitacionSemestre } from './modules/capacitaciones/capacitacion.entity';
import { ClicCapacitacion } from './modules/capacitaciones/clic.entity';
import { RecordatorioEnviado } from './modules/recordatorios/recordatorio.entity';
import { PasswordReset } from './modules/auth/password-reset.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PeriodosModule } from './modules/periodos/periodos.module';
import { TemasModule } from './modules/temas/temas.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CapacitacionesModule } from './modules/capacitaciones/capacitaciones.module';
import { RecordatoriosModule } from './modules/recordatorios/recordatorios.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        host: c.get('DB_HOST', 'localhost'),
        port: Number(c.get('DB_PORT', 5432)),
        username: c.get('DB_USER', 'postgres'),
        password: c.get('DB_PASSWORD', 'postgres'),
        database: c.get('DB_NAME', 'intereses_db'),
        entities: [User, Periodo, Tema, Respuesta, RespuestaTema, Capacitacion, CapacitacionSemestre, ClicCapacitacion, RecordatorioEnviado, PasswordReset],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: false,
        logging: false,
      }),
    }),
    MailModule,
    AuthModule,
    UsersModule,
    PeriodosModule,
    TemasModule,
    EncuestasModule,
    DashboardModule,
    CapacitacionesModule,
    RecordatoriosModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
