# Authorisation

> **In short:** a reusable Nuxt capability that decides whether a signed-in principal may act on a group-owned resource.

> **AI-driven development.** Architecture, implementation and verification are developed with AI under human direction. The project owner retains authority over requirements, acceptance and releases.

The [capability contract](CONTRACT.md) defines the public interface; [contribution guidance](CONTRIBUTING.md) and the [security policy](SECURITY.md) describe how changes and disclosures are handled.

## What it does

```text
subject + permission + resource + group context + roles + grants -> decision
```

- **Groups own information.** Every resource belongs to one group: an organisation, company, club, committee, event, department and so on. Each group has at most one parent. Tenants are a separate isolation boundary, checked on their own.
- **Every human identity has a personal group**, a unary group like a Unix user's own group, for the things a user keeps to themselves.
- **Roles are held in groups** and count only while the holder is an active member. The hierarchy confers nothing by default: a role reaches child groups only when its assignment explicitly says so.
- **Leaving a group ends the access it gave**, including to what the leaver created: creating something is provenance, not ownership. Joining one gives access up to the roles held there.
- **Grants** share one resource with another principal or group.
- **Risk levels** demand stronger authentication: `high` needs AAL2, `critical` a recent, phishing-resistant sign-in.
- **Changes need a second person** when they are risky: every change to roles, assignments, sharing and a group's access is requested, checked against the rules (no self-grant; owners follow Identity), approved where its risk demands it, and applied with its events in one transaction.
- Deny by default. No superuser. Enforcement is on the server only.

## What it does not do

Sign-in and sessions (Authentication), users, groups and memberships (Identity), and domain data (the domain capabilities). It reads groups and memberships through a port and stores none of them.

## Using it

```ts
// nuxt.config.ts of the host
export default defineNuxtConfig({
  extends: ['@nuxt4-layers/authorisation'],
})
```

```ts
// server/plugins/authorisation.ts of the host
export default defineNitroPlugin(() => {
  provideAuthorisationDatabase({ dialect: 'postgres', pool })
  provideAuthorisationDirectory(identityDirectoryAdapter)
  provideAuthorisationGovernance(identityGovernanceAdapter) // iam-integration's authorisationGovernanceFromIdentity
  provideAuthorisationSubjectResolver({ resolve: event => getAuthenticatedPrincipal(event) })
  provideAuthorisationPermissions(ORDER_PERMISSIONS)
})
```

```css
/* the host's stylesheet, when it keeps the default pages */
@import "@nuxt4-layers/theme-manager/presentation.css";
@import "@nuxt4-layers/authorisation/tailwind.css";
```

Set `NUXT_AUTHORISATION_BASE_URL` to the host's origin, and schedule `runAuthorisationMaintenance()` and `relayAuthorisationOutbox({ publish })`. The default pages live at `/groups/:groupId/access`, `/groups/:groupId/sharing`, `/tenants/:tenantId/roles` and `/access-changes/:changeId`; move or disable them under `authorisation.pages` in `nuxt.config.ts`.

Domain capabilities declare their permissions, e.g. `{ name: 'orders:process_refund', description: 'Refund an order', risk: 'high', effect: 'change' }`, and import types only from `@nuxt4-layers/authorisation/contracts`.

## Documentation

- [Contract](CONTRACT.md): permissions, roles, grants and how a decision is made
- [Composition contract](docs/composition-contract.md): what a host supplies
- [Threat model and control register](docs/threat-model.md)
- [Current plan](PLAN.md)
- [Legacy layer review](docs/legacy-review.md)

## Development

```sh
pnpm install
pnpm dev:prepare
pnpm check             # nuxt typecheck + vitest
pnpm build:playground  # proves the layer composes in a host
pnpm test:e2e          # the default pages in Chromium, with axe (needs AUTHORISATION_TEST_DATABASE_URL)
```

The current `package.json` requires Node 22 or later and declares pnpm 10.28.0. Use the declared package manager until the planned toolchain migration is complete.

## Licence

MIT
