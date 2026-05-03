#!/usr/bin/env python3
"""
Overnight Enrichment Runner
============================
Runs the Gemini enrichment pipeline collection by collection overnight.
After each collection batch, commits changes to git so you can diff and review.

Usage:
    python scripts/overnight-enrichment.py                     # Full overnight run
    python scripts/overnight-enrichment.py --batch-size 100    # Limit per collection
    python scripts/overnight-enrichment.py --dry-run            # Preview only
    python scripts/overnight-enrichment.py --resume             # Resume from checkpoint

The script:
1. Processes each collection in order (smallest first)
2. After each batch, commits the enriched files to git on a feature branch
3. Pauses between collections to avoid rate limits
4. Logs everything to scripts/overnight-enrichment.log
5. Creates a summary when done

Review in the morning:
    git log --oneline enrichment/gemini-batch
    git diff main..enrichment/gemini-batch -- firebase-assets-downloaded/
"""

import json
import os
import subprocess
import sys
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
LOG_FILE = SCRIPT_DIR / "overnight-enrichment.log"
SUMMARY_FILE = SCRIPT_DIR / "overnight-summary.json"

# Collection processing order (smallest first for fast progress)
COLLECTION_ORDER = [
    "beings",      #     8 entities
    "symbols",     #    22 entities
    "rituals",     #    28 entities
    "texts",       #    47 entities
    "cosmology",   #    72 entities
    "archetypes",  #    76 entities
    "magic",       #   108 entities
    "herbs",       #   129 entities
    "places",      #   464 entities
    "items",       #   603 entities
    "heroes",      #   824 entities
    "creatures",   #  1117 entities
    "deities",     #  2118 entities
    # "concepts" excluded - 5000+ entities, run separately
]

# Pause between collections (seconds)
INTER_COLLECTION_PAUSE = 30


def setup_logging():
    """Setup logging to both file and console."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)


def run_command(cmd, cwd=None):
    """Run a shell command and return output."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd or PROJECT_DIR,
            shell=True, timeout=120
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"


def git_setup_branch(log):
    """Create or switch to the enrichment branch."""
    branch_name = "enrichment/gemini-batch"

    # Check if branch exists
    code, out, _ = run_command(f"git branch --list {branch_name}")
    if branch_name not in out:
        log.info(f"Creating branch: {branch_name}")
        run_command(f"git checkout -b {branch_name}")
    else:
        # Switch to it
        code, current, _ = run_command("git rev-parse --abbrev-ref HEAD")
        if current != branch_name:
            log.info(f"Switching to branch: {branch_name}")
            run_command(f"git checkout {branch_name}")

    return branch_name


def git_commit_collection(collection, stats, log):
    """Stage and commit changes for a collection."""
    assets_dir = f"firebase-assets-downloaded/{collection}/"

    # Stage changes
    code, out, err = run_command(f'git add "{assets_dir}"')
    if code != 0:
        log.warning(f"git add failed: {err}")
        return False

    # Check if there are staged changes
    code, out, _ = run_command("git diff --cached --name-only")
    if not out.strip():
        log.info(f"No changes to commit for {collection}")
        return False

    changed_files = len(out.strip().split("\n"))

    # Commit
    msg = (
        f"enrich: {collection} - {stats.get('enriched', 0)} entities, "
        f"+{stats.get('fields_added', 0)} fields (Gemini 2.0 Flash)\n\n"
        f"Processed: {stats.get('processed', 0)}\n"
        f"Enriched: {stats.get('enriched', 0)}\n"
        f"Skipped: {stats.get('skipped', 0)}\n"
        f"Failed: {stats.get('failed', 0)}\n"
        f"Fields added: {stats.get('fields_added', 0)}\n"
        f"Files changed: {changed_files}"
    )

    code, out, err = run_command(f'git commit -m "{msg}"')
    if code != 0:
        log.warning(f"git commit failed: {err}")
        return False

    log.info(f"Committed {changed_files} files for {collection}")
    return True


