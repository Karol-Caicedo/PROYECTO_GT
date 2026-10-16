import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo: string;

  @IsString()
  nombre: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsOptional()
  @IsInt({ message: 'Semestre debe ser un número entre 1 y 9' })
  @Min(1)
  @Max(9)
  semestre?: number;

  @IsIn(['ESTUDIANTE', 'ADMIN'], { message: 'Rol inválido' })
  rol: 'ESTUDIANTE' | 'ADMIN' = 'ESTUDIANTE';
}

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsOptional()
  @IsInt({ message: 'Semestre debe ser un número entre 1 y 9' })
  @Min(1)
  @Max(9)
  semestre?: number;

  @IsOptional()
  @IsIn(['ESTUDIANTE', 'ADMIN'], { message: 'Rol inválido' })
  rol?: 'ESTUDIANTE' | 'ADMIN';
}

export class CambiarClaveDto {
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}

