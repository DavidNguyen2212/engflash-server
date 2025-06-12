export interface JwtPayload {
    id: number;       // user id
    email: string;
    roles: string[];     
    iat?: number;
    exp?: number;
  }
  