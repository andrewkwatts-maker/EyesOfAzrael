#!/usr/bin/env bash
#
# Visual Patrol Loop — Enhanced Live Site Monitor
#
# Every 30 minutes: screenshots eyesofazrael.com (home + 10 diverse random pages),
# feeds them to Claude Code for structured analysis and fix sprint.
# Alternates between UI/UX polish focus and performance/regression focus.
# Compares 5 current screenshots against screenshots from 5 cycles ago.
#
# Usage:
#   bash scripts/visual-patrol-loop.sh              # One-shot
#   bash scripts/visual-patrol-loop.sh --loop        # 30 min loop
#   bash scripts/visual-patrol-loop.sh --loop 900    # Custom interval (seconds)
#
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ROOT="$(pwd)"
SCREENSHOT_DIR="$PROJECT_ROOT/screenshots/patrol"
HISTORY_DIR="$PROJECT_ROOT/screenshots/history"
CYCLE_FILE="$SCREENSHOT_DIR/.cycle_count"
LIVE_URL="https://www.eyesofazrael.com"

# ── Helpers ──────────────────────────────────────────────────────────────────

get_cycle_count() {
    if [[ -f "$CYCLE_FILE" ]]; then
        cat "$CYCLE_FILE"
    else
        echo "0"
    fi
}

increment_cycle() {
    local current
    current=$(get_cycle_count)
    echo $((current + 1)) > "$CYCLE_FILE"
}

# Get the N-th most recent history directory (1 = most recent, 5 = 5 cycles ago)
get_history_dir() {
    local n="${1:-5}"
    ls -1dt "$HISTORY_DIR"/20* 2>/dev/null | sed -n "${n}p" || true
}

# Build a list of 5 screenshot paths from a history directory
get_comparison_screenshots() {
    local hist_dir="${1:-}"
    if [[ -z "$hist_dir" ]] || [[ ! -d "$hist_dir" ]]; then
        echo ""
        return
    fi
    # Pick up to 5 settled (non-early) screenshots
    local screenshots
    screenshots=$(find "$hist_dir" -name "*.png" ! -name "*_early_*" | head -5)
    echo "$screenshots"
}

