#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# BMAD Pipeline — Automated Story Lifecycle
# ═══════════════════════════════════════════════════════════════════════════════
#
# Orchestrates three BMAD phases across Claude Code and Gemini CLI,
# each in a fresh context window (non-interactive mode):
#
#   Phase 1 — Create Story    (Claude Code)  → /bmad-create-story
#   Phase 2 — Dev Story       (Claude Code)  → /bmad-dev-story
#   Phase 3 — Code Review     (Gemini CLI)   → /bmad-code-review (cross-LLM)
#
# Usage:
#   ./scripts/bmad-pipeline.sh                     # auto-discover next backlog story
#   ./scripts/bmad-pipeline.sh 1-8                 # specific story (epic 1, story 8)
#   ./scripts/bmad-pipeline.sh --skip-create       # skip phase 1 (story already created)
#   ./scripts/bmad-pipeline.sh --skip-create 1-7   # dev + review for specific story
#   ./scripts/bmad-pipeline.sh --only-review       # only run code review (phase 3)
#   ./scripts/bmad-pipeline.sh --dry-run           # show what would be executed
#
# ═══════════════════════════════════════════════════════════════════════════════

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMPL_ARTIFACTS="$PROJECT_ROOT/_bmad-output/implementation-artifacts"
SPRINT_STATUS="$IMPL_ARTIFACTS/sprint-status.yaml"
LOG_DIR="$PROJECT_ROOT/_bmad-output/pipeline-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# CLI tool paths (resolved at runtime)
CLAUDE_CMD="${CLAUDE_CMD:-claude}"
GEMINI_CMD="${GEMINI_CMD:-gemini}"

# Flags
SKIP_CREATE=false
ONLY_REVIEW=false
DRY_RUN=false
STORY_ID=""
VERBOSE=false

# ── Color Helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'  # No Color

banner() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${MAGENTA}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

info()    { echo -e "${BLUE}ℹ${NC}  $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠️${NC}  $1"; }
error()   { echo -e "${RED}❌${NC} $1"; }
step()    { echo -e "${BOLD}${CYAN}▶${NC}  ${BOLD}$1${NC}"; }
dim()     { echo -e "${DIM}   $1${NC}"; }

# ── Argument Parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-create)
      SKIP_CREATE=true
      shift
      ;;
    --only-review)
      ONLY_REVIEW=true
      SKIP_CREATE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options] [story-id]"
      echo ""
      echo "Options:"
      echo "  --skip-create    Skip Phase 1 (story already created)"
      echo "  --only-review    Only run Phase 3 (code review)"
      echo "  --dry-run        Show what would be executed without running"
      echo "  --verbose, -v    Show full CLI output in terminal"
      echo "  --help, -h       Show this help"
      echo ""
      echo "Story ID format: epic-story (e.g. 1-8, 2-3)"
      exit 0
      ;;
    -*)
      error "Unknown option: $1"
      exit 1
      ;;
    *)
      STORY_ID="$1"
      shift
      ;;
  esac
done

# ── Preflight Checks ─────────────────────────────────────────────────────────
preflight() {
  banner "🛫 BMAD Pipeline — Preflight Checks"

  # Check CLI tools exist
  if ! command -v "$CLAUDE_CMD" &>/dev/null; then
    error "Claude Code CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code"
    exit 1
  fi
  success "Claude Code CLI found: $(command -v "$CLAUDE_CMD")"

  if ! command -v "$GEMINI_CMD" &>/dev/null; then
    error "Gemini CLI not found. Install: npm install -g @anthropic-ai/gemini-cli"
    exit 1
  fi
  success "Gemini CLI found: $(command -v "$GEMINI_CMD")"

  # Check project structure
  if [[ ! -f "$PROJECT_ROOT/_bmad/bmm/config.yaml" ]]; then
    error "BMAD config not found at $PROJECT_ROOT/_bmad/bmm/config.yaml"
    exit 1
  fi
  success "BMAD config found"

  # Check sprint status
  if [[ ! -f "$SPRINT_STATUS" ]]; then
    warn "Sprint status not found — will rely on story ID or auto-discovery"
  else
    success "Sprint status found"
  fi

  # Create log directory
  mkdir -p "$LOG_DIR"
  success "Log directory ready: $LOG_DIR"

  echo ""
}