def run_enrichment(collection, args, log):
    """Run the enrichment pipeline for one collection."""
    cmd = f"python scripts/gemini-enrichment-pipeline.py --collection {collection}"

    if args.batch_size:
        cmd += f" --batch-size {args.batch_size}"
    if args.dry_run:
        cmd += " --dry-run"
    if args.resume:
        cmd += " --resume"
    if args.fields:
        cmd += f" --fields {args.fields}"

    log.info(f"Running: {cmd}")

    # Run with real-time output
    process = subprocess.Popen(
        cmd, shell=True, cwd=PROJECT_DIR,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1
    )

    output_lines = []
    for line in iter(process.stdout.readline, ""):
        line = line.rstrip()
        if line:
            print(line)
            output_lines.append(line)
            # Also log key lines
            if line.strip().startswith(("[OK]", "[FAIL]", "[SKIP]", "[", "Processed", "Enriched", "Failed")):
                log.info(f"  [{collection}] {line.strip()}")

    process.wait()

    # Parse stats from progress file
    progress_file = SCRIPT_DIR / "enrichment-progress.json"
    if progress_file.exists():
        with open(progress_file) as f:
            progress = json.load(f)
        return progress.get("overall_stats", {})

    return {"processed": 0, "enriched": 0, "failed": 0, "skipped": 0, "fields_added": 0}


def main():
    parser = argparse.ArgumentParser(description="Overnight Enrichment Runner")
    parser.add_argument("--batch-size", type=int, default=0, help="Max entities per collection (0=unlimited)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without changes")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint")
    parser.add_argument("--fields", help="Comma-separated fields to enrich")
    parser.add_argument("--collections", help="Comma-separated collections to process")
    args = parser.parse_args()

    log = setup_logging()

    log.info("=" * 60)
    log.info("OVERNIGHT ENRICHMENT RUNNER STARTED")
    log.info("=" * 60)
    log.info(f"Time: {datetime.now(timezone.utc).isoformat()}")
    log.info(f"Dry run: {args.dry_run}")
    log.info(f"Batch size: {args.batch_size or 'unlimited'}")
    log.info(f"Fields: {args.fields or 'all'}")

    # Setup git branch (unless dry run)
    branch = None
    if not args.dry_run:
        branch = git_setup_branch(log)
        log.info(f"Working on branch: {branch}")

    # Determine collections
    if args.collections:
        collections = args.collections.split(",")
    else:
        collections = COLLECTION_ORDER

    overall = {"processed": 0, "enriched": 0, "failed": 0, "skipped": 0, "fields_added": 0}
    collection_results = {}
    start_time = time.time()

    for i, collection in enumerate(collections):
        log.info(f"\n{'-' * 60}")
        log.info(f"COLLECTION {i+1}/{len(collections)}: {collection}")
        log.info(f"{'-' * 60}")

        col_start = time.time()
        stats = run_enrichment(collection, args, log)
        col_duration = time.time() - col_start

        collection_results[collection] = {**stats, "duration_seconds": round(col_duration)}

        for k in overall:
            overall[k] += stats.get(k, 0)

        log.info(f"  {collection} done in {col_duration:.0f}s: "
                 f"enriched={stats.get('enriched', 0)}, "
                 f"fields={stats.get('fields_added', 0)}")

        # Git commit after each collection
        if not args.dry_run and stats.get("enriched", 0) > 0:
            git_commit_collection(collection, stats, log)

        # Pause between collections
        if i < len(collections) - 1:
            log.info(f"  Pausing {INTER_COLLECTION_PAUSE}s before next collection...")
            time.sleep(INTER_COLLECTION_PAUSE)

    total_duration = time.time() - start_time

    # Final summary
    log.info(f"\n{'=' * 60}")
    log.info("OVERNIGHT ENRICHMENT COMPLETE")
    log.info(f"{'=' * 60}")
    log.info(f"Total time: {total_duration/60:.1f} minutes")
    log.info(f"Processed: {overall['processed']}")
    log.info(f"Enriched: {overall['enriched']}")
    log.info(f"Failed: {overall['failed']}")
    log.info(f"Skipped: {overall['skipped']}")
    log.info(f"Fields added: {overall['fields_added']}")

    if branch:
        log.info(f"\nReview changes:")
        log.info(f"  git log --oneline {branch}")
        log.info(f"  git diff main..{branch} --stat")
        log.info(f"  git diff main..{branch} -- firebase-assets-downloaded/deities/ | head -100")

    # Save summary
    summary = {
        "started_at": datetime.fromtimestamp(start_time, tz=timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "duration_minutes": round(total_duration / 60, 1),
        "dry_run": args.dry_run,
        "branch": branch,
        "overall": overall,
        "collections": collection_results
    }
    with open(SUMMARY_FILE, "w") as f:
        json.dump(summary, f, indent=2)
    log.info(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    main()
