import { Request, Response } from "express";

export interface JwtPayload {
  id: number; // user id
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface BasicAuthResult {
  access_token: string
  refresh_token: string
}

export interface SetAuthCookiesOptions {
  req: Request
  res: Response
  tokens: BasicAuthResult
  node_env: string
  csrf_secret: string
  maxAge: {
    accessToken: number; // ms
    refreshToken: number; // ms
  } 
}