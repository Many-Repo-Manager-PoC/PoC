import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { Repository } from "~/components/repository/repository";

interface DependentRepositoriesSectionProps {
  repositories: Repository[];
  loading: boolean;
}

export const DependentRepositoriesSection =
  component$<DependentRepositoriesSectionProps>(({ repositories, loading }) => {
    return (
      <div class="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 class="text-base font-semibold text-white mb-2">
          Actual Dependent Repositories
        </h2>
        <p class="text-gray-400 text-sm mb-3">
          Repositories that depend on this design system (based on package.json)
        </p>
        {loading ? (
          <div class="flex justify-center items-center h-24">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : repositories.length > 0 ? (
          <div class="space-y-3">
            {repositories.map((repo) => (
              <div key={repo.id} class="bg-gray-800 p-3 rounded-md">
                <div class="flex justify-between items-center">
                  <div>
                    <Link
                      href={`/repositories/${repo.owner.login}/${repo.name}`}
                      class="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {repo.name}
                    </Link>
                    {repo.description && (
                      <p class="text-gray-400 text-xs mt-1">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div class="flex items-center space-x-2">
                    {repo.topics && repo.topics.length > 0 && (
                      <div class="flex flex-wrap gap-1">
                        {repo.topics.slice(0, 2).map((topic: string) => (
                          <span
                            key={topic}
                            class="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 2 && (
                          <span class="text-gray-500 text-xs">
                            +{repo.topics.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p class="text-gray-400 text-sm">
            No repositories found that depend on this design system.
          </p>
        )}
      </div>
    );
  });