# ── Story Discovery ───────────────────────────────────────────────────────────
discover_story() {
  if [[ -n "$STORY_ID" ]]; then
    info "Story ID provided: $STORY_ID"
    return 0
  fi

  if [[ ! -f "$SPRINT_STATUS" ]]; then
    error "No story ID provided and no sprint-status.yaml found."
    error "Usage: $0 [story-id]  (e.g., 1-8)"
    exit 1
  fi

  # Find first backlog story from sprint status
  info "Auto-discovering next backlog story from sprint-status.yaml..."

  local found
  # Match lines like "  2-1-database-schema-and-drizzle-models: backlog"
  found=$(grep -E '^[[:space:]]+[0-9]+-[0-9]+-[a-zA-Z].*:[[:space:]]+"?backlog"?[[:space:]]*$' "$SPRINT_STATUS" | head -1 | sed 's/^[[:space:]]*//' | cut -d: -f1 || true)

  if [[ -z "$found" ]]; then
    warn "No backlog stories found in sprint-status.yaml"

    # Try ready-for-dev or in-progress stories for --skip-create / --only-review mode
    if [[ "$SKIP_CREATE" == "true" ]]; then
      found=$(grep -E '^[[:space:]]+[0-9]+-[0-9]+-[a-zA-Z].*:[[:space:]]+"?(ready-for-dev|in-progress|review)"?[[:space:]]*$' "$SPRINT_STATUS" | head -1 | sed 's/^[[:space:]]*//' | cut -d: -f1 || true)
      if [[ -n "$found" ]]; then
        STORY_ID=$(echo "$found" | grep -oE '^[0-9]+-[0-9]+')
        success "Found actionable story: $found (ID: $STORY_ID)"
        return 0
      fi
    fi

    error "No actionable stories found. Run sprint-planning first."
    exit 1
  fi

  STORY_ID=$(echo "$found" | grep -oE '^[0-9]+-[0-9]+')
  success "Next backlog story: $found (ID: $STORY_ID)"
}

# ── Find Story File ───────────────────────────────────────────────────────────
find_story_file() {
  local pattern="${STORY_ID}-*"
  local file
  file=$(find "$IMPL_ARTIFACTS" -maxdepth 1 -name "${pattern}.md" -type f 2>/dev/null | head -1)

  if [[ -n "$file" ]]; then
    echo "$file"
  else
    echo ""
  fi
}