run_patrol() {
    mkdir -p "$SCREENSHOT_DIR" "$HISTORY_DIR"

    local cycle
    cycle=$(get_cycle_count)
    increment_cycle

    # Determine focus: even cycles = UI/UX polish, odd cycles = performance + regression
    local focus_mode
    if (( cycle % 2 == 0 )); then
        focus_mode="UI_UX_POLISH"
    else
        focus_mode="PERFORMANCE_REGRESSION"
    fi

    echo ""
    echo "================================================================"
    echo " Visual Patrol Cycle #$cycle — $focus_mode"
    echo " Time:   $(date '+%Y-%m-%d %H:%M:%S')"
    echo " Target: $LIVE_URL"
    echo "================================================================"

    # 1. Run screenshot collector against live site (10 pages + early shots)
    echo "[patrol] Taking screenshots of live site (10 pages + early shots)..."
    node scripts/visual-patrol.js --base-url "$LIVE_URL" --count 10

    # 2. Read manifest
    MANIFEST="$SCREENSHOT_DIR/manifest.json"
    if [[ ! -f "$MANIFEST" ]]; then
        echo "[patrol] ERROR: No manifest found at $MANIFEST"
        return 1
    fi

    # 3. Extract page info and performance data from manifest
    PAGE_INFO=$(node -e "
        const fs = require('fs'), path = require('path');
        const f = path.resolve('screenshots', 'patrol', 'manifest.json');
        const m = JSON.parse(fs.readFileSync(f, 'utf8'));
        const lines = [];

        // Performance summary
        const perf = m.performanceSummary || {};
        if (perf.avgLoadMs) {
            lines.push('=== PERFORMANCE ===');
            lines.push('Avg load: ' + perf.avgLoadMs + 'ms | Max: ' + perf.maxLoadMs + 'ms | P75: ' + perf.p75LoadMs + 'ms');
            lines.push('Pages over 3s: ' + (perf.pagesOver3s || 0) + ' | Pages over 5s: ' + (perf.pagesOver5s || 0));
            lines.push('Firestore requests this cycle: ' + (m.firestoreRequests || '?'));
            lines.push('');
        }

        // Page breakdown
        lines.push('=== PAGES CAPTURED ===');
        m.pages.forEach(p => {
            let status = '';
            if (p.spinnerStuck) status += ' [SPINNER STUCK]';
            if (p.hasVisibleError) status += ' [JS ERROR VISIBLE]';
            if (p.hasEmptyGrid) status += ' [EMPTY GRID]';
            if (p.error) status += ' [NAV ERROR: ' + p.error + ']';
            const timing = p.loadTimeMs ? ' (' + p.loadTimeMs + 'ms)' : '';
            lines.push('- ' + p.route + timing + status);
            lines.push('  SCREENSHOT: ' + p.screenshot);
            if (p.earlyScreenshot) lines.push('  EARLY:      ' + p.earlyScreenshot);
        });

        // Console errors
        if (m.consoleErrors && m.consoleErrors.length > 0) {
            const dedup = [...new Set(m.consoleErrors.map(e => e.text.substring(0, 200)))];
            lines.push('');
            lines.push('=== CONSOLE ERRORS (' + m.consoleErrors.length + ' total, ' + dedup.length + ' unique) ===');
            dedup.slice(0, 20).forEach(e => lines.push('  - ' + e));
        }

        console.log(lines.join('\n'));
    ")

    echo "[patrol] Cycle data:"
    echo "$PAGE_INFO"

    # 4. Find comparison screenshots from 5 cycles ago
    COMPARISON_DIR=$(get_history_dir 5)
    COMPARISON_INFO=""
    if [[ -n "$COMPARISON_DIR" ]] && [[ -d "$COMPARISON_DIR" ]]; then
        COMPARISON_SHOTS=$(get_comparison_screenshots "$COMPARISON_DIR")
        if [[ -n "$COMPARISON_SHOTS" ]]; then
            COMPARISON_INFO=$(node -e "
                const shots = \`$COMPARISON_SHOTS\`.trim().split('\n').filter(Boolean);
                const lines = ['=== COMPARISON: 5 CYCLES AGO ($(basename "$COMPARISON_DIR")) ==='];
                shots.forEach(s => lines.push('  ' + s));
                console.log(lines.join('\n'));
            " 2>/dev/null || echo "")
        fi
    fi

    # 5. Build the analysis prompt based on focus mode
    if [[ "$focus_mode" == "UI_UX_POLISH" ]]; then
        FOCUS_PROMPT="FOCUS THIS CYCLE: UI/UX POLISH & VISUAL CORRECTNESS

Your primary goal this cycle is to find and fix visual and UX issues:

VISUAL CHECKS (examine EVERY screenshot carefully):
  - Layout: overlapping elements, cut-off text, broken grids, misaligned items
  - Typography: wrong sizes, weights, line heights, text overflow, ellipsis clipping
  - Color: wrong colors, missing theme application, contrast issues, gradient breaks
  - Spacing: inconsistent padding/margins, elements too close or too far apart
  - Images: broken, stretched, wrong aspect ratio, missing alt text visible
  - Animations: stuck transitions, jarring movements (inferred from early vs settled shots)
  - Header/Nav: logo position, search bar, auth capsule, theme picker
  - Cards: entity cards fully rendered with image, title, mythology badge, description
  - Buttons: styled correctly, hover states visible, not default browser style
  - Forms: input fields, labels, placeholders, submit buttons all styled
  - Empty states: are empty grids showing a helpful message or raw empty space?
  - Loading states: do skeleton screens show on the EARLY screenshots?

DELAYED-LOAD BUG DETECTION:
  Compare the EARLY screenshot (1.5s) vs the SETTLED screenshot (5s) for each page.
  Document anything that looks broken in the early shot but fixed in settled — this is
  a delayed-load bug that users will see momentarily. Fix the render order so it's
  correct from the start.

REGRESSION CHECK:
  Compare current screenshots against the 5-cycles-ago screenshots listed below.
  Flag any page that looks WORSE than it did 5 cycles ago — this is a regression.
  Also note pages that look markedly BETTER — confirm these improvements are solid."
    else
        FOCUS_PROMPT="FOCUS THIS CYCLE: PERFORMANCE, CACHING & REDUNDANCY AUDIT

Your primary goal this cycle is to find performance problems and unnecessary work:

PERFORMANCE CHECKS:
  - Pages with load time > 3000ms are SLOW — investigate why
  - Pages with load time > 5000ms are UNACCEPTABLE — must fix
  - The performance summary above shows avg/max/P75 — analyse the distribution
  - Look for layout shifts (compare early vs settled screenshots for jump/reflow)

FIRESTORE EFFICIENCY:
  - ${manifest.firestoreRequests || '?'} Firestore requests were made this cycle
  - Look in js/firebase-cache-manager.js and js/views/*.js for:
    * Fetching the same collection multiple times per page load
    * Missing cache checks before Firestore reads
    * Fetching all documents when only a few are needed (missing .limit())
    * No-index queries that do full collection scans
  - Check if browse pages use the 30-minute localStorage cache properly
  - Verify the firebase-cache-manager.js getList() cache path is hit before Firestore

SERVICE WORKER CACHE EFFICIENCY:
  - Is CACHE_VERSION current in service-worker.js?
  - Are critical scripts (firebase-config.js, app-init-simple.js) on NETWORK_FIRST?
  - Are static assets on CACHE_FIRST?

JS BUNDLE SIZE:
  - Look for large files that could be code-split or lazy-loaded
  - Check if all deferred CSS in index.html is actually non-critical

REGRESSION CHECK:
  Compare current screenshots against the 5-cycles-ago screenshots below.
  Ensure pages have not regressed visually. Any page that looks WORSE is a P1 bug."
    fi

    PROMPT="AUTOMATED VISUAL PATROL — Cycle #$cycle ($focus_mode)
Live site: $LIVE_URL

This is a vanilla JS SPA with hash-based routing, Firebase Firestore backend.
CSS: css/, views: js/views/, components: js/components/.
ALL modules use window.X = {} pattern (NOT ES modules). See CLAUDE.md for architecture.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$PAGE_INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$COMPARISON_INFO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$FOCUS_PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — VISUAL INSPECTION

Use the Read tool to open EVERY screenshot and early screenshot listed above.
Examine each one carefully. For each page note:
  - What is rendering correctly
  - What is broken, missing, or looks wrong
  - Comparison: early shot vs settled shot — any delayed-load artifacts?
  - If comparison screenshots exist: is this better or worse than 5 cycles ago?

TRIAGE RULES:
  - LIVE site with real Firebase data — empty grids = REAL BUG, not a data issue.
  - 'Please sign in' on dashboard/profile = EXPECTED (unauthenticated patrol), NOT a bug.
  - Firebase auth console errors = EXPECTED background, NOT a bug.
  - Everything else that looks wrong IS a bug.
  - 'No X Found' message on browse pages = likely a cache bug — check firebase-cache-manager.js.

PHASE 2 — STRUCTURED REPORT

Write a clear 5-section report:

  SECTION 1: PERFORMANCE METRICS
    - Load time breakdown (which pages are slow and why)
    - Delayed-load visual artifacts found (from early vs settled comparison)
    - Firestore request count assessment
    - Any redundant fetches or missing cache hits identified

  SECTION 2: PAGE-BY-PAGE FINDINGS
    - For each of the 11 pages (home + 10): what works, what's broken
    - Note load time and any flags (spinner stuck, empty grid, JS error)

  SECTION 3: REGRESSIONS vs 5 CYCLES AGO
    - Pages that look WORSE than before — regression bugs
    - Pages that look BETTER — confirmed improvements
    - Any features that were working before but are broken now

  SECTION 4: SEVERITY RANKING
    - P0 (crash/blank page/spinner stuck/JS error on screen)
    - P1 (broken layout/missing data/slow >3s/regression)
    - P2 (cosmetic/alignment/color/spacing polish)
    - PERF (performance improvement opportunity)

  SECTION 5: ROOT CAUSE ANALYSIS
    - For each bug: which source file is responsible and why
    - For performance issues: which fetch or render step causes the slowdown

PHASE 3 — FIX SPRINT

Execute fixes in priority order. Focus especially on the cycle's theme:

  Sprint 1: P0 fixes — crashes, blank pages, stuck spinners, JS errors on screen
  Sprint 2: P1 fixes — broken layouts, missing data, regressions vs previous cycles
  Sprint 3: Focus-mode fixes — apply this cycle's theme (${focus_mode})
  Sprint 4: P2 polish — cosmetic issues, alignment, spacing, colors
  Sprint 5: Console error cleanup — fix JS errors that don't crash but indicate problems
  Sprint 6: Verify — run 'npm test', confirm 0 failing tests

Fix rules:
  1. Read the source file FIRST — understand the code before changing it
  2. Fix the root cause, not symptoms
  3. Keep changes minimal and focused — do not refactor unrelated code
  4. For performance fixes: measure before/after (add timing logs if helpful)
  5. Do NOT commit or push — the patrol script handles that
  6. Do NOT modify package.json, patrol scripts, service-worker.js precache arrays, or test config
  7. After all fixes: run 'npm test' — if tests fail, fix the test or revert the change"

    echo "[patrol] Sending to Claude for analysis (cycle #$cycle, focus: $focus_mode)..."

    # Write prompt to file to avoid shell length limits
    PROMPT_FILE="$SCREENSHOT_DIR/patrol-prompt.txt"
    printf '%s' "$PROMPT" > "$PROMPT_FILE"

    # Run Claude in non-interactive mode
    cat "$PROMPT_FILE" | claude -p \
        --dangerously-skip-permissions \
        --allowedTools "Read Edit Write Bash Grep Glob Agent TodoWrite" \
        2>&1 | tee "$SCREENSHOT_DIR/claude-review.log"

    # 6. Check for changes and commit/push
    CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
    UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -v 'screenshots/' | grep -v '.log' || true)

    if [[ -n "$CHANGED_FILES" ]] || [[ -n "$UNTRACKED" ]]; then
        echo ""
        echo "[patrol] Claude made changes:"
        [[ -n "$CHANGED_FILES" ]] && echo "$CHANGED_FILES"
        [[ -n "$UNTRACKED" ]] && echo "(new files) $UNTRACKED"

        # Run tests
        echo "[patrol] Running tests..."
        if npm test 2>&1; then
            echo "[patrol] Tests pass. Committing and pushing..."
            # Stage changed files (never stage screenshots or logs)
            git add $(echo "$CHANGED_FILES" | tr '\n' ' ') 2>/dev/null || true
            if [[ -n "$UNTRACKED" ]]; then
                git add $(echo "$UNTRACKED" | tr '\n' ' ') 2>/dev/null || true
            fi
            git commit -m "$(cat <<COMMITEOF
fix(visual-patrol): auto-fix visual issues from live site review

Cycle #$cycle — Focus: $focus_mode
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
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
        echo "[patrol] No changes needed — live site looks good this cycle."
    fi

    echo "[patrol] Cycle #$cycle complete at $(date '+%H:%M:%S')"
}

# ── Main ─────────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--loop" ]]; then
    INTERVAL="${2:-1800}"
    echo "[patrol] Starting live site patrol loop (every $((INTERVAL / 60)) minutes)."
    echo "[patrol] Target: $LIVE_URL"
    echo "[patrol] Focus alternates: even cycles = UI/UX polish, odd = performance + regression."
    echo "[patrol] Press Ctrl+C to stop."
    echo ""
    while true; do
        run_patrol || echo "[patrol] Patrol run failed, will retry next cycle."
        echo ""
        NEXT_RUN=$(date -d "+${INTERVAL} seconds" '+%H:%M:%S' 2>/dev/null || date -v "+${INTERVAL}S" '+%H:%M:%S' 2>/dev/null || echo "in $((INTERVAL/60)) min")
        echo "[patrol] Next patrol at $NEXT_RUN (in $((INTERVAL / 60)) minutes)..."
        sleep "$INTERVAL"
    done
else
    run_patrol
fi
