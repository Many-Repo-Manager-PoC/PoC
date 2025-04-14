import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { DesignSystemDependency } from "~/components/repository/repository";

interface DesignSystemDependenciesSectionProps {
  dependencies: DesignSystemDependency[];
  loading: boolean;
}

export const DesignSystemDependenciesSection =
  component$<DesignSystemDependenciesSectionProps>(
    ({ dependencies, loading }) => {
      return (
        <div class="bg-gray-700 p-4 rounded-lg mb-6">
          <h2 class="text-base font-semibold text-white mb-2">
            Design System Dependencies
          </h2>
          <p class="text-gray-400 text-sm mb-3">
            Design systems that this web app depends on
          </p>
          {loading ? (
            <div class="flex justify-center items-center h-24">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : dependencies.length > 0 ? (
            <div class="space-y-3">
              {dependencies.map((dep) => (
                <div key={dep.name} class="bg-gray-800 p-3 rounded-md">
                  <div class="flex justify-between items-center">
                    <div>
                      {dep.repo ? (
                        <Link
                          href={`/repositories/${dep.repo.owner.login}/${dep.repo.name}`}
                          class="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {dep.name}
                        </Link>
                      ) : (
                        <span class="text-blue-400 font-medium">
                          {dep.name}
                        </span>
                      )}
                      {dep.repo?.description && (
                        <p class="text-gray-400 text-xs mt-1">
                          {dep.repo.description}
                        </p>
                      )}
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="text-gray-400 text-sm">{dep.version}</span>
                      {dep.repo?.topics && dep.repo.topics.length > 0 && (
                        <div class="flex flex-wrap gap-1">
                          {dep.repo.topics.slice(0, 2).map((topic: string) => (
                            <span
                              key={topic}
                              class="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                          {dep.repo.topics.length > 2 && (
                            <span class="text-gray-500 text-xs">
                              +{dep.repo.topics.length - 2}
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
              No design system dependencies found in package.json.
            </p>
          )}
        </div>
      );
    }
  );
