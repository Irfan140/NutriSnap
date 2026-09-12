import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./logo";
import { GithubIcon } from "./github-icon";
import { PlayStoreIcon } from "./play-store-icon";
import { Button } from "./ui/button";
import { SITE } from "../lib/site";
import {
  navigateToSection,
  routeHref,
  useSiteRoute,
  type SiteRoute,
} from "../lib/router";
import { cn } from "../lib/utils";

const SECTION_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "tech", label: "Tech stack" },
  { id: "faq", label: "FAQ" },
] as const;

const LEGAL_LINKS: { route: SiteRoute; label: string }[] = [
  { route: "privacy", label: "Privacy" },
  { route: "delete-account", label: "Delete account" },
];

function goToSection(id: string, close: () => void) {
  navigateToSection(id);
  close();
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const route = useSiteRoute();
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href={routeHref("home")}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          aria-label="NutriSnap home"
        >
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {SITE.name}
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {SECTION_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id, close)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
          {LEGAL_LINKS.map((link) => (
            <a
              key={link.route}
              href={routeHref(link.route)}
              aria-current={route === link.route ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900",
                route === link.route ? "text-slate-900" : "text-slate-600",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="NutriSnap on GitHub"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <Button href={SITE.playStoreUrl} target="_blank" rel="noreferrer" size="sm">
            <PlayStoreIcon className="h-5 w-5" />
            Get it on Google Play
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-slate-200 bg-white px-4 pb-6 pt-2 lg:hidden"
          aria-label="Mobile"
        >
          {SECTION_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goToSection(link.id, close)}
              className="block w-full rounded-xl px-3 py-3 text-left text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </button>
          ))}
          <div className="my-2 h-px bg-slate-200" />
          {LEGAL_LINKS.map((link) => (
            <a
              key={link.route}
              href={routeHref(link.route)}
              onClick={close}
              className="block rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3">
            <Button
              href={SITE.playStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <PlayStoreIcon className="h-5 w-5" />
              Get it on Google Play
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
