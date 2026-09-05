import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'El nombre completo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @Matches(/\S/, { message: 'El nombre completo no puede estar vacío' })
  fullName: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/\p{Lu}/u, {
    message: 'La contraseña debe contener una letra mayúscula',
  })
  @Matches(/[^\p{L}\p{N}]/u, {
    message: 'La contraseña debe contener un símbolo',
  })
  password: string;
}
