import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { ServerOptions } from "socket.io";
import { Redis } from 'ioredis'
import { OnModuleDestroy } from "@nestjs/common";

export class RedisIoAdapter extends IoAdapter implements OnModuleDestroy {
    constructor(
        app: any,
        private readonly pubClient: Redis
    ) {
        super(app)
    }

    // Don't need this from nestjs docs 'cause we already had redis instance in app module
    // private adapterConstructor: ReturnType<typeof createAdapter>;

    // async connectToRedis(): Promise<void> {
    //     const subClient = this.pubClient.duplicate();

    //     await Promise.all([this.pubClient.connect(), subClient.connect()]);

    //     this.adapterConstructor = createAdapter(this.pubClient, subClient);
    // }

    createIOServer(port: number, options?: ServerOptions) {
        const server = super.createIOServer(port, options)
        const subClient = this.pubClient.duplicate();
        server.adapter(
            createAdapter(this.pubClient, subClient),
        );
        return server;
    }

    onModuleDestroy() {
        this.pubClient.quit();
        /** subClient tự đóng vì nó gắn cờ closeClients: true mặc định trong socket.io-redis. */
    }
}