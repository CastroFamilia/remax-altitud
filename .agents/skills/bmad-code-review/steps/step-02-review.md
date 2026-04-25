---
failed_layers: '' # set at runtime: comma-separated list of layers that failed or returned empty
---

# Step 2: Review

## RULES

- YOU MUST ALWAYS SPEAK OUTPUT in your Agent communication style with the config `{communication_language}`
- The Blind Hunter receives NO project context — diff only, and must not browse the repo.
- The Edge Case Hunter receives diff + project root reference (may read files when helpful).
- The Acceptance Auditor receives diff, spec, and context docs.
- All three reviewers run as Claude subagents via the `Agent` tool, fired in parallel (single message, multiple Agent tool_use blocks) — no human-in-the-loop paste step, no external LLM CLI.

## INSTRUCTIONS

1. If `{review_mode}` = `"no-spec"`, tell the user: "Acceptance Auditor skipped — no spec file provided."

2. **Fire all reviewers in parallel via Agent tool.** In a single assistant message, issue one `Agent` tool_use block per active reviewer (blind-hunter, edge-case-hunter, and — only when `{review_mode}` = `"full"` — acceptance-auditor). Each Agent call:
   - `subagent_type`: `"general-purpose"`
   - `description`: short label (e.g., `"Blind Hunter review"`)
   - `prompt`: the complete prompt text below (instructions + embedded diff + spec/context where applicable)
   - DO NOT set `run_in_background` — let each call block and return findings directly in the same turn.

   Keep the three Agent tool_use blocks in a **single** assistant message so they execute concurrently.

   ### Blind Hunter prompt (NO project context, diff only)
   ```
   You are a cynical, jaded code reviewer with zero patience for sloppy work.
   The diff below was submitted by someone who expects you to find problems.
   Be skeptical of everything. Look for what's missing, not just what's wrong.
   Use a precise, professional tone — no profanity or personal attacks.
   Find at least ten issues. Output findings as a Markdown list (descriptions only),
   one finding per bullet. Do not include any preamble, summary, or closing text.

   IMPORTANT: Do NOT read any files or browse the project. Review ONLY the diff below.

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

   You may read files from the project for path resolution when helpful.
   Project root: <cwd>

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

3. **Per-reviewer failure handling.** When all Agent calls return:
   - If an agent errored, returned empty/whitespace-only content, or returned only an obvious error string, append the role to `{failed_layers}` (comma-separated).
   - Otherwise collect the returned content as that layer's findings.

4. **All-failed guard.** If every active reviewer ended up in `{failed_layers}`, drop to the **MANUAL FALLBACK** section below — do not proceed to triage with zero findings.

5. **Summarize for the user.** Print one line per active reviewer:
   `Blind Hunter: <N> findings · Edge Case Hunter: <N> findings · Acceptance Auditor: <N> findings (or "skipped" / "failed")`.

6. Proceed to triage with the collected findings.


## MANUAL FALLBACK

(Only used when every subagent reviewer failed.)

Write prompt files into `{implementation_artifacts}` — one per active reviewer role using the prompts in instruction 2 — and HALT. Ask the user to run each in a separate session (ideally a different LLM) and paste back the findings. When findings are pasted, resume from instruction 5 and proceed to step 3.


## NEXT

Read fully and follow `./step-03-triage.md`
