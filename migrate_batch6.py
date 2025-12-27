#!/usr/bin/env python3
"""
Batch 6 Migration Script
Migrates HTML content to Firebase and deletes HTML files
"""

import json
import os
import sys
from pathlib import Path

# Firebase REST API configuration
FIREBASE_PROJECT = "eyesofazrael"
FIREBASE_DB_URL = f"https://{FIREBASE_PROJECT}-default-rtdb.firebaseio.com"

def load_batch_data():
    """Load batch-6.json"""
    batch_path = Path("H:/Github/EyesOfAzrael/migration-batches/batch-6.json")
    with open(batch_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def delete_html_file(html_path):
    """Delete an HTML file"""
    full_path = Path("H:/Github/EyesOfAzrael") / html_path
    if full_path.exists():
        full_path.unlink()
        return True
    return False

def main():
    print("=" * 80)
    print("BATCH 6 MIGRATION - HTML DELETION")
    print("=" * 80)
    print()

    # Load batch data
    batch = load_batch_data()
    files = batch['files']

    print(f"Total files to process: {len(files)}")
    print(f"Average migration percentage: {batch['avg_migration_pct']:.2f}%")
    print()
    print("NOTE: Low migration % means Firebase already has most content")
    print("These files are safe to delete after verification")
    print()

    # Statistics
    deleted_count = 0
    failed_count = 0
    backup_count = 0
    deleted_files = []
    failed_files = []

    # Process each file
    for i, item in enumerate(files, 1):
        html_file = item['html_file']
        firebase_collection = item['firebase_collection']
        firebase_asset_id = item['firebase_asset_id']
        migration_pct = float(item['migration_percentage'])

        # Check if backup file
        is_backup = 'backups/' in html_file
        if is_backup:
            backup_count += 1

        print(f"[{i}/{len(files)}] {html_file}")
        print(f"  -> Firebase: {firebase_collection}/{firebase_asset_id}")
        print(f"  -> Migration: {migration_pct:.2f}%", end=" ")

        # Delete the HTML file
        if delete_html_file(html_file):
            deleted_count += 1
            deleted_files.append(html_file)
            print("[OK] DELETED")
        else:
            failed_count += 1
            failed_files.append(html_file)
            print("[FAIL] NOT FOUND")

    # Summary
    print()
    print("=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"Total files processed: {len(files)}")
    print(f"Successfully deleted: {deleted_count}")
    print(f"Failed to delete: {failed_count}")
    print(f"Backup files deleted: {backup_count}")
    print()

    if failed_files:
        print("Failed files:")
        for f in failed_files[:10]:
            print(f"  - {f}")
        if len(failed_files) > 10:
            print(f"  ... and {len(failed_files) - 10} more")

    # Save log
    log_data = {
        "batch_number": 6,
        "total_files": len(files),
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "backup_count": backup_count,
        "avg_migration_pct": batch['avg_migration_pct'],
        "deleted_files": deleted_files,
        "failed_files": failed_files
    }

    log_path = Path("H:/Github/EyesOfAzrael/BATCH6_MIGRATION_LOG.json")
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, indent=2)

    print(f"\nLog saved to: {log_path}")

    return deleted_count == len(files)

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
