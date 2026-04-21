# pi-github-copilot-usage

A [pi](https://github.com/mariozechner/pi-coding-agent) extension that surfaces GitHub Copilot usage stats and seat assignments directly in your coding agent session.

## Tools

| Tool | Description |
|------|-------------|
| `copilot_usage` | Fetch daily usage metrics for an org, enterprise, or team |
| `copilot_seats` | List seat assignments and last-activity info for an org |

## Requirements

- GitHub Copilot enabled on the org or enterprise
- A GitHub token with **`manage_billing:copilot`** scope (seats + usage) or **`read:org`** (usage only)

> **Note:** Pi's built-in GitHub Copilot OAuth token is **not** reused here — pi only requests `read:user`
> scope for model access, which is insufficient for org-level billing/usage endpoints.

## Installation

```bash
pi install npm:pi-github-copilot-usage
```

Or directly from git:

```bash
pi install git:github.com/DxVapor/pi-github-copilot-usage
```

## Usage

Token resolution order (no config needed if `gh` is already authenticated):

1. `GITHUB_TOKEN` env var
2. `gh` CLI session token (`gh auth login` with the right scopes)

Then ask pi naturally:

```
Show Copilot usage for my-org this week
List Copilot seats in my-org
Show enterprise-wide Copilot usage for my-enterprise since 2024-01-01
```

## API Endpoints Used

- `GET /orgs/{org}/copilot/usage`
- `GET /enterprises/{enterprise}/copilot/usage`
- `GET /orgs/{org}/team/{team}/copilot/usage`
- `GET /orgs/{org}/copilot/billing/seats`

See [GitHub Copilot REST API docs](https://docs.github.com/en/rest/copilot) for scope requirements.

## Contributing

PRs welcome. Open an issue first for larger changes.

## License

MIT
