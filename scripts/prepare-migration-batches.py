"""
Prepare Migration Batches for HTML to Firebase
===============================================

Reads migration-verification-report.csv and creates 8 batches of files
to migrate, excluding boilerplate/infrastructure files.
"""

import csv
import json
import os

# Files to exclude from migration (infrastructure/boilerplate)
EXCLUDE_PATTERNS = [
    'index.html',  # Main entry point
    'login.html',
    'register.html',
    'logout.html',
    'dashboard.html',
    'preferences.html',
    'profile.html',
    'settings.html',
    'about.html',
    'terms.html',
    'privacy.html',
    '404.html',
    '500.html',
    'offline.html',
    'components/',
    'templates/',
    'BACKUP_',
    'debug-',
    'test-',
    'shader-',
    '.claude/',
    'scripts/',
    'examples/',
    'FIREBASE/',  # Duplicate directory
    'firebase-config',
    'corpus-search.html',  # Template files
    '_corpus-search-template',
    'progress-dashboard',
    'search-advanced',
    'compare.html',
    'archetypes.html',  # Top-level category pages
    'herbalism/index.html',  # Category indexes
    'magic/index.html',
    'spiritual-items/index.html',
    'spiritual-places/index.html',
    'theories/user-submissions/',  # User submission system
    'cache-stats.html',
    'update-mythologies',
    'upload-content',
    'migrate-to-firebase',
    'migration-report'
]

def should_exclude(filepath):
    """Check if file should be excluded from migration"""
    for pattern in EXCLUDE_PATTERNS:
        if pattern in filepath:
            return True
    return False

def load_migration_data():
    """Load the migration verification CSV"""
    csv_path = "H:/Github/EyesOfAzrael/migration-verification-report.csv"

    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    return rows

def categorize_files(rows):
    """Categorize files by migration status"""
    to_migrate = []
    to_update = []
    already_migrated = []
    excluded = []

    for row in rows:
        filepath = row['html_file']
        migration_pct = float(row['migration_percentage'])
        status = row['migration_status']

        # Check exclusions
        if should_exclude(filepath):
            excluded.append(row)
            continue

        # Categorize
        if migration_pct >= 90:
            already_migrated.append(row)
        elif migration_pct >= 50:
            to_update.append(row)
        else:
            to_migrate.append(row)

    return to_migrate, to_update, already_migrated, excluded

def create_batches(files, num_batches=8):
    """Split files into equal batches"""
    batch_size = len(files) // num_batches
    remainder = len(files) % num_batches

    batches = []
    start = 0

    for i in range(num_batches):
        # Add one extra file to first 'remainder' batches
        size = batch_size + (1 if i < remainder else 0)
        end = start + size
        batches.append(files[start:end])
        start = end

    return batches

def main():
    """Main function"""
    print("=" * 80)
    print("Preparing Migration Batches")
    print("=" * 80)

    # Load data
    print("\n[1/4] Loading migration data...")
    rows = load_migration_data()
    print(f"  Loaded {len(rows)} files from CSV")

    # Categorize
    print("\n[2/4] Categorizing files...")
    to_migrate, to_update, already_migrated, excluded = categorize_files(rows)

    print(f"  To Migrate (<50%):     {len(to_migrate):4d}")
    print(f"  To Update (50-89%):    {len(to_update):4d}")
    print(f"  Already Migrated (90%+): {len(already_migrated):4d}")
    print(f"  Excluded (boilerplate):  {len(excluded):4d}")

    # Create batches
    print("\n[3/4] Creating migration batches...")

    # Combine to_migrate and to_update, sorted by migration % (lowest first)
    all_to_process = to_migrate + to_update
    all_to_process.sort(key=lambda x: float(x['migration_percentage']))

    batches = create_batches(all_to_process, num_batches=8)

    for i, batch in enumerate(batches, 1):
        print(f"  Batch {i}: {len(batch):4d} files")

    # Save batches
    print("\n[4/4] Saving batch files...")

    os.makedirs("H:/Github/EyesOfAzrael/migration-batches", exist_ok=True)

    for i, batch in enumerate(batches, 1):
        batch_path = f"H:/Github/EyesOfAzrael/migration-batches/batch-{i}.json"

        batch_data = {
            'batch_number': i,
            'total_files': len(batch),
            'avg_migration_pct': sum(float(f['migration_percentage']) for f in batch) / len(batch) if batch else 0,
            'files': batch
        }

        with open(batch_path, 'w', encoding='utf-8') as f:
            json.dump(batch_data, f, indent=2)

        print(f"  Saved batch-{i}.json ({len(batch)} files, avg {batch_data['avg_migration_pct']:.1f}%)")

    # Save summary
    summary_path = "H:/Github/EyesOfAzrael/migration-batches/summary.json"
    summary = {
        'total_files_analyzed': len(rows),
        'to_migrate': len(to_migrate),
        'to_update': len(to_update),
        'already_migrated': len(already_migrated),
        'excluded': len(excluded),
        'total_to_process': len(all_to_process),
        'num_batches': 8,
        'batches': [
            {
                'batch_number': i,
                'file_count': len(batch),
                'avg_migration_pct': sum(float(f['migration_percentage']) for f in batch) / len(batch) if batch else 0,
                'file_path': f'migration-batches/batch-{i}.json'
            }
            for i, batch in enumerate(batches, 1)
        ]
    }

    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)

    print(f"\n  Saved summary.json")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nTotal files to process: {len(all_to_process)}")
    print(f"Files per batch: ~{len(all_to_process) // 8}")
    print(f"\nBatch files ready in: migration-batches/")
    print(f"  batch-1.json through batch-8.json")
    print(f"  summary.json")
    print("\n" + "=" * 80)

if __name__ == '__main__':
    main()
