# Changelog

> **In short:** major changes to `@nuxt-layers/authorisation`, newest first. Formal release versions are suspended during development and resume when a release lifecycle is approved; the 1.0.0 entry is a historical record.

## 2026-11-10

- `node-forge` is 1.4.3, which fixes the advisory accepted for 1.4.0; its exception is removed from dependency review and the threat model. Dependabot no longer proposes TypeScript 7 or `h3` 2, which the current Nuxt cannot use.
- **Clock does all date and time work.** Authorisation requires the `Clock` capability (`@nuxt-layers/clock`, a package dependency following `master`) and no longer parses, compares, adds to or formats times itself; `tests/time.test.ts` fails if that returns. The host's `now()` clock port is unchanged.
- **Breaking for hosts:** add `@nuxt-layers/clock` to the host's dependencies and `extends`. The minimums are now Node.js 26.13 (`engines`) and Nuxt 4.6 (peer), and the screens need a browser with native `Temporal`.
- **Breaking:** instants are answered, stored in JSON and published in Clock's canonical form, which leaves a zero fraction out (`2030-01-08T00:00:00Z`, not `…00.000Z`). Compare instants, do not match them as text. Changes already recorded keep their digests.
- **Breaking:** an instant passed to a server function must be RFC 3339 with seconds; looser date strings are `validation-failed`.
- **Breaking for contract importers:** `meetsStepUp` and `refuseApproval` take the session's age in seconds (`authenticationAgeSeconds`) in place of `now`, so the contract does no time arithmetic.
- The screens show dates and times in the zone the host gives Clock (`runtimeConfig.public.clock.timeZone`, `UTC` by default) and name it, the same on the server and in the browser; before, each used its own local zone. An end date is read as the start of that day in that zone.

- **Breaking for hosts:** the package is `@nuxt-layers/authorisation`, in the `nuxt-layers` organisation; it was `@nuxt4-layers/authorisation`. Hosts change their dependency to the Git-backed `master` of the new repository, and their `extends`, `/contracts`, `/presentation` and `/tailwind.css` imports to the new scope. No function, type, endpoint, event, setting, permission, message key or database object is renamed; the role document format identifier is (below).
- **Breaking for operators:** the role document format identifier (`AUTHORISATION_ROLE_DOCUMENT_FORMAT`) is `nuxt-layers.authorisation.roles`. The digest covers it, so a role document exported before this change is refused on import; export it again from the tenant. Nothing stored in the database changes.
- Theme Manager, a development dependency, is `@nuxt-layers/theme-manager` and follows its `master`; the lockfile records the resolved commit.
- Development toolchain (ADR-0013): pnpm 12 through Corepack and Node.js 26.13.0 in CI; `zod` 4.6.7, Nuxt 4.6.3 and Node.js 26 types for development. The supported ranges for hosts (`nuxt ^4.5.0`, Node.js 22 or later) are unchanged.
- New root documents: `CONTRACT.md` (the complete consumer contract, replacing `docs/composition-contract.md`), `RESOURCES.md` (the only place external documents are linked), `PLAN.md` (replacing `docs/roadmap.md`) and `STORAGE-REGISTER.md`.
- Development follows the latest accepted `master` of each dependency; pinning to a tag or commit is no longer advised. Semantic versioning and the freeze of contract version 4 for 1.x are withdrawn until releases resume. Contract changes remain explicit, documented and tested.

## 2026-10-18

- The layer's own tests pass on Windows as well as on Linux and macOS: the paths they compare with import specifiers and routes are written with `/` on every platform (`tests/support/paths.ts`). On Windows the contract, architecture and endpoint tests used to fail, or check nothing.

## 1.0.0 (2026-10-11)

Historical: released as `@nuxt4-layers/authorisation` and tagged `v1.0.0`, with everything in contract version 4.

- Deny-by-default decisions over roles, assignment scopes and grants, with tenant isolation, paused members and step-up requirements by risk.
- Access administration through pending changes with approvals, no self-grant, a transactional outbox, default roles, time-limited assignments, access reviews and role documents.
- Just-in-time elevation of eligible assignments and the visible-scopes query.
- Service identities refused as requesters and approvers; end of life and retention.
- The `/api/authorisation/*` endpoints and the accessible default pages.
