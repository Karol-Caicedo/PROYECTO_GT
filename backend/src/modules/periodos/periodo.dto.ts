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
}

export class UpdatePeriodoDto extends CreatePeriodoDto {}
