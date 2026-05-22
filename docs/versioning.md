# Versioning & Publishing Guide

Versioning and publishing for `@hanivanrizky/nestjs-xpath-parser` are handled by
[release-it](https://github.com/release-it/release-it) with the
[`@release-it/conventional-changelog`](https://github.com/release-it/conventional-changelog)
plugin. Configuration lives in [`.release-it.json`](../.release-it.json).

## Table of Contents

- [Semantic Versioning](#semantic-versioning)
- [How Releases Work](#how-releases-work)
- [Releasing](#releasing)
- [Conventional Commits](#conventional-commits)
- [Troubleshooting](#troubleshooting)

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0
│ │ └─ PATCH: Bug fixes (backward compatible)
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes
```

The next version is inferred automatically from your
[conventional commit](#conventional-commits) messages (`fix:` → patch,
`feat:` → minor, `BREAKING CHANGE` → major).

## How Releases Work

A single `pnpm release` runs the full pipeline defined in `.release-it.json`:

1. **`before:init`** — runs `pnpm test` and `pnpm build`.
2. **Version bump** — computed from conventional commits.
3. **Changelog** — `CHANGELOG.md` is regenerated (angular preset).
4. **`after:bump`** — runs `pnpm build` again so `dist/` matches the new version.
5. **Git** — commits (`chore: release v${version}`), tags (`v${version}`), and pushes.
6. **npm** — publishes with `--access public`.
7. **GitHub** — creates a GitHub Release (requires `GITHUB_TOKEN`; otherwise falls
   back to a web-based release page).

Guards: the working dir must be clean, the branch must be `main`/`master`, and an
upstream must be configured.

## Releasing

```bash
# Preview everything without changing anything
pnpm release:dry

# Interactive release
pnpm release
```

> **Run releases in a real terminal.** `release-it` prompts for confirmation
> before publishing. Without an interactive TTY (e.g. piped/non-interactive
> shells) it will appear to hang while waiting on that prompt. To release
> non-interactively (CI), run `release-it --ci` and provide `GITHUB_TOKEN` and
> npm auth via the environment.

### GitHub Releases

Set a token so release-it can create the GitHub Release automatically:

```bash
export GITHUB_TOKEN=your_token_here
pnpm release
```

Without `GITHUB_TOKEN`, release-it falls back to opening a web-based release page.

## Conventional Commits

Version bumps and the changelog are derived from commit messages:

| Prefix             | Bump  | Example                                  |
| ------------------ | ----- | ---------------------------------------- |
| `fix:`             | patch | `fix: handle empty xpath result`         |
| `feat:`            | minor | `feat: add cycletls fingerprint support` |
| `BREAKING CHANGE:` | major | footer or `feat!:` subject               |
| `chore:`/`docs:`/… | none  | excluded from version bump               |

## Troubleshooting

**Release seems stuck / hangs.** It is waiting on the interactive confirmation
prompt. Run it in a real terminal, or use `release-it --ci` for automation.

**`requireCleanWorkingDir` error.** Commit or stash changes first — the working
tree must be clean.

**Wrong branch.** Releases are only allowed from `main`/`master`
(`requireBranch`).

**No upstream.** Set one with `git push -u origin main` (`requireUpstream`).

**GitHub Release not created.** Export `GITHUB_TOKEN` before releasing.
