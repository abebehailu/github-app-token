import { env } from "node:process";
import { getOctokit } from "@actions/github";
import { createAppAuth } from "@octokit/auth-app";
import { request } from "@octokit/request";
import ensureError from "ensure-error";

export const fetchInstallationToken = async ({
  appId,
  installationId,
  owner,
  permissions,
  privateKey,
  repo,
}: Readonly<{
  appId: string;
  installationId?: number;
  owner: string;
  permissions?: Record<string, string>;
  privateKey: string;
  repo: string;
}>): Promise<string> => {
  const app = createAppAuth({
    appId,
    privateKey,
    request: request.defaults({
      // GITHUB_API_URL is part of GitHub Actions' built-in environment variables.
      // See https://docs.github.com/en/actions/reference/environment-variables#default-environment-variables.
      baseUrl: env.GITHUB_API_URL,
    }),
  });

  const authApp = await app({ type: "app" });
  const octokit = getOctokit(authApp.token);
  if (installationId === undefined) {
    try {
      ({
        data: { id: installationId },
      } = await octokit.rest.apps.getRepoInstallation({ owner, repo }));
    } catch (error: unknown) {
      throw new Error(
        "Could not get repo installation. Is the app installed on this repo?",
        { cause: ensureError(error) },
      );
    }
  }

  try {
    const { data: installation } =
      await octokit.rest.apps.createInstallationAccessToken({
        installation_id: installationId,
        permissions,
      });
    return installation?.token;
  } catch (error: unknown) {
    throw new Error("Could not create installation access token.", {
      cause: ensureError(error),
    });
  }
};
