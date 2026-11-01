# Authorisation Development Plan

> **In short:** remaining work needed to align Authorisation with the current Nuxt Layers architecture and development workflow.

## Next

- Reconcile the package name, repository URL and cross-layer imports with the renamed `nuxt-layers` organisation; coordinate changes with consuming layers.
- Align CI and documented tooling after agreeing the supported Node, Corepack, pnpm and PostgreSQL versions. Current configuration remains authoritative until changed.
- Review transitive dependency overrides for compatibility and outstanding advisories.
- Verify and restore cross-capability architectural references when the relevant `iam-integration` process documents become available.
- Review the public contract and other documentation against the current architecture rules without changing behaviour unintentionally.

## Post-acceptance security audit (planned)

**Entry gate:** establish functional acceptance in an independent consuming application. Current Authorisation contract tests demonstrate six scenarios, including equivalent role entitlements for active and suspended principals. These results do not constitute comprehensive security assurance.

Conduct the audit as read-only investigation before proposing remediation. Record each finding with requirement, evidence, affected file or interface, severity, impact and recommended action. Apply small, reviewable PRs only after findings are agreed; CI and the local consumer harness provide execution evidence.

1. **Architecture and threat modelling.** Check the architecture rules, trust boundaries across Authentication, Identity, Authorisation and IAM Integration, tenant isolation, privilege escalation, emergency access, separation of duties, and fail-closed behaviour. Deliver a threat model and requirement-to-evidence mapping.
2. **Security implementation review.** Review every decision route, permission and role evaluation, grants, approval governance, step-up assurance, suspended and paused states, revocation, input validation, errors, concurrency and time-dependent controls. Deliver prioritised, source-grounded findings.
3. **Database and lifecycle audit.** Review schema and migrations, transaction isolation, tenant boundaries, least-privilege database access, race conditions, retention and erasure, outbox idempotency and operational recovery. Deliver data-integrity and lifecycle findings.
4. **Independent adversarial testing.** Extend the consuming harness with reproducible positive and negative controls for privilege escalation, cross-tenant requests, expired and revoked access, stale memberships, approval replay, concurrency and missing or failing providers. Deliver reproducible acceptance evidence; tests must not pass merely because an unrelated denial occurred.
5. **Public contract and supply-chain audit.** Compare published types and `CONTRACT.md` with actual behaviour, including semantic invariants; inspect dependencies, exports, package security, secrets, CI controls and deployment assumptions. Deliver contract discrepancies and release-readiness findings.

**Exit gate:** remediate or explicitly accept documented risks, verify all critical and high-severity findings through independent regression evidence, and record remaining limitations. Follow with a **separate suite-level IAM security audit** once Authentication, Identity, Authorisation and IAM Integration have individually passed functional acceptance and their own audits. Suite-level review must cover inter-layer trust, identity/session propagation, events, revocation timing and cross-capability privilege boundaries. Internal audit completion is not independent certification.

## Completed

- Initial capability implementation and access-administration functionality.
- Unit, integration, browser and accessibility testing for the original implementation.
- Relocation of the detailed capability contract to root `CONTRACT.md`.

This plan records work, not a release promise. Formal development release milestones are suspended under ADR-0008.
