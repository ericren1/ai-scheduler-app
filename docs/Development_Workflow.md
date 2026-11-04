# Personal Hub development workflow

Personal Hub was formerly named AI Scheduler. Existing repository names and historical commit messages are retained until a separate rename is approved.

## Branches

`main` represents stable, reviewed, working code. Do substantial work on a short-lived branch:

| Prefix | Purpose | Example |
| --- | --- | --- |
| `feature/` | New functionality | `feature/manual-session-creation` |
| `fix/` | Bug fixes | `fix/calendar-visible-hours` |
| `refactor/` | Structural improvements | `refactor/calendar-selectors` |
| `docs/` | Documentation only | `docs/calendar-architecture` |

Use lowercase names with hyphens. Avoid long-lived development branches and unrelated changes in a feature PR.

Before beginning work:

```sh
git status
git switch main
git fetch origin
git pull --ff-only origin main
git switch -c feature/example
```

Inspect the working tree before switching. If it has uncommitted work, stop and agree on preservation before switching: an approved commit on its current feature branch, a new branch at the same HEAD, or an explicitly approved stash including untracked files. Never discard changes to make a switch succeed. If fast-forward synchronization fails, inspect the divergence rather than resetting or forcing it.

## Commits and pushes

Commit a small, coherent increment after reviewing its changes and running relevant checks. A commit is a local checkpoint; a push publishes commits to GitHub for backup and collaboration. Do not commit every file edit or combine unrelated work just because files changed together.

Use conventional commit subjects:

- `feat: add read-only weekly calendar`
- `fix: align sessions with DST hour labels`
- `refactor: separate calendar selectors from rendering`
- `test: cover overnight session clipping`
- `docs: describe development workflow`
- `chore: exclude local credentials from version control`

An optional scope is welcome, such as `fix(calendar): clip sessions to visible hours`. Explain substantial tradeoffs in the commit body. Preserve existing commits; do not amend or rebase published history merely to improve its appearance.

Before staging, inspect `git diff`, `git status --short`, and untracked files. Stage explicit paths, then review `git diff --cached` and `git diff --cached --check`. Never commit secrets, credentials, `.env` files, dependencies, or generated build artifacts. Ignore rules are a safeguard, not a substitute for review, and do not remove previously tracked files. If a secret is exposed, rotate it and agree on remediation before altering history.

Push a feature branch regularly after authorization:

```sh
git push -u origin feature/example
```

Never force-push or push unfinished feature work directly to `main`.

## Validation and pull requests

From `frontend`, run:

```sh
npm ci
npm test
npm run lint
npm run build
```

The Node test runner requires a version supporting TypeScript stripping; Node 22.18+ is the current project recommendation. Run `npm ci` when preparing a fresh environment or checking dependency reproducibility. For ordinary edits with installed dependencies, run tests, lint, and build without reinstalling. Unit tests do not substitute for browser review of navigation, accessibility, responsive layout, and visual positioning.

Open a PR targeting `main` when the feature is ready. Use a draft PR if meaningful work or required validation remains. Include the problem, resulting behavior, validation performed, manual testing steps, and known limitations. Reference relevant specifications or issues. Check the GitHub diff for accidental files and ensure the base and head branches are correct.

Review the final changes, test results, and any automated checks. Address feedback with further commits and rerun checks appropriate to the changes. Browser checks must be reported as pending if they were not actually performed. Do not claim CI passed unless a workflow ran successfully; local validation is separate evidence.

Merge only after review, successful validation, and explicit approval. Prefer GitHub's merge-commit option during the initial migration so existing commit history is preserved. Do not automatically merge a PR or bypass failing checks. Repository branch protections and required checks must be configured separately; this document does not enforce them.

## After merging

With a clean working tree:

```sh
git switch main
git fetch origin
git pull --ff-only origin main
```

Confirm the feature commits are included in `origin/main`. Optionally delete a fully merged local feature branch with `git branch -d feature/example`; remote branch cleanup is a separate approved operation. Start the next feature from the updated `main`, not the previous feature branch. If work intentionally depends on an unmerged PR, document that dependency and PR base explicitly instead of silently stacking branches.

## Codex Git operations

Codex inspects branch, dirty/staged/untracked files, upstream divergence, recent history, and in-progress operations before substantial work. It preserves user changes and avoids resets, force-pushes, destructive cleanup, and unsolicited history rewrites.

Codex may create branches and meaningful local commits for approved implementation work after review and validation. It must ask before switching away from uncommitted work unless the user already approved the preservation/switch plan. Pushing, opening PRs, and merging require explicit authorization; authorization may cover multiple operations within a clearly defined task, so do not ask again for actions already approved. Permission to push or open a PR does not imply permission to merge.

Never commit generated artifacts, secrets, credentials, or `.env` files. Report branch names, commit subjects, PR links, validation outcomes, and outstanding review work. If authentication or tooling prevents publication, preserve local work and report the exact remaining operation.

## Initial workflow migration

The weekly calendar branch starts at the existing local foundation commit and carries the previously uncommitted calendar UI. The foundation commit keeps its original hash and message. Local `main` temporarily retains that foundation commit ahead of GitHub; it is not reset. After the reviewed calendar PR is merged with a merge commit, local `main` can fast-forward to GitHub without rewriting history.
