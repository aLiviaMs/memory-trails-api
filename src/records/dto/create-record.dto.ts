import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecordDto {
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  @IsString({ message: 'O título deve ser uma string.' })
  title: string;

  @IsNotEmpty({ message: 'A descrição não pode estar vazia.' })
  @IsString({ message: 'A descrição deve ser uma string.' })
  description: string;

  @IsNotEmpty({ message: 'A data de publicação não pode estar vazia.' })
  @IsDateString(
    {},
    {
      message:
        'A data de publicação deve estar no formato ISO8601 (ex: YYYY-MM-DDTHH:mm:ss.sssZ).',
    },
  )
  datePublished: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
