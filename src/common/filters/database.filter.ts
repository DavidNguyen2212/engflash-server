import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { PostgresErrorCode } from '../constants/pg.enum';

@Catch(QueryFailedError, EntityNotFoundError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError | EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof QueryFailedError) {
      const driverErr: any = exception.driverError;
      const code = driverErr.code;

      this.logger.error(
        `[QueryFailedError] ${code}: ${driverErr.detail || exception.message}`,
      );

      switch (code) {
        case PostgresErrorCode.UniqueViolation:
          status = HttpStatus.CONFLICT;
          message = 'Duplicated data violates unique constraint';
          break;
        case PostgresErrorCode.ForeignKeyViolation:
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          break;
        case PostgresErrorCode.NotNullViolation:
          status = HttpStatus.BAD_REQUEST;
          message = 'Missing required field';
          break;
        case '40P01': // deadlock
          status = HttpStatus.CONFLICT;
          message = 'Transaction failed due to deadlock';
          break;
        case '40001': // serialization failure
          status = HttpStatus.CONFLICT;
          message = 'Serialization conflict occurred, try again';
          break;
        default:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = driverErr.detail || 'Unexpected database error';
      }
    }

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    }

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
