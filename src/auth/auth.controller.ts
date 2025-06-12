import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators';
import { JwtAuthGuard, LocalAuthGuard } from './guards';
import {
  LoginDto,
  LoginResponseDto,
  LoginUnverifiedResponseDto,
  SignupDto,
  VerifyCodeDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshDTO,
  PassCodeDto,
} from './dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. Verification email sent.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or email already exists',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user credentials and returns access token',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: () => LoginResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User needs to verify email',
    type: () => LoginUnverifiedResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies user email using the verification code',
  })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification code',
  })
  async verifyEmail(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyEmail(verifyCodeDto);
  }

  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend verification code',
    description: 'Sends a new verification code to the user email',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email or already verified',
  })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationCode(resendDto.email);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Generate new access token',
    description: 'Create new access token with refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Create new access token successfully',
  })
  async refreshToken(@Body() refreshData: RefreshDTO) {
    return this.authService.refreshToken(refreshData.refreshToken);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Log out current user',
    description: 'Delete refresh token associated with this session',
  })
  @ApiResponse({
    status: 200,
    description: 'Log out current user successfully',
  })
  async logOut(@Body() logOutData: RefreshDTO) {
    return this.authService.handleLogOut(logOutData.refreshToken);
  }


  @Post('forgot-password')
  @ApiOperation({
    summary: 'Confirm the email you entered',
    description: 'Give the corresponding user_id with the provided email',
  })
  @ApiResponse({
    status: 200,
    description: 'User_id returns if email exists',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('verify-passcode')
  @ApiOperation({
    summary: 'Confirm the code sent to user',
    description: 'Give the corresponding user_id with the provided email',
  })
  @ApiResponse({
    status: 200,
    description: 'User_id returns if email exists',
  })
  async verifyPassCode(@Body() passCodeData: PassCodeDto) {
    return this.authService.verifyPassCode(passCodeData.email, passCodeData.resetCode);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using the user_id received & new password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset code',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reset-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset password',
    description: 'Returns the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Password has been changed successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated or invalid token',
  })
  async changePassword(
    @CurrentUser() user,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }
}


// @Get('test-email')
  // @ApiOperation({
  //   summary: 'Test email configuration',
  //   description: 'Sends a test email to verify SMTP settings',
  // })
  // @ApiQuery({
  //   name: 'email',
  //   required: true,
  //   description: 'Email address to send test email to',
  // })
  // async testEmail(@Query('email') email: string) {
  //   try {
  //     await this.emailService.sendTestEmail(email);
  //     return { message: 'Test email sent successfully' };
  //   } catch (error) {
  //     return {
  //       error: 'Failed to send test email',
  //       details: error.message,
  //     };
  //   }
  // }
