import { Global, Module } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import Redis from "ioredis";

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS',
            useFactory(configService: ConfigService) {
                return new Redis({
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT')
                })
            },
            inject: [ConfigService]
        }
    ],
    exports: ['REDIS']
})

export class RedisModule {}