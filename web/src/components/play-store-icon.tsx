import { cn } from "../lib/utils";

/** Google Play triangle mark in brand colors (lucide-react has no store icons).
 * The four facets share one center point, and each carries a same-color
 * stroke so the outer corners render rounded and no seams show between facets. */
export function PlayStoreIcon({ className }: { className?: string }) {
  const strokeWidth = 1.4;
  const join = "round" as const;
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", className)} aria-hidden="true">
      <path
        d="M5.5 3.8v16.4l6-8.2-6-8.2z"
        fill="#00a0ff"
        stroke="#00a0ff"
        strokeWidth={strokeWidth}
        strokeLinejoin={join}
      />
      <path
        d="M5.5 3.8L15 9.17l-3.5 2.83-6-8.2z"
        fill="#00e676"
        stroke="#00e676"
        strokeWidth={strokeWidth}
        strokeLinejoin={join}
      />
      <path
        d="M15 9.17L20 12l-5 2.83V9.17z"
        fill="#ffd500"
        stroke="#ffd500"
        strokeWidth={strokeWidth}
        strokeLinejoin={join}
      />
      <path
        d="M5.5 20.2L15 14.83 11.5 12l-6 8.2z"
        fill="#ff3d47"
        stroke="#ff3d47"
        strokeWidth={strokeWidth}
        strokeLinejoin={join}
      />
    </svg>
  );
}
