import {
  component$,
  Slot,
  useSignal,
  $,
  type Component,
  type JSXOutput,
} from "@builder.io/qwik";
import { Card, CardBody } from "~/design-system";

export interface CollapsibleProps {
  title: string | Component | JSXOutput;
  subtitle?: string;
  defaultExpanded?: boolean;
  class?: string;
  onTitleClick$?: () => void;
}

export const Collapsible = component$<CollapsibleProps>(
  ({
    title,
    subtitle,
    defaultExpanded = false,
    class: className = "",
    onTitleClick$,
  }) => {
    const isExpanded = useSignal(defaultExpanded);

    const toggleExpanded = $(() => {
      isExpanded.value = !isExpanded.value;
    });

    const handleTitleClick = $((e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      if (onTitleClick$) {
        onTitleClick$();
      }
    });

    return (
      <Card variant="elevated" class={className}>
        <div
          class="cursor-pointer hover:bg-gray-800/30 transition-colors"
          onClick$={toggleExpanded}
        >
          <CardBody>
            <div class="flex items-center justify-between">
              <div
                class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 hover:outline-1 hover:outline-blue-500 rounded px-2 py-1 transition-all"
                onClick$={handleTitleClick}
              >
                {typeof title === "string" ? (
                  <h3 class="text-lg font-semibold text-white">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <span class="text-sm text-gray-400">{subtitle}</span>
                )}
              </div>
              <div class="flex-1 flex justify-end ml-4">
                <svg
                  class={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isExpanded.value ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {isExpanded.value && (
              <div class="transition-all duration-200 ease-in-out mt-3">
                <Slot />
              </div>
            )}
          </CardBody>
        </div>
      </Card>
    );
  }
);
