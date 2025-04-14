import {
  component$,
  noSerialize,
  useSignal,
  useVisibleTask$,
  type NoSerialize,
} from "@builder.io/qwik";
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

// Type for monorepo packages
type MonorepoPackage = {
  name: string;
  path: string;
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
};

// Type for design system dependencies
type DesignSystemDependency = {
  name: string;
  version: string;
  repo?: Repository;
};

// GitHub API utility functions
const githubUtils = {
  // Fetch repository details
  async fetchRepository(
    octokit: Octokit,
    owner: string,
    repo: string
  ): Promise<Repository> {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    return data as Repository;
  },

  // Fetch package.json content from a repository
  async fetchPackageJson(
    octokit: Octokit,
    owner: string,
    repo: string,
    path: string = "package.json",
    ref?: string
  ): Promise<{ [key: string]: any } | null> {
    try {
      const { data: packageJsonData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ("content" in packageJsonData) {
        const content = atob(packageJsonData.content);
        return JSON.parse(content);
      }
      return null;
    } catch (err) {
      console.error(`Error fetching package.json from ${owner}/${repo}:`, err);
      return null;
    }
  },

  // Find design system dependencies in package.json
  async findDesignSystemDependencies(
    octokit: Octokit,
    owner: string,
    repo: string,
    defaultBranch: string
  ): Promise<DesignSystemDependency[]> {
    const packageJson = await this.fetchPackageJson(
      octokit,
      owner,
      repo,
      "package.json",
      defaultBranch
    );

    if (!packageJson) {
      return [];
    }

    // Combine dependencies and devDependencies
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Find design system dependencies
    const designSystems: DesignSystemDependency[] = [];

    // Check each dependency
    for (const [depName, depVersion] of Object.entries(allDependencies)) {
      // Check if it's a design system package
      if (
        depName.includes("design-system") ||
        depName.includes("ui-kit") ||
        depName.includes("component-library")
      ) {
        // Try to find the repository for this design system
        let designSystemRepo: Repository | undefined;

        // Check if it's a scoped package from the same organization
        if (depName.startsWith("@") && depName.includes("/")) {
          const [scope, packageName] = depName.split("/");
          const orgName = scope.substring(1); // Remove the @ symbol

          // If it's from the same organization, try to find the repo
          if (orgName === owner) {
            try {
              const { data: repoData } = await octokit.rest.repos.get({
                owner: orgName,
                repo: packageName,
              });
              designSystemRepo = repoData as Repository;
            } catch (err) {
              console.log(`Could not find repository for ${depName}:`, err);
            }
          }
        } else {
          // Try to find a repository with the same name
          try {
            const { data: repoData } = await octokit.rest.repos.get({
              owner,
              repo: depName,
            });
            designSystemRepo = repoData as Repository;
          } catch (err) {
            console.log(`Could not find repository for ${depName}:`, err);
          }
        }

        designSystems.push({
          name: depName,
          version: depVersion as string,
          repo: designSystemRepo,
        });
      }
    }

    return designSystems;
  },

  // Find dependent repositories for a design system
  async findDependentRepositories(
    octokit: Octokit,
    owner: string,
    repoName: string
  ): Promise<Repository[]> {
    try {
      // Fetch all repositories for the authenticated user
      const { data: userRepos } =
        await octokit.rest.repos.listForAuthenticatedUser({
          sort: "updated",
          direction: "desc",
        });

      // Filter repositories that might depend on this design system
      const potentialDependents = userRepos.filter(
        (repo) => repo.name !== repoName && repo.owner.login === owner
      );

      // Check package.json files for actual dependencies
      const actualDependents: Repository[] = [];

      for (const repo of potentialDependents) {
        try {
          // Try to fetch package.json from the repository
          const packageJson = await this.fetchPackageJson(
            octokit,
            repo.owner.login,
            repo.name,
            "package.json",
            repo.default_branch || "main"
          );

          if (packageJson) {
            // Check if this repository depends on our design system
            const dependencies = {
              ...packageJson.dependencies,
              ...packageJson.devDependencies,
            };

            // Check if any dependency matches our design system
            const dependsOnDesignSystem = Object.keys(dependencies).some(
              (dep) => {
                // Check for exact match or scoped package match
                return (
                  dep === repoName ||
                  dep === `@${owner}/${repoName}` ||
                  dep.includes(repoName)
                );
              }
            );

            if (dependsOnDesignSystem) {
              actualDependents.push(repo as Repository);
            }
          }
        } catch (err) {
          // Skip repositories without package.json or with errors
          console.log(`Could not check dependencies for ${repo.name}:`, err);
        }
      }

      return actualDependents;
    } catch (err) {
      console.error("Error fetching dependent repositories:", err);
      return [];
    }
  },

  // Find monorepo packages in packages directory
  async findMonorepoPackages(
    octokit: Octokit,
    owner: string,
    repo: string,
    defaultBranch: string
  ): Promise<MonorepoPackage[]> {
    try {
      // First, check if there's a packages directory
      const { data: rootContents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: "",
        ref: defaultBranch,
      });

      if (Array.isArray(rootContents)) {
        const packagesDir = rootContents.find(
          (item) => item.name === "packages" && item.type === "dir"
        );

        if (packagesDir) {
          // Function to search for package.json files in packages directory
          const findPackageJsonFiles = async (
            path = "packages"
          ): Promise<MonorepoPackage[]> => {
            try {
              // Get the contents of the current directory
              const { data: contents } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref: defaultBranch,
              });

              const packages: MonorepoPackage[] = [];

              // If the response is an array, it's a directory
              if (Array.isArray(contents)) {
                // Check if there's a package.json in this directory
                const packageJsonFile = contents.find(
                  (item) => item.name === "package.json"
                );
                if (
                  packageJsonFile &&
                  "content" in packageJsonFile &&
                  packageJsonFile.content
                ) {
                  try {
                    const content = atob(packageJsonFile.content);
                    const packageJson = JSON.parse(content);

                    // Only include if it has a name (to avoid root package.json)
                    if (packageJson.name) {
                      packages.push({
                        name: packageJson.name,
                        path: path,
                        dependencies: packageJson.dependencies || {},
                        devDependencies: packageJson.devDependencies || {},
                      });
                    }
                  } catch (err) {
                    console.error(
                      `Error parsing package.json at ${path}:`,
                      err
                    );
                  }
                }

                // Recursively search subdirectories
                for (const item of contents) {
                  if (item.type === "dir" && !item.name.startsWith(".")) {
                    const subPath = `${path}/${item.name}`;
                    const subPackages = await findPackageJsonFiles(subPath);
                    packages.push(...subPackages);
                  }
                }
              }

              return packages;
            } catch (err) {
              console.error(`Error searching directory ${path}:`, err);
              return [];
            }
          };

          // Start the search from the packages directory
          return await findPackageJsonFiles();
        } else {
          // If no packages directory is found, fall back to searching the entire repo
          console.log(
            "No packages directory found, searching entire repository"
          );
          return await this.findPackagesInEntireRepo(
            octokit,
            owner,
            repo,
            defaultBranch
          );
        }
      }

      // If rootContents is not an array, fall back to searching the entire repository
      return await this.findPackagesInEntireRepo(
        octokit,
        owner,
        repo,
        defaultBranch
      );
    } catch (err) {
      console.error("Error checking for packages directory:", err);
      // Fall back to searching the entire repository
      return await this.findPackagesInEntireRepo(
        octokit,
        owner,
        repo,
        defaultBranch
      );
    }
  },

  // Find packages in the entire repository (fallback)
  async findPackagesInEntireRepo(
    octokit: Octokit,
    owner: string,
    repo: string,
    defaultBranch: string
  ): Promise<MonorepoPackage[]> {
    const findPackageJsonFiles = async (
      path = ""
    ): Promise<MonorepoPackage[]> => {
      try {
        // Get the contents of the current directory
        const { data: contents } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: defaultBranch,
        });

        const packages: MonorepoPackage[] = [];

        // If the response is an array, it's a directory
        if (Array.isArray(contents)) {
          // Check if there's a package.json in this directory
          const packageJsonFile = contents.find(
            (item) => item.name === "package.json"
          );
          if (
            packageJsonFile &&
            "content" in packageJsonFile &&
            packageJsonFile.content
          ) {
            try {
              const content = atob(packageJsonFile.content);
              const packageJson = JSON.parse(content);

              // Only include if it has a name (to avoid root package.json)
              if (packageJson.name) {
                packages.push({
                  name: packageJson.name,
                  path: path || "/",
                  dependencies: packageJson.dependencies || {},
                  devDependencies: packageJson.devDependencies || {},
                });
              }
            } catch (err) {
              console.error(`Error parsing package.json at ${path}:`, err);
            }
          }

          // Recursively search subdirectories
          for (const item of contents) {
            if (item.type === "dir" && !item.name.startsWith(".")) {
              const subPath = path ? `${path}/${item.name}` : item.name;
              const subPackages = await findPackageJsonFiles(subPath);
              packages.push(...subPackages);
            }
          }
        }

        return packages;
      } catch (err) {
        console.error(`Error searching directory ${path}:`, err);
        return [];
      }
    };

    // Start the search from the root
    return await findPackageJsonFiles();
  },
};

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const owner = location.params.owner;
  const repoName = location.params.repoName;

  const repository = useSignal<Repository | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const dependentRepos = useSignal<Repository[]>([]);
  const loadingDependents = useSignal(false);
  const packageDependencies = useSignal<{ [key: string]: string }>({});
  const loadingPackageDeps = useSignal(false);
  const ownerRepositories = useSignal<Repository[]>([]);
  const loadingOwnerRepos = useSignal(false);
  const monorepoPackages = useSignal<MonorepoPackage[]>([]);
  const loadingMonorepo = useSignal(false);
  const designSystemDeps = useSignal<DesignSystemDependency[]>([]);
  const loadingDesignSystemDeps = useSignal(false);
  const octokit = useSignal<NoSerialize<Octokit> | null>(null);
  const topics = useSignal<string[]>([]);

  useVisibleTask$(async ({ track }) => {
    track(() => location.params.owner);
    track(() => location.params.repoName);

    octokit.value = noSerialize(
      new Octokit({
        auth: session.value?.user?.accessToken,
      })
    );
  });
  useVisibleTask$(async ({ track }) => {
    track(() => location.params.owner);
    track(() => location.params.repoName);
    track(() => octokit.value);

    if (!octokit.value) {
      return;
    }

    repository.value = await githubUtils.fetchRepository(
      octokit.value,
      owner,
      repoName
    );

    // Update topics signal when repository changes
    topics.value = repository.value?.topics || [];
  });

  // Add a separate useVisibleTask$ to handle navigation between repositories
  useVisibleTask$(({ track }) => {
    // Track owner and repoName changes
    track(() => location.params.owner);
    track(() => location.params.repoName);

    // Reset topics when navigating to a new repository
    // This ensures the UI updates properly when switching between repositories
    topics.value = [];
  });

  useVisibleTask$(async ({ track }) => {
    track(() => location.params.owner);
    track(() => location.params.repoName);
    track(() => octokit.value);
    track(() => topics.value);

    if (!octokit.value) {
      return;
    }

    try {
      // Reset all loading states and data when topics change
      loadingDependents.value = false;
      loadingPackageDeps.value = false;
      loadingDesignSystemDeps.value = false;
      loadingMonorepo.value = false;

      // Use the topics signal directly
      const currentTopics = topics.value;

      // If this is a design-system repository, fetch dependent repositories
      if (currentTopics.includes("design-system")) {
        loadingDependents.value = true;
        try {
          dependentRepos.value = await githubUtils.findDependentRepositories(
            octokit.value,
            owner,
            repoName
          );
        } catch (depErr) {
          console.error("Error fetching dependent repositories:", depErr);
        } finally {
          loadingDependents.value = false;
        }
      }

      // If this is a package-repo, fetch its dependencies from package.json
      if (currentTopics.includes("package-repo")) {
        loadingPackageDeps.value = true;
        try {
          const packageJson = await githubUtils.fetchPackageJson(
            octokit.value,
            owner,
            repoName,
            "package.json",
            repository.value?.default_branch || "main"
          );

          if (packageJson) {
            // Combine dependencies and devDependencies
            packageDependencies.value = {
              ...packageJson.dependencies,
              ...packageJson.devDependencies,
            };
          }
        } catch (err) {
          console.error("Error fetching package.json:", err);
        } finally {
          loadingPackageDeps.value = false;
        }
      }

      // If this is a web-app, find design system dependencies
      if (currentTopics.includes("web-app")) {
        loadingDesignSystemDeps.value = true;
        try {
          designSystemDeps.value =
            await githubUtils.findDesignSystemDependencies(
              octokit.value,
              owner,
              repoName,
              repository.value?.default_branch || "main"
            );
        } catch (err) {
          console.error("Error fetching design system dependencies:", err);
        } finally {
          loadingDesignSystemDeps.value = false;
        }
      }

      // If this is a mono-repo, search for package.json files in packages/ folders
      if (currentTopics.includes("mono-repo")) {
        loadingMonorepo.value = true;
        try {
          monorepoPackages.value = await githubUtils.findMonorepoPackages(
            octokit.value,
            owner,
            repoName,
            repository.value?.default_branch || "main"
          );
        } catch (err) {
          console.error("Error searching for monorepo packages:", err);
        } finally {
          loadingMonorepo.value = false;
        }
      }
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
                    <a
                      href={`/repositories/${repository.value.owner.login}`}
                      class="text-blue-400 hover:text-blue-300"
                    >
                      {repository.value.owner.login}
                    </a>
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

                  {topics.value && topics.value.length > 0 && (
                    <div class="mt-4">
                      <h3 class="text-sm font-medium text-gray-400 mb-2">
                        Topics
                      </h3>
                      <div class="flex flex-wrap gap-2">
                        {topics.value.map((topic) => (
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

              {/* Monorepo Packages Section - Only shown for mono-repo repositories */}
              {topics.value?.includes("mono-repo") && (
                <div class="bg-gray-700 p-4 rounded-lg mb-6">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Monorepo Packages
                  </h2>
                  <p class="text-gray-400 text-sm mb-3">
                    Packages found in this monorepo
                  </p>
                  {loadingMonorepo.value ? (
                    <div class="flex justify-center items-center h-24">
                      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : monorepoPackages.value.length > 0 ? (
                    <div class="space-y-4">
                      {monorepoPackages.value.map((pkg) => (
                        <div key={pkg.name} class="bg-gray-800 p-4 rounded-md">
                          <h3 class="text-blue-400 font-medium mb-2">
                            {pkg.name}
                          </h3>
                          <p class="text-gray-400 text-xs mb-3">
                            Path: {pkg.path}
                          </p>

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
                                      <span class="text-gray-300 text-xs">
                                        {name}
                                      </span>
                                      <span class="text-gray-400 text-xs">
                                        {version}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p class="text-gray-400 text-xs">
                                No dependencies
                              </p>
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
                                      <span class="text-gray-300 text-xs">
                                        {name}
                                      </span>
                                      <span class="text-gray-400 text-xs">
                                        {version}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p class="text-gray-400 text-xs">
                                No dev dependencies
                              </p>
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
              )}

              {/* Package Dependencies Section - Only shown for package-repo repositories */}
              {topics.value?.includes("package-repo") && (
                <div class="bg-gray-700 p-4 rounded-lg mb-6">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Package Dependencies
                  </h2>
                  {loadingPackageDeps.value ? (
                    <div class="flex justify-center items-center h-24">
                      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : Object.keys(packageDependencies.value).length > 0 ? (
                    <div class="space-y-2">
                      {Object.entries(packageDependencies.value).map(
                        ([name, version]) => (
                          <div
                            key={name}
                            class="bg-gray-800 p-3 rounded-md flex justify-between items-center"
                          >
                            <span class="text-blue-400 font-medium">
                              {name}
                            </span>
                            <span class="text-gray-400 text-sm">{version}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p class="text-gray-400 text-sm">
                      No dependencies found in package.json.
                    </p>
                  )}
                </div>
              )}

              {/* Dependent Repositories Section - Only shown for design-system repositories */}
              {topics.value?.includes("design-system") && (
                <div class="bg-gray-700 p-4 rounded-lg mb-6">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Actual Dependent Repositories
                  </h2>
                  <p class="text-gray-400 text-sm mb-3">
                    Repositories that depend on this design system (based on
                    package.json)
                  </p>
                  {loadingDependents.value ? (
                    <div class="flex justify-center items-center h-24">
                      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : dependentRepos.value.length > 0 ? (
                    <div class="space-y-3">
                      {dependentRepos.value.map((repo) => (
                        <div key={repo.id} class="bg-gray-800 p-3 rounded-md">
                          <div class="flex justify-between items-center">
                            <div>
                              <a
                                href={`/repositories/${repo.owner.login}/${repo.name}`}
                                class="text-blue-400 hover:text-blue-300 font-medium"
                              >
                                {repo.name}
                              </a>
                              {repo.description && (
                                <p class="text-gray-400 text-xs mt-1">
                                  {repo.description}
                                </p>
                              )}
                            </div>
                            <div class="flex items-center space-x-2">
                              {repo.topics && repo.topics.length > 0 && (
                                <div class="flex flex-wrap gap-1">
                                  {repo.topics.slice(0, 2).map((topic) => (
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
              )}

              {/* Design System Dependencies Section - Only shown for web-app repositories */}
              {topics.value?.includes("web-app") && (
                <div class="bg-gray-700 p-4 rounded-lg mb-6">
                  <h2 class="text-base font-semibold text-white mb-2">
                    Design System Dependencies
                  </h2>
                  <p class="text-gray-400 text-sm mb-3">
                    Design systems that this web app depends on
                  </p>
                  {loadingDesignSystemDeps.value ? (
                    <div class="flex justify-center items-center h-24">
                      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                    </div>
                  ) : designSystemDeps.value.length > 0 ? (
                    <div class="space-y-3">
                      {designSystemDeps.value.map((dep) => (
                        <div key={dep.name} class="bg-gray-800 p-3 rounded-md">
                          <div class="flex justify-between items-center">
                            <div>
                              {dep.repo ? (
                                <a
                                  href={`/repositories/${dep.repo.owner.login}/${dep.repo.name}`}
                                  class="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                  {dep.name}
                                </a>
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
                              <span class="text-gray-400 text-sm">
                                {dep.version}
                              </span>
                              {dep.repo?.topics &&
                                dep.repo.topics.length > 0 && (
                                  <div class="flex flex-wrap gap-1">
                                    {dep.repo.topics
                                      .slice(0, 2)
                                      .map((topic) => (
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
              )}

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
