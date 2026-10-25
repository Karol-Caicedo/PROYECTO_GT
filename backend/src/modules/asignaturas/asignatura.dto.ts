import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AsignaturaDto {
  @IsString({ message: 'El nombre de la asignatura es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsInt({ message: 'El semestre debe ser un número entero entre 1 y 9' })
  @Min(1, { message: 'El semestre mínimo es 1' })
  @Max(9, { message: 'El semestre máximo es 9' })
  semestre: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarAsignaturaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  semestre?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CambiarEstadoTodasDto {
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo: boolean;

  @IsOptional()
  @IsInt({ message: 'El semestre debe ser un número entero entre 1 y 9' })
  @Min(1, { message: 'El semestre mínimo es 1' })
  @Max(9, { message: 'El semestre máximo es 9' })
  semestre?: number;
}
