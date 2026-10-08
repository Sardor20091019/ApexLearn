"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SupportChat from "../../components/SupportChat";
import Certificate from "../../components/Certificate";
import { useUploadThing } from "../../lib/uploadthing";
import { getAuthToken, isTokenExpired, redirectToLogin } from "../../lib/auth";

type Course = {
  id: string;
  title: string;
  description?: string;
  category?: { name: string } | string | null;
  price?: number | string | null;
  ratingAverage?: number;
  progress?: number;
  thumbnailUrl?: string;
  thumbnail?: string;
  coverImage?: string;
  createdAt?: string;
  isEnrolled?: boolean;
};

type PaymentHistory = {
  id: string;
  stripeSessionId: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
  courses: Course[];
};

type Tab = "catalog" | "learning" | "favorites" | "purchases" | "support";
type ThemeStyle = "white-glass" | "dark-glass";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const category = (c: Course) =>
  typeof c.category === "string" ? c.category : c.category?.name || "General";

const imageFor = (c: Course) => c.thumbnailUrl || c.thumbnail || c.coverImage;

const price = (c: Course) =>
  Number.isFinite(Number(c.price)) ? Number(c.price) : 0;

const money = (n: number) =>
  n === 0
    ? "Free"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(n);

export default function StudentDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("catalog");
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    if (typeof window === "undefined") return "dark-glass";
    const saved = localStorage.getItem("apex_theme_style");
    if (saved === "white-glass" || saved === "dark-glass") return saved;
    return "dark-glass";
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [purchases, setPurchases] = useState<PaymentHistory[]>([]);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingProfile, setOnboardingProfile] = useState({
    age: "",
    identity: "Student",
    goal: "Upskilling for career",
    experience: "Beginner",
  });

  const [cart, setCart] = useState<Course[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("course-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("course-favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [tier, setTier] = useState<"all" | "free" | "paid">("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sort, setSort] = useState<"featured" | "newest" | "oldest" | "low" | "high" | "rating">("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 350);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

  const isInitialMount = useRef(true);

  const [learningCurrentPage, setLearningCurrentPage] = useState(1);
  const learningPageSize = 8;

  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState("USER");
  const [userId, setUserId] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; email: string; avatarUrl?: string; role: string }>({
    id: "",
    name: "",
    email: "",
    role: "USER",
  });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", avatarUrl: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  const [emailOtp, setEmailOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "", otp: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { startUpload: startAvatarUpload } = useUploadThing("userAvatar", {
    onUploadProgress: (p) => setAvatarProgress(p),
    onClientUploadComplete: (res) => {
      setIsUploadingAvatar(false);
      setAvatarProgress(0);
      const uploaded = res?.[0];
      const url = uploaded?.serverData?.url || uploaded?.ufsUrl || uploaded?.url || uploaded?.appUrl;
      if (url) {
        setProfileForm((prev) => ({ ...prev, avatarUrl: url }));
        setUserProfile((prev) => ({ ...prev, avatarUrl: url }));
        tell("Profile picture uploaded successfully!");
      }
    },
    onUploadError: (err) => {
      setIsUploadingAvatar(false);
      setAvatarProgress(0);
      tell(`Avatar upload failed: ${err.message}`);
    },
  });

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingAvatar(true);
    setAvatarProgress(0);
    tell("Uploading profile picture...");
    await startAvatarUpload(Array.from(files));
  };

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const tell = (s: string) => {
    setNotice(s);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const handleThemeChange = (newTheme: ThemeStyle) => {
    setThemeStyle(newTheme);
    localStorage.setItem("apex_theme_style", newTheme);
    tell(`Switched to ${newTheme === "dark-glass" ? "Dark Glass" : "White Glass"} mode!`);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const load = async (token: string) => {
    const h = { Authorization: "Bearer " + token };
    const [a, b, c, d, e, f, g, hNotif] = await Promise.all([
      fetch(API + "/courses", {
        headers: { ...h, "Cache-Control": "no-cache" },
        cache: "no-store",
      }),
      fetch(API + "/enrollments/me", { headers: h }),
      fetch(API + "/categories", { headers: h }),
      fetch(API + "/auth/profile", { headers: h }),
      fetch(API + "/payments/history", { headers: h }),
      fetch(API + "/stars/me", { headers: h }),
      fetch(API + "/user", { headers: h }),
      fetch(API + "/notifications", { headers: h }),
    ]);

    // If unauthorized or token invalid, automatically redirect to login
    if (d.status === 401 || g.status === 401 || b.status === 401) {
      redirectToLogin("Your session has expired. Please log in again.");
      return;
    }

    const enrolledMap = new Map<string, number>();
    if (b.ok) {
      const data = await b.json();
      setMine(
        data.map((x: any) => ({ ...x.course, progress: x.progress || 0 })),
      );
      data.forEach((x: any) => enrolledMap.set(x.course?.id || x.courseId, x.progress || 0));
    }
    if (a.ok) {
      const resData = await a.json();
      const rawItems = Array.isArray(resData) ? resData : (resData.data || []);
      const meta = resData.meta || {};
      const loadedCourses = rawItems.map((x: Course) => ({
        ...x,
        createdAt: x.createdAt || new Date().toISOString(),
        isEnrolled: enrolledMap.has(x.id),
        progress: enrolledMap.get(x.id) ?? x.progress,
      }));
      setCourses(loadedCourses);
      setTotalPages(meta.totalPages || Math.ceil((meta.total || loadedCourses.length) / pageSize) || 1);
      setTotalCourses(meta.total ?? loadedCourses.length);
    }
    if (c.ok) setCategories(await c.json());
    if (d.ok) {
      const x = await d.json();
      setRole((x.role || "USER").toUpperCase());
      setUserId(x.id || "");
    }
    if (e.ok) {
      setPurchases(await e.json());
    }
    if (f.ok) {
      const starredIds = await f.json();
      if (Array.isArray(starredIds)) {
        setFavorites(starredIds);
      }
    }
    if (g.ok) {
      const u = await g.json();
      setUserProfile(u);
      setProfileForm({ name: u.name || "", email: u.email || "", avatarUrl: u.avatarUrl || "" });
    }
    if (hNotif.ok) {
      const nData = await hNotif.json();
      setNotifications(nData.items || (Array.isArray(nData) ? nData : []));
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      redirectToLogin(token ? "Your session has expired. Please log in again." : "Please log in to continue.");
      return;
    }
    try {
      const x = JSON.parse(atob(token.split(".")[1]));
      setRole((x.role || "USER").toUpperCase());
      setUserId(x.id || x.sub || "");
    } catch {
      redirectToLogin("Invalid session. Please log in again.");
      return;
    }

    const completedOnboarding = localStorage.getItem("apex_onboarding_completed");
    if (!completedOnboarding) {
      setShowOnboarding(true);
    }

    const searchParams = new URLSearchParams(window.location.search);
    const isSuccess = searchParams.get("success") === "true";
    const sessionId = searchParams.get("session_id");

    if (isSuccess && sessionId) {
      setVerifyingPayment(true);
      fetch(API + "/payments/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            tell("Payment successful! Your course is now available in My Learning.");
            setCart([]);
            setTab("learning");
          } else {
            tell(res.message || "Could not verify payment session.");
          }
        })
        .catch(() => tell("Error verifying payment session."))
        .finally(() => {
          setVerifyingPayment(false);
          load(token).finally(() => setLoading(false));
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
    } else {
      load(token)
        .catch(() => tell("Unable to load all dashboard data."))
        .finally(() => setLoading(false));
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("course-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("course-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    const exists = favorites.includes(id);
    const next = exists ? favorites.filter((i) => i !== id) : [...favorites, id];
    setFavorites(next);
    tell(exists ? "Removed from favorites" : "Added to favorites");

    if (token) {
      try {
        const res = await fetch(API + "/stars/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ courseId: id }),
        });
        if (res.status === 401) {
          redirectToLogin("Session expired. Please log in again.");
          return;
        }
      } catch (err) {
        console.error("Error toggling favorite in DB", err);
      }
    } else {
      redirectToLogin("Please log in to save favorites.");
    }
  };

  const handleRequestOtp = async () => {
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    setSendingOtp(true);
    setOtpSentNotice(null);
    try {
      const res = await fetch(API + "/user/request-otp", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setOtpSentNotice(data.message || "OTP code sent to your email!");
      tell("OTP code sent to your email address!");
    } catch (err: any) {
      tell(err.message || "Could not send OTP code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return redirectToLogin();

    const isEmailChanging = profileForm.email !== userProfile.email;
    if (isEmailChanging && !emailOtp) {
      tell("OTP code is required to change your email. Please click 'Send OTP'.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch(API + "/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          avatarUrl: profileForm.avatarUrl,
          ...(isEmailChanging ? { otp: emailOtp } : {}),
        }),
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      setUserProfile(data);
      setEmailOtp("");
      setOtpSentNotice(null);
      tell("Profile updated successfully!");
    } catch (err: any) {
      tell(err.message || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.otp) {
      tell("OTP code is required to change password. Click 'Send OTP'.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      tell("New password must be at least 6 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      tell("New passwords do not match.");
      return;
    }

    const token = getAuthToken();
    if (!token) return redirectToLogin();

    setChangingPassword(true);
    try {
      const res = await fetch(API + "/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          otp: passwordForm.otp,
        }),
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      setPasswordForm({ newPassword: "", confirmPassword: "", otp: "" });
      setOtpSentNotice(null);
      tell("Password updated successfully!");
    } catch (err: any) {
      tell(err.message || "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    try {
      const res = await fetch(API + `/notifications/${id}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      setNotifications((prev) =>
        id === "all"
          ? prev.map((n) => ({ ...n, isRead: true }))
          : prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      tell(id === "all" ? "All notifications marked as read" : "Notification marked as read");
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    try {
      const res = await fetch(API + `/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to soft-delete your account?")) return;
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    try {
      const res = await fetch(API + "/user", {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      if (res.ok) {
        redirectToLogin("Account deactivated.");
      }
    } catch (err) {
      tell("Could not delete account.");
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("apex_onboarding_completed", "true");
    localStorage.setItem("apex_user_profile", JSON.stringify(onboardingProfile));
    setShowOnboarding(false);
    tell("Profile customized successfully!");
  };

  const total = useMemo(() => cart.reduce((n, x) => n + price(x), 0), [cart]);

  const fetchCatalogCourses = async (page: number = currentPage) => {
    setCoursesLoading(true);
    try {
      const token = getAuthToken();
      const h = token ? { Authorization: "Bearer " + token } : {};
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (cat && cat !== "All") params.set("category", cat);
      if (sort) params.set("sort", sort);
      if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
      if (tier && tier !== "all") params.set("tier", tier);
      if (debouncedMinPrice > 0) params.set("minPrice", String(debouncedMinPrice));
      if (debouncedMaxPrice < 1000) params.set("maxPrice", String(debouncedMaxPrice));

      const res = await fetch(`${API}/courses?${params.toString()}`, {
        headers: {
          ...h,
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const result = await res.json();
        const items = Array.isArray(result) ? result : (result.data || []);
        const meta = result.meta || {};
        const enrolledSet = new Set(mine.map((m) => m.id));

        const mapped = items.map((x: Course) => ({
          ...x,
          createdAt: x.createdAt || new Date().toISOString(),
          isEnrolled: enrolledSet.has(x.id),
          progress: mine.find((m) => m.id === x.id)?.progress ?? x.progress,
        }));

        setCourses(mapped);
        setTotalPages(meta.totalPages || Math.ceil((meta.total || items.length) / pageSize) || 1);
        setTotalCourses(meta.total ?? items.length);
      }
    } catch (err) {
      console.error("Failed to load catalog courses:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  // Reset to page 1 whenever any filter or sorting changes
  useEffect(() => {
    if (isInitialMount.current) return;
    setCurrentPage(1);
  }, [cat, sort, debouncedQuery, tier, debouncedMinPrice, debouncedMaxPrice]);

  // Fetch from backend when page or filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchCatalogCourses(currentPage);
  }, [currentPage, cat, sort, debouncedQuery, tier, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
    setLearningCurrentPage(1);
  }, [mine]);

  const enrolledCourseIds = useMemo(() => new Set(mine.map((m) => m.id)), [mine]);

  const listed = useMemo(() => {
    return courses
      .map((x) => ({
        ...x,
        isEnrolled: enrolledCourseIds.has(x.id),
        progress: mine.find((m) => m.id === x.id)?.progress ?? x.progress,
      }))
      .filter((x) => !showFavoritesOnly || favorites.includes(x.id));
  }, [courses, enrolledCourseIds, mine, showFavoritesOnly, favorites]);

  const paginatedCourses = listed;

  const learningTotalPages = Math.ceil(mine.length / learningPageSize) || 1;
  const paginatedMine = useMemo(() => {
    const start = (learningCurrentPage - 1) * learningPageSize;
    return mine.slice(start, start + learningPageSize);
  }, [mine, learningCurrentPage]);

  const favoriteCourses = useMemo(
    () => courses.filter((x) => favorites.includes(x.id)),
    [courses, favorites],
  );

  const add = (x: Course) => {
    if (cart.some((y) => y.id === x.id)) {
      setCartOpen(true);
      return;
    }
    setCart((y) => [...y, x]);
    tell("Course added to your cart.");
  };

  const enroll = async (id: string) => {
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    setEnrollBusy(id);
    try {
      const r = await fetch(API + "/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ courseId: id }),
      });
      if (r.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Could not enroll.");
      setCart((x) => x.filter((y) => y.id !== id));
      await load(token);
      tell("Successfully enrolled!");
    } catch (e: any) {
      tell(e.message || "Could not enroll.");
    } finally {
      setEnrollBusy(null);
    }
  };

  const checkout = async () => {
    const token = getAuthToken();
    if (!token) return redirectToLogin();
    setCheckoutBusy(true);
    try {
      const r = await fetch(API + "/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ courseIds: cart.map((x) => x.id) }),
      });
      if (r.status === 401) {
        redirectToLogin("Session expired. Please log in again.");
        return;
      }
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.url)
        throw new Error(data.message || "Unable to start checkout.");
      window.location.assign(data.url);
    } catch (e: any) {
      tell(e.message || "Unable to start checkout.");
    } finally {
      setCheckoutBusy(false);
    }
  };

  const theme = {
    "white-glass": {
      bg: "bg-[#f4f6fa] text-slate-900",
      header: "bg-white/60 dark:bg-white/60 border-b border-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
      card: "bg-white/65 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)] hover:-translate-y-1 hover:border-white transition-all duration-300",
      buttonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-95 transition-all",
      buttonDark: "bg-slate-900 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 active:scale-95 transition-all",
      pill: "bg-white/80 rounded-full backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900 font-semibold",
      accentText: "text-blue-600",
      input: "bg-white/70 rounded-2xl border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder-slate-400 font-medium backdrop-blur-lg",
      modal: "bg-white/85 rounded-[32px] border border-white/95 shadow-[0_32px_80px_rgba(0,0,0,0.14),inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-3xl text-slate-900",
      inspector: "bg-white/90 rounded-[28px] border border-white/90 shadow-[0_30px_70px_rgba(0,0,0,0.12)] backdrop-blur-3xl text-slate-900",
    },
    "dark-glass": {
      bg: "bg-[#090b10] text-slate-100",
      header: "bg-black/45 border-b border-white/10 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.5)]",
      card: "bg-white/[0.06] backdrop-blur-2xl border border-white/15 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.18)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(139,92,246,0.18)] hover:border-white/30 hover:-translate-y-1 transition-all duration-300",
      buttonPrimary: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(147,51,234,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:brightness-110 active:scale-95 transition-all",
      buttonDark: "bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all backdrop-blur-xl",
      pill: "bg-white/10 rounded-full backdrop-blur-xl border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] text-slate-100 font-semibold",
      accentText: "text-purple-400",
      input: "bg-black/35 rounded-2xl border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 text-white placeholder-white/40 font-medium backdrop-blur-xl",
      modal: "bg-[#0f121a]/85 rounded-[32px] border border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.25)] backdrop-blur-3xl text-slate-100",
      inspector: "bg-[#0f121a]/90 rounded-[28px] border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-slate-100",
    },
  }[themeStyle];

  const nav = [
    ["catalog", "Browse Courses"],
    ["learning", "My Learning"],
    ["purchases", "Purchase History"],
    ["support", "Support"],
  ] as const;

  const renderFilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-current pb-4 opacity-90">
        <h2 className="text-sm font-extrabold uppercase tracking-wider">Filters</h2>
        <button
          onClick={() => {
            setQuery("");
            setCat("All");
            setTier("all");
            setMinPrice(0);
            setMaxPrice(1000);
            setSort("newest");
          }}
          className={`text-xs font-bold underline ${theme.accentText} hover:opacity-80 active:scale-95 transition-all`}
        >
          Reset all
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider opacity-75">
          Category
        </label>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={`w-full border px-3.5 py-3 text-sm font-bold transition-all focus:outline-none ${theme.input}`}
        >
          <option value="All">All Categories</option>
          {categories.map((x) => (
            <option key={x.id} value={x.name} className="bg-white text-black font-bold">
              {x.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider opacity-75">
          Pricing Type
        </label>
        <div className="space-y-1.5">
          {(
            [
              ["all", "All courses"],
              ["free", "Free only"],
              ["paid", "Paid only"],
            ] as const
          ).map(([x, label]) => (
            <label
              key={x}
              className="flex cursor-pointer items-center gap-3 border-2 border-transparent px-3.5 py-2.5 text-sm font-bold transition-all hover:bg-black/[0.04] rounded-xl"
            >
              <input
                type="radio"
                name="priceTier"
                checked={tier === x}
                onChange={() => setTier(x)}
                className="h-4 w-4 accent-current transition-transform hover:scale-110"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t-2 border-current opacity-90">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider opacity-75">
            Price Range
          </label>
          <span className={`px-2.5 py-0.5 text-xs font-extrabold ${theme.pill}`}>
            {money(minPrice)} – {money(maxPrice)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
              placeholder="Min ($)"
              className={`w-full px-3 py-2 text-xs font-bold ${theme.input}`}
            />
            <span className="font-extrabold">-</span>
            <input
              type="number"
              min={minPrice}
              max={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
              placeholder="Max ($)"
              className={`w-full px-3 py-2 text-xs font-bold ${theme.input}`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative flex min-h-screen flex-col font-sans pb-24 sm:pb-0 overflow-x-clip transition-colors duration-500 ${theme.bg}`}>
      {/* Luminous background orbs for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {themeStyle === "dark-glass" ? (
          <>
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-violet-600/30 to-fuchsia-500/25 blur-[140px] animate-pulse" />
            <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-600/25 via-cyan-500/20 to-indigo-600/25 blur-[150px] animate-pulse" />
            <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-700/20 to-rose-600/20 blur-[130px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-300/40 to-indigo-200/40 blur-[120px]" />
            <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-sky-300/40 via-purple-200/35 to-pink-200/30 blur-[130px]" />
            <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-teal-200/40 to-blue-200/35 blur-[120px]" />
          </>
        )}
      </div>
      
      <style jsx global>{`
        .glass-card-item {
          position: relative;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }
        .glass-card-item::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            450px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${themeStyle === "dark-glass" ? "rgba(168, 85, 247, 0.15)" : "rgba(37, 99, 235, 0.10)"},
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }
        .glass-card-item:hover::before {
          opacity: 1;
        }

        @keyframes dropdownScale {
          0% { opacity: 0; transform: scale(0.95) translateY(-6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dropdown-smooth {
          animation: dropdownScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-lg p-8 shadow-2xl space-y-6 ${theme.modal}`}>
            <div className="flex items-center justify-between border-b border-current/20 pb-4 opacity-90">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 font-extrabold text-white text-xs shadow-md border border-white/30">
                  {onboardingStep}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                  Welcome Setup
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("apex_onboarding_completed", "true");
                  setShowOnboarding(false);
                }}
                className="p-2 opacity-70 hover:opacity-100 transition-all active:scale-95 font-bold"
              >
                ✕
              </button>
            </div>

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">How old are you?</h2>
                <p className="text-sm font-medium opacity-80">
                  This helps us personalize course recommendations for your age group.
                </p>
                <div className="pt-2">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    placeholder="e.g. 17"
                    value={onboardingProfile.age}
                    onChange={(e) =>
                      setOnboardingProfile({ ...onboardingProfile, age: e.target.value })
                    }
                    className={`w-full px-4 py-3.5 text-base focus:outline-none ${theme.input}`}
                  />
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">Who are you?</h2>
                <p className="text-sm font-medium opacity-80">
                  Select your primary role to tailor your learning pathways.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {["Student", "Software Engineer", "Designer", "Hobbyist / Enthusiast", "Entrepreneur", "Other"].map((roleOpt) => (
                    <button
                      key={roleOpt}
                      type="button"
                      onClick={() =>
                        setOnboardingProfile({ ...onboardingProfile, identity: roleOpt })
                      }
                      className={
                        "p-4 text-left text-sm font-bold transition-all rounded-2xl border backdrop-blur-xl " +
                        (onboardingProfile.identity === roleOpt
                          ? `${theme.buttonPrimary} shadow-lg scale-[1.02] border-white/40`
                          : "bg-white/5 hover:bg-white/10 border-white/15 opacity-80 hover:opacity-100")
                      }
                    >
                      {roleOpt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">Why are you studying?</h2>
                <p className="text-sm font-medium opacity-80">
                  What is your primary motivation for taking courses?
                </p>
                <div className="space-y-2.5 pt-2">
                  {[
                    "Upskilling for career advancement",
                    "Switching to a tech profession",
                    "Building personal projects & apps",
                    "Academic growth or exam preparation",
                    "Pure curiosity & hobby learning",
                  ].map((goalOpt) => (
                    <label
                      key={goalOpt}
                      className={
                        "flex cursor-pointer items-center gap-3 p-3.5 text-sm font-bold transition-all rounded-2xl border backdrop-blur-xl " +
                        (onboardingProfile.goal === goalOpt
                          ? `${theme.pill} shadow-md border-white/40 font-black`
                          : "bg-white/5 hover:bg-white/10 border-white/15 opacity-80 hover:opacity-100")
                      }
                    >
                      <input
                        type="radio"
                        name="studyGoal"
                        checked={onboardingProfile.goal === goalOpt}
                        onChange={() =>
                          setOnboardingProfile({ ...onboardingProfile, goal: goalOpt })
                        }
                        className="h-4 w-4 accent-purple-500"
                      />
                      {goalOpt}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">What is your experience level?</h2>
                <p className="text-sm font-medium opacity-80">
                  We'll suggest courses matching your current skill level.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    ["Beginner", "New to the field"],
                    ["Intermediate", "Some prior practice"],
                    ["Advanced", "Experienced professional"],
                  ].map(([lvl, desc]) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        setOnboardingProfile({ ...onboardingProfile, experience: lvl })
                      }
                      className={
                        "flex flex-col gap-1 p-4 text-left transition-all rounded-2xl border backdrop-blur-xl " +
                        (onboardingProfile.experience === lvl
                          ? `${theme.buttonPrimary} shadow-lg scale-[1.02] border-white/40`
                          : "bg-white/5 hover:bg-white/10 border-white/15 opacity-80 hover:opacity-100")
                      }
                    >
                      <span className="text-sm font-black">{lvl}</span>
                      <span className="text-xs font-medium opacity-80">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-current/20 pt-6 opacity-90">
              {onboardingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep((s) => s - 1)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-xl transition-all ${theme.pill}`}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {onboardingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep((s) => s + 1)}
                  className={`px-6 py-2.5 text-sm font-black transition-all active:scale-95 ${theme.buttonPrimary}`}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className={`px-6 py-2.5 text-sm font-black transition-all active:scale-95 ${theme.buttonDark}`}
                >
                  Get Started →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-50 w-full transition-colors duration-300 backdrop-blur-2xl ${theme.header}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => setTab("catalog")}
            className="group flex items-center gap-3 text-left font-black tracking-tight transition-transform active:scale-95"
          >
            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-white/10 border border-white/25 shadow-md shadow-violet-500/20 p-1 flex items-center justify-center backdrop-blur-md">
              <img
                src="/images/image.png"
                alt="ApexLearn Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black leading-none tracking-tight">
                ApexLearn
              </span>
              <span className="text-[11px] font-bold opacity-75">
                Student Portal
              </span>
            </div>
          </button>

          <nav className="hidden items-center gap-2 sm:flex">
            {nav.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  "px-4 py-2 text-sm font-bold transition-all " +
                  (tab === id
                    ? `${theme.pill} font-black scale-[1.02]`
                    : "opacity-80 hover:opacity-100 hover:bg-black/5 rounded-xl")
                }
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Sun / Moon Toggle */}
            <button
              onClick={() => handleThemeChange(themeStyle === "dark-glass" ? "white-glass" : "dark-glass")}
              aria-label="Toggle light and dark glass mode"
              title={themeStyle === "dark-glass" ? "Switch to White Glass" : "Switch to Dark Glass"}
              className={`flex items-center justify-center h-10 w-10 text-base transition-all hover:scale-105 active:scale-90 ${theme.pill}`}
            >
              <span className="transform transition-transform duration-300">
                {themeStyle === "dark-glass" ? "🌙" : "☀️"}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className={`relative flex items-center justify-center p-2 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${theme.pill}`}
                title="Notifications"
              >
                <span className="text-base">🔔</span>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center bg-red-600 px-1 text-[9px] font-black text-white rounded-full border border-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-72 sm:w-96 z-50 p-4 shadow-2xl space-y-3 animate-dropdown-smooth ${theme.modal}`}>
                    <div className="flex items-center justify-between border-b border-current pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔔</span>
                        <span className="text-xs font-black uppercase tracking-wider">Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={() => handleMarkNotifRead('all')}
                          className="text-[11px] font-bold underline hover:opacity-80"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-current/10">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs opacity-60 font-medium">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && handleMarkNotifRead(n.id)}
                            className={`pt-2.5 first:pt-0 p-2 rounded-xl transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                              !n.isRead ? 'bg-blue-500/10 font-bold' : 'opacity-70'
                            }`}
                          >
                            <div className="space-y-1 text-left min-w-0 flex-1">
                              <p className="text-xs font-black leading-tight text-current truncate">{n.title}</p>
                              <p className="text-xs text-current/80 leading-snug">{n.body}</p>
                              <p className="text-[10px] text-current/50">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotif(n.id, e)}
                              className="text-xs text-red-500 opacity-60 hover:opacity-100 p-1 font-black shrink-0"
                              title="Delete Notification"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setProfileOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${theme.pill}`}
              title="User Profile & Settings"
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt="Avatar"
                  className="h-5 w-5 rounded-full object-cover border border-violet-600 shrink-0"
                />
              ) : (
                <span className="h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                  {userProfile.name?.[0] || 'U'}
                </span>
              )}
              <span className="hidden sm:inline max-w-[80px] truncate">{userProfile.name || 'Profile'}</span>
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className={`hidden sm:inline-flex relative items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${theme.pill}`}
            >
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center bg-black px-1 text-xs font-bold text-white border border-black">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        aria-label="Open cart"
        className={`sm:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-full transition-transform active:scale-95 shadow-xl ${theme.buttonPrimary}`}
      >
        <span className="text-base">🛒</span>
        <span>Cart</span>
        {cart.length > 0 && (
          <span className="grid h-5 min-w-[20px] place-items-center bg-white/20 backdrop-blur-md px-1.5 text-xs font-black text-white rounded-full border border-white/30">
            {cart.length}
          </span>
        )}
      </button>

      <nav aria-label="Mobile Navigation" className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 px-2 py-2.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl transition-colors duration-300 ${theme.header}`}>
        {[
          ["catalog", "Catalog", "⌕"],
          ["learning", "Learning", "📖"],
          ["favorites", "Favs", "♥"],
          ["purchases", "History", "💳"],
          ["support", "Support", "💬"],
        ].map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={
              "flex flex-col items-center gap-1 py-1.5 px-3 transition-all active:scale-95 rounded-2xl " +
              (tab === id
                ? `${theme.pill} font-extrabold scale-[1.05]`
                : "opacity-70 font-semibold hover:opacity-100")
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[10px] leading-tight">{label}</span>
          </button>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:py-10 z-10 relative">
        {verifyingPayment && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500 text-blue-600 font-extrabold flex items-center gap-3 animate-pulse">
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Verifying your payment with Stripe and unlocking your course...</span>
          </div>
        )}

        {tab === "catalog" && (
          <section className="space-y-8">
            <div className="flex flex-col gap-2 border-b-4 border-current pb-6 opacity-95">
              <div className={`inline-flex items-center gap-2 self-start px-3.5 py-1 text-xs font-black ${theme.pill}`}>
                Course Catalog
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                Find your next course.
              </h1>
              <p className="text-base font-bold opacity-80">
                Explore expert-led courses with direct action buttons right on each course card.
              </p>
            </div>

            <div className="lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-black ${theme.pill}`}
              >
                <span className="flex items-center gap-2">
                  <span>⚙</span> Filter & Sort Courses
                </span>
                <span className="bg-black px-3 py-1 text-xs font-black text-white rounded-lg">
                  {cat !== "All" || tier !== "all" || minPrice > 0 || maxPrice < 1000 ? "Active Filters" : "All"}
                </span>
              </button>
            </div>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md lg:hidden animate-in fade-in duration-200">
                <div className={`w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-200 ${theme.modal}`}>
                  <div className="flex items-center justify-between border-b-2 border-current pb-4 opacity-90">
                    <h2 className="text-base font-black">Filter & Sort</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 opacity-70 hover:opacity-100 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  {renderFilterContent()}
                  <div className="pt-2">
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className={`w-full py-3.5 text-sm font-black shadow-md transition-all active:scale-[0.98] ${theme.buttonPrimary}`}
                    >
                      Apply Filters ({listed.length} courses)
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <aside className={`hidden lg:block h-fit p-6 sticky top-24 space-y-6 ${theme.card}`}>
                {renderFilterContent()}
              </aside>

              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search courses by title or keyword..."
                      className={`w-full px-4 py-3.5 text-sm focus:outline-none ${theme.input}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-4 py-3.5 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 ${
                      showFavoritesOnly
                        ? "bg-rose-600 text-white shadow-md rounded-2xl"
                        : `${theme.pill} hover:bg-rose-500/10`
                    }`}
                    title="Filter Favorites on Main Page"
                  >
                    
                    <span>Favorites ({favorites.length})</span>
                    {showFavoritesOnly}
                  </button>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className={`px-4 py-3.5 text-sm font-extrabold focus:outline-none ${theme.input}`}
                  >
                    <option value="newest">Sort: Added Recently</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="featured">Sort: Featured</option>
                    <option value="low">Price: Low to High</option>
                    <option value="high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider opacity-75">
                  <span>
                     {coursesLoading ? "Loading..." : `${totalCourses || listed.length} available courses`}
                  </span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                {loading || coursesLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className={`h-80 animate-pulse bg-current/10 ${theme.card}`} />
                    ))}
                  </div>
                ) : paginatedCourses.length === 0 ? (
                  <div className={`p-16 text-center ${theme.card}`}>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-2xl font-black shadow-lg">
                      ⌕
                    </div>
                    <h3 className="text-lg font-black">No courses found</h3>
                    <p className="mt-1 text-sm font-bold opacity-75">
                      Try adjusting your search query, category, or price range filter.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {paginatedCourses.map((x) => {
                        const p = price(x),
                          isFav = favorites.includes(x.id),
                          image = imageFor(x),
                          inCart = cart.some((y) => y.id === x.id),
                          isHovered = hoveredCourseId === x.id;

                        return (
                          <div
                            key={x.id}
                            className="relative group"
                            onMouseEnter={() => setHoveredCourseId(x.id)}
                            onMouseLeave={() => setHoveredCourseId(null)}
                          >
                            <article
                              onMouseMove={handleCardMouseMove}
                              className={`glass-card-item flex flex-col justify-between overflow-hidden h-full ${theme.card} ${
                                isHovered ? "ring-2 ring-white/40 shadow-2xl" : ""
                              }`}
                            >
                              <div>
                                <div className="relative h-40 w-full bg-black/10 overflow-hidden border-b border-white/10">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={x.title}
                                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="grid h-full w-full place-items-center text-xs font-black opacity-75">
                                      {category(x)}
                                    </div>
                                  )}
                                  <div className="absolute top-2.5 left-2.5 z-10">
                                    <span className={`px-2.5 py-1 text-[10px] font-black shadow-xs ${theme.pill}`}>
                                      {category(x)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => toggleFavorite(x.id, e)}
                                    aria-label="Favorite"
                                    className={`absolute top-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center shadow-xs active:scale-90 ${theme.pill}`}
                                  >
                                    <span className={isFav ? "text-red-500 font-black text-sm" : "opacity-75"}>
                                      {isFav ? "♥" : "♡"}
                                    </span>
                                  </button>
                                </div>

                                <div className="p-4 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-black">
                                      {money(p)}
                                    </span>
                                    <div className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 border border-current bg-amber-300 text-black rounded-lg">
                                      <span>★</span>
                                      <span>{(x.ratingAverage || 5.0).toFixed(1)}</span>
                                    </div>
                                  </div>
                                  <h2 className="font-black line-clamp-1 text-sm">
                                    {x.title}
                                  </h2>
                                  <p className="text-xs font-medium opacity-75 line-clamp-2 leading-relaxed">
                                    {x.description || "Comprehensive hands-on training module."}
                                  </p>
                                </div>
                              </div>

                              <div className="p-4 pt-0">
                                <div className="border-t-2 border-current pt-3">
                                  {x.isEnrolled ? (
                                    <button
                                      onClick={() => router.push(`/courses/${x.id}/learn`)}
                                      className={`w-full py-2.5 text-xs font-black active:scale-95 ${theme.buttonDark}`}
                                    >
                                      {(x.progress || 0) >= 100 ? "Completed ✓ (Review)" : "Continue Learning"}
                                    </button>
                                  ) : p === 0 ? (
                                    <button
                                      disabled={enrollBusy === x.id}
                                      onClick={() => enroll(x.id)}
                                      className={`w-full py-2.5 text-xs font-black active:scale-95 ${theme.buttonPrimary}`}
                                    >
                                      {enrollBusy === x.id ? "Enrolling..." : "Enroll for Free"}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (inCart) setCartOpen(true);
                                        else add(x);
                                      }}
                                      className={`w-full py-2.5 text-xs font-black active:scale-95 ${
                                        inCart ? theme.pill : theme.buttonPrimary
                                      }`}
                                    >
                                      {inCart ? "View in Cart" : `Add to Cart · ${money(p)}`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1 || coursesLoading}
                          className={`px-4 py-2.5 text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-xl hover:bg-white/10 disabled:opacity-30 transition-all ${theme.pill}`}
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => setCurrentPage(num)}
                            disabled={coursesLoading}
                            className={
                              "grid h-10 w-10 place-items-center text-xs font-extrabold rounded-2xl border transition-all backdrop-blur-xl " +
                              (currentPage === num
                                ? `${theme.buttonPrimary} shadow-lg scale-105 border-white/40`
                                : `${theme.pill} hover:bg-white/15 opacity-75 hover:opacity-100`)
                            }
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages || coursesLoading}
                          className={`px-4 py-2.5 text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-xl hover:bg-white/10 disabled:opacity-30 transition-all ${theme.pill}`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {tab === "learning" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b-4 border-current pb-6 opacity-95">
              <div>
                <span className={`inline-block px-3 py-1 text-xs font-black mb-2 ${theme.pill}`}>
                  My Enrolled Courses
                </span>
                <h1 className="text-3xl font-black tracking-tight">
                  Continue Learning
                </h1>
              </div>
              <button
                onClick={() => setTab("catalog")}
                className={`text-sm font-black underline ${theme.accentText} hover:opacity-85 transition-opacity`}
              >
                Browse more courses →
              </button>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-80 animate-pulse bg-current/15 ${theme.card}`} />
                ))}
              </div>
            ) : mine.length === 0 ? (
              <div className={`p-16 text-center ${theme.card}`}>
                <h3 className="text-lg font-black">No active enrollments</h3>
                <p className="mt-1 text-sm font-bold opacity-75">
                  You haven't enrolled in any courses yet. Browse the catalog to start learning.
                </p>
                <button
                  onClick={() => setTab("catalog")}
                  className={`mt-6 px-6 py-3.5 text-sm font-black shadow-md active:scale-95 ${theme.buttonDark}`}
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider opacity-75">
                  <span>Showing {mine.length} enrolled courses</span>
                  <span>Page {learningCurrentPage} of {learningTotalPages}</span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedMine.map((x) => {
                    const image = imageFor(x);
                    const progressVal = x.progress || 0;
                    return (
                      <article
                        key={x.id}
                        onMouseMove={handleCardMouseMove}
                        className={`flex flex-col justify-between overflow-hidden ${theme.card}`}
                      >
                        <div>
                          <div className="relative h-40 w-full bg-black/10 overflow-hidden border-b border-white/10">
                            {image ? (
                              <img src={image} alt={x.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-black opacity-75">
                                {category(x)}
                              </div>
                            )}
                            <div className="absolute top-2.5 left-2.5">
                              <span className={`px-2.5 py-1 text-[10px] font-black shadow-xs ${theme.pill}`}>
                                {category(x)}
                              </span>
                            </div>
                            {progressVal >= 100 && (
                              <div className="absolute top-2.5 right-2.5">
                                <span className="bg-emerald-500/80 backdrop-blur-md border border-emerald-300/40 px-2.5 py-1 text-[10px] font-black text-white shadow-md rounded-full">
                                  Completed ✓
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-2">
                            <h2 className="text-base font-black leading-snug line-clamp-1">{x.title}</h2>
                            <p className="text-xs font-medium opacity-75 line-clamp-2">
                              {x.description || "Interactive training module."}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-0 space-y-4">
                          <div className="space-y-1.5 border-t-2 border-current pt-3 opacity-90">
                            <div className="flex justify-between text-xs font-black">
                              <span>Course Progress</span>
                              <span>{progressVal}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden border-2 border-current bg-current/10 rounded-full">
                              <div
                                className={"h-full transition-all duration-500 ease-out " + (progressVal >= 100 ? "bg-emerald-500" : "bg-cyan-400")}
                                style={{ width: Math.min(progressVal, 100) + "%" }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => router.push("/courses/" + x.id + "/learn")}
                              className={`w-full py-2.5 text-xs font-black shadow-md active:scale-95 ${theme.buttonDark}`}
                            >
                              {progressVal >= 100 ? "Review materials" : progressVal > 0 ? "Continue learning" : "Start course"}
                            </button>

                            {progressVal >= 100 && (
                              <button
                                onClick={() => setSelectedCertificate(x)}
                                className={`w-full py-2.5 text-xs font-black shadow-md active:scale-95 flex items-center justify-center gap-2 ${theme.buttonPrimary}`}
                              >
                                <span>🏆</span> View Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {learningTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                      onClick={() => setLearningCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={learningCurrentPage === 1}
                      className={`px-4 py-2.5 text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-xl hover:bg-white/10 disabled:opacity-30 transition-all ${theme.pill}`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: learningTotalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setLearningCurrentPage(num)}
                        className={
                          "grid h-10 w-10 place-items-center text-xs font-extrabold rounded-2xl border transition-all backdrop-blur-xl " +
                          (learningCurrentPage === num
                            ? `${theme.buttonPrimary} shadow-lg scale-105 border-white/40`
                            : `${theme.pill} hover:bg-white/15 opacity-75 hover:opacity-100`)
                        }
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setLearningCurrentPage((p) => Math.min(p + 1, learningTotalPages))}
                      disabled={learningCurrentPage === learningTotalPages}
                      className={`px-4 py-2.5 text-xs font-bold rounded-2xl border border-white/20 backdrop-blur-xl hover:bg-white/10 disabled:opacity-30 transition-all ${theme.pill}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === "favorites" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 border-b-4 border-current pb-6 opacity-95">
              <span className={`inline-block px-3 py-1 text-xs font-black text-red-500 self-start mb-2 ${theme.pill}`}>
                Saved Items
              </span>
              <h1 className="text-3xl font-black tracking-tight">Favorite Courses</h1>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-80 animate-pulse bg-current/15 ${theme.card}`} />
                ))}
              </div>
            ) : favoriteCourses.length === 0 ? (
              <div className={`p-16 text-center ${theme.card}`}>
                <h3 className="text-lg font-black">No favorites yet</h3>
                <p className="mt-1 text-sm font-bold opacity-75">
                  Click the heart icon on any course in the catalog to save it for later.
                </p>
                <button
                  onClick={() => setTab("catalog")}
                  className={`mt-6 px-6 py-3.5 text-sm font-black shadow-md active:scale-95 ${theme.buttonDark}`}
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteCourses.map((x) => {
                  const p = price(x),
                    inCart = cart.some((y) => y.id === x.id),
                    image = imageFor(x);
                  return (
                    <article
                      key={x.id}
                      onMouseMove={handleCardMouseMove}
                      className={`relative flex flex-col justify-between overflow-hidden ${theme.card}`}
                    >
                      <div>
                        <div className="relative h-40 w-full bg-black/10 overflow-hidden border-b border-white/10">
                          {image ? (
                            <img src={image} alt={x.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs font-black opacity-75">
                              {category(x)}
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`px-2.5 py-1 text-[10px] font-black shadow-xs ${theme.pill}`}>
                              {category(x)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(x.id, e)}
                            aria-label="Remove favorite"
                            className={`absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center shadow-xs active:scale-95 text-red-500 font-black ${theme.pill}`}
                          >
                            ♥
                          </button>
                        </div>
                        <div className="p-4 space-y-2">
                          <span className="text-sm font-black">{money(p)}</span>
                          <h2 className="font-black text-sm line-clamp-1">{x.title}</h2>
                          <p className="text-xs font-medium opacity-75 line-clamp-2">{x.description || "Course details."}</p>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        {x.isEnrolled ? (
                          <button
                            onClick={() => setTab("learning")}
                            className={`w-full py-2.5 text-xs font-black active:scale-95 ${theme.pill}`}
                          >
                            {(x.progress || 0) >= 100 ? "Finished • Learn again" : "Continue learning"}
                          </button>
                        ) : p === 0 ? (
                          <button
                            onClick={() => enroll(x.id)}
                            className={`w-full py-2.5 text-xs font-black shadow-md active:scale-95 ${theme.buttonPrimary}`}
                          >
                            Enroll for free
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (inCart) setCartOpen(true);
                              else add(x);
                            }}
                            className={`w-full py-2.5 text-xs font-black shadow-md active:scale-95 ${theme.buttonPrimary}`}
                          >
                            {inCart ? "View in cart" : `Add to cart · ${money(p)}`}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "purchases" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 border-b-4 border-current pb-6 opacity-95">
              <span className={`inline-block px-3 py-1 text-xs font-black self-start mb-2 ${theme.pill}`}>
                Transaction History
              </span>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Purchase History</h1>
                  <p className="text-sm font-bold opacity-75 mt-1">
                    View receipts and order details for all your course purchases.
                  </p>
                </div>
                {purchases.length > 0 && (
                  <div className={`px-4 py-2 text-xs font-black ${theme.pill}`}>
                    Total Purchases: {purchases.length}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`h-28 animate-pulse bg-current/15 ${theme.card}`} />
                ))}
              </div>
            ) : purchases.length === 0 ? (
              <div className={`p-16 text-center ${theme.card}`}>
                <div className="text-4xl mb-3">💳</div>
                <h3 className="text-lg font-black">No purchase history found</h3>
                <p className="mt-1 text-sm font-bold opacity-75">
                  You haven't bought any paid courses yet. Your payment receipts will show up here after checkout.
                </p>
                <button
                  onClick={() => setTab("catalog")}
                  className={`mt-6 px-6 py-3.5 text-sm font-black shadow-md active:scale-95 ${theme.buttonPrimary}`}
                >
                  Browse Course Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((item) => (
                  <div
                    key={item.id}
                    onMouseMove={handleCardMouseMove}
                    className={`p-6 transition-all ${theme.card}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-current/20 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold opacity-60">Order #{item.id.slice(0, 8)}</span>
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500 text-white rounded">
                            {item.status || "COMPLETED"}
                          </span>
                        </div>
                        <p className="text-xs font-medium opacity-75 mt-1">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: (item.currency || "USD").toUpperCase(),
                          }).format(Number(item.amount || 0))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Purchased Items</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {item.courses && item.courses.length > 0 ? (
                          item.courses.map((course) => (
                            <div key={course.id} className="flex items-center gap-3 p-3 bg-black/5 rounded-xl border border-current/10">
                              {imageFor(course) ? (
                                <img src={imageFor(course)} alt={course.title} className="h-12 w-16 object-cover rounded border border-black/20" />
                              ) : (
                                <div className="h-12 w-16 bg-black/20 grid place-items-center text-[10px] font-bold rounded">
                                  Course
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-black text-xs truncate">{course.title}</h5>
                                <button
                                  onClick={() => {
                                    setTab("learning");
                                    router.push(`/courses/${course.id}/learn`);
                                  }}
                                  className={`mt-1 text-[10px] font-black underline ${theme.accentText}`}
                                >
                                  Go to Course →
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs font-bold opacity-75">Course access unlocked upon payment.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "support" && (
          <section className={`p-6 sm:p-8 ${theme.card}`}>
            <h1 className="mb-6 text-2xl font-black tracking-tight">Student Support Center</h1>
            <SupportChat userRole={role} currentUserId={userId} />
          </section>
        )}
      </main>

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className={`relative w-full max-w-5xl p-6 sm:p-8 space-y-4 my-auto ${theme.modal}`}>
            <div className="flex items-center justify-between border-b border-current/20 pb-4 px-2">
              <h3 className="text-lg font-black">Certificate of Completion</h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className={`px-4 py-2 text-sm font-black rounded-xl active:scale-95 transition-all ${theme.buttonDark}`}
              >
                Close ✕
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl bg-white/5 p-2">
              <Certificate 
                courseName={selectedCertificate.title}
                studentName={userProfile.name || "Student"}
                certificateId={`APEX-${selectedCertificate.id.toUpperCase()}`} 
                issueDate={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}              
              />
            </div>
          </div>
        </div>
      )}

      <footer className={`mt-20 border-t border-white/10 pb-20 sm:pb-0 transition-colors duration-300 backdrop-blur-2xl ${theme.header}`}>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl overflow-hidden bg-white/10 border border-white/25 shadow-md p-1 flex items-center justify-center backdrop-blur-md">
                  <img
                    src="/images/image.png"
                    alt="ApexLearn Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-base font-black">ApexLearn</span>
              </div>
              <p className="text-sm font-bold opacity-75 max-w-sm leading-relaxed">
                ApexLearn is a premier educational ecosystem crafted for professional mastery.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-sm font-bold opacity-85">
                <li><button onClick={() => setTab("catalog")} className="hover:underline">Browse Catalog</button></li>
                <li><button onClick={() => setTab("learning")} className="hover:underline">My Learning</button></li>
                <li><button onClick={() => setTab("favorites")} className="hover:underline">Favorites</button></li>
                <li><button onClick={() => setTab("support")} className="hover:underline">Support Center</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider">Legal & Privacy</h4>
              <ul className="space-y-2 text-sm font-bold opacity-75">
                <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t-2 border-current pt-6 text-xs font-bold opacity-75 sm:flex-row">
            <span>© 2026 ApexLearn Inc. All rights reserved.</span>
            <span className="mt-2 sm:mt-0 font-black">always choose the best, choose ApexLearn</span>
          </div>
        </div>
      </footer>

      {notice && (
        <div
          role="status"
          className="fixed bottom-24 sm:bottom-6 right-6 z-50 px-5 py-3 text-sm font-bold shadow-2xl backdrop-blur-2xl border border-white/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white/20 text-white"
        >
          {notice}
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
          <button
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <aside className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-2xl border-l-4 border-current animate-in slide-in-from-right duration-200 ${theme.modal}`}>
            <div className="flex items-center justify-between border-b-4 border-current px-6 py-5 opacity-90">
              <h2 className="text-base font-black">Your Cart ({cart.length})</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 opacity-70 hover:opacity-100 font-black"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y-2 divide-current opacity-90">
              {cart.length === 0 ? (
                <div className="py-12 text-center opacity-75">
                  <p className="text-sm font-bold">Your cart is empty.</p>
                </div>
              ) : (
                cart.map((x) => (
                  <div key={x.id} className="flex items-center justify-between pt-4 first:pt-0">
                    <div className="space-y-1 pr-4">
                      <p className="text-sm font-black line-clamp-1">{x.title}</p>
                      <p className="text-xs font-black text-red-500">{money(price(x))}</p>
                    </div>
                    <button
                      onClick={() => setCart((y) => y.filter((z) => z.id !== x.id))}
                      className="text-xs font-black text-red-500 underline hover:opacity-80 active:scale-95"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t-4 border-current p-6 space-y-4 opacity-95">
                <div className="flex items-center justify-between text-base">
                  <span className="font-black opacity-80">Total</span>
                  <span className="font-black text-lg">{money(total)}</span>
                </div>
                <button
                  disabled={checkoutBusy}
                  onClick={checkout}
                  className={`w-full py-3.5 text-sm font-black shadow-md disabled:opacity-60 active:scale-95 ${theme.buttonPrimary}`}
                >
                  {checkoutBusy ? "Redirecting to checkout..." : `Proceed to Checkout · ${money(total)}`}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-md p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${theme.modal}`}>
            <div className="flex items-center justify-between border-b-2 border-current pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black uppercase shadow-md">
                  {userProfile.name?.[0] || 'U'}
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">{userProfile.name || 'Account Settings'}</h2>
                  <p className="text-xs opacity-75 font-mono">{userProfile.email}</p>
                </div>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-1.5 opacity-70 hover:opacity-100 font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-3 py-2 border-b border-current/20 pb-4">
                <div className="relative group h-24 w-24 rounded-full overflow-hidden border-4 border-violet-600 shadow-xl bg-violet-100 flex items-center justify-center shrink-0">
                  {profileForm.avatarUrl || userProfile.avatarUrl ? (
                    <img
                      src={profileForm.avatarUrl || userProfile.avatarUrl}
                      alt="Profile Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-violet-700 uppercase">
                      {userProfile.name?.[0] || 'U'}
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  id="avatar-file-input"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                  disabled={isUploadingAvatar}
                />
                <label
                  htmlFor="avatar-file-input"
                  className={`cursor-pointer px-4 py-2 text-xs font-black rounded-xl border-2 border-current transition-all shadow-xs active:scale-95 ${
                    isUploadingAvatar ? 'opacity-50 pointer-events-none' : 'hover:bg-black/10'
                  }`}
                >
                  {isUploadingAvatar ? `Uploading (${avatarProgress}%)` : '📷 Upload Profile Picture'}
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider block opacity-80">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your Name"
                  className={`w-full px-3.5 py-2.5 text-xs font-bold ${theme.input}`}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider block opacity-80">Email Address</label>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp}
                    className="text-[11px] font-extrabold text-violet-600 hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending OTP..." : "📩 Send OTP to Email"}
                  </button>
                </div>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className={`w-full px-3.5 py-2.5 text-xs font-bold ${theme.input}`}
                  required
                />
              </div>

              {profileForm.email !== userProfile.email && (
                <div className="space-y-1 p-3 bg-violet-500/10 rounded-xl border border-violet-500/30">
                  <label className="text-[11px] font-black uppercase tracking-wider block text-violet-600">
                    Email OTP Verification Code *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className={`flex-1 px-3.5 py-2 text-xs font-bold font-mono tracking-widest ${theme.input}`}
                    />
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={sendingOtp}
                      className="px-3 py-2 text-xs font-black bg-violet-600 text-white rounded-xl active:scale-95 disabled:opacity-50"
                    >
                      {sendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                  <p className="text-[10px] opacity-75">Check your email inbox for the 6-digit verification code.</p>
                </div>
              )}

              {otpSentNotice && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold rounded-xl">
                  {otpSentNotice}
                </div>
              )}

              <div className="pt-1 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className={`flex-1 py-3 text-xs font-black transition-all active:scale-95 ${theme.buttonPrimary}`}
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
                </button>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="border-t-2 border-current/30 pt-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-violet-600">🔐 Change Password (Requires OTP)</h3>
              
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider block opacity-75">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className={`w-full px-3.5 py-2 text-xs font-bold ${theme.input}`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider block opacity-75">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className={`w-full px-3.5 py-2 text-xs font-bold ${theme.input}`}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider block opacity-75">Enter Security OTP Code</label>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp}
                    className="text-[11px] font-extrabold text-violet-600 hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : "📩 Request OTP"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={passwordForm.otp}
                    onChange={(e) => setPasswordForm({ ...passwordForm, otp: e.target.value })}
                    placeholder="6-digit OTP"
                    className={`flex-1 px-3.5 py-2 text-xs font-bold font-mono tracking-widest ${theme.input}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp}
                    className="px-3 py-2 text-xs font-black bg-violet-600 text-white rounded-xl active:scale-95 disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 text-xs font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            <div className="border-t-2 border-current pt-4 space-y-3 opacity-90">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Account Role</span>
                <span className="bg-violet-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {userProfile.role || 'USER'}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("access_token");
                    router.replace("/auth");
                  }}
                  className={`flex-1 py-2.5 text-xs font-black transition-all active:scale-95 ${theme.buttonDark}`}
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-3.5 py-2.5 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}