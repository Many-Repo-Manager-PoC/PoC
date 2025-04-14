import { component$ } from "@builder.io/qwik";

interface PackageDependenciesSectionProps {
  dependencies: { [key: string]: string };
  loading: boolean;
}

export const PackageDependenciesSection =
  component$<PackageDependenciesSectionProps>(({ dependencies, loading }) => {
    return (
      <div class="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 class="text-base font-semibold text-white mb-2">
          Package Dependencies
        </h2>
        {loading ? (
          <div class="flex justify-center items-center h-24">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : Object.keys(dependencies).length > 0 ? (
          <div class="space-y-2">
            {Object.entries(dependencies).map(([name, version]) => (
              <div
                key={name}
                class="bg-gray-800 p-3 rounded-md flex justify-between items-center"
              >
                <span class="text-blue-400 font-medium">{name}</span>
                <span class="text-gray-400 text-sm">{version}</span>
              </div>
            ))}
          </div>
        ) : (
          <p class="text-gray-400 text-sm">
            No dependencies found in package.json.
          </p>
        )}
      </div>
    );
  });
