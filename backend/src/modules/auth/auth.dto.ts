import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsInt, Min, Max, IsBoolean, Equals } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'estudiante@unipacifico.edu.co' })
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo: string;

  @ApiProperty({ example: 'María Fernanda López' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'ClaveSegura123*', minLength: 8 })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 9 })
  @IsInt({ message: 'Semestre debe ser un número entre 1 y 9' })
  @Min(1)
  @Max(9)
  semestre: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: 'Debe autorizar el tratamiento de datos (Ley 1581 de 2012)' })
  aceptoDatos: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'estudiante@unipacifico.edu.co' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'ClaveSegura123*' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class SolicitarRecuperacionDto {
  @ApiProperty({ example: 'estudiante@unipacifico.edu.co' })
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo: string;
}

export class RestablecerClaveDto {
  @ApiProperty({ example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'Token inválido' })
  token: string;

  @ApiProperty({ example: 'NuevaClave123*', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}

export class CompleteSsoDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 9 })
  @IsInt()
  @Min(1)
  @Max(9)
  semestre: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: 'Debe autorizar el tratamiento de datos (Ley 1581 de 2012)' })
  aceptoDatos: boolean;
}

export class CompletarSsoDto extends CompleteSsoDto {
  @ApiProperty({ example: 'temp_7f3c9a2b1d4e5f60718293a4b5c6d7e8', minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'Token temporal inválido' })
  temp: string;
}

export class ActualizarSemestreDto {
  @ApiProperty({ example: 6, minimum: 1, maximum: 9 })
  @IsInt()
  @Min(1)
  @Max(9)
  semestre: number;
}
