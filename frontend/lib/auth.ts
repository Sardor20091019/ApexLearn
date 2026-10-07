export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    null;

  // Auto-sync cookie if missing so Next.js server/middleware detects active session
  if (token && !isTokenExpired(token) && !document.cookie.includes("accessToken=")) {
    document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax`;
  }

  return token;
}

export function setAuthToken(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("access_token", accessToken);
  document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refresh_token", refreshToken);
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refresh_token");

  // Expire cookies
  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
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
    // Prevent redirect loop if already on /auth or /
    if (window.location.pathname !== "/auth" && window.location.pathname !== "/") {
      window.location.href = "/auth";
    }
  }
}
