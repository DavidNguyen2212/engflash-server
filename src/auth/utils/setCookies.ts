import { createHmac, randomUUID } from "crypto";
import { SetAuthCookiesOptions } from "../interface";

export const SetCookies = ({req, res, tokens, node_env, csrf_secret, maxAge}: SetAuthCookiesOptions) => {
    const isProduction = node_env === 'production'
    // Set access token cookie
  res.cookie('ef_ac_token', tokens.access_token, {
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: 'strict',
    maxAge: maxAge.accessToken,
  });

  // Set refresh token cookie
  res.cookie('ef_rf_token', tokens.refresh_token, {
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: 'strict',
    maxAge: maxAge.refreshToken,
  });

  // Set CSRF token
  const rawCSRF = randomUUID();
  const signature = createHmac('sha256', csrf_secret).update(rawCSRF).digest('hex');
  const signedCSRFToken = `${rawCSRF}.${signature}`;

  res.cookie('ef_csrf_token', signedCSRFToken, {
    httpOnly: false,
    path: '/',
    secure: isProduction,
    sameSite: 'strict',
    maxAge: maxAge.accessToken,
  });
}