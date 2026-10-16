import { IsEmail, IsString, MinLength, IsInt, Min, Max, IsBoolean, Equals } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo: string;

  @IsString()
  nombre: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsInt({ message: 'Semestre debe ser un número entre 1 y 9' })
  @Min(1)
  @Max(9)
  semestre: number;

  @IsBoolean()
  @Equals(true, { message: 'Debe autorizar el tratamiento de datos (Ley 1581 de 2012)' })
  aceptoDatos: boolean;
}

export class LoginDto {
  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class SolicitarRecuperacionDto {
  @IsEmail({}, { message: 'Correo institucional inválido' })
  correo: string;
}

export class RestablecerClaveDto {
  @IsString()
  @MinLength(10, { message: 'Token inválido' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}

export class CompleteSsoDto {
  @IsInt()
  @Min(1)
  @Max(9)
  semestre: number;

  @IsBoolean()
  @Equals(true, { message: 'Debe autorizar el tratamiento de datos (Ley 1581 de 2012)' })
  aceptoDatos: boolean;
}
