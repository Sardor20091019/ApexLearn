"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SupportChat from "../../components/SupportChat";

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
  isEnrolled?: boolean;
};

type Tab = "catalog" | "learning" | "favorites" | "support";

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingProfile, setOnboardingProfile] = useState({
    age: "",
    identity: "Student",
    goal: "Upskilling for career",
    experience: "Beginner",
  });

  // Lazy initialization prevents initial empty state from wiping localStorage on refresh
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
  const [maxPrice, setMaxPrice] = useState(500);
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState("USER");
  const [userId, setUserId] = useState("");

  const tell = (s: string) => {
    setNotice(s);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const load = async (token: string) => {
    const h = { Authorization: "Bearer " + token };
    const [a, b, c, d] = await Promise.all([
      fetch(API + "/courses", { headers: h }),
      fetch(API + "/enrollments/me", { headers: h }),
      fetch(API + "/categories", { headers: h }),
      fetch(API + "/auth/profile", { headers: h }),
    ]);
    const enrolledMap = new Map<string, number>();
    if (b.ok) {
      const data = await b.json();
      setMine(
        data.map((x: any) => ({ ...x.course, progress: x.progress || 0 })),
      );
      data.forEach((x: any) => enrolledMap.set(x.course?.id || x.courseId, x.progress || 0));
    }
    if (a.ok)
      setCourses(
        (await a.json()).map((x: Course) => ({
          ...x,
          isEnrolled: enrolledMap.has(x.id),
          progress: enrolledMap.get(x.id) ?? x.progress,
        })),
      );
    if (c.ok) setCategories(await c.json());
    if (d.ok) {
      const x = await d.json();
      setRole((x.role || "USER").toUpperCase());
      setUserId(x.id || "");
    }
  };

  // Auth check, remote data loading, and Onboarding check on mount
  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) {
      router.replace("/auth");
      return;
    }
    try {
      const x = JSON.parse(atob(token.split(".")[1]));
      setRole((x.role || "USER").toUpperCase());
      setUserId(x.id || x.sub || "");
    } catch {}

    // Check if user completed onboarding
    const completedOnboarding = localStorage.getItem("apex_onboarding_completed");
    if (!completedOnboarding) {
      setShowOnboarding(true);
    }

    load(token)
      .catch(() => tell("Unable to load all dashboard data."))
      .finally(() => setLoading(false));
  }, [router]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("course-cart", JSON.stringify(cart));
  }, [cart]);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("course-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((i) => i !== id) : [...prev, id];
      tell(exists ? "Removed from favorites" : "Added to favorites");
      return next;
    });
  };

  const finishOnboarding = () => {
    localStorage.setItem("apex_onboarding_completed", "true");
    localStorage.setItem("apex_user_profile", JSON.stringify(onboardingProfile));
    setShowOnboarding(false);
    tell("Profile customized successfully!");
  };

  const total = useMemo(() => cart.reduce((n, x) => n + price(x), 0), [cart]);

  const listed = useMemo(() => {
    return courses
      .filter((x) => {
        const p = price(x);
        return (
          (x.title + " " + (x.description || ""))
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (cat === "All" || category(x) === cat) &&
          (tier === "all" || (tier === "free" ? p === 0 : p > 0)) &&
          p >= minPrice &&
          p <= maxPrice
        );
      })
      .sort((a, b) =>
        sort === "low"
          ? price(a) - price(b)
          : sort === "high"
            ? price(b) - price(a)
            : 0,
      );
  }, [courses, query, cat, tier, minPrice, maxPrice, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, cat, tier, minPrice, maxPrice, sort]);

  const totalPages = Math.ceil(listed.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return listed.slice(start, start + pageSize);
  }, [listed, currentPage]);

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
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) return router.replace("/auth");
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
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    if (!token) return router.replace("/auth");
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

  if (loading)
    return (
      <div className="flex min-h-screen flex-col bg-[#FBFBFA] text-stone-900">
        <style jsx global>{`
          @keyframes waveShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-wave {
            background: linear-gradient(90deg, #e7e5e4 0%, #fef3c7 50%, #e7e5e4 100%);
            background-size: 200% 100%;
            animation: waveShimmer 1.6s infinite linear;
          }
        `}</style>

        {/* Skeleton Header with Wave Animation */}
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#FBFBFA]/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl animate-wave" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 rounded-md animate-wave" />
                <div className="h-3 w-16 rounded-md animate-wave" />
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-9 w-28 rounded-xl animate-wave" />
              <div className="h-9 w-28 rounded-xl animate-wave" />
              <div className="h-9 w-24 rounded-xl animate-wave" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-16 rounded-xl animate-wave" />
              <div className="hidden h-9 w-20 rounded-xl animate-wave sm:block" />
            </div>
          </div>
        </header>

        {/* Skeleton Main Workspace with Wave Animation */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 space-y-8">
          <div className="space-y-3 border-b border-stone-200/60 pb-6">
            <div className="h-5 w-28 rounded-full animate-wave" />
            <div className="h-9 w-72 rounded-lg animate-wave" />
            <div className="h-4 w-96 rounded-lg animate-wave" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sidebar Skeleton */}
            <aside className="hidden lg:block h-fit rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="h-4 w-16 rounded-md animate-wave" />
                <div className="h-3 w-12 rounded-md animate-wave" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-md animate-wave" />
                <div className="h-10 w-full rounded-xl animate-wave" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-md animate-wave" />
                <div className="space-y-2.5 pt-1">
                  <div className="h-4 w-28 rounded-md animate-wave" />
                  <div className="h-4 w-24 rounded-md animate-wave" />
                  <div className="h-4 w-24 rounded-md animate-wave" />
                </div>
              </div>
            </aside>

            {/* Grid Cards Skeleton */}
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-10 w-full max-w-md rounded-xl animate-wave" />
                <div className="h-10 w-44 rounded-xl animate-wave" />
              </div>

              <div className="flex items-center justify-between">
                <div className="h-3 w-40 rounded-md animate-wave" />
                <div className="h-3 w-20 rounded-md animate-wave" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs"
                  >
                    <div className="h-44 w-full animate-wave" />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-16 rounded-md animate-wave" />
                        <div className="h-5 w-12 rounded-md animate-wave" />
                      </div>
                      <div className="h-5 w-full rounded-md animate-wave" />
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3.5 w-full rounded-md animate-wave" />
                        <div className="h-3.5 w-3/4 rounded-md animate-wave" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );

  const nav = [
    ["catalog", "Browse Courses"],
    ["learning", "My Learning"],
    ["favorites", `Favorites (${favorites.length})`],
    ["support", "Support"],
  ] as const;

  const renderFilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <h2 className="font-semibold text-stone-900">Filters</h2>
        <button
          onClick={() => {
            setQuery("");
            setCat("All");
            setTier("all");
            setMinPrice(0);
            setMaxPrice(500);
            setSort("featured");
          }}
          className="text-xs font-semibold text-amber-800 transition-colors hover:text-amber-950"
        >
          Reset all
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
          Category
        </label>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-[#FBFBFA] px-3 py-2.5 text-sm font-medium text-stone-800 shadow-xs focus:border-stone-400 focus:bg-white focus:outline-none"
        >
          <option value="All">All Categories</option>
          {categories.map((x) => (
            <option key={x.id} value={x.name}>
              {x.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing Type Radio */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
          Pricing Type
        </label>
        <div className="space-y-2">
          {(
            [
              ["all", "All courses"],
              ["free", "Free only"],
              ["paid", "Paid only"],
            ] as const
          ).map(([x, label]) => (
            <label
              key={x}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              <input
                type="radio"
                name="priceTier"
                checked={tier === x}
                onChange={() => setTier(x)}
                className="h-4 w-4 accent-stone-900"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Min-Max Price Dual Range Slider */}
      <div className="space-y-4 pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            Price Range
          </label>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
            {money(minPrice)} – {money(maxPrice)}
          </span>
        </div>

        <div className="relative py-3">
          <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-stone-200" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stone-900 transition-all"
            style={{
              left: `${(minPrice / 500) * 100}%`,
              right: `${100 - (maxPrice / 500) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={500}
            step={5}
            value={minPrice}
            onChange={(e) => {
              const val = Math.min(
                Number(e.target.value),
                maxPrice - 5,
              );
              setMinPrice(val);
            }}
            className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <input
            type="range"
            min={0}
            max={500}
            step={5}
            value={maxPrice}
            onChange={(e) => {
              const val = Math.max(
                Number(e.target.value),
                minPrice + 5,
              );
              setMaxPrice(val);
            }}
            className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs font-medium text-stone-400">
          <span>$0</span>
          <span>$250</span>
          <span>$500</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFA] text-stone-900 selection:bg-amber-100 selection:text-amber-900 pb-20 sm:pb-0">
      
      {/* Onboarding Modal with Close (X) Button */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-stone-900 font-bold text-white text-xs">
                  {onboardingStep}/4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Welcome Setup
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline-block text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                  ApexLearn Onboarding
                </span>
                <button
                  onClick={() => {
                    localStorage.setItem("apex_onboarding_completed", "true");
                    setShowOnboarding(false);
                  }}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  aria-label="Close onboarding"
                >
                  ✕
                </button>
              </div>
            </div>

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">How old are you?</h2>
                <p className="text-sm text-stone-500">
                  This helps us personalize course content recommendations for your age group.
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
                    className="w-full rounded-xl border border-stone-200 bg-[#FBFBFA] px-4 py-3 text-base text-stone-900 shadow-xs focus:border-stone-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">Who are you?</h2>
                <p className="text-sm text-stone-500">
                  Tell us your primary role or background to tailor your learning pathway.
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
                        "rounded-xl border p-3.5 sm:p-4 text-left text-sm font-semibold transition-all " +
                        (onboardingProfile.identity === roleOpt
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50")
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
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">Why are you studying?</h2>
                <p className="text-sm text-stone-500">
                  What is your core motivation for taking courses on ApexLearn?
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
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm font-medium transition-all " +
                        (onboardingProfile.goal === goalOpt
                          ? "border-stone-900 bg-stone-50 text-stone-900 ring-1 ring-stone-900"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50")
                      }
                    >
                      <input
                        type="radio"
                        name="studyGoal"
                        checked={onboardingProfile.goal === goalOpt}
                        onChange={() =>
                          setOnboardingProfile({ ...onboardingProfile, goal: goalOpt })
                        }
                        className="h-4 w-4 accent-stone-900"
                      />
                      {goalOpt}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">What is your experience level?</h2>
                <p className="text-sm text-stone-500">
                  We'll suggest courses that match your skill proficiency level.
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
                        "flex flex-col gap-1 rounded-xl border p-4 text-left transition-all " +
                        (onboardingProfile.experience === lvl
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50")
                      }
                    >
                      <span className="text-sm font-bold">{lvl}</span>
                      <span className={"text-[11px] " + (onboardingProfile.experience === lvl ? "text-stone-300" : "text-stone-500")}>
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-stone-100 pt-6">
              {onboardingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep((s) => s - 1)}
                  className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
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
                  className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
                >
                  Get Started →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#FBFBFA]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setTab("catalog")}
            className="group flex items-center gap-2.5 text-left font-semibold tracking-tight transition-colors"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-900 font-bold text-[#FBFBFA] shadow-sm">
              A
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-none text-stone-900">
                ApexLearn
              </span>
              <span className="text-[11px] font-medium text-stone-500">
                Student Portal
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all " +
                  (tab === id
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900")
                }
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-xs transition-all hover:bg-stone-50 hover:border-stone-300"
            >
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-amber-700 px-1 text-xs font-bold text-white shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                router.push("/auth");
              }}
              className="hidden rounded-xl px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/50 hover:text-stone-900 sm:block"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb-friendly navigation for phones) */}
      <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-around shadow-lg">
        {[
          ["catalog", "Catalog", "⌕"],
          ["learning", "Learning", "📖"],
          ["favorites", "Favorites", "♥"],
          ["support", "Support", "💬"],
        ].map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all " +
              (tab === id
                ? "text-amber-800 font-bold bg-amber-50"
                : "text-stone-500 font-medium hover:text-stone-900")
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[11px] leading-tight">{label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8 sm:px-6">
        {tab === "catalog" && (
          <section className="space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-2 border-b border-stone-200/60 pb-6">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-100/60 px-3 py-1 text-xs font-semibold text-amber-900">
                Course Catalog
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
                Find your next course.
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                Explore expert-led courses crafted for professional mastery.
              </p>
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-xs active:bg-stone-50"
              >
                <span className="flex items-center gap-2">
                  <span>⚙</span> Filter & Sort Courses
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
                  {cat !== "All" || tier !== "all" || minPrice > 0 || maxPrice < 500 ? "Active Filters" : "All"}
                </span>
              </button>
            </div>

            {/* Mobile Filter Modal Drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-900/50 backdrop-blur-xs lg:hidden">
                <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <h2 className="text-base font-bold text-stone-900">Filter & Sort</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  </div>
                  {renderFilterContent()}
                  <div className="pt-2">
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
                    >
                      Apply Filters ({listed.length} courses)
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Desktop Filter Sidebar */}
              <aside className="hidden lg:block h-fit rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs lg:sticky lg:top-24 space-y-6">
                {renderFilterContent()}
              </aside>

              {/* Course Listing Column */}
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search courses by title or keyword..."
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 shadow-xs transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 shadow-xs focus:border-stone-400 focus:outline-none"
                  >
                    <option value="featured">Sort by: Featured</option>
                    <option value="low">Price: Low to High</option>
                    <option value="high">Price: High to Low</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <span>Showing {listed.length} available courses</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                {paginatedCourses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 sm:p-16 text-center shadow-xs">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl font-bold text-stone-400">
                      ⌕
                    </div>
                    <h3 className="text-base font-bold text-stone-800">
                      No courses found
                    </h3>
                    <p className="mt-1 text-sm text-stone-500">
                      Try adjusting your search query, category, or price range
                      filter.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {paginatedCourses.map((x) => {
                        const p = price(x),
                          inCart = cart.some((y) => y.id === x.id),
                          isFav = favorites.includes(x.id),
                          image = imageFor(x);
                        return (
                          <article
                            key={x.id}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
                          >
                            <div>
                              <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={x.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-sm font-bold text-stone-400 bg-stone-100">
                                    {category(x)}
                                  </div>
                                )}
                                <div className="absolute top-3 left-3">
                                  <span className="rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-stone-800 shadow-xs">
                                    {category(x)}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => toggleFavorite(x.id, e)}
                                  aria-label="Favorite"
                                  className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur-sm shadow-xs transition-transform active:scale-95 hover:bg-white"
                                >
                                  <span
                                    className={
                                      isFav ? "text-rose-600" : "text-stone-400"
                                    }
                                  >
                                    {isFav ? "♥" : "♡"}
                                  </span>
                                </button>
                              </div>
                              <div className="p-5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-extrabold text-stone-900">
                                    {money(p)}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded-md">
                                    <span>★</span>
                                    <span>
                                      {(x.ratingAverage || 5.0).toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                <h2 className="font-bold text-stone-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                                  {x.title}
                                </h2>
                                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">
                                  {x.description ||
                                    "Comprehensive hands-on training module."}
                                </p>
                              </div>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-stone-900/95 backdrop-blur-md p-5 sm:p-6 text-white transition-transform duration-300 ease-in-out group-hover:translate-y-0 flex flex-col justify-between space-y-4 max-h-full overflow-y-auto z-20">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                                  <span>Detailed Overview</span>
                                  <span>★ {(x.ratingAverage || 5.0).toFixed(1)}</span>
                                </div>
                                <h3 className="font-bold text-white text-base leading-snug">
                                  {x.title}
                                </h3>
                                <p className="text-xs text-stone-300 leading-relaxed line-clamp-4">
                                  {x.description ||
                                    "Explore deep modules, hands-on projects, and expert-curated curriculum designed to elevate your career to the next level."}
                                </p>
                              </div>

                              <div className="pt-2">
                                {x.isEnrolled ? (
                                  <button
                                    onClick={() => setTab("learning")}
                                    className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
                                  >
                                    {(x.progress || 0) >= 100 ? "Completed ✓ (Review)" : "Continue learning"}
                                  </button>
                                ) : p === 0 ? (
                                  <button
                                    disabled={enrollBusy === x.id}
                                    onClick={() => enroll(x.id)}
                                    className="w-full rounded-xl bg-amber-600 py-3 text-xs font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-60"
                                  >
                                    {enrollBusy === x.id
                                      ? "Enrolling..."
                                      : "Enroll for free"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      inCart ? setCartOpen(true) : add(x)
                                    }
                                    className={
                                      "w-full rounded-xl py-3 text-xs font-semibold shadow-sm transition-colors " +
                                      (inCart
                                        ? "bg-white text-stone-900 hover:bg-stone-100"
                                        : "bg-amber-600 text-white hover:bg-amber-500")
                                    }
                                  >
                                    {inCart ? "View in cart" : `Add to cart · ${money(p)}`}
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => setCurrentPage(num)}
                            className={
                              "grid h-10 w-10 place-items-center rounded-xl text-sm font-semibold transition-all " +
                              (currentPage === num
                                ? "bg-stone-900 text-white shadow-sm"
                                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50")
                            }
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-40"
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/60 pb-6">
              <div>
                <span className="inline-block rounded-full bg-amber-100/60 px-3 py-1 text-xs font-semibold text-amber-900 mb-2">
                  My Progress
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                  Enrolled Courses
                </h1>
              </div>
              <button
                onClick={() => setTab("catalog")}
                className="text-sm font-semibold text-amber-800 hover:text-amber-950"
              >
                Browse more courses →
              </button>
            </div>

            {mine.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 sm:p-16 text-center shadow-xs">
                <h3 className="text-lg font-bold text-stone-800">
                  No active enrollments
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  You haven't enrolled in any courses yet. Browse the catalog to
                  start learning.
                </p>
                <button
                  onClick={() => setTab("catalog")}
                  className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((x) => {
                  const image = imageFor(x);
                  const progressVal = x.progress || 0;
                  return (
                    <article
                      key={x.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all hover:border-stone-300 hover:shadow-md"
                    >
                      <div>
                        <div className="relative h-40 w-full bg-stone-100 overflow-hidden">
                          {image ? (
                            <img
                              src={image}
                              alt={x.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm font-bold text-stone-400 bg-stone-100">
                              {category(x)}
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-stone-800 shadow-xs">
                              {category(x)}
                            </span>
                          </div>
                          {progressVal >= 100 && (
                            <div className="absolute top-3 right-3">
                              <span className="rounded-lg bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                                Completed ✓
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-5 space-y-2">
                          <h2 className="text-lg font-bold text-stone-900 leading-snug line-clamp-1">
                            {x.title}
                          </h2>
                          <p className="text-sm text-stone-500 line-clamp-2">
                            {x.description || "Interactive training module."}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-5">
                        <div className="space-y-2 border-t border-stone-100 pt-4">
                          <div className="flex justify-between text-xs font-bold text-stone-600">
                            <span>Course Progress</span>
                            <span>{progressVal}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                            <div
                              className={"h-full rounded-full transition-all duration-500 " + (progressVal >= 100 ? "bg-emerald-600" : "bg-stone-900")}
                              style={{
                                width: Math.min(progressVal, 100) + "%",
                              }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            router.push("/courses/" + x.id + "/learn")
                          }
                          className={
                            "w-full rounded-xl py-3 text-sm font-semibold shadow-sm transition-all " +
                            (progressVal >= 100
                              ? "bg-emerald-700 text-white hover:bg-emerald-600"
                              : progressVal > 0
                              ? "bg-stone-900 text-white hover:bg-stone-800"
                              : "bg-stone-900 text-white hover:bg-stone-800")
                          }
                        >
                          {progressVal >= 100
                            ? "Already finished • Learn again"
                            : progressVal > 0
                            ? "Continue learning"
                            : "Start course"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "favorites" && (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 border-b border-stone-200/60 pb-6">
              <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 self-start mb-2">
                Saved Items
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                Favorite Courses
              </h1>
            </div>

            {favoriteCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 sm:p-16 text-center shadow-xs">
                <h3 className="text-lg font-bold text-stone-800">
                  No favorites yet
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Click the heart icon on any course in the catalog to save it
                  for later.
                </p>
                <button
                  onClick={() => setTab("catalog")}
                  className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {favoriteCourses.map((x) => {
                  const p = price(x),
                    inCart = cart.some((y) => y.id === x.id),
                    image = imageFor(x);
                  return (
                    <article
                      key={x.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
                    >
                      <div>
                        <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                          {image ? (
                            <img
                              src={image}
                              alt={x.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-sm font-bold text-stone-400 bg-stone-100">
                              {category(x)}
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-stone-800 shadow-xs">
                              {category(x)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(x.id, e)}
                            aria-label="Remove favorite"
                            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur-sm shadow-xs transition-transform active:scale-95 hover:bg-white text-rose-600"
                          >
                            ♥
                          </button>
                        </div>
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold text-stone-900">
                              {money(p)}
                            </span>
                          </div>
                          <h2 className="font-bold text-stone-900 line-clamp-1">
                            {x.title}
                          </h2>
                          <p className="text-sm text-stone-500 line-clamp-2">
                            {x.description || "Course details."}
                          </p>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-stone-900/95 backdrop-blur-md p-5 sm:p-6 text-white transition-transform duration-300 ease-in-out group-hover:translate-y-0 flex flex-col justify-between space-y-4 max-h-full overflow-y-auto z-20">
                        <div className="space-y-2">
                          <span className="text-xs text-amber-300 font-semibold">Saved Favorite</span>
                          <h3 className="font-bold text-white text-base leading-snug">{x.title}</h3>
                          <p className="text-xs text-stone-300 leading-relaxed line-clamp-4">
                            {x.description || "Course overview and learning path details."}
                          </p>
                        </div>
                        <div className="pt-2">
                          {x.isEnrolled ? (
                            <button
                              onClick={() => setTab("learning")}
                              className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-stone-900 hover:bg-stone-100 transition-colors"
                            >
                              {(x.progress || 0) >= 100 ? "Already finished • Learn again" : "Continue learning"}
                            </button>
                          ) : p === 0 ? (
                            <button
                              onClick={() => enroll(x.id)}
                              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
                            >
                              Enroll for free
                            </button>
                          ) : (
                            <button
                              onClick={() => (inCart ? setCartOpen(true) : add(x))}
                              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
                            >
                              {inCart ? "View in cart" : `Add to cart · ${money(p)}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "support" && (
          <section className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-8 shadow-xs">
            <h1 className="mb-6 text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Student Support Center
            </h1>
            <SupportChat userRole={role} currentUserId={userId} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200/70 bg-[#F7F6F3] text-stone-600 pb-16 sm:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-900 font-bold text-[#FBFBFA]">
                  A
                </span>
                <span className="text-base font-bold text-stone-900">ApexLearn</span>
              </div>
              <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
                <strong className="text-stone-700">About:</strong> ApexLearn is a premier educational ecosystem crafted to provide professional mastery through structured, expert-led courses.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">Navigation</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li><button onClick={() => setTab("catalog")} className="hover:text-stone-900 transition-colors">Browse Catalog</button></li>
                <li><button onClick={() => setTab("learning")} className="hover:text-stone-900 transition-colors">My Learning</button></li>
                <li><button onClick={() => setTab("favorites")} className="hover:text-stone-900 transition-colors">Favorites</button></li>
                <li><button onClick={() => setTab("support")} className="hover:text-stone-900 transition-colors">Support Center</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">Legal & Privacy</h4>
              <ul className="space-y-2 text-sm font-medium text-stone-500">
                <li className="hover:text-stone-900 cursor-pointer transition-colors">Terms of Service</li>
                <li className="hover:text-stone-900 cursor-pointer transition-colors">Privacy Policy</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-stone-200/60 pt-6 text-xs text-stone-400 sm:flex-row">
            <span>© 2026 ApexLearn Inc. All rights reserved.</span>
            <span className="mt-2 sm:mt-0">always choose the best, choose ApexLearn</span>
          </div>
        </div>
      </footer>

      {/* Notice Toast */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-xl"
        >
          {notice}
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs transition-opacity">
          <button
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <h2 className="text-lg font-bold text-stone-900">
                Your Cart ({cart.length})
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-stone-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-stone-500">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                cart.map((x) => (
                  <div
                    key={x.id}
                    className="flex items-center justify-between pt-4 first:pt-0"
                  >
                    <div className="space-y-1 pr-4">
                      <p className="text-sm font-bold text-stone-900 line-clamp-1">
                        {x.title}
                      </p>
                      <p className="text-xs font-semibold text-amber-800">
                        {money(price(x))}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setCart((y) => y.filter((z) => z.id !== x.id))
                      }
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-200 bg-[#FBFBFA] p-6 space-y-4">
                <div className="flex items-center justify-between text-base">
                  <span className="font-bold text-stone-700">Total</span>
                  <span className="font-extrabold text-stone-900">
                    {money(total)}
                  </span>
                </div>
                <button
                  disabled={checkoutBusy}
                  onClick={checkout}
                  className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:opacity-60"
                >
                  {checkoutBusy
                    ? "Redirecting to checkout..."
                    : `Proceed to Checkout · ${money(total)}`}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}