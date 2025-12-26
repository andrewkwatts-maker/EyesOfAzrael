import os
import shutil
from pathlib import Path

base_path = Path('H:/Github/EyesOfAzrael')

# Find all .bak files
backup_files = list(base_path.glob('mythos/**/*.html.bak'))

print(f"Found {len(backup_files)} backup files")

restored = 0
for backup_file in backup_files:
    target_file = backup_file.with_suffix('')
    try:
        shutil.copy2(backup_file, target_file)
        restored += 1
    except Exception as e:
        print(f"Error restoring {backup_file}: {e}")

print(f"Restored {restored} files")
