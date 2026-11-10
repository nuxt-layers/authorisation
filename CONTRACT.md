# Authorisation — Consumer Contract

> **In short:** everything a host or another capability needs to install, compose and use Authorisation: it decides, on the server, whether a subject may perform a permission on a group-owned resource, and administers roles, assignments and grants through approved changes.

**Status:** development contract for the current `master`; contract version 4. Not a formal package release. Maintainers' detail is in `docs/contracts.md`; it defines no other consumer interface.

## Install

```json
"@nuxt-layers/authorisation": "github:nuxt-layers/authorisation#master"
```

A Git-backed dependency following the latest accepted `master`; the host's lockfile records the resolved commit and is refreshed when `master` advances. The package runs no install scripts and installs one runtime dependency, `zod`. It needs Nuxt 4.5 or later (peer dependency `nuxt ^4.5.0`), Node.js 22 or later, and a PostgreSQL database (tested on PostgreSQL 16) reached through a `pg`-compatible pool the host creates.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['@nuxt-layers/authorisation'],
})
```

```ts
// server/plugins/authorisation.ts
export default defineNitroPlugin(() => {
  provideAuthorisationDatabase({ dialect: 'postgres', pool })
  provideAuthorisationDirectory(directory)
  provideAuthorisationGovernance(governance)
  provideAuthorisationSubjectResolver({ resolve: event => signedInPrincipal(event) })
  provideAuthorisationPermissions(ORDER_PERMISSIONS)
  void migrateAuthorisationDatabase()
})
```

`pool`, `directory`, `governance`, `signedInPrincipal` and `ORDER_PERMISSIONS` are the host's own; *Host passes* gives each shape. In the IAM suite, `iam-integration` supplies the directory, governance and subject adapters. Every server function below is auto-imported in the host's server code; `useAuthorisation()` is auto-imported in its app code.

| Import path | Offers |
|---|---|
| `@nuxt-layers/authorisation` | The Nuxt layer, for `extends` |
| `@nuxt-layers/authorisation/contracts` | Every type, schema, constant and pure helper named here. Imports only `zod` |
| `@nuxt-layers/authorisation/capability` | The manifest, `capability.json` |
| `@nuxt-layers/authorisation/presentation` | `AUTHORISATION_MESSAGES_EN_GB`, `AuthorisationMessageKey`, `AuthorisationMessages`, `formatMessage`, `resolveMessage`, `DELIBERATE_PAIRINGS`, `authorisationClasses` |
| `@nuxt-layers/authorisation/tailwind.css` | Tailwind source registration for the default screens |

Nothing else is public: never import `server/internal`, `server/database` or any other path.

## Settings

| Setting | Default | Does |
|---|---|---|
| `runtimeConfig.authorisation.baseUrl` (`NUXT_AUTHORISATION_BASE_URL`) | `''` | The host's public origin. A state-changing `/api/authorisation/*` request must carry an `Origin` (or, failing that, a `Referer`) matching it. Unset, every such request is refused |
| `runtimeConfig.public.authorisation.locale` (`NUXT_PUBLIC_AUTHORISATION_LOCALE`) | `en-GB` | BCP 47 locale of the screens' text, dates and times |
| `runtimeConfig.public.authorisation.routes.signIn` | `/sign-in` | Where the screens send someone who is not signed in |
| `authorisation.presentation` (`nuxt.config.ts`) | `true` | `false` registers no page, component, presentation auto-import or route rule; the core works unchanged |
| `authorisation.pages.enabled` | `true` | `false` keeps the components and registers no page |
| `authorisation.pages.paths` | See *Screens* | Moves the pages. Each path is absolute and keeps its parameter (`:groupId`, `:tenantId` or `:changeId`), or the build fails |
| `appConfig.authorisation.messages` (`app.config.ts`) | none | Wording overrides and further locales: `{ 'en-GB': { [key]: text }, 'cy-GB': { … } }` |

The database schema name is passed with the pool (`schema`, default `authorisation`). Policy is passed in code (`provideAuthorisationPolicy`, below). The layer reads no other environment variable and holds no secret.

## Host passes

A required port that is missing throws `AuthorisationCompositionError` (with the port's name as `port`) at first use; the operation is refused and there is no fallback store, directory or resolver. A wrongly shaped port throws `TypeError` from its `provide*` call at start-up.

| Call | Required | Passes |
|---|---|---|
| `provideAuthorisationDatabase({ dialect: 'postgres', pool, schema? })` | Yes | A `pg`-compatible pool (`query`, `connect`, `end`). The host owns its credentials, TLS, pooling and lifecycle; the layer owns everything inside its schema. `schema` matches `^[a-z_][a-z0-9_]{0,62}$` |
| `provideAuthorisationDirectory(directory)` | Yes | Identity's groups, tenants and memberships (below) |
| `provideAuthorisationPermissions(definitions)` | For any permission but the layer's own | Each capability's permission definitions; may be called once per capability |
| `provideAuthorisationGovernance(governance)` | For every change request and decision on one | Identity's approval facts (below) |
| `provideAuthorisationSubjectResolver({ resolve(event) })` | For the HTTP API | Who is signed in: an `AuthorisationSubject`, or `null`; rejects on failure |
| `provideAuthorisationClock({ now(): Date })` | No: the system clock | The suite's clock. Trusted like a key; a movable clock is for tests only |
| `provideAuthorisationPolicy(input)` | No: secure defaults | Policy overrides (below) |
| `provideAuthorisationEventSink({ emit(event) })` | No | Receives refused decisions only (`AuthorisationDenialEvent`), best effort |
| `provideAuthorisationLegalHolds({ covers({ kind, id }) })` | No | Whether a legal hold covers a `group`, `tenant` or `person`. Without it, retention keeps every decided change |

The host also:

- calls `migrateAuthorisationDatabase()` once after supplying the database. It creates the schema if absent and applies pending migrations; it is safe to run from several instances at once, and operations wait for it;
- runs `runAuthorisationMaintenance()` on a schedule (every few minutes) and `relayAuthorisationOutbox({ publish })` on a schedule or after requests. Neither is an endpoint;
- resolves the request's tenant on the server and passes it as `requestTenantId`; a tenant or group identifier from a client is never proof of authority;
- keeps the `owner` role in step with Identity's owners, and gives new members their group's default role, through `assignAuthorisationRole` and `unassignAuthorisationRole` from its Identity event handler;
- tests the composed system, including tenant isolation and leaving a group.

### Subject

```ts
interface AuthorisationSubject {
  principalId: string                 // opaque
  kind?: 'person' | 'service'         // absent: a person
  authenticatedAt: string             // ISO 8601, last primary or step-up authentication
  assurance: { level: 'aal1' | 'aal2', phishingResistant: boolean }
}
```

It is a structural subset of Authentication's principal, passed in by the host; Authorisation imports neither Authentication nor Identity.

### Directory

```ts
interface AuthorisationDirectory {
  resolveActor(principalId: string, options: { consistency: 'strong' | 'bounded' }): Promise<AuthorisationActorContext | null>
  describeGroup(groupId: string, options: { consistency: 'strong' | 'bounded' }): Promise<AuthorisationGroup | null>
}
interface AuthorisationGroup { groupId: string, lineage: readonly string[], tenantId: string }  // lineage: root first, ending with the group
interface AuthorisationActorContext {
  principalId: string
  kind?: 'person' | 'service' | 'break-glass'      // absent: a person
  status: 'active' | 'paused' | 'suspended'
  personalGroup: AuthorisationGroup | null
  memberships: readonly { group: AuthorisationGroup, status: 'active' | 'paused' | 'suspended' | 'ended' }[]
}
```

`null` means unknown. `strong` reads the source of truth with no cache; `bounded` may be cached for at most `AUTHORISATION_MAX_STALENESS_SECONDS` (30). A failure must reject, never answer stale or partial data. The hierarchy must not imply membership: only direct memberships are listed.

### Governance

```ts
interface AuthorisationGovernance {
  describeGroup(input: { groupId: string, principalId: string, correlationId: string }): Promise<AuthorisationGovernedGroup | null>
  isOwner(input: { principalId: string, groupId: string }): Promise<boolean>
  countOwners(input: { groupId: string, excluding: readonly string[] }): Promise<number>
}
interface AuthorisationGovernedGroup {
  groupId: string, tenantId: string
  kind: 'standard' | 'personal'
  state: 'active' | 'orphaned' | 'archived'
  parentGroupId: string | null, rootGroupId: string
  personalOfPrincipalId: string | null
  approvals: { required: { low: 0 | 1, medium: 0 | 1, high: 1 | 2, critical: 1 | 2 }, referenceRequired: boolean }
  safetyPeriods: { publishedDelayHighHours: number, publishedDelayCriticalHours: number, approvalExpiryDays: number, recoveryHoldHours: number }
  requester: { recoveryHoldUntil: string | null, controls: readonly string[] }
}
```

Read from Identity's own record at `strong` consistency; a failure rejects.

### Permission definitions

`{ name, description, risk, effect? }`: `name` is `<resource>:<action>` (resource: lower-case, hyphenated segments joined by dots; action: snake case; at most 128 characters; scope never appears in the name); `description` is 1 to 500 characters; `risk` is `low`, `medium`, `high` or `critical`; `effect` is `view` or `change` (default `change`). A name defined twice with a different description, risk or effect throws `TypeError`.

### Policy

`provideAuthorisationPolicy` accepts a partial `AuthorisationPolicyInput` and throws at start-up when it is invalid or below a floor:

| Member | Default | Floor |
|---|---|---|
| `assurance.low`, `assurance.medium` | `aal1` | No level may demand less than the one below it |
| `assurance.high` | `aal2` | `aal2` |
| `assurance.critical` | `aal2`, phishing resistant, authenticated within 900 seconds | `aal2`, within 3600 seconds. Dropping phishing resistance needs a documented risk treatment |
| `roles` | See *Permissions* | A role naming an exact permission missing from the catalogue is refused |
| `personalGroupRole` | `owner` | A built-in role, or `null` |
| `externalGrants` | `false` | — |
| `retention.outboxDays` | 30 | 7 to 365; below 30 needs `riskTreatment` |
| `retention.changeDays` | 730 | 365 to 2555; below 730 needs `riskTreatment` |
| `riskTreatment` | `null` | A reference such as `RISK-12` |

### Storage

The layer creates and owns one PostgreSQL schema (`authorisation` by default) holding custom roles, role assignments, grants, each group's access settings, pending changes, an outbox and its migration record. It stores opaque identifiers, role and permission names, codes, digests and instants: no names, email addresses or free text. No other capability reads it; there are no cross-schema keys. The host should connect with a database role limited to that schema. The layer sets no cookie and uses no browser storage.

## Client and server functions

Every server function fails closed. It throws `AuthorisationFailure` (`code`, and `reason` for `conflict` and `validation-failed`): `unavailable` when the directory, governance port, database or clock fails; `validation-failed` for invalid input.

### Decisions

| Function | Returns |
|---|---|
| `authorise({ subject, permission, resource, requestTenantId? })` | `AuthorisationDecision`: `{ allowed: true, permission, via }` (`via`: `role`, `personal-group` or `grant`) or `{ allowed: false, permission, reason, requirement }` |
| `requireAuthorisation(input)` | Nothing when allowed; otherwise throws an HTTP error: `forbidden`, `insufficient-assurance` or `unavailable` |
| `authorisationQualifies({ principalId, permission, resource })` | Whether the principal holds the permission now, whatever their session |
| `countAuthorisationQualifying({ permission, resource, excludingPrincipalIds, limit })` | How many others qualify, up to `limit` (at most 100). Grants to a group are not counted, so it errs low |
| `listAuthorisationVisibleGroups({ subject, permission })` | `{ permission, groupIds }`: among the subject's memberships, personal group and assigned groups (at most 1000), those where it holds the permission. For building queries; every action on a row is still decided |

```ts
interface AuthorisationResource {
  type: string                        // the resource part of its permissions, e.g. 'orders'
  id: string
  owningGroupId: string               // every resource has exactly one owning group
  creatorPrincipalId?: string | null  // provenance only; never grants access
  attributes?: Readonly<Record<string, string | number | boolean | null>>
}
```

The domain capability that owns a resource describes it from its own store at decision time. `requirement` is `{ minimumLevel, phishingResistant, maxAuthenticationAgeSeconds }`, so the host can send the person to step up. Denial reasons (`unknown-permission`, `unknown-subject`, `unknown-group`, `tenant-mismatch`, `not-permitted`, `paused`, `insufficient-assurance`) are for the server and audit only.

How a decision is made:

1. Refuse a permission missing from the catalogue or not of the resource's type, an unknown principal, and an unknown owning group.
2. With `requestTenantId`, refuse a resource in any other tenant.
3. Find a route: a role held in the owning group, or in an ancestor by an assignment scoped `group-and-descendants`, while a member of that group, in the resource's tenant, before the assignment ends, and activated if it is eligible; the personal-group role, on the subject's own personal group; or an unexpired grant inside the tenant, bound to the resource's owning group when it records one.
4. A paused membership or principal confers only `view` permissions at `low` or `medium` risk; `suspended` and `ended` confer nothing. A route with active standing wins.
5. Check the session against the permission's risk; if it falls short, refuse with `insufficient-assurance`.

`high` and `critical` permissions read the directory at `strong` consistency, others at `bounded`. Decisions are never cached across requests.

### Direct changes, for the host's own server code

These **decide nothing**: the caller has authorised the change. They exist for applying Identity's events. People change access only through pending changes.

| Function | Returns |
|---|---|
| `listAuthorisationRoleAssignments({ principalId?, groupId? })` | `AuthorisationRoleAssignment[]` |
| `assignAuthorisationRole({ principalId, groupId, roleId, scope?, expiresAt?, actorPrincipalId, correlationId? })` | Whether anything changed |
| `unassignAuthorisationRole({ principalId, groupId, roleId \| null, actorPrincipalId, correlationId? })` | The roles removed; `null` removes every role |
| `defineAuthorisationRole({ tenantId, role, actorPrincipalId, correlationId? })` | `'defined'` or `'changed'` |
| `deleteAuthorisationRole({ tenantId, roleId, actorPrincipalId, correlationId? })` | Whether it existed |
| `createAuthorisationGrant({ grant, actorPrincipalId, correlationId? })` | The grant's identifier |
| `revokeAuthorisationGrant({ grantId, actorPrincipalId, correlationId? })` | Whether it existed |
| `authorisationDefaultRoles(groupId)` | `{ member, guest }`: role identifiers or `null`; `member` and `viewer` until the group chooses others |

A role definition is `{ id, name, description?, permissions: { pattern, when? }[] }`. A grant is `{ resource: { type, id, owningGroupId? }, subject: { kind: 'principal', principalId } | { kind: 'group', groupId }, permissions, expiresAt }`, with exact permission names only.

### Pending changes

`getAuthorisationChanges()` returns:

| Method | Does |
|---|---|
| `request({ subject, request, correlationId })` | Records a change; applies it at once when no approver is needed |
| `decide({ subject, changeId, changeDigest, decision, correlationId })` | `approve` or `reject`; applies in the same transaction once enough approvals are recorded |
| `cancel({ subject, changeId, correlationId })` | Withdraws; the requester only |
| `get({ subject, changeId })` | One change, for its requester, beneficiary, a decider, or a holder of `authorisation.roles:view` |
| `listForGroup({ subject, groupId })` | The group's open changes, under `authorisation.roles:view` |

Each returns `AuthorisationPendingChange` (`listForGroup` an array): `changeId`, `type`, `tenantId`, `groupId`, `requesterId`, `beneficiaryId`, `risk`, `justification`, `target`, `requiredApprovals`, `route`, `approvals`, `changeDigest`, `delayEndsAt`, `expiresAt`, `heldUntil`, `state`, `correlationId`, `createdAt`, `decidedAt`, `version`. States are `awaiting-approval`, `delayed`, `applied`, `rejected`, `expired` and `cancelled`; routes are `approvers`, `parent-owner`, `tenant-owner`, `published-delay` and `none`.

A request is `{ type, target, justification: { reasonCode, reference } }`, parsed strictly:

| `type` | `target` | Permission, on | Risk |
|---|---|---|---|
| `role.assign` | `principalId`, `groupId`, `roleId`, `scope?`, `expiresAt?`, `eligible?` | `authorisation.role-assignments:manage`, the group | The role's highest, at least `medium`; `critical` for `group-and-descendants` |
| `role.unassign` | `principalId`, `groupId`, `roleId` | As above | `medium` |
| `role.activate` | `principalId`, `groupId`, `roleId`, `minutes` (5 to 480) | The holder's own eligible assignment | As assigning that role |
| `assignment.confirm` | `principalId`, `groupId`, `roleId` | `authorisation.role-assignments:manage`, the group | `low` |
| `grant.create` | `grant` (with `resource.owningGroupId`) | `authorisation.grants:manage`, the owning group | The permissions' highest, at least `high`; `critical` beyond the tenant |
| `grant.revoke` | `grantId` | `authorisation.grants:manage`, the grant's owning group | `medium` |
| `role.define`, `role.delete` | `tenantId`, `role` or `roleId` | `authorisation.roles:manage`, the tenant's root group | `critical` |
| `group.change-default-roles` | `groupId`, `defaultRoles: { member, guest }` | `authorisation.group-access:manage`, the group | The chosen roles' highest, at least `high` |
| `group.change-review-interval` | `groupId`, `intervalDays` (1 to 3650, or `null`) | As above | `high` |

The requester must hold the permission and step up to the change's risk (`high`: `aal2`; `critical`: `aal2`, phishing resistant, within 15 minutes). Approvals are bound to `changeDigest`. Every rule is checked again when the change applies, in the same transaction as the decision and its events.

### Administration reads

`getAuthorisationAdministration()` returns `assignments`, `accessReview`, `groupAccess` and `grants` (each `{ subject, groupId }`), `tenantRoles({ subject, tenantId })` and `self({ subject })`; `listAuthorisationAccessReview({ subject, groupId })` is the access review alone. Each is guarded as its endpoint below.

### Operations, server-only

| Function | Does |
|---|---|
| `runAuthorisationMaintenance({ limit? })` | Removes assignments past their end, expires undecided changes, applies delayed changes whose delay or hold has ended, announces overdue reviews and applies retention. `limit` 1 to 5000, default 500. Idempotent. Returns counts: `expiredAssignments`, `expiredChanges`, `appliedChanges`, `rejectedChanges`, `failedChanges`, `overdueReviews`, `retention: { outboxEvents, changes }` |
| `relayAuthorisationOutbox({ publish, limit? })` | Publishes up to `limit` (1 to 1000, default 100) events in order. An event is marked relayed only when `publish` resolves; a failure stops the run and the event is published again next time. Returns `{ published, failed }` |
| `exportAuthorisationData({ principalId, correlationId })` | The principal's assignments, grants and changes (`AuthorisationDataExport`), or `null` when it holds none |
| `eraseAuthorisationPrincipal({ principalId, actorPrincipalId, correlationId? })` | Removes every assignment and grant the principal holds and rejects its open changes. Returns `{ assignments, grants }` |
| `disposeAuthorisationGroup({ groupId, correlationId })` | Removes the group's assignments, grants, access settings and changes. Returns `{ assignments, grants, changes }` |
| `disposeAuthorisationTenant({ tenantId, correlationId })` | Removes the tenant's custom roles and their changes. Returns `{ roles, changes }` |
| `exportAuthorisationTenantData({ tenantId, groupIds, correlationId })` | `AuthorisationTenantExport` |
| `exportAuthorisationRoles({ tenantId })`, `importAuthorisationRoles({ tenantId, document, correlationId })` | A tenant's custom roles as a document with its SHA-256 digest; the import returns `{ defined, changed, deleted }` |

These decide nothing: the host calls them only after the responsible capability has authorised the operation.

### Events

Every change writes its event to the outbox in the same transaction. `publish` receives `AuthorisationEvent`: `{ eventId, type, occurredAt, correlationId, actorPrincipalId, data }`, validated by `authorisationEventSchema`. Delivery is in order and at least once; consumers are idempotent by `eventId`. `actorPrincipalId` is `null` for the system.

Types, each prefixed `authorisation.`: `change-requested`, `change-decided`, `change-held`, `role-assigned`, `role-unassigned`, `role-expired`, `role-activated`, `assignment-confirmed`, `grant-created`, `grant-revoked`, `role-defined`, `role-changed`, `role-deleted`, `roles-imported`, `group-access-changed`, `review-overdue`, `principal-erased`, `group-disposed`, `tenant-disposed` and `retention-applied`. `AUTHORISATION_EVENT_PAYLOADS` holds each payload's schema. Events carry identifiers, codes, role and permission names and instants only.

`authorisation.denied` is not an outbox event: it goes to the optional sink, and a sink failure never changes the decision.

### HTTP API

Every endpoint takes the subject only from the subject resolver, parses its body strictly and answers the coarse errors below. A client may send `x-correlation-id` (a lower-case UUID).

| Endpoint | Does | Needs |
|---|---|---|
| `POST /api/authorisation/changes` `{ request }` | Requests a change; 201 with the change | As *Pending changes* |
| `GET /api/authorisation/changes/:changeId` | One change | Requester, beneficiary, a decider, or `authorisation.roles:view` |
| `POST /api/authorisation/changes/:changeId/decision` `{ decision, changeDigest }` | Approves or rejects | A decider |
| `POST /api/authorisation/changes/:changeId/cancel` | Withdraws | The requester |
| `GET /api/authorisation/groups/:groupId/changes` | Open changes | `authorisation.roles:view` |
| `GET /api/authorisation/groups/:groupId/assignments` | Live assignments with provenance | `authorisation.roles:view` |
| `GET /api/authorisation/groups/:groupId/access` | Default roles and review interval | `authorisation.roles:view` |
| `GET /api/authorisation/groups/:groupId/access-review` | The access review | `authorisation.role-assignments:manage` |
| `GET /api/authorisation/groups/:groupId/grants` | Grants bound to the group | `authorisation.grants:manage` |
| `GET /api/authorisation/tenants/:tenantId/roles` | Built-in and custom roles with their risk | `authorisation.roles:view` in a group of the tenant the caller belongs to |
| `GET /api/authorisation/visible-groups?permission=` | The caller's visible groups | Signed in |
| `GET /api/authorisation/me` | The caller's own live assignments | Signed in |

| Code | HTTP | Meaning |
|---|---|---|
| `unauthenticated` | 401 | No signed-in subject |
| `forbidden` | 403 | Refused. Never says why, or whether anything exists |
| `insufficient-assurance` | 403 | Permitted after step-up or re-authentication |
| `validation-failed` | 400 | Malformed input |
| `conflict` | 409 | A rule refused a change; answered only to a caller entitled to see the change |
| `unavailable` | 503 | A port, the database or the clock failed |

The body is `{ code, messageKey, reason? }`, with `messageKey` `authorisation.error.<code>`. `reason` appears only with `conflict` and `validation-failed`, as a rule code such as `self-grant`, `owner-role`, `own-request`, `change-differs`, `not-eligible` or `reference-missing` (most are listed in `CHANGE_REFUSALS` and `APPROVAL_REFUSALS`).

### Client

`useAuthorisation()` calls the HTTP API, forwarding the session cookie during server-side rendering. It is for the experience only and decides nothing. It offers `me()`, `assignments(groupId)`, `accessReview(groupId)`, `groupAccess(groupId)`, `grants(groupId)`, `changes(groupId)`, `tenantRoles(tenantId)`, `requestChange(request)`, `change(changeId)`, `decideChange({ changeId, changeDigest }, decision)`, `cancelChange(changeId)` and `share(input, justification)`.

`share` lets a domain capability request a `grant.create` for a resource it owns: `input` is `{ resource: { type, id, owningGroupId }, with: { kind: 'principal', principalId } | { kind: 'group', groupId }, permissions, expiresAt? }`.

## Permissions

Authorisation asks about every permission the host supplies, and adds its own:

| Permission | Risk | Effect | Guards |
|---|---|---|---|
| `authorisation.roles:view` | low | view | A group's roles, assignments, access settings and open changes; a tenant's roles |
| `authorisation.role-assignments:manage` | medium | change | `role.assign`, `role.unassign`, `assignment.confirm` and the access review |
| `authorisation.grants:manage` | high | change | `grant.create`, `grant.revoke` and a group's grants |
| `authorisation.group-access:manage` | high | change | A group's default roles and review interval |
| `authorisation.roles:manage` | critical | change | `role.define` and `role.delete`, on the tenant's root group |

| Risk | Default assurance |
|---|---|
| `low`, `medium` | Any authenticated session |
| `high` | `aal2` |
| `critical` | `aal2`, phishing resistant, authenticated in the last 15 minutes |

| Built-in role | Default permissions |
|---|---|
| `owner` | `*`, and every `authorisation.*:manage` permission by name |
| `administrator` | `*`, and `authorisation.grants:manage` |
| `member` | `*:view`, `*:create` |
| `viewer` | `*:view` |

A role pattern is an exact name, `<resource>:*`, `*:<action>` or `*`. **Wildcards never cover `high` or `critical` permissions.** A pattern may carry conditions (`when`), all of which must hold: `{ attribute, operator, value }`, where `attribute` is `resource.creatorPrincipalId` or `resource.attributes.<name>`, `operator` is `equals`, `not-equals`, `in` or `not-in`, and `value` is a literal, a list for `in` and `not-in`, or `{ ref: 'subject.principalId' }`. A missing attribute fails every condition. Tenants may define custom roles; a custom role never reuses a built-in identifier.

## Screens

The presentation part offers four pages for tenant and group administrators, drawn only with Theme Manager's `SemanticPresentationTheme` vocabulary:

| Page | Key | Default path | Shows |
|---|---|---|---|
| Group access | `groupAccess` | `/groups/:groupId/access` | Roles held, with requests to give and take them; default roles and review interval; the access review; changes waiting |
| Sharing | `sharing` | `/groups/:groupId/sharing` | The group's grants, with requests to stop each |
| Tenant roles | `tenantRoles` | `/tenants/:tenantId/roles` | Built-in and custom roles; requests to define, change and delete custom roles |
| Change | `change` | `/access-changes/:changeId` | What a change does and how it is approved; approve, reject or withdraw |

Components, auto-imported: `AuthorisationGroupAccess`, `AuthorisationSharing`, `AuthorisationChanges` (each takes `groupId`), `AuthorisationTenantRoles` (`tenantId`), `AuthorisationChange` (`changeId`), `AuthorisationAssignments`, `AuthorisationAccessReview` (`groupId`, `roles`), `AuthorisationDefaultRoles` (`access`, `roles`), `AuthorisationChangeNotice` (`change`), `AuthorisationJustification`, `AuthorisationAlert`, `AuthorisationSignedOut`, `AuthorisationUnavailable` and `AuthorisationPersonName` (`principalId`). Composables: `useAuthorisationText()`, `useAuthorisationAction()` and `useAuthorisationRoutes()`.

Styling: with the pages, the host's stylesheet imports Theme Manager's presentation stylesheet and then `@nuxt-layers/authorisation/tailwind.css`. Authorisation has no package dependency on Theme Manager; without it the screens work, unstyled.

Wording: the message catalogue is `AUTHORISATION_MESSAGES_EN_GB`, keyed by `AuthorisationMessageKey`; the keys are part of this contract. Every key starts `authorisation.` followed by one of `access`, `assignments`, `builtInRole`, `change`, `changeState`, `changeType`, `changes`, `common`, `defaults`, `error`, `justification`, `outcome`, `person`, `reason`, `review`, `risk`, `roles`, `route`, `scope` or `sharing`. `{name}` placeholders are filled from parameters.

People: the screens never show a name. `AuthorisationPersonName` shows an opaque placeholder; a host that composes Profile replaces it with a component of the same name.

Switching off: see *Settings*.

## Headless surface

A host that draws its own screens must still:

- send state-changing requests from the configured origin, and never frame or cache administration screens or leak their paths in a `Referer` (the default pages set `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` and `Cache-Control: no-store`);
- show the change's `changeDigest` and send it back unchanged with an approval;
- collect a justification for every change: a reason code, and a reference where the group requires one, never free text;
- treat everything from `useAuthorisation()` as a hint: the server decides again;
- send a person to step up on `insufficient-assurance`, and say nothing more than `forbidden` allows;
- name people only through the host's own component, never from an identifier;
- meet WCAG 2.2 AA in light and dark mode, and keep these pairings legible in its theme: `pen-muted-default` on `fill-base-default`, `edge-error-default` on `fill-input-default`, and `edge-base-active` on `fill-base-default`.

## You will hit this

- **Identifiers.** Principals, groups, tenants, roles and resources match `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`: no `@`, no spaces. Changes, grants, events and correlations are lower-case UUIDs. A reason code matches `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`; a reference matches `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,63}$`.
- **Deny by default.** An unknown permission, principal or group is refused. There is no superuser.
- **No implicit inheritance.** A role reaches child groups only when its assignment is scoped `group-and-descendants`, which is always `critical`.
- **Leaving ends access.** A role or grant counts only while its holder is an active member, including for what they created.
- **No self-grant.** Outside their own personal group, nobody assigns themselves a role, confirms their own assignment or shares with themselves. Activating one's own eligible assignment is the one exception, and takes that assignment's approval route.
- **`owner` follows Identity.** It is never assigned, removed or made a default role through a change.
- **A second person.** `high` and `critical` changes need at least one approver who is not the requester, the beneficiary or an identity the requester controls. With no approver anywhere, the change waits for Identity's published delay.
- **Service identities** hold roles like anyone, but never request, decide or approve a change, and are never allowed a `critical` permission.
- **Grants stay in the tenant** unless `externalGrants` is on, and are bound to the owning group named when shared.
- **Guests.** A guest's default role may never hold a `high` or `critical` permission.
- **Role documents** carry the format identifier `nuxt4-layers.authorisation.roles` (`AUTHORISATION_ROLE_DOCUMENT_FORMAT`). It names the document format, not the package, and is unchanged so that existing documents and their digests stay valid.
- **Unset base URL.** Without `NUXT_AUTHORISATION_BASE_URL` every state-changing request is `forbidden`.
