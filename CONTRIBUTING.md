# Contributing

> **In short:** branch from `master`, make a focused, tested change, and open a pull request; security comes first.

Thank you for helping. This layer decides who may do what, so changes are
reviewed with security first. Read [CLAUDE.md](CLAUDE.md) for the project rules
and [docs/threat-model.md](docs/threat-model.md) before changing server code.

## Workflow

1. Fork the repository and branch from `master`.
2. Make a focused change with tests. Run `pnpm check`. A change to the decision
   engine needs a negative test showing what it must still refuse.
3. Open a pull request. A maintainer approves CI for first-time contributors;
   every pull request needs a code owner's review and a green Quality check
   before it is merged.

Commits to `master` must be signed. Sign yours with SSH or GPG, or a maintainer will squash-merge (GitHub signs the merge commit).

## Dependencies

Add a dependency only when necessary, and say why in the pull request. New
dependencies must be maintained, MIT-compatible and free of install scripts.
Always commit `pnpm-lock.yaml`.

Another layer is a Git-backed dependency following its latest accepted `master`,
never a tag or commit pin. Refresh the lockfile when that `master` advances; the
lockfile records the resolved commit, and CI installs from it frozen.

## Documents

A change to the public interface updates [CONTRACT.md](CONTRACT.md) in the same
pull request. External documents are linked only from [RESOURCES.md](RESOURCES.md);
plans and status live only in [PLAN.md](PLAN.md). British spelling throughout.

## Security issues

Never in public issues or pull requests: see [SECURITY.md](SECURITY.md).
