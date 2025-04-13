import { component$ } from "@builder.io/qwik";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
  size?: SpinnerSize;
  class?: string;
  color?: string;
}

export const Spinner = component$<SpinnerProps>(
  ({ size = "md", class: className, color = "current" }) => {
    const sizeClasses = {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    };

    const spinnerClasses = `animate-spin rounded-full border-2 border-${color} border-t-transparent ${sizeClasses[size]} ${className || ""}`;

    return <div class={spinnerClasses} />;
  }
);
