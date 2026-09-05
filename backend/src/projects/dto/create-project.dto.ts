import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'El nombre del proyecto debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del proyecto es obligatorio' })
  @Matches(/\S/, { message: 'El nombre del proyecto no puede estar vacío' })
  name: string;

  @IsString({ message: 'La zona horaria debe ser texto' })
  @IsNotEmpty({ message: 'La zona horaria es obligatoria' })
  timeZone: string;
}
