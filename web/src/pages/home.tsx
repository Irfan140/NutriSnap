import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Flame,
  Globe,
  HeartPulse,
  History,
  ImagePlus,
  LogIn,
  Salad,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PlayStoreIcon } from "../components/play-store-icon";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { SITE, contactHref } from "../lib/site";
import { routeHref } from "../lib/router";

/* ---------------------------------- data --------------------------------- */

const HERO_POINTS = [
  "Calories, protein, carbs, fat & fiber",
  "Health score from 0–100, explained",
  "History, stats & daily streaks",
] as const;

const TOOL_CHIPS = [
  "Expo",
  "React Native",
  "Bun",
  "Express",
  "OpenAI",
  "Clerk",
  "Prisma",
  "Cloudflare R2",
  "BullMQ",
  "Tailwind CSS",
] as const;

const FEATURES = [
  {
    icon: Camera,
    title: "Snap any meal",
    text: "Pick a meal photo from your gallery. The app normalizes it to a compact JPEG so uploads are fast and light.",
  },
  {
    icon: Sparkles,
    title: "AI nutrition breakdown",
    text: "A vision model reads your photo and returns calories, protein, carbs, fat, fiber, vitamins, and minerals.",
  },
  {
    icon: HeartPulse,
    title: "Health score 0–100",
    text: "Every meal gets a clear score with an explanation, plus practical advice and healthier alternatives.",
  },
  {
    icon: History,
    title: "History & meal detail",
    text: "Browse past analyses newest-first with thumbnails and scores, and reopen any meal for the full breakdown.",
  },
  {
    icon: Flame,
    title: "Stats & streaks",
    text: "Track totals, average score, and daily streaks on your profile to stay consistent over time.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Photos live in private storage behind short-lived URLs. No ads, no trackers — delete anything, anytime.",
  },
] as const;

const STEPS = [
  {
    icon: LogIn,
    title: "Sign in securely",
    text: "Create an account with email or Google. Clerk handles authentication and keeps your session safe.",
  },
  {
    icon: ImagePlus,
    title: "Snap your meal",
    text: "Choose a food photo. It uploads straight to private storage through a short-lived presigned URL.",
  },
  {
    icon: Sparkles,
    title: "AI does the analysis",
    text: "A background worker sends the photo to a vision model, validates the result, and saves your report.",
  },
  {
    icon: History,
    title: "Review & track",
    text: "Get your score, macros, and guidance in seconds — then build history, stats, and streaks over time.",
  },
] as const;

const STACK = [
  {
    icon: Smartphone,
    title: "Mobile app",
    text: "Expo SDK 55 with React Native, Expo Router navigation, Clerk auth, and TanStack Query data hooks.",
  },
  {
    icon: Server,
    title: "API & AI",
    text: "Bun + Express API, BullMQ background jobs, LangChain with an OpenAI vision model, Prisma + Postgres.",
  },
  {
    icon: Globe,
    title: "Web & docs",
    text: "This site — React, TypeScript, Vite, and Tailwind CSS. Privacy and account-deletion pages included.",
  },
] as const;

const FAQS = [
  {
    q: "How does NutriSnap analyze my meal?",
    a: "You pick a meal photo, the app uploads it to private storage, and a background job sends it to an AI vision model. The model returns structured nutrition data — calories, macros, fiber, vitamins, and a health score — which the app renders with advice, alternatives, and a summary.",
  },
  {
    q: "What does the health score mean?",
    a: "Every analysis includes a score from 0 to 100 with a written explanation, so you can see at a glance how a meal fits your goals and what would make it better.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Meal photos are stored in a private bucket and served only through short-lived signed URLs. The app uses no advertising identifiers or third-party analytics SDKs, and you can delete any meal — or your whole account — at any time.",
  },
  {
    q: "How do I delete my account?",
    a: "The fastest way is inside the app under Profile → Danger zone → Delete account, which removes your meals, photos, stats, and profile immediately. You can also request deletion by email — see the account deletion page for details.",
  },
  {
    q: "Where can I see the code or contribute?",
    a: "NutriSnap is developed in the open on GitHub — mobile app, API server, and this website all live in one repository. Issues and pull requests are welcome.",
  },
] as const;

