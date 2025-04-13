import { component$, Slot } from "@builder.io/qwik";

export interface TagProps {
  variant?: "default" | "success" | "error" | "active" | "inactive" | "topic";
  class?: string;
  prefix?: string;
  suffix?: string;
}

const getVariantClasses = (variant: TagProps["variant"] = "default") => {
  switch (variant) {
    case "success":
      return "bg-digital-green-10 text-digital-green-20 border border-digital-green-20";
    case "error":
      return "bg-digital-red-10 text-digital-red-20 border border-digital-red-20";
    case "active":
      return "bg-core-blue-60 text-white border border-light-blue-20";
    case "inactive":
      return "bg-core-blue-50 text-digital-gray-10 border border-digital-gray-20";
    case "topic":
      return "bg-[#ddf4ff] text-[#0969da] border border-[#0969da]/30 dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:border-[#58a6ff]/30";
    default:
      return "bg-digital-gray-5 text-digital-gray-10 border border-digital-gray-20";
  }
};

export const Tag = component$<TagProps>(
  ({ variant, class: className, prefix, suffix }) => {
    return (
      <span
        class={[
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          getVariantClasses(variant),
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {prefix && <span class="mr-0.5">{prefix}</span>}
        <Slot />
        {suffix && <span class="ml-0.5">{suffix}</span>}
      </span>
    );
  }
);
