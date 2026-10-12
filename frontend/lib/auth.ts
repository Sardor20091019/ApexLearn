function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie("accessToken") || getCookie("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie("refreshToken") || getCookie("refresh_token");
}

export function setAuthToken(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;

  document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");

  if (refreshToken) {
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh_token");
  }
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;

  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";

  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refresh_token");
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function redirectToLogin(noticeMessage?: string): void {
  clearAuthTokens();
  if (typeof window !== "undefined") {
    if (noticeMessage) {
      try {
        sessionStorage.setItem("auth_notice", noticeMessage);
      } catch {}
    }
    if (window.location.pathname !== "/auth" && window.location.pathname !== "/") {
      window.location.href = "/auth";
    }
  }
}
