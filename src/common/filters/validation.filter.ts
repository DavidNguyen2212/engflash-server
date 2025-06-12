import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(BadRequestException)
  export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Validation failed';
  
      response.status(400).json({
        statusCode: 400,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
  