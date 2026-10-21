import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePeriodoDto {
  @IsString()
  nombre: string;
  @IsDateString()
  fechaInicio: string;
  @IsDateString()
  fechaFin: string;
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
  @IsOptional()
  @IsIn(['seleccion', 'calificacion'])
  modoEncuesta?: 'seleccion' | 'calificacion';
  @IsOptional()
  @IsBoolean()
  encuestaAsignaturasActiva?: boolean;
  @IsOptional()
  @IsDateString()
  fechaInicioAsignaturas?: string | null;
  @IsOptional()
  @IsDateString()
  fechaFinAsignaturas?: string | null;
}

export class ConfigurarEncuestaAsignaturasDto {
  @IsBoolean()
  encuestaAsignaturasActiva: boolean;
  @IsOptional()
  @IsDateString()
  fechaInicioAsignaturas?: string | null;
  @IsOptional()
  @IsDateString()
  fechaFinAsignaturas?: string | null;
}

export class UpdatePeriodoDto extends CreatePeriodoDto {}
