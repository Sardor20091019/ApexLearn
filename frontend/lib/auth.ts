export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    null
  );
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
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
    // Prevent redirect loop if already on /auth or /
    if (window.location.pathname !== "/auth" && window.location.pathname !== "/") {
      window.location.href = "/auth";
    }
  }
}
