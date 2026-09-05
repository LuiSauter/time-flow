import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateManualEntryDto {
  @IsString({ message: 'La fecha debe ser texto' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha no es válida' })
  date: string;

  @IsString({ message: 'La hora de inicio debe ser texto' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de inicio no es válida',
  })
  startTime: string;

  @IsString({ message: 'La hora de fin debe ser texto' })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de fin no es válida',
  })
  endTime: string;
}
