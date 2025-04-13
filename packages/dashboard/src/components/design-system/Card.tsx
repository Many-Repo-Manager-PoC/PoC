import {
  component$,
  Slot,
  type PropFunction,
  type QRL,
} from "@builder.io/qwik";

export type CardVariant = "default" | "bordered" | "elevated";

export interface CardProps {
  variant?: CardVariant;
  class?: string;
  onClick$?:
    | PropFunction<(evt: Event) => void>
    | QRL<(evt: Event) => void>
    | QRL<() => void>
    | (QRL<(evt: Event) => void> | QRL<() => void>)[];
}

export const Card = component$<CardProps>(
  ({ variant = "default", class: className, onClick$ }) => {
    const baseClasses = "rounded-lg overflow-hidden";

    const variantClasses = {
      default: "bg-gray-800",
      bordered: "bg-gray-800 border border-gray-700",
      elevated: "bg-gray-800 shadow-lg",
    };

    return (
      <div
        onClick$={onClick$}
        class={`${baseClasses} ${variantClasses[variant]} ${className || ""}`}
      >
        <Slot />
      </div>
    );
  }
);

export const CardHeader = component$<{ class?: string }>(
  ({ class: className }) => {
    return (
      <div class={`p-4 border-b border-gray-700 ${className || ""}`}>
        <Slot />
      </div>
    );
  }
);

export const CardBody = component$<{ class?: string }>(
  ({ class: className }) => {
    return (
      <div class={`p-4 ${className || ""}`}>
        <Slot />
      </div>
    );
  }
);

export const CardFooter = component$<{ class?: string }>(
  ({ class: className }) => {
    return (
      <div class={`p-4 border-t border-gray-700 ${className || ""}`}>
        <Slot />
      </div>
    );
  }
);
