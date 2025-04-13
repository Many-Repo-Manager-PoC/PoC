import { component$, Slot } from "@builder.io/qwik";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  class?: string;
  fallback?: string;
}

export const Avatar = component$<AvatarProps>(
  ({ src, alt = "", size = "md", class: className, fallback }) => {
    const sizeClasses = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-12 h-12 text-lg",
      xl: "w-16 h-16 text-xl",
    };

    const baseClasses =
      "inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 text-gray-600";

    // Generate initials from fallback text
    const getInitials = (text: string) => {
      return text
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div class={`${baseClasses} ${sizeClasses[size]} ${className || ""}`}>
        {src ? (
          <img src={src} alt={alt} class="w-full h-full object-cover" />
        ) : fallback ? (
          <span class="font-medium">{getInitials(fallback)}</span>
        ) : (
          <Slot />
        )}
      </div>
    );
  }
);
