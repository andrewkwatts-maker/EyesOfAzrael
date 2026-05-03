#!/usr/bin/env python3
"""
Overnight Content Generation Runner with Watchdog

Wraps generate-new-content.py with:
- Automatic restart on failure
- Progress monitoring
- Periodic status reports
- Graceful shutdown on Ctrl+C

Usage:
    python scripts/overnight-content-gen.py
    python scripts/overnight-content-gen.py --mythology greek
    python scripts/overnight-content-gen.py --collection creatures
"""

import os
import sys
import time
import json
import subprocess
import signal
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "firebase-assets-downloaded"
CHECKPOINT_FILE = BASE_DIR / "scripts" / "content-gen-checkpoint.json"
LOG_FILE = BASE_DIR / "scripts" / "content-generation.log"
STATUS_FILE = BASE_DIR / "scripts" / "content-gen-status.json"

COLLECTIONS = [
    "deities", "heroes", "creatures", "items", "places",
    "texts", "rituals", "herbs", "symbols", "cosmology",
    "archetypes", "magic", "beings"
]

MAX_RESTARTS = 10
RESTART_DELAY = 30  # seconds between restarts
STATUS_INTERVAL = 300  # status report every 5 minutes

shutdown_requested = False


def signal_handler(sig, frame):
    global shutdown_requested
    print("\n\n[WATCHDOG] Shutdown requested. Waiting for current entity to finish...")
    shutdown_requested = True


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def count_assets():
    """Count total assets across all collections."""
    total = 0
    by_collection = {}
    for col in COLLECTIONS:
        col_dir = ASSETS_DIR / col
        if col_dir.exists():
            count = len(list(col_dir.glob("*.json")))
            by_collection[col] = count
            total += count
    return total, by_collection


def get_checkpoint_stats():
    """Read checkpoint file for progress info."""
    if CHECKPOINT_FILE.exists():
        try:
            data = json.loads(CHECKPOINT_FILE.read_text(encoding="utf-8"))
            return {
                "generated": len(data.get("generated", [])),
                "last_run": data.get("last_run", "unknown")
            }
        except Exception:
            pass
    return {"generated": 0, "last_run": "unknown"}


def save_status(status):
    """Save current status to file for external monitoring."""
    STATUS_FILE.write_text(
        json.dumps(status, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def print_status(start_time, initial_count, restarts):
    """Print a status report."""
    elapsed = time.time() - start_time
    hours = int(elapsed // 3600)
    minutes = int((elapsed % 3600) // 60)

    current_count, by_collection = count_assets()
    new_entities = current_count - initial_count
    checkpoint = get_checkpoint_stats()

    rate = new_entities / (elapsed / 3600) if elapsed > 60 else 0

    print(f"\n{'=' * 60}")
    print(f"CONTENT GENERATION STATUS — {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'=' * 60}")
    print(f"  Runtime:        {hours}h {minutes}m")
    print(f"  New entities:   {new_entities} (from {initial_count} → {current_count})")
    print(f"  Rate:           {rate:.1f} entities/hour")
    print(f"  Restarts:       {restarts}/{MAX_RESTARTS}")
    print(f"  Checkpoint:     {checkpoint['generated']} total generated")
    print(f"  Last activity:  {checkpoint['last_run']}")

    # Top collections
    top = sorted(by_collection.items(), key=lambda x: x[1], reverse=True)[:5]
    print(f"\n  Top collections:")
    for col, count in top:
        print(f"    {col}: {count}")

    print(f"{'=' * 60}\n")

    status = {
        "timestamp": datetime.now().isoformat(),
        "runtime_seconds": int(elapsed),
        "initial_count": initial_count,
        "current_count": current_count,
        "new_entities": new_entities,
        "rate_per_hour": round(rate, 1),
        "restarts": restarts,
        "by_collection": by_collection
    }
    save_status(status)


def run_generator(extra_args=None):
    """Run the content generation script as a subprocess."""
    cmd = [sys.executable, str(BASE_DIR / "scripts" / "generate-new-content.py")]
    if extra_args:
        cmd.extend(extra_args)

    print(f"[WATCHDOG] Starting: {' '.join(cmd)}")

    process = subprocess.Popen(
        cmd,
        cwd=str(BASE_DIR),
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    # Monitor the process
    while process.poll() is None:
        if shutdown_requested:
            print("[WATCHDOG] Sending graceful shutdown to generator...")
            process.send_signal(signal.SIGINT)
            process.wait(timeout=30)
            return "shutdown"
        time.sleep(1)

    return process.returncode


def main():
    global shutdown_requested

    extra_args = sys.argv[1:]

    print("=" * 60)
    print("OVERNIGHT CONTENT GENERATION — WATCHDOG")
    print("=" * 60)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Args: {' '.join(extra_args) if extra_args else '(none — full run)'}")
    print(f"Max restarts: {MAX_RESTARTS}")
    print(f"Press Ctrl+C to gracefully stop")
    print()

    start_time = time.time()
    initial_count, _ = count_assets()
    print(f"Initial asset count: {initial_count}")

    restarts = 0
    last_status = time.time()

    while restarts <= MAX_RESTARTS and not shutdown_requested:
        # Print status before each run
        if restarts > 0:
            print_status(start_time, initial_count, restarts)
            print(f"[WATCHDOG] Restart {restarts}/{MAX_RESTARTS} in {RESTART_DELAY}s...")
            time.sleep(RESTART_DELAY)

        result = run_generator(extra_args)

        if result == "shutdown":
            break

        if result == 0:
            print("[WATCHDOG] Generator completed successfully (all targets met)")
            break

        # Generator exited with error — restart
        restarts += 1
        print(f"[WATCHDOG] Generator exited with code {result}")

        if restarts > MAX_RESTARTS:
            print(f"[WATCHDOG] Max restarts ({MAX_RESTARTS}) reached. Stopping.")
            break

    # Final status
    print_status(start_time, initial_count, restarts)

    elapsed = time.time() - start_time
    current_count, _ = count_assets()
    new_entities = current_count - initial_count

    print(f"\nOVERNIGHT RUN COMPLETE")
    print(f"  Total new entities: {new_entities}")
    print(f"  Total runtime: {int(elapsed // 3600)}h {int((elapsed % 3600) // 60)}m")
    print(f"  Final asset count: {current_count}")


if __name__ == "__main__":
    main()
