# Authorisation Development Plan

> **In short:** remaining work needed to align Authorisation with the current Nuxt Layers architecture and development workflow.

## Next

- Reconcile the package name, repository URL and cross-layer imports with the renamed `nuxt-layers` organisation; coordinate changes with consuming layers.
- Align CI and documented tooling after agreeing the supported Node, Corepack, pnpm and PostgreSQL versions. Current configuration remains authoritative until changed.
- Review transitive dependency overrides for compatibility and outstanding advisories.
- Verify and restore cross-capability architectural references when the relevant `iam-integration` process documents become available.
- Review the public contract and other documentation against the current architecture rules without changing behaviour unintentionally.

## Completed

- Initial capability implementation and access-administration functionality.
- Unit, integration, browser and accessibility testing for the original implementation.
- Relocation of the detailed capability contract to root `CONTRACT.md`.

This plan records work, not a release promise. Formal development release milestones are suspended under ADR-0008.
