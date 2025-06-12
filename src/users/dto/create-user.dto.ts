import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsNumber,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Tên phải là chuỗi ký tự.' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự.' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;

  @IsOptional()
  @IsDate({ message: 'Ngày sinh phải là định dạng ngày hợp lệ.' })
  dateofbirth?: Date;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password: string;

  @IsOptional()
  @IsNumber({}, { message: 'ID nhóm phải là số.' })
  group_id?: number;

  @IsOptional()
  @IsDate({ message: 'Ngày tham gia phải là định dạng ngày hợp lệ.' })
  joined_at?: Date;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là giá trị boolean.' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái xác thực email phải là giá trị boolean.' })
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự.' })
  verificationCode?: string;

  @IsOptional()
  @IsDate({ message: 'Thời hạn mã xác thực phải là định dạng ngày hợp lệ.' })
  verificationCodeExpiresAt?: Date;

  @IsOptional()
  @IsString({ message: 'Mã đặt lại mật khẩu phải là chuỗi ký tự.' })
  passwordResetCode?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Số nỗ lực đặt mật khẩu sai' })
  resetCodeAttempts?: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái xác thực email phải là giá trị boolean.' })
  canResetPassword?: boolean;

  @IsOptional()
  @IsDate({
    message: 'Thời hạn mã đặt lại mật khẩu phải là định dạng ngày hợp lệ.',
  })
  passwordResetCodeExpiresAt?: Date;

  @IsOptional()
  @IsDate({
    message: 'Thời hạn mã đặt lại mật khẩu phải là định dạng ngày hợp lệ.',
  })
  lastLogin?: Date;
}
