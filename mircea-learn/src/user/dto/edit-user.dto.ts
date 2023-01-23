import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class EditUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @MinLength(2)
  @IsOptional()
  lastName?: string;
}
