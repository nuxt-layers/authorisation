# Authorisation — Public Consumer Contract

> **In short:** a Nuxt foundation capability that makes and enforces server-side access decisions. This file is the self-contained integration handover for applications, domain layers and IAM Integration. Contract version **4**.

## Install

Current package: `@nuxt4-layers/authorisation` (the package has not yet been renamed). During active development, consume its latest accepted `master` through the host's normal Git dependency and commit the resolved lockfile (ADR-0008). The Nuxt layer entry is the package root:

```ts
export default defineNuxtConfig({ extends: ['@nuxt4-layers/authorisation'] })
```

Declared package exports: `.` (Nuxt entry), `./contracts` (pure TypeScript types, schemas, constants and helpers), `./capability` (manifest), `./presentation` (messages and semantic styles) and `./tailwind.css`. Import cross-capability types **only** from `@nuxt4-layers/authorisation/contracts`; server functions and Nuxt auto-imports are available in a composed host, not through unsupported package subpaths. Do not import private `shared/`, `server/`, database or implementation paths. It has no package dependency on Authentication, Identity or IAM Integration.

## Settings

| Setting | Default | Host responsibility |
|---|---|---|
| `NUXT_AUTHORISATION_BASE_URL` / `runtimeConfig.authorisation.baseUrl` | Empty | **Required for state-changing HTTP requests**: set the public origin; Origin or Referer must match, otherwise requests are refused |
| `NUXT_PUBLIC_AUTHORISATION_LOCALE` / `runtimeConfig.public.authorisation.locale` | `en-GB` | Locale for supplied pages |
| `runtimeConfig.public.authorisation.routes.signIn` | `/sign-in` | Application's sign-in route |
| `runtimeConfig.public.authorisation.routes.groupAccess` | `/groups/:groupId/access` | Group access navigation |
| `runtimeConfig.public.authorisation.routes.sharing` | `/groups/:groupId/sharing` | Sharing navigation |
| `runtimeConfig.public.authorisation.routes.tenantRoles` | `/tenants/:tenantId/roles` | Tenant roles navigation |
| `runtimeConfig.public.authorisation.routes.change` | `/access-changes/:changeId` | Change details navigation |
| `authorisation.presentation`, `authorisation.pages` | Presentation enabled by default | Keep, relocate or disable supplied screens; use the Nuxt module options |

The host owns PostgreSQL credentials, TLS, pool lifecycle and the deployment schedule. Authorisation owns only its own schema (default `authorisation`, override with a lowercase PostgreSQL schema identifier). Apply its append-only migrations.

## Host passes

Register the following providers in a **server-only Nitro plugin**, before the first operation. Public shapes are exported by `@nuxt4-layers/authorisation/contracts`:

```ts
type AuthorisationDatabase = {
  dialect: 'postgres'
  pool: PostgresPoolLike // query(sql, values?), connect(), end()
  schema?: string       // default: authorisation
}
type ReadOptions = { consistency: 'strong' | 'bounded' }
type AuthorisationDirectory = {
  resolveActor(principalId: string, options: ReadOptions): Promise<AuthorisationActorContext | null>
  describeGroup(groupId: string, options: ReadOptions): Promise<AuthorisationGroup | null>
}
type AuthorisationGovernance = {
  describeGroup(input: { groupId: string; principalId: string; correlationId: string }): Promise<AuthorisationGovernedGroup | null>
  isOwner(input: { principalId: string; groupId: string }): Promise<boolean>
  countOwners(input: { groupId: string; excluding: readonly string[] }): Promise<number>
}
type AuthorisationSubjectResolver = {
  resolve(request: unknown): Promise<AuthorisationSubject | null>
}
type AuthorisationSubject = {
  principalId: string
  kind?: 'person' | 'service'
  authenticatedAt: string // ISO 8601
  assurance: { level: 'aal1' | 'aal2'; phishingResistant: boolean }
}
type AuthorisationGroup = { groupId: string; lineage: readonly string[]; tenantId: string }
type AuthorisationActorContext = {
  principalId: string
  kind?: 'person' | 'service' | 'break-glass'
  status: 'active' | 'paused' | 'suspended'
  personalGroup: AuthorisationGroup | null
  memberships: readonly { group: AuthorisationGroup; status: 'active' | 'paused' | 'suspended' | 'ended' }[]
}
type AuthorisationGovernedGroup = {
  groupId: string; tenantId: string; kind: 'standard' | 'personal'
  state: 'active' | 'orphaned' | 'archived'
  parentGroupId: string | null; rootGroupId: string; personalOfPrincipalId: string | null
  approvals: { required: AuthorisationRequiredApprovers; referenceRequired: boolean }
  safetyPeriods: {
    publishedDelayHighHours: number; publishedDelayCriticalHours: number
    approvalExpiryDays: number; recoveryHoldHours: number
  }
  requester: { recoveryHoldUntil: string | null; controls: readonly string[] }
}
```

