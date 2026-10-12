<div align="center">

# OpenCelium — Open Source API Hub

**Connect your applications. Let them talk.**

[![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE.md)
[![Website](https://img.shields.io/badge/website-opencelium.io-brightgreen.svg)](https://www.opencelium.io)
[![Documentation](https://img.shields.io/badge/docs-docs.opencelium.io-orange.svg)](https://docs.opencelium.io)
[![Maintained by OpenCelium GmbH](https://img.shields.io/badge/maintained%20by-OpenCelium%20GmbH-1f4e79.svg)](https://www.opencelium.io)

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

| Component        | Technology                | Responsibility                                          |
|------------------|---------------------------|---------------------------------------------------------|
| Frontend         | React, served via NGINX   | Web UI, including the drag-and-drop Connection Editor    |
| Backend          | Java / Spring Boot         | Connection execution engine, scheduling, user management |
| Relational store | MariaDB                   | Core configuration, users, applications, connections     |
| Document store   | MongoDB                   | Execution data and flexible document storage             |

The frontend serves the UI over HTTP/HTTPS, the backend exposes its API internally, and
both databases run alongside the backend within the same Docker network.

## Quick Start

The fastest way to get OpenCelium running is with the official Docker setup, maintained
in a dedicated repository: **[opencelium-docker](https://github.com/opencelium/opencelium-docker)**.
This compose setup includes HTTP and HTTPS support, runs without Elastic/Kibana, and is
recommended for testing. A typical installation takes about 5 minutes.

```bash
# 1. Clone the Docker repository
git clone https://github.com/opencelium/opencelium-docker.git
cd opencelium-docker

# 2. Create a .env file with the required credentials (see Configuration below)
cp /opt/opencelium-docker/conf/application_default.yml /opt/opencelium-docker/conf/application.yml
cp /opt/opencelium-docker/conf/nginx_default.conf /opt/opencelium-docker/conf/nginx.conf
cp /opt/opencelium-docker/.env_default /opt/opencelium-docker/.env

# 3. Start OpenCelium
docker compose up -d

# 4. Open the UI in your browser
#    http://localhost      (HTTP, port 80)
#    https://localhost     (HTTPS, port 443 — see the repo's SSL notes)
```

After the first login, **change the default administrator password immediately.** Default
credentials and further details are described in the
[installation documentation](https://docs.opencelium.io/en/prod/gettinginvolved/installation.html#docker-compose).

## Prerequisites

- **Docker** and **Docker Compose**
- Ports **80** and **443** available on the host (for HTTP and HTTPS)
- Recommended minimum: 2 CPU cores, 4 GB RAM, 10 GB free disk space
- A modern web browser (Chrome, Firefox, Edge)

For bare-metal / manual installation requirements, see the
[installation guide](https://docs.opencelium.io).

## Installation

OpenCelium can be installed in several ways. The Docker-based setup is recommended for
most users.

### Docker (recommended)

The Docker deployment lives in its own repository,
**[opencelium-docker](https://github.com/opencelium/opencelium-docker)**:

```bash
git clone https://github.com/opencelium/opencelium-docker.git
cd opencelium-docker

# create your application, nginx and .env file (see Configuration), then:
cp /opt/opencelium-docker/conf/application_default.yml /opt/opencelium-docker/conf/application.yml
cp /opt/opencelium-docker/conf/nginx_default.conf /opt/opencelium-docker/conf/nginx.conf
cp /opt/opencelium-docker/.env_default /opt/opencelium-docker/.env

# start opencelium
docker compose up -d
```

To enable HTTPS, switch the NGINX configuration to the SSL variant and mount your
certificates as described in the
[opencelium-docker README](https://github.com/opencelium/opencelium-docker).

### Manual installation

A manual / production installation (separate frontend, backend and databases, reverse
proxy, TLS, etc.) is described in detail in the
**[installation documentation](https://docs.opencelium.io)**.

## Configuration

The Docker setup is configured via a `.env` file in the `opencelium-docker` directory.
The following variables are **required** (the containers will not start without them):

| Variable              | Description                                      | Example        |
|-----------------------|--------------------------------------------------|----------------|
| `OC_MYSQL_DATABASE`   | Name of the MariaDB database                     | `opencelium`   |
| `OC_DB_ROOT_PASSWORD` | MariaDB root password                            | _(set a strong value)_ |
| `OC_MYSQL_USER`       | MariaDB application user                          | `opencelium`   |
| `OC_MYSQL_PASSWORD`   | MariaDB application user password                | _(set a strong value)_ |
| `OC_MONGODB_USER`     | MongoDB user                                     | `opencelium`   |
| `OC_MONGODB_PASSWORD` | MongoDB user password                            | _(set a strong value)_ |

Example `.env`:

```dotenv
OC_MYSQL_DATABASE=opencelium
OC_DB_ROOT_PASSWORD=change-me-strong-root-pw
OC_MYSQL_USER=opencelium
OC_MYSQL_PASSWORD=change-me-strong-pw
OC_MONGODB_USER=opencelium
OC_MONGODB_PASSWORD=change-me-strong-pw
```

Additional settings (NGINX, SSL, `application.yml`) are mounted from the `conf/` directory
of the Docker repository. For the complete configuration reference, see
[docs.opencelium.io](https://docs.opencelium.io).

## First Steps

1. Open `http://localhost` (or your host's address) and log in with the initial
   administrator account, then **change the password**.
2. Add your first application (API endpoint + authentication).
3. Add a second application you want to connect it to.
4. Open the **Connection Editor** and model the data flow between them.
5. Run the connection and inspect the result in the monitoring view.

A step-by-step tutorial is available in the
[getting-started guide](https://docs.opencelium.io).

## Updating

From within your `opencelium-docker` directory:

```bash
git pull
docker compose pull
docker compose up -d
```

> **Always back up your MariaDB and MongoDB data before upgrading.** Review the
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

## License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.
See the [LICENSE.md](LICENSE.md) file for the full text.

## About

OpenCelium is developed and maintained by **[OpenCelium GmbH](https://www.opencelium.io)**,
specialising in IT infrastructure, monitoring and integration.

---

<div align="center">
<sub>Like the mycelium beneath the forest floor — quietly keeping everything connected.</sub>
</div>
