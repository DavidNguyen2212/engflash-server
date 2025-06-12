import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { CloudinaryHealthIndicator } from './indicators';


@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly cloudinary: CloudinaryHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // pingCheck nhận key, url, object kết quả làm tham số.
    // key này dùng để đánh tên object của kết quả, ví dụ: nestjs-docs trong object bên dưới
    /*
    {
        "status": "ok",
        "info": {
            "nestjs-docs": {
                "status": "up"
            }
        },
        "error": {},
        "details": {
            "nestjs-docs": {
                "status": "up"
            }
        }
    }
    */
    return this.health.check([
      // Check sẽ nhận một list các callback dùng để kiểm tra
      () => this.http.pingCheck('engflash-docs', 'https://engflash-system-ngk.onrender.com/api'),
      () => this.cloudinary.isHealthy('cloudinary'),
      () =>
        this.db.pingCheck('postgres', { timeout: 1500 }),
      () =>
        this.disk.checkStorage('storage', { path: 'C:\\', thresholdPercent: 0.5 }), // use '/' on linux
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }
}
