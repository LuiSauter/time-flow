import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export type HistoryPeriod = 'week' | 'month' | 'custom';

export class HistoryQueryDto {
  @IsIn(['week', 'month', 'custom'], {
    message: 'El período debe ser semana, mes o personalizado',
  })
  period: HistoryPeriod = 'month';

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  endDate?: string;

  @IsOptional()
  @IsIn([true, false, 'true', 'false'], {
    message: 'El filtro de días hábiles no es válido',
  })
  onlyWeekdays?: boolean | string;

  @IsOptional()
  @IsString({ message: 'El proyecto no es válido' })
  projectId?: string;
}
