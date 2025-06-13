export interface GoogleUserInfo { 
    id: string, 
    email: string, 
    verified_email: boolean, 
    given_name: string, 
    family_name: string, 
    picture: string
}

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token?: string;
}