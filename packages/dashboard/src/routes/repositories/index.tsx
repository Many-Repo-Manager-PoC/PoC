import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
  sync$,
} from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth.ts";
import { useNavigate } from "@builder.io/qwik-city";
import {
  Breadcrumb,
  Card,
  CardBody,
  Skeleton,
  Button,
  Avatar,
  Collapsible,
} from "~/components/design-system";
import { RepoCard, type Repository } from "~/components/RepoCard";
import { Octokit } from "octokit";

interface GroupedRepositories {
  [owner: string]: {
    avatar_url: string;
    repositories: Repository[];
  };
}

// Hardcoded array of pinned repositories in order of priority
const PINNED_ORGS = ["Many-Repo-Manager-PoC"];

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();

  const repositories = useSignal<Repository[]>([]);
  const filteredRepositories = useSignal<Repository[]>([]);
  const pinnedRepositories = useSignal<GroupedRepositories>({});
  const personalRepositories = useSignal<GroupedRepositories>({});
  const otherRepositories = useSignal<GroupedRepositories>({});
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTopic = useSignal<string | null>(null);

  // Filter repositories by selected topic
  const filterRepositories = $(() => {
    if (!selectedTopic.value) {
      filteredRepositories.value = repositories.value;
      return;
    }
    filteredRepositories.value = repositories.value.filter((repo) =>
      repo.topics.includes(selectedTopic.value || "")
    );
  });

  const handleTopicClick = $((topic: string) => {
    if (selectedTopic.value === topic) {
      selectedTopic.value = null;
    } else {
      selectedTopic.value = topic;
    }
    filterRepositories();
  });

  const handleOwnerClick = $((owner: string) => {
    navigate(`/repositories/${owner}`);
  });

  const categorizeRepositories = $((repos: Repository[]) => {
    const pinned: GroupedRepositories = {};
    const personal: GroupedRepositories = {};
    const other: GroupedRepositories = {};

    const userLogin = session.value?.user?.name || "";

    // Group repositories by owner
    for (const repo of repos) {
      const owner = repo.owner.login;

      // Initialize owner groups if they don't exist
      if (!pinned[owner] && !personal[owner] && !other[owner]) {
        const ownerGroup = {
          avatar_url: "", // Default empty string since avatar_url is not in the type
          repositories: [],
        };

        // Determine which group this owner belongs to
        if (PINNED_ORGS.includes(owner)) {
          pinned[owner] = { ...ownerGroup };
        } else if (owner === userLogin) {
          personal[owner] = { ...ownerGroup };
        } else {
          other[owner] = { ...ownerGroup };
        }
      }

      // Add repository to the appropriate group
      if (PINNED_ORGS.includes(owner)) {
        pinned[owner].repositories.push(repo);
      } else if (owner === userLogin) {
        personal[owner].repositories.push(repo);
      } else {
        other[owner].repositories.push(repo);
      }
    }

    // Sort repositories within each group by updated_at date
    const sortRepositories = (group: GroupedRepositories) => {
      for (const owner in group) {
        group[owner].repositories.sort((a, b) => {
          // If both are pinned, sort by their order in the PINNED_ORGS array
          const aIndex = PINNED_ORGS.indexOf(a.name);
          const bIndex = PINNED_ORGS.indexOf(b.name);

          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }

          // Otherwise sort by updated_at date
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        });
      }
    };

    sortRepositories(pinned);
    sortRepositories(personal);
    sortRepositories(other);

    pinnedRepositories.value = pinned;
    personalRepositories.value = personal;
    otherRepositories.value = other;
  });

  useVisibleTask$(async () => {
    try {
      // We know session is valid at this point (handled by layout)
      // But we'll use optional chaining for type safety
      const accessToken = session.value?.user?.accessToken;
      if (!accessToken) {
        error.value = "Authentication token not available";
        return;
      }

      const octokit = new Octokit({
        auth: accessToken,
      });

      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
      });

      repositories.value = data as Repository[];
      filteredRepositories.value = repositories.value;
      categorizeRepositories(repositories.value);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading.value = false;
    }
  });

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Repositories" },
  ];

  const skeletonItems = Array(6)
    .fill(0)
    .map((_, i) => ({
      id: `skeleton-${i}`,
    }));

  const OwnerTitle = component$<{ owner: string; avatar_url: string }>(
    ({ owner, avatar_url }) => (
      <div class="flex items-center space-x-3">
        <Avatar
          src={avatar_url}
          alt={owner}
          size="md"
          fallback={owner[0].toUpperCase()}
        />
        <h3 class="text-lg font-semibold text-white">{owner}</h3>
      </div>
    )
  );

  const RepositorySection = component$<{
    title: string;
    repositories: GroupedRepositories;
  }>(({ title, repositories }) => {
    if (Object.keys(repositories).length === 0) return null;

    return (
      <div class="mb-8">
        <h3 class="text-lg font-bold text-white mb-4">{title}</h3>
        <div class="space-y-6">
          {Object.entries(repositories).map(([owner, data]) => {
            return (
              <Collapsible
                key={owner}
                title={
                  <OwnerTitle owner={owner} avatar_url={data.avatar_url} />
                }
                subtitle={`${data.repositories.length} repositories`}
                onTitleClick$={() => handleOwnerClick(owner)}
              >
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.repositories.map((repo) => {
                    const repoName = repo.name;
                    return (
                      <div key={repo.id} class="relative">
                        {PINNED_ORGS.includes(repo.name) && (
                          <div class="absolute -top-2 -right-2 z-10 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                            Pinned
                          </div>
                        )}
                        <RepoCard
                          variant="readonly"
                          repo={repo}
                          onClick$={[
                            sync$((evt: Event) => {
                              evt.stopPropagation();
                              evt.preventDefault();
                              console.log("clicked", repoName);
                            }),
                            $(() => {
                              navigate(
                                `/repositories/${repo.owner.login}/${repo.name}`
                              );
                            }),
                          ]}
                          selectedTopic={selectedTopic.value}
                        />
                      </div>
                    );
                  })}
                </div>
              </Collapsible>
            );
          })}
        </div>
      </div>
    );
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div class="max-w-7xl mx-auto">
        <Breadcrumb items={breadcrumbItems} class="mb-6" />

        {/* <h2 class="text-lg font-bold text-white mb-6">Your Repositories</h2> */}

        {loading.value ? (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skeletonItems.map((item) => (
              <Card key={item.id} variant="elevated">
                <CardBody>
                  <Skeleton
                    variant="text"
                    height="1.25rem"
                    width="70%"
                    class="mb-2"
                  />
                  <Skeleton variant="text" height="1rem" class="mb-3" />
                  <div class="flex justify-between">
                    <Skeleton variant="text" height="1rem" width="20%" />
                    <Skeleton variant="text" height="1rem" width="20%" />
                    <Skeleton variant="text" height="1rem" width="30%" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : error.value ? (
          <Card variant="bordered" class="bg-red-900/50 border-red-500">
            <CardBody>
              <p class="font-medium text-sm text-red-200">
                Error loading repositories
              </p>
              <p class="text-xs text-red-200">{error.value}</p>
            </CardBody>
          </Card>
        ) : filteredRepositories.value.length === 0 ? (
          <Card>
            <CardBody>
              <p class="text-gray-300 text-sm text-center">
                {selectedTopic.value
                  ? `No repositories found with topic "${selectedTopic.value}"`
                  : "No repositories found."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            <RepositorySection
              title="Pinned Repositories"
              repositories={pinnedRepositories.value}
            />
            <RepositorySection
              title="Your Repositories"
              repositories={personalRepositories.value}
            />
            <RepositorySection
              title="Other Repositories"
              repositories={otherRepositories.value}
            />
          </>
        )}
      </div>
    </div>
  );
});
