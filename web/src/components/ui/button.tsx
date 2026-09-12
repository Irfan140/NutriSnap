import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
        secondary:
          "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
        dark: "bg-slate-900 text-white hover:bg-slate-700",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonAsButton = VariantProps<typeof buttonVariants> &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = VariantProps<typeof buttonVariants> &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  if ("href" in props && props.href !== undefined) {
    const { variant, size, className, ...rest } = props;
    return (
      <a className={cn(buttonVariants({ variant, size }), className)} {...rest} />
    );
  }
  const { variant, size, className, type, ...rest } = props;
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  );
}
