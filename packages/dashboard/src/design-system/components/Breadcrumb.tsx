import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  id?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  class?: string;
}

export const Breadcrumb = component$<BreadcrumbProps>(
  ({ items, class: className }) => {
    return (
      <nav class={`text-sm ${className || ""}`}>
        <ol class="flex items-center space-x-2">
          {items.map((item) => (
            <li key={item.id || item.label} class="flex items-center">
              {items.indexOf(item) > 0 && (
                <span class="text-gray-500 mx-2">/</span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span class="text-white font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
