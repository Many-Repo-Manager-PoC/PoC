import { component$, type PropFunction, type QRL, $ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Tag,
} from "~/components/design-system";

export interface Repository {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  updated_at: string;
  topics: string[];
  owner: {
    login: string;
  };
}

export interface RepoCardProps {
  repo: Repository;
  variant?: "interactive" | "readonly";
  selectedTopic?: string | null;
  onTopicClick$?: PropFunction<(topic: string) => void>;
  onClick$?:
    | PropFunction<(evt: Event) => void>
    | QRL<(evt: Event) => void>
    | QRL<() => void>
    | (QRL<(evt: Event) => void> | QRL<() => void>)[];
}

export const RepoCard = component$<RepoCardProps>(
  ({
    repo,
    variant = "interactive",
    selectedTopic,
    onTopicClick$,
    onClick$,
  }) => {
    const isReadOnly = variant === "readonly";

    return (
      <Card
        onClick$={onClick$}
        variant="elevated"
        class={`flex flex-col h-full ${!isReadOnly ? "hover:shadow-xl transition-shadow" : ""}`}
      >
        <CardBody class="flex-1">
          <h2 class="text-sm font-medium text-white mb-2 break-words">
            {isReadOnly ? (
              repo.name
            ) : (
              <Link
                href={`/repositories/${repo.owner.login}/${repo.name}`}
                class="hover:text-blue-400 transition-colors"
              >
                {repo.name}
              </Link>
            )}
          </h2>
          <p class="text-gray-400 mb-4 line-clamp-2 text-xs min-h-[2.5rem]">
            {repo.description || "No description available"}
          </p>

          {repo.topics.length > 0 && (
            <div class="flex flex-wrap gap-2 mb-4">
              {repo.topics.map((topic) =>
                isReadOnly ? (
                  <Tag key={topic} variant="topic" prefix="#">
                    {topic}
                  </Tag>
                ) : (
                  <button
                    type="button"
                    key={topic}
                    onClick$={() => onTopicClick$?.(topic)}
                    class="focus:outline-none"
                  >
                    <Tag
                      variant="topic"
                      class={
                        selectedTopic === topic ? "ring-1 ring-offset-1" : ""
                      }
                      prefix="#"
                    >
                      {topic}
                    </Tag>
                  </button>
                )
              )}
            </div>
          )}

          <div class="flex justify-between text-xs text-gray-500">
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Stars</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <Tag variant="default">{repo.stargazers_count || 0}</Tag>
            </div>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Forks</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <Tag variant="default">{repo.forks_count || 0}</Tag>
            </div>
            <Tag variant="default">
              Updated: {new Date(repo.updated_at).toLocaleDateString()}
            </Tag>
          </div>
        </CardBody>
        {!isReadOnly && (
          <CardFooter class="flex justify-between">
            <Link href={`/repositories/${repo.owner.login}/${repo.name}`}>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </Link>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Open on GitHub
              </Button>
            </a>
          </CardFooter>
        )}
      </Card>
    );
  }
);

export interface ReadOnlyRepoCardProps {
  repo: Repository;
}

export const ReadOnlyRepoCard = component$<ReadOnlyRepoCardProps>(
  ({ repo }) => {
    return (
      <Card variant="elevated" class="flex flex-col h-full">
        <CardBody class="flex-1">
          <h2 class="text-sm font-medium text-white mb-2 break-words">
            {repo.name}
          </h2>
          <p class="text-gray-400 mb-4 line-clamp-2 text-xs min-h-[2.5rem]">
            {repo.description || "No description available"}
          </p>

          {repo.topics.length > 0 && (
            <div class="flex flex-wrap gap-2 mb-4">
              {repo.topics.map((topic) => (
                <Tag key={topic} variant="topic" prefix="#">
                  {topic}
                </Tag>
              ))}
            </div>
          )}

          <div class="flex justify-between text-xs text-gray-500">
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Stars</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <Tag variant="default">{repo.stargazers_count || 0}</Tag>
            </div>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>Forks</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <Tag variant="default">{repo.forks_count || 0}</Tag>
            </div>
            <Tag variant="default">
              Updated: {new Date(repo.updated_at).toLocaleDateString()}
            </Tag>
          </div>
        </CardBody>
      </Card>
    );
  }
);
