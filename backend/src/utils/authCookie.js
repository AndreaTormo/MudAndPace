const ACCESS_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mp_access_token';

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

module.exports = {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  clearAccessCookieOptions
};
