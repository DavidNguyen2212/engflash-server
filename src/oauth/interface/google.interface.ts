import { User } from '../../users/entities';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
}

export interface GoogleOAuthResponse {
  access_token: string;
  refresh_token: string;
  user: Partial<User>;
  new_user: boolean;
}
export interface GoogleOAuthResponse {
  access_token: string;
  refresh_token: string;
  user: Partial<User>;
  new_user: boolean;
}

export interface GoogleOAuthBody {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  grant_type: string;
}
