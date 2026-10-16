import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Respuesta, RespuestaTema } from './respuesta.entity';
import { Sugerencia } from './sugerencia.entity';
import { Tema } from '../temas/tema.entity';
import { Periodo } from '../periodos/periodo.entity';
import { User } from '../users/user.entity';
import { EncuestasService } from './encuestas.service';
import { EncuestasController } from './encuestas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Respuesta, RespuestaTema, Sugerencia, Tema, Periodo, User])],
  controllers: [EncuestasController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
