import { Mail } from "lucide-react";
import { LogoMark } from "./logo";
import { GithubIcon } from "./github-icon";
import { PlayStoreIcon } from "./play-store-icon";
import { SITE, contactHref } from "../lib/site";
import { navigateToSection, routeHref } from "../lib/router";

const PRODUCT_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "tech", label: "Tech stack" },
  { id: "faq", label: "FAQ" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight text-white">
              {SITE.name}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            An AI meal analyzer. Snap a photo of your food and get calories,
            macros, a health score, and practical guidance.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Product
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => navigateToSection(link.id)}
                  className="rounded transition-colors hover:text-white"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Legal
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={routeHref("privacy")} className="rounded transition-colors hover:text-white">
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href={routeHref("delete-account")}
                className="rounded transition-colors hover:text-white"
              >
                Delete Your Account
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Project
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={SITE.playStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded transition-colors hover:text-white"
              >
                <PlayStoreIcon className="h-5 w-5" />
                Get it on Google Play
              </a>
            </li>
            <li>
              <a
                href={SITE.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded transition-colors hover:text-white"
              >
                <GithubIcon className="h-4 w-4" />
                GitHub repository
              </a>
            </li>
            <li>
              <a
                href={contactHref()}
                className="inline-flex items-center gap-2 rounded transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                Contact us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>© 2026 {SITE.name}. All rights reserved.</p>
          <p>Privacy-first AI nutrition.</p>
        </div>
      </div>
    </footer>
  );
}
