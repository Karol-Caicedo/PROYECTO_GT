import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUrl, ArrayMinSize, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CapacitacionDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsUrl({}, { message: 'El enlace debe ser una URL válida' })
  enlace: string;

  @IsOptional()
  @IsString()
  temaId?: string | null;

  @IsOptional()
  @IsDateString()
  fechaEvento?: string | null;

  @IsOptional()
  @IsIn(['virtual', 'presencial'])
  modalidad?: 'virtual' | 'presencial';

  @IsOptional()
  @IsDateString()
  visibleDesde?: string | null;

  @IsOptional()
  @IsDateString()
  visibleHasta?: string | null;

  @IsOptional()
  @IsIn(['borrador', 'publicado'])
  estado?: 'borrador' | 'publicado';

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value.map(Number);
    if (typeof value === 'string') {
      try {
        const p = JSON.parse(value);
        if (Array.isArray(p)) return p.map(Number);
      } catch { /* noop */ }
      if (value.toLowerCase() === 'todos') return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      return value.split(',').map((s) => Number(s.trim()));
    }
    return value;
  })
  semestres?: number[];
}

export class FiltroCapDto {
  @IsOptional()
  @IsIn(['borrador', 'publicado'])
  estado?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  semestre?: number;
}
