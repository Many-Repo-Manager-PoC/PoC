import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { withAsChild, type AsChildProps } from "./utils/asChild";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends AsChildProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  class?: string;
  onClick$?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  href?: string;
  target?: string;
  rel?: string;
  server?: boolean;
}

const BaseButton = component$<ButtonProps>(
  ({
    variant = "primary",
    size = "md",
    isLoading = false,
    fullWidth = false,
    class: className,
    onClick$,
    disabled,
    type = "button",
    href,
    target,
    rel,
    server = false,
    ...props
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500",
      outline:
        "border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500",
      ghost: "bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    const widthClass = fullWidth ? "w-full" : "";

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className || ""}`;

    const loadingSpinner = isLoading ? (
      <div class="mr-2">
        <Spinner size="sm" />
      </div>
    ) : null;

    if (href) {
      if (!server) {
        return (
          <Link
            href={href}
            target={target}
            rel={rel}
            class={buttonClasses}
            onClick$={onClick$}
            {...props}
          >
            {loadingSpinner}
            <Slot />
          </Link>
        );
      }

      return (
        <a
          href={href}
          target={target}
          rel={rel}
          class={buttonClasses}
          onClick$={onClick$}
          {...props}
        >
          {loadingSpinner}
          <Slot />
        </a>
      );
    }

    return (
      <button
        class={buttonClasses}
        disabled={isLoading || disabled}
        type={type}
        onClick$={onClick$}
        {...props}
      >
        {loadingSpinner}
        <Slot />
      </button>
    );
  }
);

export const Button = withAsChild(BaseButton);
