import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
    WsResponse,
  } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationRecipientDTO } from './dto';
import { Logger, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws.guard';
import { WsAuthenticatedUser } from './interface/ws-authen';
import { WsUser } from './decorators';
import { WsRoleGuard } from './guards/ws-role.guard';
import { Roles } from '../common/decorators';
import { extractJwtFromSocket } from '../common/utils';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
    namespace: '/notifications',
    transports: ['websocket'],
    cors: { origin: ['*'], credentials: true },
  })
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() 
  server: Server;
  
  private readonly logger = new Logger(NotificationsGateway.name)
  // Deprecated. Now user RedisAdapter and Room messaging
  // private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService
  ) {}
  /**
   * Implement WebSocket's Authorization 
   * - While handshaking
   * - On refreshing (hot-swap)
   * @param server 
   */
  async afterInit(server: Server) {
    /** Re‑useable helper */
    const verifyAndAttach = async (socket: Socket, token: string) => {
      const payload = this.jwt.verify(token);
      if (!payload?.sub || !payload?.email) {
        throw new WsException({
          error: 'Unauthorized',
          message: 'Invalid token payload',
          statusCode: 401
        });
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user) 
        throw new WsException({
          error: 'Not found',
          message: 'Invalid user in token payload',
          statusCode: 404
        });

      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        roles: user.getRoleNames(),
        exp: payload.exp,
        socketId: socket.id,
        connectedAt: new Date(),
      } as WsAuthenticatedUser;

      this.logger.debug(
        `Socket ${socket.id} authenticated as ${payload.email}`,
      );
    };

    /* 1. Handshake middleware */
    server.use(async (socket, next) => {
      try {
        const token = extractJwtFromSocket(socket);
        await verifyAndAttach(socket, token);
        next();
      } catch (err) {
        next(new WsException({ error: 'Unauthorized', message: err.message }));
      }
    });

    /* 2. Hot‑swap listener per socket */
    server.on('connection', (socket) => {
      socket.on(
        'authentication',
        async (newToken: string, ack?: (res: any) => void) => {
          try {
            await verifyAndAttach(socket, newToken);
            ack?.({ ok: true });
          } catch (err) {
            ack?.({ ok: false, error: err.message });
            socket.emit('auth:error', err.message);
            socket.disconnect(true);
          }
        },
      );
    });
  }

  /**
   * Implement WebSocket's Connection
   * - Establish connection
   * - Add current socket to connected users
   * @param client: `Socket`
   */
  async handleConnection(client: Socket) {
    try {      
      this.logger.log(`Client ${client.id} attempting to connect`);      
      const userId = client.data?.user?.id;
      if (userId) {
        // ✅ Join user to their personal room (Redis will handle distribution)
        await client.join(`user:${userId}`)
        this.logger.log(`Socket ${client.id} joined user:${userId} room`)
        // ✅ Optional: Join role-based rooms
        const roles = client.data.user.roles || [];
        for (const role of roles) {
          await client.join(`role:${role}`);
        }
      }
      client.emit('connection:established', {
        message: 'Connection established',
        socketId: client.id,
        userId: userId,
        timestamp: new Date()
      });

      this.logger.log(`Successfully connected socket ${client.id} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Connection failed for ${client.id}:`, error.message);
      client.emit('connection:error', { 
        message: 'Connection failed',
        error: error.message 
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data?.user?.id;
    
    if (userId) {
      this.logger.log(`Client ${client.id} (user: ${userId}) disconnected`);
      // ✅ Socket.IO automatically handles room cleanup on disconnect
    }
  }

  // Message handlers với guards
  @SubscribeMessage('notification:subscribe')
  @UseGuards(WsJwtGuard, WsRoleGuard)
  @Roles('user', 'admin', 'moderator')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @WsUser() user: WsAuthenticatedUser,
    @MessageBody() data: { categories: string[] }
  ) {
    // Join user to their personal room
    client.join(`user:${user.id}`);
    
    // Join category rooms
    data.categories.forEach(category => {
      client.join(`category:${category}`);
    });
    
    this.logger.log(`User ${user.email} subscribed to: ${data.categories.join(', ')}`);
    
    return {
      event: 'notification:subscribed',
      data: { 
        categories: data.categories,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles
        }
      }
    };
  }

  @SubscribeMessage('notification:unsubscribe')
  @UseGuards(WsJwtGuard)
  handleUnsubscribeFromNotifications(
    @ConnectedSocket() client: Socket,
    @WsUser() user: WsAuthenticatedUser,
    @MessageBody() data: { categories?: string[] }
  ) {
    const { categories = [] } = data;
    
    categories.forEach(category => {
      client.leave(`category:${category}`);
    });
    
    this.logger.log(`User ${user.id} unsubscribed from categories: ${categories.join(', ')}`);
    
    client.emit('notification:unsubscribed', {
      message: 'Successfully unsubscribed',
      categories,
      userId: user.id
    });
  }

  @SubscribeMessage('notification:mark-read')
  @UseGuards(WsJwtGuard)
  handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @WsUser() user: WsAuthenticatedUser,
    @MessageBody() data: { notificationId: string }
  ) {
    // Logic để mark notification as read
    this.logger.log(`User ${user.id} marked notification ${data.notificationId} as read`);
    
    client.emit('notification:marked-read', {
      notificationId: data.notificationId,
      userId: user.id
    });
  }

  // Public methods để gửi notification
  async sendNotificationToUser(userId: string, notification: any) {
    const room = `user:${userId}`
    const sockets = await this.server.in(room).fetchSockets()

    if (sockets.length > 0) {
      this.server.to(room).emit('notification', notification)
      this.logger.log(`Sent notification to user ${userId} on ${sockets.length} devices`)
      return true
    } else {
      this.logger.warn(`User ${userId} is not connected`);
      return false;
    }
  }

  sendToCategory(category: string, data: NotificationRecipientDTO) {
    this.server.to(`category:${category}`).emit('notification:new', data);
    this.logger.log(`Sent notification to category: ${category}`);
  }

  broadcastToAll(data: NotificationRecipientDTO) {
    this.server.emit('notification:broadcast', data);
    this.logger.log('Broadcasted notification to all users');
  }

  /**
   * Send notification to users with specific role
   */
  async sendNotificationToRole(role: string, notification: any) {
    const room = `role:${role}`;
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Sent notification to role: ${role}`);
  }

  // Utility methods
  /**
   * Get all online users (for admin dashboard)
  */
  async getOnlineUsers(): Promise<string[]> {
    const sockets = await this.server.fetchSockets();
    const onlineUsers = new Set<string>();
    
    sockets.forEach(socket => {
      const userId = socket.data?.user?.id;
      if (userId) {
        onlineUsers.add(userId);
      }
    });
    
    return Array.from(onlineUsers);
  }

  /**
   * Get user's active device count
  */
  async getUserDeviceCount(userId: string): Promise<number> {
    const room = `user:${userId}`;
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length;
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const room = `user:${userId}`;
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * Force disconnect user from all devices
   */
  async disconnectUser(userId: string, reason?: string) {
    const room = `user:${userId}`;
    const sockets = await this.server.in(room).fetchSockets();
    
    for (const socket of sockets) {
      socket.emit('force:disconnect', { reason: reason || 'Disconnected by admin' });
      socket.disconnect(true);
    }
    
    this.logger.log(`Force disconnected user ${userId} from ${sockets.length} devices`);
  }
}