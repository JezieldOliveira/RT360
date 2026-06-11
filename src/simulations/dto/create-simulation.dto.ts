import { IsIn, IsNumber, Max, Min } from 'class-validator';

export class CreateSimulationDto {
  @IsIn(['LP', 'LR', 'SN'])
  regime: 'LP' | 'LR' | 'SN';

  @IsNumber()
  @Min(1)
  receita: number;

  @IsNumber()
  @Min(0)
  tributos: number;

  @IsNumber()
  @Min(0)
  csp: number;

  @IsNumber()
  @Min(0)
  adm: number;

  @IsNumber()
  @Min(0)
  irpj: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  cbs: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  ibs: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  aliqSN: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  pctRegular: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  pctSN: number;

  @IsNumber()
  @Min(0)
  @Max(95)
  margemDesejada: number;
}
