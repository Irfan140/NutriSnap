import { ArrowLeft, Mail } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { SITE, contactHref } from "../lib/site";
import { routeHref } from "../lib/router";
import type { ReactNode } from "react";

function PolicyCard({
  children,
  first,
}: {
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${first ? "" : "mt-5"}`}
    >
      {children}
    </section>
  );
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-xl font-bold text-slate-900">{children}</h2>;
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 mt-5 text-base font-semibold text-slate-900">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-3.5 text-[15px] leading-relaxed text-slate-600">{children}</p>;
}

function UL({ children }: { children: ReactNode }) {
  return <ul className="mb-3.5 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-slate-600">{children}</ul>;
}

export default function PrivacyPage() {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-br from-emerald-700 to-emerald-900">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Badge variant="dark">{SITE.name}</Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[15px] text-emerald-50">
          Your privacy matters to us. This policy explains what we collect and
          how we use it.
        </p>
      </div>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <PolicyCard first>
            <Badge>Last updated: {SITE.privacyLastUpdated}</Badge>
            <H2>
              <span className="mt-4 block">1. Introduction</span>
            </H2>
            <P>
              NutriSnap (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
              &ldquo;us&rdquo;) is a mobile application that analyzes photos of
              meals using artificial intelligence to provide nutrition
              information such as calories, macronutrients, vitamins, and health
              guidance.
            </P>
            <P>
              This Privacy Policy describes the information we collect, how we
              use it, and the choices you have. By downloading or using
              NutriSnap, you agree to the collection and use of information in
              accordance with this policy.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>2. Information We Collect</H2>
            <H3>2.1 Account Information</H3>
            <P>When you create an account or sign in, we collect:</P>
            <UL>
              <li>Your email address.</li>
              <li>Your authentication credentials (handled by our authentication provider).</li>
              <li>
                If you sign in with Google, the basic profile information Google
                provides, such as your name, email address, and profile picture.
              </li>
            </UL>
            <P>
              Account creation and authentication are provided by Clerk, Inc.
              (&ldquo;Clerk&rdquo;). Please refer to Clerk&apos;s privacy policy
              for details on how they handle your account data.
            </P>
            <H3>2.2 Meal Photos</H3>
            <P>
              To provide nutrition analysis, you may select a meal photo from
              your device&apos;s photo library. This photo is uploaded to our
              private object storage and transmitted to a third-party artificial
              intelligence provider, OpenAI, LLC (&ldquo;OpenAI&rdquo;), for
              analysis. We retain your meal photos and generated nutrition
              reports so you can view your history. Photos and reports are
              permanently deleted when you delete the meal or your account.
              Incomplete uploads that are never analyzed are removed
              automatically after 24 hours.
            </P>
            <H3>2.3 Usage and Log Data</H3>
            <P>
              When you use the app, our servers may automatically record certain
              technical information, including:
            </P>
            <UL>
              <li>Request details (endpoint, HTTP method, status code) and response times.</li>
              <li>Your user identifier.</li>
              <li>Your IP address (used for rate limiting and abuse prevention).</li>
            </UL>
            <P>We do not use advertising identifiers or third-party analytics SDKs.</P>
            <H3>2.4 Device Permissions</H3>
            <UL>
              <li>
                <strong className="font-semibold text-slate-800">Photo Library:</strong>{" "}
                We request access to your photo library only so that you can
                select a meal image to analyze. We do not access your photos
                unless you choose an image.
              </li>
            </UL>
          </PolicyCard>

          <PolicyCard>
            <H2>3. How We Use Your Information</H2>
            <UL>
              <li>To create and manage your account and to authenticate you.</li>
              <li>To analyze your meal photos and return nutrition information.</li>
              <li>
                To operate, maintain, and improve the service, including error
                logging and rate limiting to prevent abuse.
              </li>
              <li>To respond to support requests and communicate with you about the service.</li>
            </UL>
          </PolicyCard>

          <PolicyCard>
            <H2>4. How We Share Your Information</H2>
            <P>
              We do not sell your personal information. We share information
              only with the following third-party service providers, and only to
              the extent necessary to operate the service:
            </P>
            <UL>
              <li><strong className="font-semibold text-slate-800">Clerk, Inc.</strong> — authentication and account management.</li>
              <li><strong className="font-semibold text-slate-800">OpenAI, LLC</strong> — the AI vision model that analyzes your meal photos.</li>
              <li><strong className="font-semibold text-slate-800">Cloudflare, Inc.</strong> — private object storage for your meal photos.</li>
              <li><strong className="font-semibold text-slate-800">Google LLC</strong> — only if you choose to sign in with Google.</li>
            </UL>
            <P>
              These providers process data under their own privacy policies. We
              may also disclose information where required by law or to protect
              the rights and safety of our users.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>5. Data Retention</H2>
            <UL>
              <li>
                <strong className="font-semibold text-slate-800">Account information</strong>{" "}
                is retained for as long as your account remains active and is
                managed by Clerk.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Meal photos and nutrition reports</strong>{" "}
                are retained in private storage until you delete the meal or
                your account, at which point they are permanently removed.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Server logs</strong>{" "}
                may be retained for a limited period for operational and security purposes.
              </li>
            </UL>
            <P>
              Want everything removed? See{" "}
              <a href={routeHref("delete-account")} className="font-semibold text-emerald-700 hover:underline">
                how to delete your account
              </a>
              .
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>6. Security</H2>
            <P>
              We take reasonable measures to protect your information. All
              communication between the app and our servers uses HTTPS, and
              authentication tokens are stored securely on your device. However,
              no method of transmission or electronic storage is completely
              secure, and we cannot guarantee absolute security.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>7. Children&apos;s Privacy</H2>
            <P>
              NutriSnap is not directed to children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If you believe a child has provided us with personal information,
              please contact us and we will take steps to delete it.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>8. Your Rights</H2>
            <P>
              Depending on your location, you may have rights under data
              protection laws such as the General Data Protection Regulation
              (GDPR) or the California Consumer Privacy Act (CCPA), including
              the rights to:
            </P>
            <UL>
              <li>Access, correct, or delete your personal information.</li>
              <li>Receive a portable copy of your data.</li>
              <li>Object to or restrict certain processing.</li>
            </UL>
            <P>To exercise any of these rights, please contact us using the details below.</P>
          </PolicyCard>

          <PolicyCard>
            <H2>9. International Data Transfers</H2>
            <P>
              Your information may be transferred to and processed in countries
              other than your own, where our service providers operate. We take
              steps to apply appropriate safeguards when transferring personal
              information.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>10. Changes to This Policy</H2>
            <P>
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by updating the
              &ldquo;Last updated&rdquo; date at the top of this page and, where
              appropriate, through the app. Your continued use of the app after
              changes take effect constitutes acceptance of the revised policy.
            </P>
          </PolicyCard>

          <PolicyCard>
            <H2>11. Contact Us</H2>
            <P>
              If you have any questions or concerns about this Privacy Policy,
              please contact us:
            </P>
            <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <a
                href={contactHref("NutriSnap Privacy Question")}
                className="inline-flex items-center gap-2 font-semibold text-emerald-800 hover:underline"
              >
                <Mail className="h-4 w-4" />
                {SITE.contactEmail}
              </a>
            </div>
          </PolicyCard>

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
