// import { Injectable } from '@nestjs/common';
// import { HealthIndicatorService } from '@nestjs/terminus';
// import { createClient, RedisClientType } from 'redis';

// @Injectable()
// export class RedisHealthIndicator {
//   private client: RedisClientType;

//   constructor(
//     private readonly healthIndicatorService: HealthIndicatorService,
//   ) {
//     this.client = createClient({
//       socket: {
//         host: process.env.REDIS_HOST || 'localhost',
//         port: +(process.env.REDIS_PORT || 6379),
//       },
//       password: process.env.REDIS_PASSWORD || undefined,
//     });

//     // Kết nối sớm
//     this.client.connect().catch((err) => {
//       console.error('Redis connection failed at startup:', err.message);
//     });
//   }

//   async isHealthy(key: string) {
//     const indicator = this.healthIndicatorService.check(key);

//     try {
//       const pingResult = await this.client.ping();
//       if (pingResult === 'PONG') {
//         return indicator.up();
//       } else {
//         return indicator.down({ message: pingResult });
//       }
//     } catch (error) {
//       return indicator.down({ error: error.message });
//     }
//   }
// }
