import { IsOptional, IsString, MinLength } from 'class-validator';

export class createBookmarkDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  link: string;
}

export class editBookmarkDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
