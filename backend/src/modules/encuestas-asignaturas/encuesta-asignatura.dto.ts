import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ItemEncuestaAsignaturaDto {
  @IsString({ message: 'El identificador de la asignatura es obligatorio' })
  asignaturaId: string;

  @IsBoolean()
  tieneDificultad: boolean;

  @IsInt({ message: 'El nivel de satisfacción debe ser un entero de 1 a 5' })
  @Min(1, { message: 'El nivel mínimo de satisfacción es 1' })
  @Max(5, { message: 'El nivel máximo de satisfacción es 5' })
  nivelSatisfaccion: number;
}

export class ResponderEncuestaAsignaturaDto {
  @IsArray({ message: 'Debes enviar la lista de asignaturas evaluadas' })
  @ValidateNested({ each: true })
  @Type(() => ItemEncuestaAsignaturaDto)
  items: ItemEncuestaAsignaturaDto[];
}
