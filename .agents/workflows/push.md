---
description: Intelligently group uncommitted changes into logical commits and push to remote
---

# Push to Remote

// turbo-all

## Steps

1. **Branch guard — auto-create feature branch if needed**:
   - Run `git branch --show-current` to get the current branch.
   - If the current branch is `master` or `development`:
     1. Inform the user that pushing directly to `master` or `development` is not allowed.
     2. Analyze the uncommitted changes to determine an appropriate branch name using the format `<type>/<short-description>` (e.g., `feat/add-price-alerts`, `fix/login-redirect`).
     3. Propose the branch name to the user.
     4. Run `git checkout -b <branch-name>` to create and switch to the new feature branch.
     5. Continue with the next steps on the new branch.

2. **Analyze repository status**:
   - Run `git status` and `git diff --stat` to identify all uncommitted changes.
   - If there are no changes, STOP and inform the user.

3. **Group changes**:
   - Analyze the changed files in the context of recent work.
   - Determine if changes belong to a single logical unit or multiple distinct logical units.
   - If there are changes addressing different issues, split them into separate commits.

4. **Pre-push verification gate**:
   Run each check below **in order**. If any step fails, STOP immediately, report the failure to the user, and do NOT proceed to commit or push.
   1. **Lint**:

      ```bash
      npm run lint
      ```

      Confirm: no errors.

   2. **TypeScript check**:

      ```bash
      npm run typecheck
      ```

      Confirm: no type errors.

   3. **Format check**:

      ```bash
      npm run format:check
      ```

      Confirm: all files properly formatted.

   If all checks pass, proceed to the next step.

5. **Commit changes**:
   - For each identified group of changes:
     1. **Stage**: Run `git add <path/to/files>` for the files in this group.
     2. **Message**: Generate a specific, descriptive commit message using the format `<type>: <description>`.
        - **Type**: Select strictly from the allowed types below.
        - **Description**: A concise summary of the change (start with uppercase, no period).
     3. **Commit**: Run `git commit -m "<type>: <description>"`.

6. **Push**:
   - Run `git push origin <branch>` where `<branch>` is the current branch.

7. **Report**:
   - Inform the user of:
     - All commits created (with messages).
     - Which branch was pushed.
     - Verification results (lint ✓, typecheck ✓, format ✓).

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
- **Do not** commit or push if the pre-push verification gate fails.
