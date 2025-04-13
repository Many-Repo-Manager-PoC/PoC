import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LoginButton } from "./LoginButton";

export const Header = component$(() => {
  return (
    <header class="bg-gray-800 shadow-md sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <Link href="/" class="text-2xl font-bold text-white">
              Many Repo Manager
            </Link>
          </div>
          <div class="flex items-center space-x-4">
            <LoginButton />
          </div>
        </div>
      </div>
    </header>
  );
});
