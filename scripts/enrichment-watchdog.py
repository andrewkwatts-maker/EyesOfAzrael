#!/usr/bin/env python3
"""
Enrichment Watchdog
===================
Launches the overnight enrichment pipeline and monitors it.
If the process stalls (no checkpoint updates for STALL_TIMEOUT), kills and restarts it.
Keeps running until all collections are complete or max restarts exceeded.

Usage:
    python scripts/enrichment-watchdog.py
    python scripts/enrichment-watchdog.py --max-restarts 20
    python scripts/enrichment-watchdog.py --stall-timeout 300
"""

import subprocess
import sys
import os
import json
import time
import argparse
import signal
from pathlib import Path
from datetime import datetime, timezone

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
CHECKPOINT_FILE = SCRIPT_DIR / "enrichment-checkpoint.json"
WATCHDOG_LOG = SCRIPT_DIR / "watchdog.log"
OVERNIGHT_SCRIPT = SCRIPT_DIR / "overnight-enrichment.py"

# How long to wait before considering the process stalled (seconds)
DEFAULT_STALL_TIMEOUT = 180  # 3 minutes without checkpoint update = stalled
# How often to check the checkpoint file
POLL_INTERVAL = 30  # seconds
# Max number of restarts before giving up
DEFAULT_MAX_RESTARTS = 50
# Pause between restart attempts
RESTART_PAUSE = 15  # seconds


