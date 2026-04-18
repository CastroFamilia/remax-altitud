---
description: Commit, push, and create a GitHub Pull Request from the current branch using the walkthrough as description
---

# Create a Pull Request

// turbo-all

## Steps

1. **Get the current branch**:
   - Run `git branch --show-current` to get the source branch name.
   - If the current branch is `master`, STOP and warn the user — do not create a PR from `master`.
   - If the current branch is `development`, this is a **release PR** — target must be `master`. Skip to step 3.

2. **Commit and push uncommitted changes**:
   - Run `git status` and `git diff --stat` to identify all uncommitted changes.
   - If there are uncommitted changes:
     1. Analyze the changed files and group them into logical commits.
     2. For each group:
        - **Stage**: Run `git add <path/to/files>` for the files in this group.
        - **Message**: Generate a commit message using `<type>: <description>` (see Allowed Commit Types below).
        - **Commit**: Run `git commit -m "<type>: <description>"`.
     3. Run `git push origin <current-branch>` to push all commits.
   - If there are no uncommitted changes, ensure the branch is pushed:
     - Run `git push origin <current-branch>` (safe to run even if already up-to-date).

3. **Lint Check**:
   - Run `npm run lint` to check for lint errors.
   - If lint errors are found:
     1. Run `npm run lint:fix` to auto-fix.
     2. Stage the fixed files: `git add -A`.
     3. Amend the last commit: `git commit --amend --no-edit`.
     4. Push again: `git push origin <current-branch> --force-with-lease`.
     5. Re-run `npm run lint` to verify all errors are resolved.
     6. If lint still fails after auto-fix, **STOP**. Report the remaining lint errors to the user and do NOT proceed.

4. **Pre-PR build verification**:
   Run the production build to ensure the code compiles without errors before creating the PR.

   ```bash
   npm run build
   ```

   Confirm: `✓ Compiled successfully` and zero errors.
   If the build fails, STOP immediately, report the failure to the user, and do NOT proceed to create the PR.

5. **Determine the PR type**:
   - For **release PRs** (`development` → `master`), the type is always `Release`.
   - For feature branch PRs, ask the user (or infer from the branch name). Common types:
     - `Feature` — new functionality
     - `Fix` — bug fix
     - `Refactor` — code restructuring
     - `Chore` — tooling, deps, build
     - `Docs` — documentation only
     - `Test` — adding/correcting tests
     - `Perf` — performance improvement

6. **Build the PR title and body**:
   - **For feature branch PRs**:
     - Read the **walkthrough.md** artifact from the current conversation's brain directory (`<appDataDir>/brain/<conversation-id>/walkthrough.md`).
     - If no walkthrough exists, **generate one automatically**:
       1. Review the current conversation's chat history (task logs and artifacts in `<appDataDir>/brain/<conversation-id>/`) to understand all changes made.
       2. Also review `git log development..<current-branch> --oneline` and `git diff development..<current-branch> --stat` to understand the full scope of changes.
       3. Write a comprehensive `walkthrough.md` that includes:
          - A `# Title` heading summarizing the feature/change.
          - An **Overview** section with a brief description.
          - A **Changes** section listing all modified/created files with explanations.
          - A **Testing** section noting how the changes were verified.
       4. Save the generated walkthrough as an artifact (`walkthrough.md`) before proceeding.
     - Extract the **title** from the first `# Heading` in the walkthrough (strip the `# ` prefix and any trailing ` — Walkthrough` suffix).
     - Build the PR title as: `<Type> : <Title>` (e.g., `Feature : AI Context Enrichment`).
     - Use the **entire walkthrough content** as the PR body.
     - **Issue Linking**: Ask the user if there is a GitHub Issue number this PR should close/link to (e.g., `#12`). If they provide one, append `Closes #<issue-number>` to the bottom of the PR body.
   - **For release PRs** (`development` → `master`):
     - Run `git log master..development --oneline` to get the list of commits being merged.
     - Build the PR title as: `Release : <date>` (e.g., `Release : 2026-04-16`).
     - Build the PR body from the commit list, formatted as a markdown changelog.

7. **Determine the target branch**:
   - For **release PRs**: always `master`.
   - For feature branch PRs: user-specified or default `development`.

8. **Create the PR**:
   - Strip any `file:///` links from the body since they won't work on GitHub.
   - Run:
     ```bash
     gh pr create --base <target-branch> --head <current-branch> --title "<Type> : <Title>" --body '<PR body content>'
     ```

9. **Report**:
   - Inform the user:
     - Commits created (if any) with messages.
     - PR title and link.
     - Source branch → target branch.

## Allowed Commit Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Formatting, whitespace (no code change)                 |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `chore`    | Build process, tooling, dependencies                    |

## Constraints

- **Do not** squash distinct features into a single commit.
- **Do not** use generic messages like "fixes" or "updates".
- **Do not** invent new commit types; use strictly the ones listed above.
- **Do not** push if `git commit` fails.
- **Do not** create a PR from `master`.
- **Do not** create the PR if the build fails.
