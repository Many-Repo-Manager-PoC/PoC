import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useSession } from "~/routes/plugin@auth.ts";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
  const session = useSession();
  const isAuthenticated = !!session.value?.user;
  const userName =
    session.value?.user?.name || session.value?.user?.email || "User";

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      {isAuthenticated ? (
        <div class="text-center">
          <h1 class="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Welcome, {userName}!
          </h1>
          <p class="text-xl text-gray-300 mb-8 max-w-2xl">
            You're now logged in to Many Repo Manager. You can manage your
            GitHub repositories from here.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/repositories"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View Repositories
            </Link>
            <button
              type="button"
              class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      ) : (
        <div class="text-center">
          <h1 class="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Many Repo Manager
          </h1>
          <p class="text-xl text-gray-300 mb-8 max-w-2xl">
            Manage multiple GitHub repositories with ease. Organize, track, and
            collaborate on your projects all in one place.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
            </button>
            <button
              type="button"
              class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      )}

      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div class="text-blue-400 text-2xl mb-4">📊</div>
          <h3 class="text-xl font-semibold text-white mb-2">
            Repository Analytics
          </h3>
          <p class="text-gray-400">
            Get insights into your repositories with detailed analytics and
            metrics.
          </p>
        </div>

        <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div class="text-purple-400 text-2xl mb-4">🔄</div>
          <h3 class="text-xl font-semibold text-white mb-2">
            Sync Automatically
          </h3>
          <p class="text-gray-400">
            Keep all your repositories in sync with automatic updates and
            notifications.
          </p>
        </div>

        <div class="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div class="text-green-400 text-2xl mb-4">👥</div>
          <h3 class="text-xl font-semibold text-white mb-2">
            Team Collaboration
          </h3>
          <p class="text-gray-400">
            Collaborate with your team members across multiple repositories
            seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Many Repo Manager",
  meta: [
    {
      name: "description",
      content: "Manage multiple GitHub repositories with ease",
    },
  ],
};
