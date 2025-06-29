import { JwtPayload } from "../../auth/interface";

export interface WsAuthenticatedUser extends JwtPayload {
  // Can add more fields for WebSocket
  socketId?: string;
  connectedAt?: Date;
}