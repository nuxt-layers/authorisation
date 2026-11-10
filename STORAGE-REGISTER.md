# Storage Register

> **In short:** the storage Authorisation creates: one PostgreSQL schema of opaque identifiers, role and permission names, codes and instants. It sets no cookie and uses no browser storage. This is a factual inventory, not a legal determination.

## Server-side storage

All of it is implemented, in one PostgreSQL schema the capability owns (`authorisation` by default; the host may name another), reached through the pool the host supplies (Resources: ADR-0002). The tables and their append-only migrations are in `server/database/migrations.ts`.

| Table | Purpose | Fields | Retention and deletion |
|---|---|---|---|
| `custom_role` | A tenant's custom roles | Tenant and role identifiers; the definition (name, description, permission patterns and conditions); created and updated instants | Until the role is deleted, or the tenant is disposed of |
| `role_assignment` | Who holds which role in which group | Principal, group and role identifiers; scope; who assigned it; created, end, confirmation and activation instants; who confirmed it; eligibility | Removed when unassigned, by maintenance once past its end, on the principal's erasure and on the group's disposal |
| `grant` | Permissions shared on one resource | Grant identifier; resource type and identifier; owning group; the principal or group it is to; permission names; expiry; who granted it; created instant | Removed when revoked, on the principal's erasure and on the group's disposal. A grant past its expiry confers nothing |
| `group_access` | A group's default roles and review interval | Group and tenant identifiers; default member and guest roles; review interval; who updated it and when; version | Until the group is disposed of |
| `pending_change` | Requested changes and their approvals | Change identifier; type; tenant, group, requester and beneficiary identifiers; risk; justification (a reason code and an optional reference); target; what the digest covers; approvals (approver, decision, instant, assurance, digest); digest; delay, expiry and hold instants; state; a failure code; correlation identifier; created and decided instants; version | Decided changes are deleted by maintenance after `retention.changeDays` (730 by default, 365 to 2555) unless a legal hold covers their group; without the legal-hold port every change is kept. Also removed on the group's or tenant's disposal |
| `outbox` | Events awaiting relay, and relayed | Sequence; event identifier and type; payload; occurred and published instants | Delivered events are deleted by maintenance after `retention.outboxDays` (30 by default, 7 to 365). Unpublished events are kept until relayed |
| `schema_migration` | Which migrations have been applied | Migration identifier; applied instant | Kept for the life of the schema |

**Personal data.** The schema holds no names, email addresses, free text or resource attributes. Principal identifiers are opaque values issued by Identity; because they relate to a person, the rows that carry them (assignments, grants, changes and the actor of each event) are pseudonymous personal data. Role names and descriptions are written by tenant administrators and are not meant to describe a person.

**Scope and isolation.** Every row carries its tenant or a group whose tenant the directory supplies; tenant isolation is checked in each decision. No other capability reads or writes the schema, and it has no cross-schema keys.

**Access and security.** Parameterised SQL only, through the host's pool; rows are validated before they reach a decision. The host owns credentials, TLS and encryption at rest, and should connect with a database role limited to this schema.

**Essential.** Yes: without the database every decision and change is refused (`unavailable`). There is no in-memory or file fallback.

**Data-subject requests.** `exportAuthorisationData` returns a principal's assignments, grants and changes; `eraseAuthorisationPrincipal` removes its assignments and grants. Records a principal made for others keep its opaque identifier as their provenance.

## Browser storage

None. Authorisation sets no cookie and writes no local storage, session storage, IndexedDB or cache. Its endpoints rely on the host's session, which Authentication owns and registers. The `authorisation_playground_principal` cookie is read only by this repository's `playground/` in test mode; it is not part of the package.

## Third-party storage

None. The optional denial sink and the outbox's `publish` hand events to the host, which decides and registers where they go.

## Consent

Authorisation supplies these facts, not a consent service. The consuming application determines notices, lawful bases, exemptions and retention periods for its jurisdiction.
