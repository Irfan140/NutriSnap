import { useEffect, useState } from "react";

export type SiteRoute = "home" | "privacy" | "delete-account";

const HASH_TO_ROUTE: Record<string, SiteRoute> = {
  "#/": "home",
  "#/privacy": "privacy",
  "#/delete-account": "delete-account",
};

const TITLES: Record<SiteRoute, string> = {
  home: "NutriSnap — Snap your meal, know your nutrition",
  privacy: "Privacy Policy — NutriSnap",
  "delete-account": "Delete Your Account — NutriSnap",
};

/** Resolve the current route from the URL hash first, then the pathname.
 * Hash routing works on any static host with zero config; the pathname
 * fallback covers hosts that serve index.html for unknown paths. */
export function resolveRoute(): SiteRoute {
  if (typeof window === "undefined") return "home";
  const fromHash = HASH_TO_ROUTE[window.location.hash];
  if (fromHash) return fromHash;
  const path = window.location.pathname.toLowerCase();
  if (path.includes("delete-account")) return "delete-account";
  if (path.includes("privacy")) return "privacy";
  return "home";
}

export function routeHref(route: SiteRoute): string {
  return route === "home" ? "#/" : `#/${route}`;
}

export function useSiteRoute(): SiteRoute {
  const [route, setRoute] = useState<SiteRoute>(resolveRoute);

  useEffect(() => {
    const onChange = () => {
      setRoute(resolveRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  return route;
}

/** Go to a section on the home page, navigating home first if needed. */
export function navigateToSection(id: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const scroll = () => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  if (resolveRoute() !== "home") {
    window.location.hash = "#/";
    window.setTimeout(scroll, 100);
  } else {
    scroll();
  }
}