`AuthorisationRequiredApprovers` is exported publicly from `./contracts`; use that exact type rather than guessing the governance approval policy. Directory adapters MUST honour `strong` (source of truth, no cache) and `bounded` (no older than `AUTHORISATION_MAX_STALENESS_SECONDS = 30`). Unknown entities return `null`; data-source failures reject. Never return partial/stale answers.

```ts
export default defineNitroPlugin(() => {
  // pool, directory, governance and principalResolver are host-owned adapters
  // implementing the public types above, NOT Authorisation internals.
  provideAuthorisationDatabase({ dialect: 'postgres', pool })
  provideAuthorisationDirectory(directory)
  provideAuthorisationGovernance(governance)
  provideAuthorisationSubjectResolver({ resolve: principalResolver })
  provideAuthorisationPermissions(domainPermissions)
})
```

Required ports: database, directory, governance, subject resolver (HTTP endpoints), permission catalogue. Optional: `provideAuthorisationPolicy`, `provideAuthorisationEventSink({ emit(event) })` for best-effort denials, `provideAuthorisationClock({ now(): Date })` (defaults to system time), and `provideAuthorisationLegalHolds({ covers({ kind, id }): Promise<boolean> })` for retention. A missing required port throws `AuthorisationCompositionError` at use; failures fail closed.

## Client and server functions

**Server-side decision inputs and results:**

```ts
type AuthorisationResource = {
  type: string; id: string; owningGroupId: string
  creatorPrincipalId?: string | null
  attributes?: Readonly<Record<string, string | number | boolean | null>>
}
type DecisionInput = {
  subject: AuthorisationSubject
  permission: string
  resource: AuthorisationResource
  requestTenantId?: string
}
type AuthorisationDecision =
  | { allowed: true; permission: string; via: 'role' | 'personal-group' | 'grant' }
  | { allowed: false; permission: string; reason:
      'unknown-permission' | 'unknown-subject' | 'unknown-group' |
      'tenant-mismatch' | 'not-permitted' | 'paused' | 'insufficient-assurance'
      requirement: { minimumLevel: 'aal1' | 'aal2'; phishingResistant: boolean; maxAuthenticationAgeSeconds: number | null } | null }
```

- `authorise({ subject, permission, resource, requestTenantId? })` returns an `AuthorisationDecision`; use it for non-throwing server checks.
- `requireAuthorisation(input)` enforces the same check, throwing `AuthorisationFailure` on denial; invoke it **before** a protected operation.
- `authorisationQualifies({ principalId, permission, resource })` checks a candidate's entitlement independently of their current authentication session; `countAuthorisationQualifying({ permission, resource, excludingPrincipalIds, limit })` counts eligible principals (up to 100).
- `listAuthorisationRoleAssignments({ principalId?, groupId? })`, `authorisationDefaultRoles(groupId)`, `listAuthorisationAccessReview({ subject, groupId })` expose server-only read operations.
- `getAuthorisationChanges()` exposes `request`, `decide`, `cancel`, `get`, `listForGroup`; people must use this approved-change workflow, **not** direct mutation functions.
- Trusted host adapters only: `assignAuthorisationRole`, `unassignAuthorisationRole`, `defineAuthorisationRole`, `deleteAuthorisationRole`, `createAuthorisationGrant`, `revokeAuthorisationGrant`. These functions do not approve operations; the calling host must already have authorised the action.
- Lifecycle/server operations: `migrateAuthorisationDatabase()`, `runAuthorisationMaintenance({ limit? })`, `relayAuthorisationOutbox({ publish: async event => ..., limit? })`; also `exportAuthorisationData`, `eraseAuthorisationPrincipal`, `disposeAuthorisationGroup`, `disposeAuthorisationTenant`, `exportAuthorisationTenantData`, `exportAuthorisationRoles`, `importAuthorisationRoles`. These are **not** public HTTP endpoints. The host schedules maintenance and at-least-once outbox relay and handles event idempotency.

