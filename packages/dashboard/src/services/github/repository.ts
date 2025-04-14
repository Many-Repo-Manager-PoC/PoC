import type {
  OctokitInstance,
  Repository,
  PackageJson,
} from "~/components/repository/repository";

/**
 * Fetch repository details from GitHub
 */
export async function fetchRepository(
  octokit: OctokitInstance,
  owner: string,
  repo: string
): Promise<Repository> {
  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  });
  return data as Repository;
}

/**
 * Fetch package.json content from a repository
 */
export async function fetchPackageJson(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  path = "package.json",
  ref?: string
): Promise<PackageJson | null> {
  try {
    const { data: packageJsonData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ("content" in packageJsonData) {
      const content = atob(packageJsonData.content);
      const packageJson = JSON.parse(content) as PackageJson;
      return packageJson;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching package.json from ${owner}/${repo}:`, err);
    return null;
  }
}
