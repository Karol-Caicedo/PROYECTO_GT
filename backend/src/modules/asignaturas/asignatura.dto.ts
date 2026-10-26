import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AsignaturaDto {
  @ApiProperty({ example: 'Cálculo Diferencial' })
  @IsString({ message: 'El nombre de la asignatura es obligatorio' })
  nombre: string;

  @ApiPropertyOptional({ example: 'MAT-101' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 9 })
  @IsInt({ message: 'El semestre debe ser un número entero entre 1 y 9' })
  @Min(1, { message: 'El semestre mínimo es 1' })
  @Max(9, { message: 'El semestre máximo es 9' })
  semestre: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarAsignaturaDto {
  @ApiPropertyOptional({ example: 'Cálculo Diferencial' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'MAT-101' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 9 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  semestre?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CambiarEstadoTodasDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo: boolean;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 9 })
  @IsOptional()
  @IsInt({ message: 'El semestre debe ser un número entero entre 1 y 9' })
  @Min(1, { message: 'El semestre mínimo es 1' })
  @Max(9, { message: 'El semestre máximo es 9' })
  semestre?: number;
}
