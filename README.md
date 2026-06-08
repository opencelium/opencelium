<div align="center">

# OpenCelium — Open Source API Hub

**Connect your applications. Let them talk.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-opencelium.io-brightgreen.svg)](https://www.opencelium.io)
[![Documentation](https://img.shields.io/badge/docs-docs.opencelium.io-orange.svg)](https://docs.opencelium.io)
[![Maintained by becon GmbH](https://img.shields.io/badge/maintained%20by-becon%20GmbH-1f4e79.svg)](https://www.becon.eu)

</div>

---

OpenCelium easily connects applications with each other so that they can communicate
seamlessly and exchange data — similar to how the mycelium network in the forest floor
allows trees to communicate with one another. With OpenCelium, writing and updating API
integrations becomes a simple **drag-and-drop** exercise for the IT administrator on a
convenient web front end, instead of a maintenance-heavy collection of custom scripts.

Visit **[opencelium.io](https://www.opencelium.io)** for more details, and the full
documentation at **[docs.opencelium.io](https://docs.opencelium.io)**.

## Table of Contents

- [Why OpenCelium?](#why-opencelium)
- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [First Steps](#first-steps)
- [Updating](#updating)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support & Community](#support--community)
- [License](#license)
- [About](#about)

## Why OpenCelium?

Modern IT landscapes are a patchwork of monitoring tools, ticketing systems, CMDBs,
inventory platforms and cloud services — each with its own API. Connecting them usually
means writing brittle, undocumented glue scripts that only one person understands and
that break on the next API change.

OpenCelium replaces that with a maintainable, visual integration layer:

- **No more script sprawl** — model integrations once, visually, and reuse them.
- **Transparent** — every connection is documented by design and visible to the whole team.
- **Maintainable** — adapt to API changes by editing a connection, not by debugging code.
- **Self-hosted** — your data and credentials stay in your own infrastructure.

## Features

- **Visual Connection Editor** — build integrations with drag-and-drop instead of code.
- **REST API support** — connect any application that exposes a web API.
- **Chained API calls** — orchestrate multi-step request/response flows across systems.
- **Flexible field mapping** — map data between systems, including N-to-1 field mappings
  and transformations.
- **Scheduling** — run connections on a schedule or trigger them on demand.
- **Monitoring & notifications** — keep track of integration runs and get alerted on failures.
- **User & access management** — role-based access for teams.
- **Microservice architecture** — components scale and deploy independently.
- **Self-hosted & open source** — full control over deployment and data.

<!-- VERIFY: confirm this feature list matches the current shipped feature set before publishing. -->

## How It Works

1. **Register your applications** in OpenCelium together with their API endpoints and
   authentication.
2. **Create a connection** in the visual editor that describes how data flows from a
   source system to one or more target systems.
3. **Map the fields** between the systems and define the request/response chain.
4. **Schedule or trigger** the connection and let OpenCelium handle the execution.
5. **Monitor** runs, inspect results and get notified about problems.

## Architecture

OpenCelium is built as a set of cooperating services:

| Component   | Responsibility                                              |
|-------------|-------------------------------------------------------------|
| Frontend    | Web UI, including the drag-and-drop Connection Editor        |
| Backend     | Connection execution engine, scheduling, user management     |
| Database    | Persistence for connections, applications, users and history |

<!-- VERIFY: confirm the technology stack below against the current codebase. -->
> **Tech stack (please verify):** React-based frontend, backend service layer, and a
> document database for persistence. Replace this note with the exact stack and versions.

## Quick Start

> The fastest way to try OpenCelium locally is with Docker.

```bash
# 1. Clone the repository
git clone https://github.com/OpenCelium/OpenCelium.git
cd OpenCelium

# 2. Start OpenCelium
# <!-- VERIFY: replace with the actual start command for your distribution -->
docker compose up -d

# 3. Open the UI in your browser
#    http://localhost:8080   <!-- VERIFY: confirm default port -->
```

Default credentials and ports are described in the
[documentation](https://docs.opencelium.io). **Change the default password immediately
after the first login.**

## Prerequisites

<!-- VERIFY: confirm minimum versions and resource requirements. -->

- **Docker** and **Docker Compose** (for the containerised installation)
- Recommended minimum: 2 CPU cores, 4 GB RAM, 10 GB free disk space
- A modern web browser (Chrome, Firefox, Edge)

For bare-metal / manual installation requirements, see the
[installation guide](https://docs.opencelium.io).

## Installation

OpenCelium can be installed in several ways. The Docker-based setup is recommended for
most users.

### Docker (recommended)

```bash
git clone https://github.com/OpenCelium/OpenCelium.git
cd OpenCelium
# <!-- VERIFY: exact command / compose file / install script -->
docker compose up -d
```

### Manual installation

A manual / production installation (separate frontend, backend and database, reverse
proxy, TLS, etc.) is described in detail in the
**[installation documentation](https://docs.opencelium.io)**.

## Configuration

Core settings are provided via environment variables (typically in a `.env` file) and/or
the compose file.

<!-- VERIFY: replace the placeholders below with the real, documented variables. -->

| Variable            | Description                                  | Default          |
|---------------------|----------------------------------------------|------------------|
| `OC_PORT`           | Port the web UI is served on                 | `8080`           |
| `OC_DB_HOST`        | Database host                                | `db`             |
| `OC_DB_PORT`        | Database port                                | —                |
| `OC_DB_NAME`        | Database name                                | `opencelium`     |
| `OC_ADMIN_USER`     | Initial administrator user                   | `admin`          |
| `OC_ADMIN_PASSWORD` | Initial administrator password (change me!)  | —                |

For the complete and authoritative configuration reference, see
[docs.opencelium.io](https://docs.opencelium.io).

## First Steps

1. Log in with the initial administrator account and **change the password**.
2. Add your first application (API endpoint + authentication).
3. Add a second application you want to connect it to.
4. Open the **Connection Editor** and model the data flow between them.
5. Run the connection and inspect the result in the monitoring view.

A step-by-step tutorial is available in the
[getting-started guide](https://docs.opencelium.io).

## Updating

```bash
# <!-- VERIFY: confirm the documented upgrade procedure, incl. DB migrations & backups -->
git pull
docker compose pull
docker compose up -d
```

> **Always back up your database before upgrading.** Review the
> [release notes](https://docs.opencelium.io) for breaking changes and migration steps.

## Documentation

- **Product website:** [opencelium.io](https://www.opencelium.io)
- **Full documentation:** [docs.opencelium.io](https://docs.opencelium.io)
- **Installation guide:** see the documentation site
- **API reference:** see the documentation site

## Contributing

Contributions are welcome! Whether it is a bug report, a feature request, documentation
improvements or code — we appreciate your help.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-improvement`.
3. Commit your changes with clear messages.
4. Push the branch and open a Pull Request.

Please open an [issue](https://github.com/OpenCelium/OpenCelium/issues) first for larger
changes so we can discuss the approach. <!-- VERIFY: add CONTRIBUTING.md / code style / CLA notes if applicable -->

## Support & Community

- **Issues & bug reports:** [GitHub Issues](https://github.com/OpenCelium/OpenCelium/issues)
- **Questions & ideas:** see the channels listed on [opencelium.io](https://www.opencelium.io)
- **Commercial support:** provided by [OpenCelium GmbH](https://www.opencelium.io)

## License

<!-- VERIFY: set the correct license. The badge at the top currently says MIT — adjust both if needed. -->
This project is licensed under the terms described in the [LICENSE](LICENSE) file.

## About

OpenCelium is developed and maintained by **[OpenCelium GmbH](https://www.opencelium.io)**, an IT
service provider specialising in IT infrastructure, monitoring and integration.

---

<div align="center">
<sub>Like the mycelium beneath the forest floor — quietly keeping everything connected.</sub>
</div>
