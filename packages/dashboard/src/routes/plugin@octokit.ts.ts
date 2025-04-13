import type { RequestEvent } from "@builder.io/qwik-city";
import { Octokit } from "octokit";

export const onRequest = async (requestEvent: RequestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (session?.user?.accessToken) {
    const octokit = new Octokit({
      auth: session.user.accessToken,
    });

    requestEvent.sharedMap.set("octokit", octokit);
  }
};
