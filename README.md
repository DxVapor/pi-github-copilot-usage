# pi-github-copilot-usage

A [pi](https://github.com/mariozechner/pi-coding-agent) extension that surfaces GitHub Copilot usage stats and seat assignments directly in your coding agent session.

## Tools

| Tool | Description |
|------|-------------|
| `copilot_usage` | Fetch daily usage metrics for an org, enterprise, or team |
| `copilot_seats` | List seat assignments and last-activity info for an org |

## Requirements

- A GitHub token in `GITHUB_TOKEN` with **`manage_billing:copilot`** scope (or `read:org` for usage-only)
- GitHub Copilot enabled on the org or enterprise

## Installation

```bash
pi install npm:pi-github-copilot-usage
```

Or directly from git:

```bash
pi install git:github.com/DxVapor/pi-github-copilot-usage
```

## Usage

Set your token:

```bash
export GITHUB_TOKEN=ghp_...
```

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
