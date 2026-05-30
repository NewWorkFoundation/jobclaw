export const ADMIN_COOKIE_NAME = "jobclaw-admin";

function getAdminDashboardToken(): string | undefined {
  const token = process.env.ADMIN_DASHBOARD_TOKEN?.trim();
  return token || undefined;
}

/** True when ADMIN_DASHBOARD_TOKEN is set (required for admin access in production). */
export function isAdminAuthConfigured(): boolean {
  return Boolean(getAdminDashboardToken());
}

export function isValidAdminPassword(password: string | null | undefined): boolean {
  const token = getAdminDashboardToken();
  if (!token || !password) {
    return false;
  }

  return password === token;
}

export function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
