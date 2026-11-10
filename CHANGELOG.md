# Changelog

> **In short:** major changes to `@nuxt-layers/authorisation`, newest first. Formal release versions are suspended during development and resume when a release lifecycle is approved; the 1.0.0 entry is a historical record.

## 2026-11-10

- **Breaking for hosts:** the package is `@nuxt-layers/authorisation`, in the `nuxt-layers` organisation; it was `@nuxt4-layers/authorisation`. Hosts change their dependency to the Git-backed `master` of the new repository, and their `extends`, `/contracts`, `/presentation` and `/tailwind.css` imports to the new scope. No function, type, endpoint, event, setting, permission, message key or database object is renamed.
- The role document format identifier stays `nuxt4-layers.authorisation.roles`, so existing role documents and their digests remain valid.
- Theme Manager, a development dependency, is `@nuxt-layers/theme-manager` and follows its `master`; the lockfile records the resolved commit.
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
