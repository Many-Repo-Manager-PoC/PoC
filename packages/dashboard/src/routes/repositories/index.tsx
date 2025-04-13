import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth.ts";
import { useNavigate } from "@builder.io/qwik-city";

interface Repository {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

// Extend the User type to include accessToken
declare module "@auth/core/types" {
  interface User {
    accessToken?: string;
  }
}

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();
  const repositories = useSignal<Repository[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const defaultOrg = "Many-Repo-Manager-PoC";

  useVisibleTask$(async () => {
    if (!session.value?.user) {
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/orgs/${defaultOrg}/repos`,
        {
          headers: {
            Authorization: `Bearer ${session.value.user.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      const data = await response.json();
      repositories.value = data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Repositories for {defaultOrg}
        </h1>

        {loading.value ? (
          <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : error.value ? (
          <div class="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
            <p class="font-medium">Error loading repositories</p>
            <p>{error.value}</p>
          </div>
        ) : repositories.value.length === 0 ? (
          <div class="bg-gray-800 p-6 rounded-lg text-center">
            <p class="text-gray-300">
              No repositories found for this organization.
            </p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.value.map((repo) => (
              <div
                key={repo.id}
                class="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div class="p-6">
                  <h2 class="text-xl font-semibold text-white mb-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="hover:text-blue-400 transition-colors"
                    >
                      {repo.name}
                    </a>
                  </h2>
                  <p class="text-gray-400 mb-4 line-clamp-2">
                    {repo.description || "No description available"}
                  </p>
                  <div class="flex justify-between text-sm text-gray-500">
                    <div class="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <title>Stars</title>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      {repo.stargazers_count}
                    </div>
                    <div class="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <title>Forks</title>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      {repo.forks_count}
                    </div>
                    <div>
                      Updated: {new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
