# Plan

> **In short:** what Authorisation has delivered, and the work still open to meet the governing architecture. External documents named here are listed in [Resources](RESOURCES.md).

## Next

Open work, in order. Each item is its own pull request with tests, and keeps `pnpm check` green.

| Item | Why | Status |
|---|---|---|
| Minimal host | ADR-0012 §4 and Layer Standard §6 ask for `examples/minimal-host`, composing Authorisation alone within the 50-line budget, built and smoke-tested in CI with a budget check. `playground/` proves composition today but is not budget-checked | Not started |
| Shared composition shapes | ADR-0012 §2 names the shared shapes (`resolveCaller`, `decide`, `tasks`, `relay()`). Authorisation's ports predate them: its subject resolver returns the signed-in principal, not `{ tenantId, subjectId, assurance }`, and maintenance and the relay are two functions, not `tasks`. Reconcile with iam-integration, which returns the shared shapes for the suite, without weakening assurance or tenant isolation | Needs a decision |
| Port fakes in the package | ADR-0012 §3 asks each capability to ship fakes of its ports, refused outside test configuration. The fakes live in `tests/` and `playground/` today | Not started |
| Switching the HTTP API off | ADR-0009 and Architecture §4 let a host switch a capability's HTTP API off. Only the presentation part can be switched off today | Not started |
| Development toolchain | ADR-0013 names Node.js 26 LTS and pnpm 12 as the development and CI baseline, piloted here. CI runs Node.js 22 with pnpm 10, through Corepack. TypeScript is already 6.0.3. Move after compatibility is verified; the consumer minimum stays Node.js 22 unless a runtime dependency needs more | Not started |
| Clock capability | The catalogue gives dates, times and temporal arithmetic to `clock`. Authorisation takes the current time through the shared `now()` shape and does its own duration arithmetic and `Intl` formatting. Decide whether to require `clock` | Needs a decision |
| Markdown check | ADR-0004 and ADR-0010 expect a check for headings, local links and external links outside `RESOURCES.md`. None runs here yet | Not started |
| Contract acceptance | ADR-0012 asks for a consumer test proving `CONTRACT.md` alone is enough to compose the capability | Not started |

## Done

| Phase | Scope | Status |
|---|---|---|
| 1. Foundation | Package, manifest, public contract (subject, permissions, resources and lineage, roles, conditions, grants, decisions, errors, events, policy, ports), composition registry (fail closed), permission catalogue, pure decision engine, docs, threat model, CI, playground | Complete |
| 1a. Group model (contract 2) | Reconcile with the group model (then the Group Model Definition v0.1, now Identity and Access): no implicit hierarchy inheritance (explicit assignment scope), tenant as a separate check, creator provenance without access, membership status, nullable personal group, personal-group role as policy, directory consistency levels for revocation | Complete |
| 2. Core | PostgreSQL schema and migrations for custom roles, role assignments (with scope) and grants; `authorise(event, permission, resource)` and `requireAuthorisation(...)` server functions that gather facts from the directory (`strong` reads for high and critical permissions, `bounded` otherwise) and database; denial and change events; last-owner protection; revocation tests | Complete: storage, `authorise`/`requireAuthorisation`, approval qualification (`authorisationQualifies`, `countAuthorisationQualifying`), assignment, custom-role and grant server functions with events; last-owner protection is Identity's |
| 2a. Paused members (contract 3) | `paused` membership status and principal `status`; `effect: 'view' \| 'change'` on catalogue permissions (default `change`); paused standing confers only `view` at `low` or `medium` risk on every route, the personal group and grants included; `paused` denial reason | Complete |
| 2b. Data-subject requests | `exportAuthorisationData` (assignments and grants held) for Profile's coordination, and `eraseAuthorisationPrincipal` on account closure (`authorisation.principal-erased`), through iam-integration's adapters | Complete |
| 3. Administration (contract 4) | Access administration as iam-integration's access administration and approvals set out: pending changes with approval routes, step-up, recovery holds, digests and every rule re-checked when applying; the governance port; a transactional outbox (`relayAuthorisationOutbox`); per-group default roles (`authorisationDefaultRoles`), time-limited assignments, access reviews and maintenance (`runAuthorisationMaintenance`); roles as versioned documents (`exportAuthorisationRoles`, `importAuthorisationRoles`); `/api/authorisation/*` endpoints behind the subject resolver and an origin check; `useAuthorisation()` for user-experience hints only | Complete |
| 4. Default pages | Accessible (WCAG 2.2 AA, light and dark), localisable group access, sharing, tenant roles and change pages through the `SemanticPresentationTheme` vocabulary; movable and disable-able; overridable `AuthorisationPersonName`; Playwright with axe in CI | Complete |
| 5. Host integration | Composition into `platform-test-harness` beside Authentication, with a directory adapter, negative isolation tests and end-to-end tests; the suite's optional clock port (`provideAuthorisationClock`, iam-integration's architecture §7), from which grant expiry, authentication age and every recorded time are taken, failing closed on an invalid time | Complete |
| 6. End of life | iam-integration's group deletion, tenant lifecycle and retention processes ([contract](docs/contracts.md) §19): `disposeAuthorisationGroup` and `disposeAuthorisationTenant` with their outbox confirmations, `exportAuthorisationTenantData`, retention of delivered events and decided changes under the optional legal-hold port | Complete |
| 7. Service identities | Authorisation's part of iam-integration's service identities process: the actor's `kind` in the directory port (`AuthorisationActorContext.kind`, `AUTHORISATION_PRINCIPAL_KINDS`) and the subject's `kind` from Authentication; a service identity holds roles through its memberships like anyone but never requests, decides or qualifies to approve a change | Complete |
| 8. Just-in-time elevation and visible scopes | Eligible assignments, activated by their holder through `role.activate` for up to eight hours with the assignment's own approval route (iam-integration improvement register item 7); `listAuthorisationVisibleGroups` and `GET /api/authorisation/visible-groups` for listing pages (contracts §20) | Complete |
| 9. Release 1.0 | Contract version 4 released as 1.0.0 with `CHANGELOG.md` and the `v1.0.0` tag, which remains a historical record: formal releases are suspended during development (ADR-0008) | Complete |
| 10. Organisation migration | Identity moved from the version-specific organisation and package scope to `nuxt-layers` and `@nuxt-layers`; Theme Manager followed on `master`; root `CONTRACT.md`, `RESOURCES.md`, `PLAN.md` and `STORAGE-REGISTER.md` | Complete |

## Dependencies on other capabilities

- **Identity** owns users, groups, group types, the single-parent hierarchy, memberships and their lifecycle (including pausing), and the personal group created with every human identity (Identity and Access §3). A host adapts its directory to `AuthorisationDirectory`; iam-integration provides the reference adapter.
- **Tenancy**: tenants come through the directory port today. If a separate tenancy capability is introduced (the catalogue lists `tenancy-service` as a candidate), the host adapts it into the same port.
- **Authentication** supplies the subject. The host passes `AuthenticatedPrincipal`, which satisfies `AuthorisationSubject` structurally.

## Deliberate exclusions

- Groups, memberships, invitations and profile data: Identity.
- Sign-in, sessions and step-up: Authentication. This layer only says which assurance a decision needs.
- Superuser bypasses, client-side enforcement and time, IP or geography rules (see the [legacy review](docs/legacy-review.md)).
