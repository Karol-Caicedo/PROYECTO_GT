import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ItemEncuestaAsignaturaDto {
  @ApiProperty({ example: '123e4567-e89b-42d3-a456-426614174000' })
  @IsString({ message: 'El identificador de la asignatura es obligatorio' })
  asignaturaId: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  tieneDificultad: boolean;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt({ message: 'El nivel de satisfacción debe ser un entero de 1 a 5' })
  @Min(1, { message: 'El nivel mínimo de satisfacción es 1' })
  @Max(5, { message: 'El nivel máximo de satisfacción es 5' })
  nivelSatisfaccion: number;
}

export class ResponderEncuestaAsignaturaDto {
  @ApiProperty({
    type: [ItemEncuestaAsignaturaDto],
    example: [
      { asignaturaId: '123e4567-e89b-42d3-a456-426614174000', tieneDificultad: false, nivelSatisfaccion: 4 },
      { asignaturaId: '123e4567-e89b-42d3-a456-426614174001', tieneDificultad: true, nivelSatisfaccion: 2 },
    ],
  })
  @IsArray({ message: 'Debes enviar la lista de asignaturas evaluadas' })
  @ValidateNested({ each: true })
  @Type(() => ItemEncuestaAsignaturaDto)
  items: ItemEncuestaAsignaturaDto[];
}

export class GuardarInscripcionesDto {
  @ApiProperty({
    example: [
      '123e4567-e89b-42d3-a456-426614174000',
      '123e4567-e89b-42d3-a456-426614174001',
    ],
  })
  @IsArray({ message: 'Debes enviar la lista de asignaturas a inscribir' })
  @IsString({ each: true, message: 'Cada identificador de asignatura debe ser una cadena' })
  asignaturaIds: string[];
}
