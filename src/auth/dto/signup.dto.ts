import { ApiProperty } from '@nestjs/swagger';
import {
  IsStrongPassword,
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'User name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Avatar url of google account',
    example: 'image.com',
  })
  @IsEmail()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description:
      'User password - must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
    minLength: 8,
    maxLength: 32,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
