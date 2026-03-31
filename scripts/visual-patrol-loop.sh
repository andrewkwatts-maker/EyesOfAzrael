#!/usr/bin/env bash
#
# Visual Patrol Loop
# Runs the screenshot patrol, feeds results to Claude Code for analysis
# and auto-fix, then pushes fixes if any were made.
#
# Usage:
#   bash scripts/visual-patrol-loop.sh          # One-shot
#   bash scripts/visual-patrol-loop.sh --loop   # Repeat every 30 min
#
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ROOT="$(pwd)"
SCREENSHOT_DIR="$PROJECT_ROOT/screenshots/patrol"
PORT=8080
SERVER_PID=""

# ── Helpers ──────────────────────────────────────────────────────────────────

cleanup() {
    if [[ -n "$SERVER_PID" ]]; then
        echo "[patrol] Stopping dev server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
        SERVER_PID=""
    fi
}
trap cleanup EXIT

start_server() {
    # Check if server is already running
    if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
        echo "[patrol] Server already running on port $PORT"
        return
    fi

    echo "[patrol] Starting http-server on port $PORT..."
    npx http-server -p "$PORT" --silent &
    SERVER_PID=$!

    # Wait for server to be ready
    for i in {1..15}; do
        if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
            echo "[patrol] Server ready."
            return
        fi
        sleep 1
    done
    echo "[patrol] ERROR: Server failed to start after 15s"
    exit 1
}

run_patrol() {
    echo ""
    echo "================================================================"
    echo " Visual Patrol - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================================"

    # 1. Start server
    start_server

    # 2. Run screenshot collector
    echo "[patrol] Taking screenshots..."
    node scripts/visual-patrol.js --base-url "http://localhost:$PORT"

    # 3. Build the prompt for Claude with all screenshots
    MANIFEST="$SCREENSHOT_DIR/manifest.json"
    if [[ ! -f "$MANIFEST" ]]; then
        echo "[patrol] ERROR: No manifest found at $MANIFEST"
        return 1
    fi

    # Read manifest to get screenshot paths and page info
    # Use path.resolve to handle Windows/Git Bash path differences
    SCREENSHOTS=$(node -e "
        const fs = require('fs'), path = require('path');
        const f = path.resolve('screenshots', 'patrol', 'manifest.json');
        const m = JSON.parse(fs.readFileSync(f, 'utf8'));
        const imgs = m.pages.map(p => p.screenshot).filter(Boolean);
        console.log(imgs.join('\n'));
    ")

    PAGE_INFO=$(node -e "
        const fs = require('fs'), path = require('path');
        const f = path.resolve('screenshots', 'patrol', 'manifest.json');
        const m = JSON.parse(fs.readFileSync(f, 'utf8'));
        const lines = m.pages.map(p => {
            let status = '';
            if (p.spinnerStuck) status = ' [SPINNER STUCK]';
            if (p.error) status = ' [ERROR: ' + p.error + ']';
            return '- ' + p.route + ' -> ' + p.screenshot + status;
        });
        if (m.consoleErrors && m.consoleErrors.length > 0) {
            lines.push('');
            lines.push('Console errors (' + m.consoleErrors.length + '):');
            m.consoleErrors.slice(0, 20).forEach(e => {
                lines.push('  - ' + e.text.substring(0, 200));
            });
        }
        console.log(lines.join('\n'));
    ")

    echo "[patrol] Pages captured:"
    echo "$PAGE_INFO"

    # 4. Build prompt — tell Claude to read each screenshot file
    PROMPT="AUTOMATED VISUAL PATROL — Find and fix real bugs in Eyes of Azrael.

This is a vanilla JS SPA (hash routing via js/spa-navigation.js) backed by Firebase Firestore.
CSS is in css/, views in js/views/, components in js/components/. Modules use window.X = {} pattern (NOT ES modules).
See CLAUDE.md for full architecture reference.

Pages visited and their screenshot file paths (read each with the Read tool):
$PAGE_INFO

STEP 1 — VISUAL INSPECTION
Read every screenshot file above using the Read tool. For each page, check for:
  - Broken layouts: overlapping elements, cut-off text, collapsed containers with zero height
  - Unstyled elements: white/default buttons, missing backgrounds, raw HTML visible
  - Stuck spinners: loading indicator still showing after page should have rendered
  - JS errors surfaced to users: error messages, stack traces, 'undefined' text visible
  - Empty content: grids/lists showing 0 items when they should have data
  - Header/footer bugs: misaligned nav, broken theme picker, user info not showing
  - Broken images: missing icons, oversized/stretched images, broken SVG
  - Console errors: check the manifest console errors section — these often reveal the root cause

STEP 2 — TRIAGE (important!)
Ignore these expected states — they are NOT bugs:
  - 'Please sign in' or auth prompts (expected for unauthenticated patrol)
  - Empty content due to no Firebase connection (patrol runs against local http-server)
  - Slight layout differences at exactly 1440x900 viewport

Focus ONLY on genuine code bugs: crashes, wrong logic, broken CSS, missing event handlers,
race conditions, null reference errors, or regressions from recent changes.

STEP 3 — FIX ROOT CAUSES
For each real bug found:
  1. Read the source file responsible (check the view/component that renders that page)
  2. Understand the existing code before changing it
  3. Fix the root cause — not a bandaid. If a layout is broken, fix the CSS. If data is missing, fix the query/render logic.
  4. Keep fixes minimal and focused — do not refactor surrounding code

STEP 4 — VERIFY
  - Run 'npm test' to confirm no test regressions
  - If tests fail, fix the test or revert your change — do not leave broken tests

STEP 5 — REPORT
  - List each issue found with: page, description, root cause, file:line changed
  - If no real issues found, say 'No actionable issues detected' and exit

Do NOT commit or push — the patrol script handles git operations."

    echo "[patrol] Sending to Claude for analysis..."

    # Write prompt to a temp file to avoid shell argument length limits
    PROMPT_FILE="$SCREENSHOT_DIR/patrol-prompt.txt"
    echo "$PROMPT" > "$PROMPT_FILE"

    # Run claude in non-interactive print mode, piping prompt via stdin
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --allowedTools "Read Edit Write Bash Grep Glob Agent" \
        2>&1 | tee "$SCREENSHOT_DIR/claude-review.log"

    # 5. Check if any files were modified
    CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
    if [[ -n "$CHANGED_FILES" ]]; then
        echo ""
        echo "[patrol] Claude made changes to:"
        echo "$CHANGED_FILES"

        # Run tests to verify
        echo "[patrol] Running tests..."
        if npm test 2>&1; then
            echo "[patrol] Tests pass. Committing and pushing..."
            git add $CHANGED_FILES
            git commit -m "$(cat <<'COMMITEOF'
fix(visual-patrol): auto-fix visual issues

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
COMMITEOF
)"
            git push
            echo "[patrol] Pushed fixes."
        else
            echo "[patrol] Tests FAILED after Claude's changes. Reverting..."
            git checkout -- .
            echo "[patrol] Reverted. Manual review needed."
        fi
    else
        echo "[patrol] No changes made - site looks good."
    fi

    echo "[patrol] Patrol complete at $(date '+%H:%M:%S')"
}

# ── Main ─────────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--loop" ]]; then
    echo "[patrol] Starting patrol loop (every 30 minutes). Ctrl+C to stop."
    while true; do
        run_patrol || echo "[patrol] Patrol run failed, will retry next cycle."
        echo ""
        INTERVAL="${2:-1800}"
        echo "[patrol] Next patrol in $((INTERVAL / 60)) minutes..."
        sleep "$INTERVAL"
    done
else
    run_patrol
fi
