import { ArrowLeft, Check, Mail, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { SITE, contactHref } from "../lib/site";
import { routeHref } from "../lib/router";

const ERASED_ITEMS = [
  "Meal photos in private storage",
  "Nutrition reports and history",
  "Stats, streaks, and profile data",
  "Your Clerk authentication account",
] as const;

export default function DeleteAccountPage() {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-br from-red-700 to-rose-900">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Badge variant="dark">{SITE.name}</Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Delete Your Account
        </h1>
        <p className="mt-2 text-[15px] text-red-50">
          We&apos;re sorry to see you go. Here&apos;s how to remove your
          NutriSnap account and data.
        </p>
      </div>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Fastest: delete in the app
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-slate-600">
              Delete instantly under{" "}
              <strong className="font-semibold text-slate-800">
                Profile → Danger zone → Delete account
              </strong>
              . This removes your meals, photos, stats, and profile immediately.
            </p>
            <ul className="space-y-2.5">
              {ERASED_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Prefer email? Request deletion
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-slate-600">
              To delete your NutriSnap account and associated data, please send
              us an email:
            </p>
            <ol className="mb-4 list-decimal space-y-2 pl-6 text-[15px] leading-relaxed text-slate-600">
              <li>Send an email to the address below.</li>
              <li>
                Use the{" "}
                <strong className="font-semibold text-slate-800">
                  same email address you registered with
                </strong>{" "}
                in the app so we can verify your account.
              </li>
              <li>
                Mention that you would like to delete your account (for example,
                use the subject &ldquo;Account Deletion Request&rdquo;).
              </li>
            </ol>
            <p className="mb-5 text-[15px] leading-relaxed text-slate-600">
              Once verified, we will delete your account and associated data.
            </p>
            <div className="rounded-xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
              <Button
                href={contactHref("Account Deletion Request")}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Mail className="h-4 w-4" />
                {SITE.contactEmail}
              </Button>
              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-500">
                Please write from the registered email ID that you used in the
                app, so we can locate and delete the correct account.
              </p>
            </div>
          </section>

          <section className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-amber-900">
              Deletion is permanent and cannot be undone. Incomplete uploads
              that are never analyzed are removed automatically after 24 hours.
            </p>
          </section>

          <div className="mt-8 text-center">
            <Button href={routeHref("home")} variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
