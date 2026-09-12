export const SITE = {
  name: "NutriSnap",
  tagline: "Snap your meal. Know your nutrition.",
  githubUrl: "https://github.com/Irfan140/NutriSnap",
  playStoreUrl:
    "https://play.google.com/store/apps/details?id=com.irfan140.NutriSnap",
  contactEmail: "irfanmehmud140@gmail.com",
  privacyLastUpdated: "August 16, 2026",
} as const;

export function contactHref(subject?: string): string {
  const base = `mailto:${SITE.contactEmail}`;
  if (!subject) return base;
  return `${base}?subject=${encodeURIComponent(subject)}`;
}
