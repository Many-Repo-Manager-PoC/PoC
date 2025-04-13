import { component$ } from "@builder.io/qwik";

export interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
  class?: string;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton = component$<SkeletonProps>(
  ({
    variant = "text",
    width,
    height,
    class: className,
    animation = "pulse",
  }) => {
    const baseClasses = "bg-gray-700";

    const variantClasses = {
      text: "rounded",
      circular: "rounded-full",
      rectangular: "rounded-md",
    };

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer",
      none: "",
    };

    const style = {
      width: width || (variant === "text" ? "100%" : undefined),
      height: height || (variant === "text" ? "1rem" : undefined),
    };

    return (
      <div
        class={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className || ""}`}
        style={style}
      />
    );
  }
);
