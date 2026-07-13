import { ButtonHTMLAttributes } from "react";

type Variant = "accent" | "primary" | "outline" | "ghost";

const variantClasses: Record<Variant, string> = {
  accent:
    "bg-accent text-white hover:bg-accent-dark active:bg-accent-dark disabled:opacity-50",
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50",
  outline:
    "border-2 border-border bg-surface text-text-primary hover:border-text-secondary disabled:opacity-50",
  ghost: "text-text-secondary hover:text-text-primary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "accent",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-semibold transition-colors duration-150 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
