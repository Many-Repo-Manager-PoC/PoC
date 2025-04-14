import type {
  OctokitInstance,
  MonorepoPackage,
} from "~/components/repository/repository";

/**
 * Find monorepo packages in packages directory
 */
export async function findMonorepoPackages(
  octokit: OctokitInstance,
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
                  console.error(`Error parsing package.json at ${path}:`, err);
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
      }
    }

    // If rootContents is not an array, fall back to searching the entire repository
    return await findPackagesInEntireRepo(octokit, owner, repo, defaultBranch);
  } catch (err) {
    console.error("Error checking for packages directory:", err);
    // Fall back to searching the entire repository
    return await findPackagesInEntireRepo(octokit, owner, repo, defaultBranch);
  }
}

/**
 * Find packages in the entire repository (fallback)
 */
async function findPackagesInEntireRepo(
  octokit: OctokitInstance,
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
}