/* -------------------------------- components ------------------------------ */

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`Health score ${score} out of 100`}>
      <svg viewBox="0 0 84 84" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="42" cy="42" r={r} fill="none" strokeWidth="9" className="stroke-emerald-100" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-emerald-500"
          strokeDasharray={`${filled} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900">{score}</span>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  grams,
  pct,
  barClass,
}: {
  label: string;
  grams: string;
  pct: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{grams}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-emerald-200/70 via-transparent to-indigo-200/60 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-[2.5rem] border border-slate-200 bg-white p-3 shadow-xl">
        <div className="overflow-hidden rounded-[2rem] bg-slate-50">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-white">Today&apos;s lunch</p>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              Score 82
            </span>
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-700 px-4 py-5 text-white">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Salad className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold">Grilled salmon bowl</p>
              <p className="text-xs text-emerald-50">520 kcal · analyzed in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <ScoreRing score={82} />
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" grams="34g" pct={76} barClass="bg-emerald-500" />
              <MacroBar label="Carbs" grams="45g" pct={58} barClass="bg-indigo-400" />
              <MacroBar label="Fat" grams="18g" pct={40} barClass="bg-amber-400" />
            </div>
          </div>
          <div className="mx-4 mb-4 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
            <p className="text-[11px] leading-relaxed text-emerald-900">
              Great balance of protein and fiber. Try brown rice next time for
              extra staying power.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

/* ----------------------------------- page --------------------------------- */

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-20">
          <div>
            <Badge>
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered nutrition · Expo + Bun + OpenAI
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Snap your meal.{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Know your nutrition.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-500">
              NutriSnap turns a single food photo into calories, macros, a
              0–100 health score, and practical guidance — then tracks your
              history, stats, and streaks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={SITE.playStoreUrl} target="_blank" rel="noreferrer" size="lg">
                <PlayStoreIcon className="h-6 w-6" />
                Get it on Google Play
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <ul className="mt-8 space-y-2.5">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* Tool strip */}
      <section className="border-y border-slate-200 bg-white" aria-label="Built with">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Built with modern tools
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TOOL_CHIPS.map((tool) => (
              <Badge key={tool} variant="muted">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to eat smarter"
            text="From photo to insight in seconds — with history and streaks that keep you going."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardContent>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.text}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading
            eyebrow="How it works"
            title="Photo to insight in four steps"
            text="A simple flow on the surface, powered by a robust queue-based pipeline underneath."
          />
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <Card className="h-full">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <step.icon className="h-5 w-5" />
                      </span>
                      <span className="text-4xl font-extrabold text-slate-100">
                        {i + 1}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{step.title}</CardTitle>
                    <CardDescription className="mt-2">{step.text}</CardDescription>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Privacy band */}
      <section aria-label="Privacy first">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 sm:px-12 lg:px-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <Badge variant="dark">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Privacy first
                </Badge>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Your meals are yours.
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed text-slate-400">
                  Photos live in private storage behind short-lived URLs. No
                  ads, no analytics SDKs — and you can delete any meal or your
                  entire account whenever you like.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={routeHref("privacy")} variant="secondary">
                    Read the Privacy Policy
                  </Button>
                  <Button
                    href={routeHref("delete-account")}
                    variant="ghost"
                    className="text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete your account
                  </Button>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Private object storage, never public",
                  "Short-lived presigned URLs only",
                  "No ads or tracking SDKs",
                  "One-tap meal & account deletion",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/10"
                  >
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section id="tech" className="scroll-mt-24 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading
            eyebrow="Tech stack"
            title="One repo, three parts"
            text="A full-stack TypeScript project — mobile app, background-job API, and this website."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STACK.map((item) => (
              <Card key={item.title}>
                <CardContent>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="mt-4">{item.title}</CardTitle>
                  <CardDescription className="mt-2">{item.text}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            text="The short version of how NutriSnap works and how your data is handled."
          />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Get started">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-14 text-center sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Hungry for insight into your meals?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-emerald-50">
                Explore the code, follow the roadmap, or get in touch —
                NutriSnap is being built in the open.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href={SITE.playStoreUrl} target="_blank" rel="noreferrer" variant="secondary" size="lg">
                  <PlayStoreIcon className="h-6 w-6" />
                  Get it on Google Play
                </Button>
                <Button
                  href={contactHref("Hello NutriSnap")}
                  variant="dark"
                  size="lg"
                  className="bg-slate-950 hover:bg-slate-800"
                >
                  Contact us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