# ── Run Phase ─────────────────────────────────────────────────────────────────
# Runs a CLI command, logs output, checks exit code
run_phase() {
  local phase_num="$1"
  local phase_name="$2"
  local cli_tool="$3"
  local prompt="$4"
  local log_file="$LOG_DIR/${TIMESTAMP}_phase${phase_num}_${phase_name// /_}.log"

  banner "Phase $phase_num — $phase_name"

  if [[ "$DRY_RUN" == "true" ]]; then
    info "[DRY RUN] Would execute:"
    dim "Tool: $cli_tool"
    dim "Prompt: ${prompt:0:200}..."
    dim "Log: $log_file"
    echo ""
    return 0
  fi

  step "Starting $phase_name..."
  dim "Log file: $log_file"
  echo ""

  local exit_code=0

  if [[ "$cli_tool" == "claude" ]]; then
    # Claude Code — non-interactive mode with fresh context
    if [[ "$VERBOSE" == "true" ]]; then
      "$CLAUDE_CMD" \
        --print \
        --dangerously-skip-permissions \
        --verbose \
        "$prompt" 2>&1 | tee "$log_file" || exit_code=$?
    else
      "$CLAUDE_CMD" \
        --print \
        --dangerously-skip-permissions \
        "$prompt" > "$log_file" 2>&1 || exit_code=$?
    fi

  elif [[ "$cli_tool" == "gemini" ]]; then
    # Gemini CLI — non-interactive mode with fresh context
    if [[ "$VERBOSE" == "true" ]]; then
      "$GEMINI_CMD" \
        --prompt "$prompt" \
        --yolo 2>&1 | tee "$log_file" || exit_code=$?
    else
      "$GEMINI_CMD" \
        --prompt "$prompt" \
        --yolo > "$log_file" 2>&1 || exit_code=$?
    fi
  fi

  echo ""

  if [[ $exit_code -ne 0 ]]; then
    error "Phase $phase_num ($phase_name) failed with exit code $exit_code"
    error "Check log: $log_file"
    dim "Last 20 lines of output:"
    tail -20 "$log_file" | while IFS= read -r line; do dim "$line"; done
    return $exit_code
  fi

  success "Phase $phase_num ($phase_name) completed successfully"
  dim "Full log: $log_file"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Create Story (Claude Code)
# ═══════════════════════════════════════════════════════════════════════════════
phase_create_story() {
  local prompt

  if [[ -n "$STORY_ID" ]]; then
    prompt="Create story ${STORY_ID} using the /bmad-create-story workflow.

IMPORTANT INSTRUCTIONS:
- Run the complete /bmad-create-story workflow for story ${STORY_ID}
- Perform exhaustive artifact analysis — do NOT skim or be lazy
- After the story file is generated, validate it against the checklist
- Apply ALL suggested improvements from the checklist validation automatically
- Do NOT ask for user input — make the best decision yourself for any ambiguity
- Update sprint-status.yaml to mark the story as ready-for-dev
- Continue until the story is fully created and validated — do not stop early"
  else
    prompt="Create the next story using the /bmad-create-story workflow.

IMPORTANT INSTRUCTIONS:
- Auto-discover the next backlog story from sprint-status.yaml
- Run the complete /bmad-create-story workflow
- Perform exhaustive artifact analysis — do NOT skim or be lazy
- After the story file is generated, validate it against the checklist
- Apply ALL suggested improvements from the checklist validation automatically
- Do NOT ask for user input — make the best decision yourself for any ambiguity
- Update sprint-status.yaml to mark the story as ready-for-dev
- Continue until the story is fully created and validated — do not stop early"
  fi

  run_phase 1 "Create Story" "claude" "$prompt"
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Dev Story (Claude Code)
# ═══════════════════════════════════════════════════════════════════════════════
phase_dev_story() {
  # Find the story file
  local story_file
  story_file=$(find_story_file)

  local prompt

  if [[ -n "$story_file" ]]; then
    prompt="Implement the story at ${story_file} using the /bmad-dev-story workflow.

IMPORTANT INSTRUCTIONS:
- Run the complete /bmad-dev-story workflow for the story at: ${story_file}
- Follow ALL tasks and subtasks in EXACT order as written in the story file
- Use red-green-refactor cycle: write failing tests first, then implement, then refactor
- Do NOT stop for milestones, significant progress, or session boundaries
- Do NOT ask for user input — make the best decision yourself for any ambiguity
- Mark each task [x] only after ALL validation gates pass
- Run lint, typecheck, and build at the end
- Update sprint-status.yaml when done
- Continue in a single execution until ALL tasks are complete or a HALT condition is triggered"
  else
    prompt="Implement the next ready-for-dev story using the /bmad-dev-story workflow.

IMPORTANT INSTRUCTIONS:
- Auto-discover the next ready-for-dev story from sprint-status.yaml
- Run the complete /bmad-dev-story workflow
- Follow ALL tasks and subtasks in EXACT order as written in the story file
- Use red-green-refactor cycle: write failing tests first, then implement, then refactor
- Do NOT stop for milestones, significant progress, or session boundaries
- Do NOT ask for user input — make the best decision yourself for any ambiguity
- Mark each task [x] only after ALL validation gates pass
- Run lint, typecheck, and build at the end
- Update sprint-status.yaml when done
- Continue in a single execution until ALL tasks are complete or a HALT condition is triggered"
  fi

  run_phase 2 "Dev Story" "claude" "$prompt"
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Code Review (Gemini CLI — cross-LLM)
# ═══════════════════════════════════════════════════════════════════════════════
phase_code_review() {
  # Find the story file for context
  local story_file
  story_file=$(find_story_file)

  local story_context=""
  if [[ -n "$story_file" ]]; then
    story_context="The story file is at: ${story_file}"
  fi

  local prompt="Run a comprehensive adversarial code review using the /bmad-code-review workflow.

${story_context}

IMPORTANT INSTRUCTIONS:
- You are running an adversarial code review as a DIFFERENT LLM than the one that wrote the code
- This is intentional — cross-LLM review catches blind spots that the implementing LLM would miss
- Run the complete /bmad-code-review workflow with all three review layers:
  1. Blind Hunter — find bugs, security issues, and logic errors
  2. Edge Case Hunter — find boundary conditions and unhandled scenarios
  3. Acceptance Auditor — verify all acceptance criteria are met
- Perform structured triage of all findings into actionable categories
- Update the story file with the Senior Developer Review section
- Add review follow-up tasks for any required changes
- Update sprint-status.yaml with the review outcome
- Do NOT ask for user input — complete the full review autonomously
- Be thorough and adversarial — this is a quality gate"

  run_phase 3 "Code Review (Cross-LLM)" "gemini" "$prompt"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main Pipeline
# ═══════════════════════════════════════════════════════════════════════════════
main() {
  banner "🚀 BMAD Pipeline — Automated Story Lifecycle"

  info "Project: $PROJECT_ROOT"
  info "Timestamp: $TIMESTAMP"
  [[ -n "$STORY_ID" ]] && info "Story: $STORY_ID"
  [[ "$SKIP_CREATE" == "true" ]] && info "Mode: Skip create"
  [[ "$ONLY_REVIEW" == "true" ]] && info "Mode: Review only"
  [[ "$DRY_RUN" == "true" ]] && warn "DRY RUN — no commands will be executed"
  echo ""

  # Preflight
  preflight

  # Discover story
  discover_story

  local pipeline_start
  pipeline_start=$(date +%s)

  # Phase 1 — Create Story
  if [[ "$SKIP_CREATE" == "false" ]]; then
    local phase1_start=$(date +%s)
    phase_create_story
    local phase1_end=$(date +%s)
    info "Phase 1 duration: $(( phase1_end - phase1_start ))s"
    echo ""

    # Verify story file was created
    if [[ "$DRY_RUN" == "false" ]]; then
      local story_file
      story_file=$(find_story_file)
      if [[ -z "$story_file" ]]; then
        error "Story file not found after Phase 1. Check logs."
        exit 1
      fi
      success "Story file created: $story_file"
    fi
  else
    info "Skipping Phase 1 (Create Story)"
  fi

  # Phase 2 — Dev Story
  if [[ "$ONLY_REVIEW" == "false" ]]; then
    local phase2_start=$(date +%s)
    phase_dev_story
    local phase2_end=$(date +%s)
    info "Phase 2 duration: $(( phase2_end - phase2_start ))s"
    echo ""
  else
    info "Skipping Phase 2 (Dev Story)"
  fi

  # Phase 3 — Code Review (Gemini)
  local phase3_start=$(date +%s)
  phase_code_review
  local phase3_end=$(date +%s)
  info "Phase 3 duration: $(( phase3_end - phase3_start ))s"

  # ── Summary ─────────────────────────────────────────────────────────────────
  local pipeline_end
  pipeline_end=$(date +%s)
  local total_duration=$(( pipeline_end - pipeline_start ))

  banner "🏁 Pipeline Complete"
  success "Story: $STORY_ID"
  success "Total duration: ${total_duration}s ($(( total_duration / 60 ))m $(( total_duration % 60 ))s)"
  success "Logs: $LOG_DIR/${TIMESTAMP}_*"
  echo ""
  info "Next steps:"
  dim "1. Review the code review findings in the story file"
  dim "2. If changes are requested, run: $0 --skip-create $STORY_ID"
  dim "3. When ready, push with: /push"
  echo ""
}

main "$@"
