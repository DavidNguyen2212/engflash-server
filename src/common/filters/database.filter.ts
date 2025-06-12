import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(Error)
  export class DatabaseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DatabaseExceptionFilter.name);
  
    catch(exception: Error, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      if (
        exception.message.includes('duplicate key') ||
        exception.message.includes('Unique constraint') ||
        exception.message.includes('P2002')
      ) {
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Duplicate record in database',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
  
      this.logger.error(`Database error: ${exception.message}`);
  
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Database error: ${exception.message}`,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
  