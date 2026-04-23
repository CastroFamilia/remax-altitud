---
failed_layers: '' # set at runtime: comma-separated list of layers that failed or returned empty
gemini_run_id: '' # set at runtime: unix timestamp used as suffix for /tmp prompt + output files
---

# Step 2: Review

## RULES

- YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- The Blind Hunter receives NO project context — diff only.
- The Edge Case Hunter receives diff + project root reference.
- The Acceptance Auditor receives diff, spec, and context docs.
- All three reviewers run via the local `gemini` CLI in parallel — no human-in-the-loop paste step.

## INSTRUCTIONS

1. If `{review_mode}` = `"no-spec"`, tell the user: "Acceptance Auditor skipped — no spec file provided."

2. **Preflight `gemini` availability.** Run a single Bash check: `command -v gemini >/dev/null && gemini --version`. If it fails (command not found, non-zero exit), skip to the **MANUAL FALLBACK** section at the bottom of this step.

3. **Build prompt files.** Set `{gemini_run_id}` to the current unix timestamp. For each active reviewer, write its full prompt (instructions + embedded diff + spec/context where applicable) to `/tmp/bmad-review-<role>-{gemini_run_id}.md` using the Write tool. Roles: `blind-hunter`, `edge-case-hunter`, and (only when `{review_mode}` = `"full"`) `acceptance-auditor`.

   ### Blind Hunter prompt (NO project context, diff only)
   ```
   You are a cynical, jaded code reviewer with zero patience for sloppy work.
   The diff below was submitted by someone who expects you to find problems.
   Be skeptical of everything. Look for what's missing, not just what's wrong.
   Use a precise, professional tone — no profanity or personal attacks.
   Find at least ten issues. Output findings as a Markdown list (descriptions only),
   one finding per bullet. Do not include any preamble, summary, or closing text.

   DIFF:
   <paste full {diff_output} here>
   ```

   ### Edge Case Hunter prompt (diff + project root reference)
   ```
   You are a pure path tracer. Walk every branching path and boundary condition
   reachable from the diff hunks below. Report ONLY unhandled paths and conditions —
   discard handled ones silently. No editorializing, no praise, no summary.

   Output ONLY a valid JSON array. Each element must be an object with exactly
   these four fields:
     - "location": "file:start-end" (or file:line, or file:hunk)
     - "trigger_condition": one-line description, max 15 words
     - "guard_snippet": minimal code sketch as a single-line escaped string
     - "potential_consequence": what could go wrong, max 15 words
   No markdown wrapping. An empty array [] is valid.

   Project root (for path resolution only — do not browse): <cwd>

   DIFF:
   <paste full {diff_output} here>
   ```

   ### Acceptance Auditor prompt (only when {review_mode} = "full")
   ```
   You are an Acceptance Auditor. Review the diff against the spec and context
   docs below. Check for: violations of acceptance criteria, deviations from spec
   intent, missing implementation of specified behavior, contradictions between
   spec constraints and actual code.

   Output findings as a Markdown list. For each finding include:
     - one-line title
     - which AC or constraint it violates
     - evidence from the diff (file:line + short quote)
   No preamble, no summary.

   SPEC FILE: {spec_file}
   <paste full contents of {spec_file} here>

   CONTEXT DOCS:
   <paste each loaded context doc here, separated by "--- doc: <path> ---">

   DIFF:
   <paste full {diff_output} here>
   ```

4. **Fire all reviewers in parallel.** In a single Bash tool-call block, issue one Bash call per active reviewer. Each call must:
   - Use a 180-second timeout
   - Pipe the prompt file into `gemini` via stdin
   - Redirect both stdout and stderr to a per-role output file
   - Capture the exit code

   Pattern (one call per role, fired in parallel — same tool-use block):
   ```sh
   timeout 180 gemini < /tmp/bmad-review-<role>-{gemini_run_id}.md \
     > /tmp/bmad-review-<role>-{gemini_run_id}.out 2>&1
   echo "exit=$?"
   ```

5. **Per-reviewer failure handling.** After all calls return, for each role:
   - If exit code is non-zero, the output file is missing, or the output is empty / whitespace-only / contains only an obvious error string ("error:", "quota", "auth"), append the role to `{failed_layers}` (comma-separated).
   - Otherwise read the `.out` file and collect its contents as that layer's findings.

6. **All-failed guard.** If every active reviewer ended up in `{failed_layers}`, drop to the **MANUAL FALLBACK** section below — do not proceed to triage with zero findings.

7. **Summarize for the user.** Print one line per active reviewer:
   `Blind Hunter: <N> findings · Edge Case Hunter: <N> findings · Acceptance Auditor: <N> findings (or "skipped" / "failed")`.

8. Proceed to triage with the collected findings.


## MANUAL FALLBACK

(Only used when `gemini` is unavailable or every reviewer failed.)

Generate prompt files in `{implementation_artifacts}` — one per active reviewer role using the prompts in instruction 3 — and HALT. Ask the user to run each in a separate session (ideally a different LLM) and paste back the findings. When findings are pasted, resume from instruction 7 and proceed to step 3.


## NEXT

Read fully and follow `./step-03-triage.md`
