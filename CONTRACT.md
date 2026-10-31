# Authorisation — Consumer Contract

> **In short:** Authorisation decides whether an authenticated subject may act on a resource. Hosts compose its declared ports; the server enforces every decision.

## Install

During active development, consume the latest accepted `master` under ADR-0008. The current package identifier is `@nuxt4-layers/authorisation` until its coordinated rename.

```ts
export default defineNuxtConfig({
  extends: ['@nuxt4-layers/authorisation'],
})
```

Public package exports: `.`, `./contracts`, `./capability`, `./presentation`, `./tailwind.css`. Import contract types and pure helpers from `@nuxt4-layers/authorisation/contracts`; do not import private server or database paths.

## Settings

- `NUXT_AUTHORISATION_BASE_URL`: host origin for the capability's endpoint checks.
- `authorisation.pages`: configure paths or disable the optional pages in `nuxt.config.ts`.
- The host must schedule `runAuthorisationMaintenance()` and `relayAuthorisationOutbox({ publish })` where administration and durable events are in use.

## Host passes

From a server-side Nitro plugin, configure the host's actual providers:

```ts
export default defineNitroPlugin(() => {
  provideAuthorisationDatabase({ dialect: 'postgres', pool })
  provideAuthorisationDirectory(directory)
  provideAuthorisationGovernance(governance)
  provideAuthorisationSubjectResolver({ resolve: event => getAuthenticatedPrincipal(event) })
  provideAuthorisationPermissions(permissions)
})
```

- **Database:** PostgreSQL connection; Authorisation owns its schema.
- **Directory:** current identities, group hierarchy, membership state and tenant context, supplied through `AuthorisationDirectory`.
- **Governance:** ownership, approval requirements, safety periods and recovery holds, supplied through `AuthorisationGovernance`.
- **Subject resolver:** authenticated principal supplied securely on the server, not from request body fields.
- **Permissions:** host's declared domain permission catalogue.
- **Optional ports:** policy, event sink and clock; the clock defaults to the system clock.

The owning capabilities supply the data through public interfaces. This layer does not import another capability or depend on an integration suite.

## Client and server functions

- `authorise(event, permission, resource)`: evaluate access; `requireAuthorisation(...)`: enforce access on the server.
- Role and grant administration, pending approvals, reviews, maintenance, outbox relay, export and disposal are offered through documented server APIs.
- `useAuthorisation()`: presentation hints only; never a security boundary.
- HTTP endpoints are namespaced beneath `/api/authorisation/*` and require the host's subject resolver. The server validates inputs and returns coarse error codes, not internal details.

The full public types, inputs, outputs, error codes and operation signatures are specified in this repository's [detailed contract](docs/contracts.md). That document is for capability maintainers; consumers should integrate against the public exports described here.

## Permissions

Each domain capability declares its own permissions with a name, description, risk and effect. For example:

```ts
{ name: 'orders:process_refund', description: 'Refund an order', risk: 'high', effect: 'change' }
```

Risk and effect constrain decisions. High-risk access requires stronger authentication; critical access requires recent phishing-resistant authentication. Unknown permissions fail closed.

## Screens

Optional pages include:

- `/groups/:groupId/access`
- `/groups/:groupId/sharing`
- `/tenants/:tenantId/roles`
- `/access-changes/:changeId`

The host may relocate or disable these through `authorisation.pages`. Presentation uses Theme Manager's semantic tokens and the public client API.

## Headless surface

A custom screen must still authenticate the subject, obtain and enforce server-side authorisation, honour approval and step-up requirements, provide accessible and localisable state feedback, and avoid relying on hidden UI controls for security.

## You will hit this

- Every resource has a group owner; tenants remain a separate isolation boundary.
- Group hierarchy grants no access implicitly. Membership-derived access ends when membership ends; creating data confers no enduring access.
- Administrative changes may require independent approval. No superuser bypass or impersonation exists.
- Only the server may enforce access; client decisions are hints.
- Use the documented database migrations and outbox relay; do not read or write the capability's private tables directly.
