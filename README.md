# n8n-nodes-fortisiem

An [n8n](https://n8n.io/) community node for [FortiSIEM](https://www.fortinet.com/products/siem/fortisiem) — Fortinet's security information and event management (SIEM) platform for real-time monitoring, analytics, and incident management.

This node wraps the **FortiSIEM 7.5.1 REST API**, letting you fetch and update incidents, run event & CMDB queries, manage cases, watchlists and lookup tables, look up context & reputation, run Osquery on agents, drive device discovery, and monitor cluster health — all from your n8n workflows.

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
- [Usage Notes](#usage-notes)
- [Development](#development)
- [Publishing to npm](#publishing-to-npm)
- [Compatibility](#compatibility)
- [License](#license)

---

## Features

- **72 operations** across **16 resource types**
- Two authentication methods: **HTTP Basic** and **OAuth Access Token** (Client ID / Client Secret → bearer, with automatic token caching & refresh)
- Automatic JSON parsing of FortiSIEM's `text/plain` responses
- Async query helpers that submit → poll → return results in a single step (event queries, incident triggering events)
- Multipart uploads for case attachments and lookup-table CSV imports
- Rich field metadata (enums, examples, descriptions) sourced directly from the official OpenAPI specs (see [`api_docs/`](api_docs))
- Optional "Ignore SSL Issues" toggle for self-signed appliance certificates
- `continueOnFail` support and compatibility with n8n's **AI Tool** interface (`usableAsTool: true`)

---

## Prerequisites

| Requirement | Version |
|---|---|
| n8n | ≥ 1.0.0 |
| FortiSIEM | 7.5.x (REST API under `/phoenix/rest`) |
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

Create a **FortiSIEM API** credential and pick an authentication method:

| Field | Description |
|---|---|
| **Base URL** | Base URL of your FortiSIEM Supervisor or Manager, e.g. `https://fortisiem.example.com` (no trailing slash) |
| **Authentication** | `Basic Auth` or `Access Token (OAuth Client Credentials)` |
| **Username** / **Password** | *(Basic Auth)* API user as `<organization>/<user>`, e.g. `super/admin` |
| **Client ID** / **Client Secret** | *(Access Token)* Credentials generated in FortiSIEM (Admin > Settings > API Token) |
| **Ignore SSL Issues (Insecure)** | Enable for self-signed certificates |

With **Access Token** auth the node exchanges the Client ID/Secret at `/phoenix/rest/pub/security/oauth/token` for a bearer token and caches it until shortly before it expires.

---

## Resources & Operations

### Incident
Fetch (advanced filters), Get Many (time window or ID list), Get Page, Update, Start Triggering Events Query, Get Triggering Events Progress / Result, and **Get Triggering Events** (runs start → poll → result automatically).

### Event
Submit Query, Get Query Progress, Get Query Results, **Run Query** (submit → poll → results), and Submit Archive Query (report XML against archive storage). Supports v2 simple search and ClickHouse SQL advanced search.

### Case
Create, Update, Get Analysts, Add Attachment (binary upload).

### CMDB Query
Query CMDB objects (Device, User, Rule, Report, Case, Risk, …) and Get Schema for a table.

### Device
List, Delete, List Monitored, Update Monitoring (XML).

### Device Maintenance
Create/Update Schedule, Delete Schedule (XML).

### Discovery
Discover devices, Get Status, Update Credential (XML).

### Organization
Get Many, Add, Update (XML), Delete.

### Context
Get by Hostname, Get by IP, Get by User.

### Reputation
Check Domain, Hash, IP, URL.

### Lookup Table
List, Create, Delete, Get Data, Update Data, Delete Data, Import (CSV upload), Get Import Status.

### Osquery
Run, Get Progress, Get Result.

### Agent
Get Status (Windows/Linux agents, v3).

### Health
Get Full Health, Get Instance Health, Get Health Summary.

### Watchlist
Get Many, Get Summary, Get, Get Entry, Get Containing Watchlist, Get by Value, Get Count, Get Entries by Type (IP/Hash/Domain), Create, Add Entries, Delete Watchlists, Delete Entries, Update Entry, Set Entry Active / Count / Last Seen.

### Worker
Get Event Workers, Get Queue State.

---

## Usage Notes

- **Timestamps:** date/time fields in the UI are converted automatically to the units FortiSIEM expects (epoch milliseconds in most places, epoch seconds for case-analyst statistics).
- **Incident triggering events:** the time window cannot exceed 24 hours.
- **XML endpoints** (Organization add/update, Device monitoring, Discovery, Device Maintenance) accept the FortiSIEM XML payloads; each field is pre-filled with a template you can adapt.
- **Advanced JSON bodies** (Event query, Lookup Table create, Watchlist create) accept raw JSON with sensible sample defaults.
- FortiSIEM often returns `text/plain`; the node parses JSON automatically and returns non-JSON output (e.g. one-per-line watchlist exports) under a `data` property.

The complete OpenAPI reference used to build this node is included in [`api_docs/`](api_docs).

---

## Development

```bash
git clone https://github.com/kboykov/n8n-nodes-fortisiem.git
cd n8n-nodes-fortisiem
npm install
npm run build      # tsc + copy icons
npm run lint       # eslint
npm run lint:fix
npm run format     # prettier
```

Local testing with n8n:

```bash
# In this repo
npm link
# In your local n8n installation directory
npm link n8n-nodes-fortisiem
```

### Project structure

```
n8n-nodes-fortisiem/
├── credentials/
│   └── FortiSiemApi.credentials.ts
├── nodes/
│   └── FortiSiem/
│       ├── FortiSiem.node.ts          # description assembly + execute router
│       ├── GenericFunctions.ts        # auth, token cache, request helpers
│       └── descriptions/              # one file per resource
├── icons/fortisiem.png
├── api_docs/                          # official FortiSIEM 7.5.1 OpenAPI specs
├── .github/workflows/publish.yml      # automated npm publish on tag
├── gulpfile.js
├── package.json
└── tsconfig.json
```

---

## Publishing to npm

Releases are published to [npm](https://www.npmjs.com/package/n8n-nodes-fortisiem) automatically by the [`Publish`](.github/workflows/publish.yml) GitHub Actions workflow, which triggers on any pushed tag matching `*.*.*`.

The workflow runs `npm ci`, then `npm publish --provenance --access public`, so releases include [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestation.

### One-time setup

1. Create an **automation** access token on npmjs.com (Account → Access Tokens → Generate New Token → *Automation*).
2. In this repository, add it as an Actions secret named **`NPM_TOKEN`** (Settings → Secrets and variables → Actions).

### Cutting a release

```bash
npm version patch   # or: minor / major
git push --follow-tags
```

Pushing the tag starts the workflow, which builds via `prepublishOnly` and publishes to npm.

---

## Compatibility

| Component | Status |
|---|---|
| n8n Nodes API | v1 |
| FortiSIEM REST API | 7.5.1 (`/phoenix/rest`) |

---

## License

[MIT](LICENSE)

---

## Contributing

Issues and pull requests are welcome. Please open an issue first to discuss any significant changes.
