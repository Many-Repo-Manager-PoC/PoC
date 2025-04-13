import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth.ts";
import { useNavigate, Link, useLocation } from "@builder.io/qwik-city";
import { Octokit } from "octokit";

// Use a more flexible type that matches the Octokit response
type Repository = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  language?: string;
  topics?: string[];
  default_branch: string;
  clone_url: string;
  created_at: string;
  pushed_at: string;
  size: number;
  visibility: string;
};

// Extend the User type to include accessToken
declare module "@auth/core/types" {
  interface User {
    accessToken?: string;
  }
}

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const owner = location.params.owner;
  const repoName = location.params.repoName;

  const repository = useSignal<Repository | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    if (!session.value?.user) {
      navigate("/");
      return;
    }

    try {
      // Create a new Octokit instance on the client side
      const octokit = new Octokit({
        auth: session.value.user.accessToken,
      });

      // Fetch repository details
      const { data } = await octokit.rest.repos.get({
        owner,
        repo: repoName,
      });

      repository.value = data as Repository;
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
        {/* Breadcrumbs navigation */}
        <nav class="mb-6 text-sm">
          <ol class="flex items-center space-x-2">
            <li>
              <Link href="/" class="text-gray-400 hover:text-white">
                Home
              </Link>
            </li>
            <li class="text-gray-500">/</li>
            <li>
              <Link href="/repositories" class="text-gray-400 hover:text-white">
                Repositories
              </Link>
            </li>
            <li class="text-gray-500">/</li>
            <li>
              <Link
                href={`/repositories/${owner}`}
                class="text-gray-400 hover:text-white"
              >
                {owner}
              </Link>
            </li>
            <li class="text-gray-500">/</li>
            <li class="text-white font-medium">{repoName}</li>
          </ol>
        </nav>

        {loading.value ? (
          <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : error.value ? (
          <div class="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
            <p class="font-medium text-sm">Error loading repository</p>
            <p class="text-xs">{error.value}</p>
          </div>
        ) : repository.value ? (
          <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
              <div class="flex items-center mb-4">
                {repository.value.owner.avatar_url && (
                  <img
                    src={repository.value.owner.avatar_url}
                    alt={repository.value.owner.login}
                    class="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <h1 class="text-xl font-bold text-white">
                    {repository.value.name}
                  </h1>
                  <p class="text-gray-400 text-sm">
                    by{" "}
                    <Link
                      href={`/repositories/${repository.value.owner.login}`}
                      class="text-blue-400 hover:text-blue-300"
                    >
                      {repository.value.owner.login}
                    </Link>
                  </p>
                </div>
              </div>

              {repository.value.description && (
                <p class="text-gray-300 text-sm mb-4">
                  {repository.value.description}
                </p>
              )}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-700 p-4 rounded-lg">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Repository Details
                  </h2>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Visibility:</span>
                      <span class="text-white capitalize">
                        {repository.value.visibility}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Default Branch:</span>
                      <span class="text-white">
                        {repository.value.default_branch}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Created:</span>
                      <span class="text-white">
                        {new Date(
                          repository.value.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Last Updated:</span>
                      <span class="text-white">
                        {new Date(
                          repository.value.updated_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Last Pushed:</span>
                      <span class="text-white">
                        {new Date(
                          repository.value.pushed_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Size:</span>
                      <span class="text-white">
                        {Math.round(repository.value.size / 1024)} KB
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-700 p-4 rounded-lg">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Repository Stats
                  </h2>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Stars:</span>
                      <span class="text-white">
                        {repository.value.stargazers_count || 0}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Forks:</span>
                      <span class="text-white">
                        {repository.value.forks_count || 0}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Language:</span>
                      <span class="text-white">
                        {repository.value.language || "Not specified"}
                      </span>
                    </div>
                  </div>

                  {repository.value.topics &&
                    repository.value.topics.length > 0 && (
                      <div class="mt-4">
                        <h3 class="text-sm font-medium text-gray-400 mb-2">
                          Topics
                        </h3>
                        <div class="flex flex-wrap gap-2">
                          {repository.value.topics.map((topic) => (
                            <span
                              key={topic}
                              class="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <a
                  href={repository.value.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  View on GitHub
                </a>
                <a
                  href={repository.value.clone_url}
                  class="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Clone Repository
                </a>
                <Link
                  href={`/repositories/${owner}`}
                  class="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Back to {owner}'s Repositories
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div class="bg-gray-800 p-6 rounded-lg text-center">
            <p class="text-gray-300 text-sm">Repository not found.</p>
          </div>
        )}
      </div>
    </div>
  );
});
