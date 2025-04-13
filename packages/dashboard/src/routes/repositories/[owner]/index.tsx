import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth.ts";
import { useNavigate, useLocation } from "@builder.io/qwik-city";
import { Octokit } from "octokit";
import { Breadcrumb, Card, CardBody, Avatar, Skeleton } from "~/design-system";
import { RepoCard, type Repository } from "~/components/RepoCard";

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const owner = location.params.owner;

  const repositories = useSignal<Repository[]>([]);
  const filteredRepositories = useSignal<Repository[]>([]);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const selectedTopic = useSignal<string | null>(null);
  const ownerInfo = useSignal<{
    name: string;
    avatar_url: string;
    bio: string | null;
  } | null>(null);

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

  useVisibleTask$(async () => {
    if (!session.value?.user) {
      navigate("/");
      return;
    }

    try {
      const octokit = new Octokit({
        auth: session.value.user.accessToken,
      });

      try {
        const { data: userData } = await octokit.rest.users.getByUsername({
          username: owner,
        });

        ownerInfo.value = {
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
        };
      } catch (userErr) {
        console.error("Error fetching user data:", userErr);
      }

      const { data } = await octokit.rest.repos.listForUser({
        username: owner,
        sort: "updated",
        direction: "desc",
      });

      repositories.value = data as Repository[];
      filteredRepositories.value = repositories.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading.value = false;
    }
  });

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Repositories", href: "/repositories" },
    { label: owner },
  ];

  const skeletonItems = Array(6)
    .fill(0)
    .map((_, i) => ({
      id: `skeleton-${i}`,
    }));

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div class="max-w-7xl mx-auto">
        <Breadcrumb items={breadcrumbItems} class="mb-6" />

        {loading.value ? (
          <Card variant="elevated" class="mb-6">
            <CardBody>
              <div class="flex items-center">
                <Skeleton
                  variant="circular"
                  width="3rem"
                  height="3rem"
                  class="mr-4"
                />
                <div class="flex-1">
                  <Skeleton
                    variant="text"
                    height="1.5rem"
                    width="60%"
                    class="mb-2"
                  />
                  <Skeleton variant="text" height="1rem" width="80%" />
                </div>
              </div>
            </CardBody>
          </Card>
        ) : ownerInfo.value ? (
          <Card variant="elevated" class="mb-6">
            <CardBody>
              <div class="flex items-center">
                <Avatar
                  src={ownerInfo.value.avatar_url}
                  alt={ownerInfo.value.name}
                  size="lg"
                  class="mr-4"
                  fallback={ownerInfo.value.name}
                />
                <div>
                  <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    {ownerInfo.value.name}
                  </h1>
                  {ownerInfo.value.bio && (
                    <p class="text-gray-300 text-sm mt-1">
                      {ownerInfo.value.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <h2 class="text-lg font-bold text-white mb-6">
          Repositories for {owner}
        </h2>

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
                  : "No repositories found for this user."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepositories.value.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                selectedTopic={selectedTopic.value}
                onTopicClick$={handleTopicClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
