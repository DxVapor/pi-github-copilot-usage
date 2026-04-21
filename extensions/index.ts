import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const BASE = "https://api.github.com";

/**
 * Resolve a GitHub token to use for REST API calls.
 *
 * Priority:
 *   1. GITHUB_TOKEN env var (explicit PAT)
 *   2. `gh auth token` (gh CLI session — needs read:org / manage_billing:copilot scope)
 *
 * Note: pi's built-in GitHub Copilot OAuth token is NOT usable here.
 * Pi requests only the `read:user` OAuth scope for Copilot model access,
 * so that token cannot call org-level Copilot billing/usage endpoints.
 */
async function resolveToken(pi: ExtensionAPI, signal?: AbortSignal): Promise<string | null> {
  // 1. Explicit env var
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) return envToken;

  // 2. gh CLI session
  try {
    const result = await pi.exec("gh", ["auth", "token"], { signal, timeout: 5000 });
    const token = result.stdout.trim();
    if (token && result.code === 0) return token;
  } catch {
    // gh not installed or not authed
  }

  return null;
}

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getTokenOrError(
  pi: ExtensionAPI,
  signal?: AbortSignal
): Promise<{ token: string } | { error: string }> {
  const token = await resolveToken(pi, signal);
  if (!token) {
    return {
      error:
        "No GitHub token found. Set GITHUB_TOKEN env var, or run `gh auth login` with read:org / manage_billing:copilot scope.",
    };
  }
  return { token };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "copilot_usage",
    label: "Copilot Usage",
    description:
      "Fetch GitHub Copilot usage statistics for an organization or enterprise. " +
      "Uses GITHUB_TOKEN env var or gh CLI session (needs read:org or manage_billing:copilot scope).",
    promptSnippet: "Fetch GitHub Copilot usage stats for an org or enterprise",
    parameters: Type.Object({
      org: Type.Optional(
        Type.String({ description: "GitHub organization slug (e.g. 'my-org')" })
      ),
      enterprise: Type.Optional(
        Type.String({ description: "GitHub enterprise slug (e.g. 'my-enterprise')" })
      ),
      team: Type.Optional(
        Type.String({ description: "Team slug within the org to scope results" })
      ),
      since: Type.Optional(
        Type.String({ description: "Start date in YYYY-MM-DD format (max 28 days range)" })
      ),
      until: Type.Optional(
        Type.String({ description: "End date in YYYY-MM-DD format" })
      ),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
      const auth = await getTokenOrError(pi, signal);
      if ("error" in auth) {
        return { content: [{ type: "text", text: `Error: ${auth.error}` }], isError: true };
      }

      if (!params.org && !params.enterprise) {
        return {
          content: [{ type: "text", text: "Error: provide either org or enterprise." }],
          isError: true,
        };
      }

      const qs = new URLSearchParams();
      if (params.since) qs.set("since", params.since);
      if (params.until) qs.set("until", params.until);
      const query = qs.toString() ? `?${qs}` : "";

      let endpoint: string;
      if (params.enterprise) {
        endpoint = `/enterprises/${params.enterprise}/copilot/usage${query}`;
      } else if (params.team) {
        endpoint = `/orgs/${params.org}/team/${params.team}/copilot/usage${query}`;
      } else {
        endpoint = `/orgs/${params.org}/copilot/usage${query}`;
      }

      const data = await ghFetch(endpoint, auth.token);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        details: { data },
      };
    },
  });

  pi.registerTool({
    name: "copilot_seats",
    label: "Copilot Seats",
    description:
      "List GitHub Copilot seat assignments for an organization. " +
      "Uses GITHUB_TOKEN env var or gh CLI session (needs manage_billing:copilot scope).",
    promptSnippet: "List GitHub Copilot seat assignments for an org",
    parameters: Type.Object({
      org: Type.String({ description: "GitHub organization slug" }),
      page: Type.Optional(Type.Number({ description: "Page number (default 1)" })),
      per_page: Type.Optional(
        Type.Number({ description: "Results per page, max 100 (default 50)" })
      ),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
      const auth = await getTokenOrError(pi, signal);
      if ("error" in auth) {
        return { content: [{ type: "text", text: `Error: ${auth.error}` }], isError: true };
      }

      const qs = new URLSearchParams();
      qs.set("page", String(params.page ?? 1));
      qs.set("per_page", String(params.per_page ?? 50));

      const data = await ghFetch(
        `/orgs/${params.org}/copilot/billing/seats?${qs}`,
        auth.token
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        details: { data },
      };
    },
  });
}
