import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // đảm bảo ConfigService được dùng
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isPretty = configService.get<string>('LOG_PRETTY') === 'true';
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: configService.get<string>('LOG_LEVEL') || (isProduction ? 'info' : 'debug'),
            
            transport: isPretty
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                    
                    // Custom colors cho các log levels
                    customColors: 'info:blue,warn:yellow,error:red,debug:gray',
                    
                    // Custom level formatting
                    customLevels: {
                      10: 'TRACE',
                      20: 'DEBUG',
                      30: 'INFO',
                      40: 'WARN',
                      50: 'ERROR',
                      60: 'FATAL'
                    },
                  },
                }
              : undefined,
              
            // Custom properties cho mỗi request
            customProps: (req, res) => ({
              context: 'HTTP',
            }),
            
            // Optimized serializers
            serializers: {
              req: (req) => ({
                method: req.method,
                url: req.url,
                // Chỉ include query nếu có
                ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
                // Chỉ include params nếu có và khác path default
                ...(req.params && Object.keys(req.params).length > 1 && { params: req.params }),
                // Include user info nếu có (cho auth)
                ...(req.user && { userId: req.user.id }),
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
              // Custom error serializer
              err: (err) => ({
                type: err.constructor.name,
                message: err.message,
                stack: err.stack,
              }),
            },
            
            // Custom timestamp format
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            
            // Request ID cho tracking
            genReqId: (req) => req.headers['x-request-id'] || require('crypto').randomUUID(),
            
            // Custom success/error conditions
            customSuccessMessage: (req, res) => {
              const { method, url } = req;
              const { statusCode } = res;
              return `${method} ${url} completed`;
            },
            
            customErrorMessage: (req, res, err) => {
              const { method, url } = req;
              return `${method} ${url} failed: ${err.message}`;
            },
            
            // Disable default logging cho static files
            autoLogging: {
              ignore: (req) => {
                const url = req.url || '';
                return url.includes('/favicon.ico') || 
                       url.includes('/health') ||
                       url.startsWith('/static/');
              }
            },
          },
        }; //
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
