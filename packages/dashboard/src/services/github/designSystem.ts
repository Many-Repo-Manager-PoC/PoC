import type {
  OctokitInstance,
  Repository,
  DesignSystemDependency,
} from "~/types/repository";
import { fetchPackageJson, fetchRepository } from "./repository";

/**
 * Find design system dependencies in package.json
 */
export async function findDesignSystemDependencies(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  defaultBranch: string
): Promise<DesignSystemDependency[]> {
  const packageJson = await fetchPackageJson(
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
            designSystemRepo = await fetchRepository(
              octokit,
              orgName,
              packageName
            );
          } catch (err) {
            console.log(`Could not find repository for ${depName}:`, err);
          }
        }
      } else {
        // Try to find a repository with the same name
        try {
          designSystemRepo = await fetchRepository(octokit, owner, depName);
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
}

/**
 * Find dependent repositories for a design system
 */
export async function findDependentRepositories(
  octokit: OctokitInstance,
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
        const packageJson = await fetchPackageJson(
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
}
