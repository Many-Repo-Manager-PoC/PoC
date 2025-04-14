import { component$ } from "@builder.io/qwik";
import type { MonorepoPackage } from "~/types/repository";

interface MonorepoPackagesSectionProps {
  packages: MonorepoPackage[];
  loading: boolean;
}

export const MonorepoPackagesSection = component$<MonorepoPackagesSectionProps>(
  ({ packages, loading }) => {
    return (
      <div class="bg-gray-700 p-4 rounded-lg mb-6">
        <h2 class="text-base font-semibold text-white mb-2">
          Monorepo Packages
        </h2>
        <p class="text-gray-400 text-sm mb-3">
          Packages found in this monorepo
        </p>
        {loading ? (
          <div class="flex justify-center items-center h-24">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : packages.length > 0 ? (
          <div class="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.name} class="bg-gray-800 p-4 rounded-md">
                <h3 class="text-blue-400 font-medium mb-2">{pkg.name}</h3>
                <p class="text-gray-400 text-xs mb-3">Path: {pkg.path}</p>

                {/* Dependencies */}
                <div class="mb-3">
                  <h4 class="text-sm font-medium text-gray-300 mb-1">
                    Dependencies
                  </h4>
                  {Object.keys(pkg.dependencies).length > 0 ? (
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(pkg.dependencies).map(
                        ([name, version]) => (
                          <div
                            key={name}
                            class="bg-gray-700 p-2 rounded flex justify-between items-center"
                          >
                            <span class="text-gray-300 text-xs">{name}</span>
                            <span class="text-gray-400 text-xs">{version}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p class="text-gray-400 text-xs">No dependencies</p>
                  )}
                </div>

                {/* Dev Dependencies */}
                <div>
                  <h4 class="text-sm font-medium text-gray-300 mb-1">
                    Dev Dependencies
                  </h4>
                  {Object.keys(pkg.devDependencies).length > 0 ? (
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(pkg.devDependencies).map(
                        ([name, version]) => (
                          <div
                            key={name}
                            class="bg-gray-700 p-2 rounded flex justify-between items-center"
                          >
                            <span class="text-gray-300 text-xs">{name}</span>
                            <span class="text-gray-400 text-xs">{version}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p class="text-gray-400 text-xs">No dev dependencies</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p class="text-gray-400 text-sm">
            No packages found in this monorepo.
          </p>
        )}
      </div>
    );
  }
);
