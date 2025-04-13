import { component$, Slot } from "@builder.io/qwik";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  class?: string;
}

export const Badge = component$<BadgeProps>(
  ({ variant = "default", size = "md", class: className }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-full font-medium";

    const variantClasses = {
      default: "bg-gray-200 text-gray-800",
      primary: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-cyan-100 text-cyan-800",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-0.5 text-sm",
      lg: "px-3 py-1 text-base",
    };

    return (
      <span
        class={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
      >
        <Slot />
      </span>
    );
  }
);
