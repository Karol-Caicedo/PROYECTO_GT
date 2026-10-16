import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Respuesta, RespuestaTema } from '../encuestas/respuesta.entity';
import { Tema } from '../temas/tema.entity';
import { Periodo } from '../periodos/periodo.entity';
import { User } from '../users/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CapacitacionesModule } from '../capacitaciones/capacitaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Respuesta, RespuestaTema, Tema, Periodo, User]), CapacitacionesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
