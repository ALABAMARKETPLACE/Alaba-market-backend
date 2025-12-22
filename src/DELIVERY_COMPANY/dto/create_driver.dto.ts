import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateDriverDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  license_number: string;

  @IsNotEmpty()
  @IsString()
  countrycode?: string;
}
