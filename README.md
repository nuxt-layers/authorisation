# authorisation

> **In short:** a Nuxt foundation layer that decides, on the server, whether a signed-in principal may perform an action on a group-owned resource, and administers roles, assignments and sharing through approved changes.

> **AI-driven development.** This repository is part of Nuxt Layers, an experimental initiative in which AI does the principal architecture, development, testing, security assessment and documentation, under human direction. The project owner decides requirements, governance, acceptance and releases. Every contribution meets the same standards, whatever its origin; the method is the *Contributing* entry in [Resources](RESOURCES.md).

`@nuxt-layers/authorisation` is a Foundation capability of the IAM suite: a headless core with an optional presentation part. It is governed by `nuxt-layers/architecture-rules`; the documents it follows are listed in [Resources](RESOURCES.md).

## Responsibility

```text
subject + permission + resource + group context + roles + grants -> decision
```

**Owns:** the permission catalogue's rules, roles, role assignments, grants, the decision, pending changes and their approvals, each group's default roles and review interval, and its outbox.

- **Groups own information.** Every resource belongs to one group. Each group has at most one parent. Tenants are a separate isolation boundary, checked on their own.
- **Every human identity has a personal group**, for what a person keeps to themselves.
- **Roles are held in groups** and count only while the holder is an active member. The hierarchy confers nothing by default: a role reaches child groups only when its assignment says so.
- **Leaving a group ends the access it gave**, including to what the leaver created: creating something is provenance, not ownership.
- **Grants** share one resource with another principal or group.
- **Risk levels** demand stronger authentication: `high` needs AAL2, `critical` a recent, phishing-resistant sign-in.
- **Risky changes need a second person.** Every change to roles, assignments, sharing and a group's access is requested, checked against the rules, approved where its risk demands it, and applied with its events in one transaction.
- Deny by default. No superuser. Enforcement is on the server only.

**Does not own:** sign-in and sessions (Authentication); users, groups and memberships (Identity); personal data (Profile); domain data (the domain capabilities). It reads groups and memberships through a port and stores none of them.

## Provides and requires

- **Provides:** `Authorisation`.
- **Requires:** `Authentication`, for the subject of each decision, and `Identity`, for groups, memberships and governance facts. Both reach it through ports the host fills; there is no package dependency on either.

[`capability.json`](capability.json) records both, with contract versions and ports.

## Using it

The [consumer contract](CONTRACT.md) is the complete integration interface: installation, settings, what the host passes, functions, permissions, screens and failure codes. A host needs no other document.

## Compatibility

The layer is built on Nuxt 4 and declares it as a peer dependency; `package.json` states the supported Nuxt and Node.js ranges, and the contract repeats them for hosts. Storage is PostgreSQL.

## Documents

- [Consumer contract](CONTRACT.md): the public integration interface.
- [Detailed contract](docs/contracts.md): the rules behind each decision and change, for maintainers.
- [Threat model and control register](docs/threat-model.md).
- [Storage register](STORAGE-REGISTER.md): what is stored, why and for how long.
- [Plan](PLAN.md): what is done and what is open.
- [Changelog](CHANGELOG.md): major changes, newest first.
- [Resources](RESOURCES.md): the governing architecture and suite processes relied on.
- [Legacy layer review](docs/legacy-review.md): a historical record of what was kept from the earlier layer.
- [Contributing](CONTRIBUTING.md) and [Security policy](SECURITY.md).

## Working on it

```sh
pnpm install --frozen-lockfile
pnpm dev:prepare
pnpm check             # nuxt typecheck + vitest
pnpm build:playground  # proves the layer composes in a host
pnpm test:e2e          # the default pages in Chromium, with axe
```

The database suites and the browser tests need `AUTHORISATION_TEST_DATABASE_URL`: the administrator URL of a local, disposable PostgreSQL. `package.json` names the package manager; the Quality workflow runs the same checks on every pull request.

## Security and privacy

Authorisation is security-critical: see the [threat model](docs/threat-model.md) and report vulnerabilities as the [security policy](SECURITY.md) says. It stores opaque identifiers, role and permission names, codes and instants, never names or email addresses; see the [storage register](STORAGE-REGISTER.md).

## Licence

MIT