def log(msg):
    """Log to both console and file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(WATCHDOG_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def get_checkpoint_time():
    """Get the last_run timestamp from checkpoint file."""
    if not CHECKPOINT_FILE.exists():
        return None
    try:
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return data.get("last_run")
    except Exception:
        return None


def get_checkpoint_count():
    """Get total processed entity count from checkpoint."""
    if not CHECKPOINT_FILE.exists():
        return 0
    try:
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return sum(len(v) for v in data.get("processed", {}).items())
    except Exception:
        return 0


def get_checkpoint_details():
    """Get per-collection counts from checkpoint."""
    if not CHECKPOINT_FILE.exists():
        return {}
    try:
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            data = json.load(f)
        return {k: len(v) for k, v in data.get("processed", {}).items()}
    except Exception:
        return {}


def checkpoint_file_mtime():
    """Get the modification time of the checkpoint file."""
    if not CHECKPOINT_FILE.exists():
        return 0
    return CHECKPOINT_FILE.stat().st_mtime


def launch_enrichment():
    """Launch the overnight enrichment script as a subprocess."""
    cmd = [
        sys.executable,
        str(OVERNIGHT_SCRIPT),
        "--resume"
    ]

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"

    process = subprocess.Popen(
        cmd,
        cwd=str(PROJECT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env
    )
    return process


def stream_output(process, timeout_seconds):
    """
    Read process output line by line.
    Returns: 'completed' if process exits, 'stalled' if checkpoint stops updating.
    """
    import select
    import threading

    last_checkpoint_mtime = checkpoint_file_mtime()
    last_activity = time.time()

    def reader():
        """Read stdout in a thread to avoid blocking."""
        try:
            for line in iter(process.stdout.readline, ""):
                line = line.rstrip()
                if line:
                    # Print key lines, skip noisy ones
                    if any(k in line for k in ["[OK]", "[FAIL]", "[SKIP]", "COLLECTION", "done in",
                                                "Committed", "COMPLETE", "SUMMARY", "Processing",
                                                "enriched=", "Enriched", "Failed", "Processed"]):
                        log(f"  PIPE: {line}")
        except Exception:
            pass

    # Start reader thread
    t = threading.Thread(target=reader, daemon=True)
    t.start()

    while process.poll() is None:
        time.sleep(POLL_INTERVAL)

        # Check if checkpoint has been updated
        current_mtime = checkpoint_file_mtime()
        if current_mtime > last_checkpoint_mtime:
            last_checkpoint_mtime = current_mtime
            last_activity = time.time()
            count = get_checkpoint_count()
            log(f"  Checkpoint updated: {count} entities processed")

        # Check for stall
        idle_time = time.time() - last_activity
        if idle_time > timeout_seconds:
            log(f"  STALL DETECTED: No checkpoint update for {idle_time:.0f}s (timeout: {timeout_seconds}s)")
            return "stalled"

    # Process exited
    exit_code = process.returncode
    log(f"  Process exited with code {exit_code}")
    return "completed" if exit_code == 0 else "crashed"


def kill_process(process):
    """Kill the enrichment process and all children."""
    try:
        process.kill()
        process.wait(timeout=10)
    except Exception:
        pass

    # Also kill any stray python processes running our scripts
    try:
        if sys.platform == "win32":
            subprocess.run(
                'taskkill /F /FI "WINDOWTITLE eq *enrichment*" 2>nul',
                shell=True, capture_output=True
            )
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="Enrichment Watchdog")
    parser.add_argument("--max-restarts", type=int, default=DEFAULT_MAX_RESTARTS,
                        help=f"Max restart attempts (default: {DEFAULT_MAX_RESTARTS})")
    parser.add_argument("--stall-timeout", type=int, default=DEFAULT_STALL_TIMEOUT,
                        help=f"Seconds without checkpoint update before restart (default: {DEFAULT_STALL_TIMEOUT})")
    args = parser.parse_args()

    log("=" * 60)
    log("ENRICHMENT WATCHDOG STARTED")
    log("=" * 60)
    log(f"Max restarts: {args.max_restarts}")
    log(f"Stall timeout: {args.stall_timeout}s")
    log(f"Poll interval: {POLL_INTERVAL}s")

    initial_count = get_checkpoint_count()
    log(f"Starting checkpoint: {initial_count} entities already processed")
    details = get_checkpoint_details()
    if details:
        log(f"  Collections done: {json.dumps(details)}")

    restart_count = 0
    total_start = time.time()

    while restart_count < args.max_restarts:
        log(f"\n--- Launch #{restart_count + 1} ---")
        count_before = get_checkpoint_count()

        process = launch_enrichment()
        log(f"  PID: {process.pid}")

        result = stream_output(process, args.stall_timeout)

        count_after = get_checkpoint_count()
        entities_this_run = count_after - count_before
        log(f"  Result: {result} | Entities this run: {entities_this_run} | Total: {count_after}")

        if result == "completed":
            log("Enrichment pipeline completed successfully!")
            break
        elif result == "stalled":
            log("Killing stalled process...")
            kill_process(process)
            restart_count += 1

            if entities_this_run == 0 and restart_count >= 3:
                # If we've stalled 3 times in a row with no progress, something is wrong
                consecutive_no_progress = True
                log("WARNING: 3+ consecutive stalls with no progress. Possible systemic issue.")
                log("Continuing anyway - rate limits may just be very aggressive.")

            log(f"Restarting in {RESTART_PAUSE}s... (restart {restart_count}/{args.max_restarts})")
            time.sleep(RESTART_PAUSE)
        elif result == "crashed":
            kill_process(process)
            restart_count += 1
            log(f"Process crashed. Restarting in {RESTART_PAUSE}s... (restart {restart_count}/{args.max_restarts})")
            time.sleep(RESTART_PAUSE)

    total_duration = time.time() - total_start
    final_count = get_checkpoint_count()

    log("\n" + "=" * 60)
    log("WATCHDOG SESSION COMPLETE")
    log("=" * 60)
    log(f"Total runtime: {total_duration/3600:.1f} hours")
    log(f"Restarts: {restart_count}")
    log(f"Entities processed: {final_count - initial_count} (total: {final_count})")
    log(f"Final checkpoint details:")
    for col, cnt in sorted(get_checkpoint_details().items()):
        log(f"  {col}: {cnt} entities")

    if restart_count >= args.max_restarts:
        log(f"\nMax restarts ({args.max_restarts}) reached. Re-run watchdog to continue.")
    else:
        log("\nAll collections processed successfully!")


if __name__ == "__main__":
    main()
