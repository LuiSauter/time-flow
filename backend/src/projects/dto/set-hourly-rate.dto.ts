import { IsNumber, Min } from 'class-validator';

export class SetHourlyRateDto {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La tarifa debe ser un importe válido con máximo dos decimales' },
  )
  @Min(0, { message: 'La tarifa no puede ser negativa' })
  hourlyRate: number;
}