**HTTP API** (all under `/api/authorisation`): `POST /changes` body `{ request }`; `GET /changes/:changeId`; `POST /changes/:changeId/decision` body `{ decision, changeDigest }`; `POST /changes/:changeId/cancel`; `GET /groups/:groupId/changes`, `/assignments`, `/access`, `/access-review`, `/grants`; `GET /tenants/:tenantId/roles`; `GET /me`. The caller is obtained from `AuthorisationSubjectResolver`, never trusted from a request body. Clients may supply `x-correlation-id` (UUID). `useAuthorisation()` is a UI helper only; it never grants access.

HTTP failure body: `{ code, messageKey, reason? }`. Codes/status: `unauthenticated` 401; `forbidden` 403; `insufficient-assurance` 403; `validation-failed` 400; `conflict` 409; `unavailable` 503. The server never leaks why a protected resource was forbidden; failures from directory, governance, database or clock are `unavailable`.

## Permissions

A domain capability declares `AuthorisationPermissionDefinitionInput[]` and passes it through `provideAuthorisationPermissions`:

```ts
const domainPermissions = [
  { name: 'orders:view', description: 'View orders', risk: 'low', effect: 'view' },
  { name: 'orders:process_refund', description: 'Refund an order', risk: 'high', effect: 'change' },
] as const
```

Names are `<resource>:<action>` (plural lowercase resource, optional dot namespace; snake-case action), maximum 128 characters; scopes belong in the group/role/grant model, not the permission name. Risks: `low | medium | high | critical`; effects: `view | change` (omitted means `change`). Authorisation includes its own `authorisation.roles:view`, `authorisation.grants:manage`, `authorisation.role-assignments:manage`, `authorisation.roles:manage`, `authorisation.group-access:manage` permissions. Unknown permissions fail closed; `high` and `critical` require strong directory reads and stronger authentication. A paused principal/member gets only low/medium `view` rights; suspended/ended get none.

## Screens

The optional presentation supplies `/groups/:groupId/access`, `/groups/:groupId/sharing`, `/tenants/:tenantId/roles`, `/access-changes/:changeId`. Set page paths/enabled state under `authorisation.pages`, or disable `authorisation.presentation`. If retaining the pages, include `@nuxt4-layers/theme-manager/presentation.css` followed by `@nuxt4-layers/authorisation/tailwind.css` in the host stylesheet. The public `./presentation` export provides message keys, `AUTHORISATION_MESSAGES_EN_GB`, `resolveMessage`, `formatMessage` and semantic class tokens. Provide a sign-in route and translate/override messages in the host.

## Headless surface

A replacement screen must retrieve the authenticated user, enforce authorisation again on its **server** operation, submit administrative changes through their approval workflow, handle step-up, errors and request correlation, and provide accessible/localisable UI state. A hidden control or a client-side decision is never enforcement.

## You will hit this

- Identity owns group hierarchy, memberships, owners and tenant context; Authentication owns the session. Authorisation stores none of them. The host composes their **public contracts** as adapters.
- Every resource has exactly one owning group; its tenant is a distinct isolation boundary. Creator provenance grants no authority. A group parent does not imply membership or roles. Ending membership revokes the access derived from it.
- Defaults are member/guest group roles unless explicitly configured; no `owner` role is granted through ordinary administration. High/critical changes need independent approvals or a governed delay; service identities cannot request or approve changes.
- Outbox delivery is **at least once**; consumers deduplicate by event identity. Schedule maintenance for expiries, delayed changes and access reviews. Missing legal-holds port prevents deletion of records that might be held.
- A public contract type is authoritative for fields too intricate to duplicate here (notably `AuthorisationRequiredApprovers`, pending change unions and event payloads), available from the explicitly supported `./contracts` export without opening private source. If the installed public types and this contract disagree, stop integration and raise a contract defect.
