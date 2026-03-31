#!/usr/bin/env bash
#
# Visual Patrol Loop — Live Site Monitor
#
# Every 30 minutes: screenshots eyesofazrael.com (home + 5 random pages),
# feeds them to Claude Code for a structured bug report and fix sprint,
# then pushes verified fixes.
#
# Usage:
#   bash scripts/visual-patrol-loop.sh              # One-shot
#   bash scripts/visual-patrol-loop.sh --loop        # 30 min loop (default)
#   bash scripts/visual-patrol-loop.sh --loop 900    # 15 min loop
#
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ROOT="$(pwd)"
SCREENSHOT_DIR="$PROJECT_ROOT/screenshots/patrol"
LIVE_URL="https://www.eyesofazrael.com"

# ── Helpers ──────────────────────────────────────────────────────────────────

run_patrol() {
    echo ""
    echo "================================================================"
    echo " Visual Patrol - $(date '+%Y-%m-%d %H:%M:%S')"
    echo " Target: $LIVE_URL"
    echo "================================================================"

    # 1. Run screenshot collector against live site
    echo "[patrol] Taking screenshots of live site..."
    node scripts/visual-patrol.js --base-url "$LIVE_URL"

    # 2. Read manifest
    MANIFEST="$SCREENSHOT_DIR/manifest.json"
    if [[ ! -f "$MANIFEST" ]]; then
        echo "[patrol] ERROR: No manifest found at $MANIFEST"
        return 1
    fi

    # Extract page info from manifest (handles Windows/Git Bash paths)
    PAGE_INFO=$(node -e "
        const fs = require('fs'), path = require('path');
        const f = path.resolve('screenshots', 'patrol', 'manifest.json');
        const m = JSON.parse(fs.readFileSync(f, 'utf8'));
        const lines = m.pages.map(p => {
            let status = '';
            if (p.spinnerStuck) status += ' [SPINNER STUCK]';
            if (p.hasVisibleError) status += ' [ERROR VISIBLE]';
            if (p.error) status += ' [NAV ERROR: ' + p.error + ']';
            return '- ' + p.route + ' -> ' + p.screenshot + status;
        });
        if (m.consoleErrors && m.consoleErrors.length > 0) {
            const dedupErrors = [...new Set(m.consoleErrors.map(e => e.text.substring(0, 150)))];
            lines.push('');
            lines.push('Console errors (' + m.consoleErrors.length + ' total, ' + dedupErrors.length + ' unique):');
            dedupErrors.slice(0, 15).forEach(e => lines.push('  - ' + e));
        }
        console.log(lines.join('\n'));
    ")

    echo "[patrol] Pages captured:"
    echo "$PAGE_INFO"

    # 3. Build the analysis prompt
    PROMPT="AUTOMATED VISUAL PATROL — Live Site Bug Report & Fix Sprint

You are reviewing the LIVE production website at $LIVE_URL.
Screenshots were just taken of the home page and 5 random sub-pages.

This is a vanilla JS SPA with hash-based routing (js/spa-navigation.js), Firebase Firestore backend.
CSS in css/, views in js/views/, components in js/components/. All modules use window.X = {} (NOT ES modules).
See CLAUDE.md for full architecture reference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES SCREENSHOTTED (read each image file with the Read tool):
$PAGE_INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — VISUAL INSPECTION (Read every screenshot)

Open every screenshot file above using the Read tool. For each page examine:
  - Does the page render correctly with real content? (this is the LIVE site — Firebase is connected)
  - Are there broken layouts, overlapping elements, cut-off text, collapsed containers?
  - Are there unstyled elements (white/default buttons, missing backgrounds)?
  - Is the loading spinner stuck when content should be showing?
  - Are there JS errors visible to users (\"undefined\", stack traces, error messages)?
  - Are grids/lists empty when they should have data?
  - Is the header/nav correct? Theme picker working? Logo visible?
  - Are images broken, missing, oversized, or stretched?
  - Any raw HTML tags visible to users?
  - On content pages: do entity cards render properly with images, names, mythology tags?

IMPORTANT TRIAGE RULES:
  - This is the LIVE site with real Firebase data. Empty grids = REAL BUG.
  - \"Please sign in\" on the dashboard = expected (unauthenticated patrol), NOT a bug.
  - Console errors about Firebase auth = expected, NOT a bug.
  - Everything else that looks wrong IS a bug and needs fixing.

PHASE 2 — BUG REPORT (write a structured report)

Write a clear 5-section report:

  SECTION 1: HOME PAGE
    - What renders correctly
    - What is broken (if anything)
    - Console errors related to home page

  SECTION 2: SUB-PAGES
    - For each of the 5 random pages: what works, what's broken
    - Note any pages that fail to load entirely

  SECTION 3: CROSS-CUTTING ISSUES
    - Problems that appear on multiple pages (CSS issues, header bugs, etc.)
    - Console errors that indicate systemic problems

  SECTION 4: SEVERITY RANKING
    - P0 (crash/blank page), P1 (broken layout/missing data), P2 (cosmetic/polish)

  SECTION 5: ROOT CAUSE ANALYSIS
    - For each bug: which source file is responsible and why

PHASE 3 — FIX SPRINT (fix all bugs found)

Execute fixes in priority order:

  Sprint 1: P0 fixes — crashes, blank pages, stuck spinners
  Sprint 2: P1 fixes — broken layouts, missing data, wrong rendering
  Sprint 3: P2 fixes — cosmetic polish, alignment, color issues
  Sprint 4: Console error fixes — JS errors that don't crash but indicate problems
  Sprint 5: Verify all fixes — run 'npm test', confirm no regressions

For each fix:
  1. Read the source file FIRST — understand the code before changing it
  2. Fix the root cause, not a bandaid
  3. Keep changes minimal and focused — do not refactor unrelated code
  4. Test after fixing

After all fixes, run 'npm test' to confirm the test suite passes.
If tests fail, fix the test or revert the change — never leave broken tests.

Do NOT commit or push — the patrol script handles that.
Do NOT modify package.json, patrol scripts, or test configuration files."

    echo "[patrol] Sending to Claude for analysis..."

    # Write prompt to file to avoid shell length limits
    PROMPT_FILE="$SCREENSHOT_DIR/patrol-prompt.txt"
    echo "$PROMPT" > "$PROMPT_FILE"

    # Run Claude in non-interactive mode
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --allowedTools "Read Edit Write Bash Grep Glob Agent" \
        2>&1 | tee "$SCREENSHOT_DIR/claude-review.log"

    # 4. Check for changes and commit/push
    CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
    if [[ -n "$CHANGED_FILES" ]]; then
        echo ""
        echo "[patrol] Claude made changes to:"
        echo "$CHANGED_FILES"

        # Run tests
        echo "[patrol] Running tests..."
        if npm test 2>&1; then
            echo "[patrol] Tests pass. Committing and pushing..."
            git add $CHANGED_FILES
            git commit -m "$(cat <<'COMMITEOF'
fix(visual-patrol): auto-fix visual issues from live site review

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
COMMITEOF
)"
            git push
            echo "[patrol] Pushed fixes."
        else
            echo "[patrol] Tests FAILED. Reverting changes..."
            git checkout -- .
            echo "[patrol] Reverted. Manual review needed."
        fi
    else
        echo "[patrol] No changes needed — live site looks good."
    fi

    echo "[patrol] Patrol complete at $(date '+%H:%M:%S')"
}

# ── Main ─────────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--loop" ]]; then
    INTERVAL="${2:-2820}"
    echo "[patrol] Starting live site patrol loop (every $((INTERVAL / 60)) minutes)."
    echo "[patrol] Target: $LIVE_URL"
    echo "[patrol] Press Ctrl+C to stop."
    while true; do
        run_patrol || echo "[patrol] Patrol run failed, will retry next cycle."
        echo ""
        echo "[patrol] Next patrol in $((INTERVAL / 60)) minutes..."
        sleep "$INTERVAL"
    done
else
    run_patrol
fi
