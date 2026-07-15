# n8n-nodes-fortisiem

An [n8n](https://n8n.io/) community node for [FortiSIEM](https://www.fortinet.com/products/siem/fortisiem) — Fortinet's security information and event management (SIEM) platform for real-time monitoring, analytics, and incident management.

This node lets you interact with the FortiSIEM REST API directly from your n8n workflows: fetch and update incidents, retrieve triggering events, run analytic event queries, manage monitored organizations, and maintain watchlists.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-fortisiem.svg)](https://www.npmjs.com/package/n8n-nodes-fortisiem)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![n8n community node](https://img.shields.io/badge/n8n-community--node-orange)](https://docs.n8n.io/integrations/community-nodes/)

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Credentials](#credentials)
- [Resources & Operations](#resources--operations)
  - [Incident](#incident)
  - [Event](#event)
  - [Organization](#organization)
  - [Watchlist](#watchlist)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Publishing to npm](#publishing-to-npm)
- [Compatibility](#compatibility)
- [License](#license)

---

## Features

- **13 operations** across 4 FortiSIEM resource types
- HTTP Basic authentication with built-in credential testing
- Automatic JSON parsing of FortiSIEM's `text/plain` responses
- Optional "Ignore SSL Issues" toggle for self-signed appliance certificates
- `continueOnFail` support — process remaining items even when one fails
- Compatible with n8n's **AI Tool** interface (`usableAsTool: true`)
- Full TypeScript source with strict mode enabled

---

## Prerequisites

| Requirement | Version |
|---|---|
| n8n | ≥ 1.0.0 |
| FortiSIEM | ≥ 6.x (REST API, `/phoenix/rest`) |
| Node.js | ≥ 18.x |

---

## Installation

### Via n8n UI (recommended)

1. Open n8n → **Settings** → **Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-fortisiem` and confirm

### Via npm (self-hosted)

```bash
npm install n8n-nodes-fortisiem
```

Then restart your n8n instance.

---

## Credentials

Create a **FortiSIEM API** credential with the following fields:

| Field | Description | Example |
|---|---|---|
| **Base URL** | Base URL of your FortiSIEM Supervisor (no trailing slash) | `https://fortisiem.example.com` |
| **Username** | API user as `<organization>/<user>` | `super/admin` |
| **Password** | Account password | `••••••••` |
| **Ignore SSL Issues (Insecure)** | Connect even if the TLS certificate fails validation | `true` for self-signed certs |

The node authenticates every request using HTTP Basic auth. Click **Test connection** on the credential card to verify connectivity — this calls `GET /phoenix/rest/config/Domain` (list monitored organizations).

> **Tip:** Create a dedicated FortiSIEM API user with the minimum required role for your workflows.

---

## Resources & Operations

### Incident

| Operation | Description | Endpoint |
|---|---|---|
| **Fetch** | Fetch incidents by filters, time range, paging and ordering | `POST /phoenix/rest/pub/incident` |
| **Get Many** | Retrieve incidents, optionally filtered by status | `GET /phoenix/rest/pub/incident` |
| **Get Triggering Events** | Retrieve the events that triggered an incident | `GET /phoenix/rest/pub/incident/triggeringEvents` |
| **Update** | Update the external ticket state of an incident | `POST /phoenix/rest/pub/incident/update/{incidentId}` |

**Fetch** filter options: incident IDs, status, `timeFrom`/`timeTo` (epoch ms), `start`, `size`, `orderBy`, `descending`, and the list of `fields` to return.

---

### Event

| Operation | Description | Endpoint |
|---|---|---|
| **Query** | Run an analytic event query defined by an XML report | `POST /phoenix/rest/query/` |

The **Report XML** field is pre-filled with a sample report definition (top events by count) to get you started.

---

### Organization

| Operation | Description | Endpoint |
|---|---|---|
| **Get Many** | Retrieve the list of monitored organizations | `GET /phoenix/rest/config/Domain` |
| **Add** | Add a new organization | `POST /phoenix/rest/organization/add` |
| **Update** | Update an organization | `GET /phoenix/rest/organization/update` |

---

### Watchlist

| Operation | Description | Endpoint |
|---|---|---|
| **Get Many** | Retrieve all watchlists | `GET /phoenix/rest/watchlist/all` |
| **Get By Entry** | Get the watchlist containing a specific entry | `GET /phoenix/rest/watchlist/byEntry/{id}` |
| **Add Entry** | Add an entry to a watchlist | `POST /phoenix/rest/watchlist/addTo` |
| **Create Group** | Create a new watchlist group | `POST /phoenix/rest/watchlist/save` |
| **Delete Entry** | Delete one or more watchlist entries | `POST /phoenix/rest/watchlist/entry/delete` |

---

## Usage Examples

### Poll for new active incidents and alert

1. Add a **Schedule Trigger**
2. Add a **FortiSIEM** node → resource **Incident** → **Fetch**, set **Time From**/**Time To** to your window and **Status** to `0` (active)
3. Add an **IF** node to check severity
4. Add a **Slack** / **Email** node to notify

### Sync a FortiSIEM incident to an external ticketing system

1. **FortiSIEM** → Incident → **Fetch** the incidents you care about
2. Create the ticket in your ITSM tool
3. **FortiSIEM** → Incident → **Update** with the **External Ticket ID** and **External Ticket State** (e.g. `Closed`)

### Investigate an incident's root cause

1. **FortiSIEM** → Incident → **Get Triggering Events**, expression `{{ $json.incidentId }}` as Incident ID
2. Inspect the raw events that generated the incident

---

## Development

### Requirements

- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
git clone https://github.com/kboykov/n8n-nodes-fortisiem.git
cd n8n-nodes-fortisiem
npm install
```

### Build

```bash
npm run build
```

This runs `tsc` followed by `gulp build:icons` to copy the icon into `dist/`.

### Lint & format

```bash
npm run lint
npm run lint:fix   # auto-fix where possible
npm run format     # prettier
```

### Local testing with n8n

```bash
# In this repo
npm link

# In your local n8n installation directory
npm link n8n-nodes-fortisiem
```

Then restart n8n. The FortiSIEM node will appear in the node picker.

### Project structure

```
n8n-nodes-fortisiem/
├── credentials/
│   └── FortiSiemApi.credentials.ts     # Credential definition (Basic auth)
├── nodes/
│   └── FortiSiem/
│       ├── FortiSiem.node.ts            # Main node implementation
│       └── descriptions/
│           ├── IncidentDescription.ts
│           ├── EventDescription.ts
│           ├── OrganizationDescription.ts
│           └── WatchlistDescription.ts
├── icons/
│   └── fortisiem.png
├── .github/workflows/publish.yml        # Automated npm publish on tag
├── gulpfile.js
├── package.json
└── tsconfig.json
```

---

## Publishing to npm

Releases are published to [npm](https://www.npmjs.com/package/n8n-nodes-fortisiem) automatically by the [`Publish`](.github/workflows/publish.yml) GitHub Actions workflow, which triggers on any pushed tag matching `*.*.*` (e.g. `0.1.0`).

The workflow runs `npm ci`, then `npm publish --provenance --access public`, so releases include [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestation.

### One-time setup

1. Create an **automation** access token on npmjs.com (Account → Access Tokens → Generate New Token → *Automation*).
2. In this repository, go to **Settings → Secrets and variables → Actions** and add a secret named **`NPM_TOKEN`** with that token.

### Cutting a release

```bash
# Bump the version in package.json and create a matching git tag
npm version patch   # or: minor / major

# Push the commit and the tag — the tag push triggers the workflow
git push --follow-tags
```

Pushing the tag (for example `v0.1.1` → the workflow matches the `0.1.1` portion) starts the workflow, which builds via the `prepublishOnly` script and publishes to npm.

---

## Compatibility

| Component | Status |
|---|---|
| n8n Nodes API | v1 |
| FortiSIEM REST API | `/phoenix/rest` (FortiSIEM ≥ 6.x) |

---

## License

[MIT](LICENSE)

---

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss any significant changes.
