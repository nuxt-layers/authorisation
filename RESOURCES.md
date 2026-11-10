# Resources

> **In short:** the external architectural documents Authorisation relies on, each at the verified revision reviewed. Other documents name these entries instead of linking outside the repository.

## Governing architecture

Reviewed at `nuxt-layers/architecture-rules` commit `3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2`.

| Entry | Governs | Verified reference |
|---|---|---|
| Architecture | The model, invariants and authority order | [Architecture](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/architecture.md) |
| Layer Standard | Repository layout, public surface, manifest, consumption and versioning | [Layer Standard](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/layer-standard.md) |
| Identity and Access | The group model, memberships, ownership, authorisation and revocation | [Identity and Access](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/identity.md) |
| Security | The assurance baseline, control register and data-store controls | [Security](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/security.md) |
| Privacy | Data minimisation and the storage register | [Privacy](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/privacy.md) |
| Presentation | The semantic vocabulary, internationalisation and accessibility | [Presentation](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/presentation.md) |
| Capability Catalogue | What Authorisation owns, and the capabilities beside it | [Catalogue](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/catalogue.md) |
| Contributing | The AI-driven development method | [Contributing](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/CONTRIBUTING.md) |
| ADR-0001 | Capability repositories and composition roots | [ADR-0001](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0001-capability-repositories-and-composition-shells.md) |
| ADR-0002 | Host-supplied persistence and capability-owned schemas | [ADR-0002](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0002-composition-supplied-persistence-and-capability-owned-schemas.md) |
| ADR-0003 | The group model | [ADR-0003](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0003-group-model-and-identity-first.md) |
| ADR-0004 | Where documents live | [ADR-0004](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0004-documentation-placement.md) |
| ADR-0005 | The IAM suite | [ADR-0005](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0005-iam-suite.md) |
| ADR-0006 | Data-store security and visible scopes | [ADR-0006](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0006-polyglot-persistence-and-data-store-security.md) |
| ADR-0007 | Break-glass emergency access | [ADR-0007](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0007-break-glass-emergency-access.md) |
| ADR-0008 | Development on the latest accepted `master`; no release pins | [ADR-0008](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0008-independent-layer-delivery.md) |
| ADR-0009 | Headless core and optional presentation part | [ADR-0009](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0009-headless-capability-layers.md) |
| ADR-0010 | Documentation style and the root files | [ADR-0010](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0010-documentation-style.md) |
| ADR-0012 | Trivial composition, shared shapes and the consumer contract | [ADR-0012](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0012-trivial-composition.md) |
| ADR-0013 | The development toolchain baseline | [ADR-0013](https://github.com/nuxt-layers/architecture-rules/blob/3436b1cc2a33401a7c3f08d5bc9ee9fe11ea93d2/docs/decisions/ADR-0013-development-toolchain-baseline.md) |

## IAM suite processes

Documents of `nuxt-layers/iam-integration`, each at the revision reviewed when the part of the contract that follows it was written.

| Entry | Governs | Verified reference |
|---|---|---|
| iam-integration: access administration | Pending changes and the rules they check (contract §15) | [Access administration](https://github.com/nuxt-layers/iam-integration/blob/35e86ab288fed79848b513a98cfbd98304a3cb26/docs/processes/access-administration.md) |
| iam-integration: approvals | Approval routes, safety periods and holds (contract §15) | [Approvals](https://github.com/nuxt-layers/iam-integration/blob/35e86ab288fed79848b513a98cfbd98304a3cb26/docs/processes/approvals.md) |
| iam-integration: architecture, events | Relaying the outbox to its consumers (contract §8) | [Architecture](https://github.com/nuxt-layers/iam-integration/blob/35e86ab288fed79848b513a98cfbd98304a3cb26/docs/architecture.md) |
| iam-integration: architecture, time | The suite's clock (contract §13) | [Architecture](https://github.com/nuxt-layers/iam-integration/blob/e986245d746507bf7093ca203e346ab1b571e3a8/docs/architecture.md) |
| iam-integration: group deletion | Group disposal (contract §19) | [Group deletion](https://github.com/nuxt-layers/iam-integration/blob/9d84e3ee22ab9a58df79d880fdc288381b645ebd/docs/processes/group-deletion.md) |
| iam-integration: tenant lifecycle | Tenant disposal and the governance export (contract §19) | [Tenant lifecycle](https://github.com/nuxt-layers/iam-integration/blob/9d84e3ee22ab9a58df79d880fdc288381b645ebd/docs/processes/tenant-lifecycle.md) |
| iam-integration: retention | Retention and legal holds (contract §19) | [Retention](https://github.com/nuxt-layers/iam-integration/blob/9d84e3ee22ab9a58df79d880fdc288381b645ebd/docs/processes/retention.md) |
| iam-integration: service identities | Service identities (contract §15) | [Service identities](https://github.com/nuxt-layers/iam-integration/blob/69eb3df32eed2a62257e711243976cbc268c1b62/docs/processes/service-identities.md) |

Software dependencies are not listed here: they follow the latest accepted upstream `master` (ADR-0008), and the lockfile records what was resolved.
