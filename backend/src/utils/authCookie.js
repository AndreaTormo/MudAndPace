const ACCESS_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mp_access_token';
const USER_ACCESS_COOKIE_NAME = process.env.USER_ACCESS_COOKIE_NAME || 'user_access_token';
const USER_REFRESH_COOKIE_NAME = process.env.USER_REFRESH_COOKIE_NAME || 'user_refresh_token';

function baseCookieOptions() {
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || 'lax';
  const secureEnv = process.env.AUTH_COOKIE_SECURE;
  const secure = secureEnv === 'true' || (secureEnv !== 'false' && process.env.NODE_ENV === 'production');

  const options = {
    httpOnly: true,
    secure: sameSite === 'none' ? true : secure,
    sameSite,
    path: process.env.AUTH_COOKIE_PATH || '/api/v1'
  };

  if (process.env.AUTH_COOKIE_DOMAIN) {
    options.domain = process.env.AUTH_COOKIE_DOMAIN;
  }

  return options;
}

function accessCookieOptions(expiresAt) {
  const options = baseCookieOptions();
  const expires = new Date(expiresAt);

  if (!Number.isNaN(expires.getTime())) {
    options.expires = expires;
    options.maxAge = Math.max(0, expires.getTime() - Date.now());
  }

  return options;
}

function clearAccessCookieOptions() {
  return baseCookieOptions();
}

function userAccessCookieOptions(expiresAt) {
  return accessCookieOptions(expiresAt);
}

function userRefreshCookieOptions(expiresAt) {
  return accessCookieOptions(expiresAt);
}

const LEGACY_COOKIE_NAMES = ['access_token', 'session_id'];

function clearLegacyCookies(res) {
  for (const name of LEGACY_COOKIE_NAMES) {
    res.clearCookie(name, baseCookieOptions());
    res.clearCookie(name, { ...baseCookieOptions(), path: '/' });
  }
}

module.exports = {
  ACCESS_COOKIE_NAME,
  USER_ACCESS_COOKIE_NAME,
  USER_REFRESH_COOKIE_NAME,
  accessCookieOptions,
  clearAccessCookieOptions,
  userAccessCookieOptions,
  userRefreshCookieOptions,
  clearUserCookieOptions: clearAccessCookieOptions,
  clearLegacyCookies
};
