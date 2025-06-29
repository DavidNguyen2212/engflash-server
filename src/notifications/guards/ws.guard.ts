import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";


@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);
  constructor(
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    const user = client.data?.user;

    if (!user) {                 // Chưa login ⇒ block
      throw new WsException({
        error: 'Unauthorized',
        message: 'Socket unauthenticated',
        statusCode: 401,
      });
    }

    // (Tuỳ chọn) kiểm tra hết hạn => Cho phép bỏ qua lần xử lý này
    if (user.exp && Date.now() / 1000 > user.exp) {
      this.logger.log(`Token expired on Socket client id:${client.id}`)
      client.emit('auth:expired');
      // client.disconnect(true); // Nhưng không ngắt kết nối socket, đợi hot-swap
      return false;
    }

    return true;            
  }
}


  // async canActivate(context: ExecutionContext): Promise<boolean> {
  //   const client = context.switchToWs().getClient<Socket>();

  //   try {
  //     const token = this.extractToken(client);
  //     const payload = this.jwtService.verify(token);
  //     if (!payload?.sub || !payload?.email) {
  //       throw new UnauthorizedException('Invalid token payload');
  //     }

  //     // Fetch user from database (giống như JwtStrategy)
  //     const user = await this.usersService.findOne(payload.sub);
  //     if (!user) {
  //       throw new WsException({
  //         error: 'Unauthorized',
  //         message: 'User does not exist!',
  //         statusCode: 401
  //       });
  //     }
  //     // Store user info trong socket data
  //     const authenticatedUser: WsAuthenticatedUser = {
  //       id: payload.sub,
  //       email: payload.email,
  //       roles: user.getRoleNames(),
  //       socketId: client.id,
  //       connectedAt: new Date(),
  //     };
  //     console.log(authenticatedUser);
  //     client.data.user = authenticatedUser
  //     this.logger.debug(`WebSocket authentication successful for user: ${user.email}`);
  //     return true;
  //   } catch (error) {
  //     this.logger.error(`WebSocket authentication failed: ${error.message}`);
  //     // Convert HTTP exceptions to WebSocket exceptions
  //     if (error instanceof UnauthorizedException) {
  //       throw new WsException({
  //         error: 'Unauthorized',
  //         message: error.message,
  //         statusCode: 401
  //       });
  //     }
      
  //     throw new WsException({
  //       error: 'Authentication Error',
  //       message: 'Token verification failed',
  //       statusCode: 401
  //     });
  //   }
  // }