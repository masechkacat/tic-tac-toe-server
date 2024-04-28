import { IsInt, Min, Max } from 'class-validator';

export class MoveDto {
  @IsInt()
  @Min(0)
  @Max(8)
  index: number;
}
