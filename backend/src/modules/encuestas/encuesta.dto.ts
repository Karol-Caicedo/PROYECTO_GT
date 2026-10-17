import { Type, Transform, plainToInstance } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested, ArrayMinSize } from 'class-validator';

export class ItemRespuestaDto {
  @IsUUID('4', { message: 'temaId inválido' })
  temaId: string;

  @IsOptional()
  @IsInt({ message: 'El puntaje debe ser entero de 1 a 5' })
  @Min(1)
  @Max(5)
  puntaje?: number;
}

export class CrearEncuestaDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe elegir al menos 1 tema' })
  @ValidateNested({ each: true })
  @Type(() => ItemRespuestaDto)
  @Transform(
    ({ value }) => {
      // Acepta JSON serializado (multipart): parsea y convierte cada ítem a su clase
      // para que la validación anidada funcione igual que con un arreglo real.
      const arr = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(arr) ? arr.map((i) => plainToInstance(ItemRespuestaDto, i)) : arr;
    },
    { toClassOnly: true },
  )
  items: ItemRespuestaDto[];
}
