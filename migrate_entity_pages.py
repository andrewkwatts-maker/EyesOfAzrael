"""
Entity Page Firebase Migration Script
Migrates individual entity detail pages to use Firebase dynamic content

Tasks:
1. Add Firebase SDK scripts if missing
2. Add dynamic entity loading script
3. Preserve existing content as fallback
4. Add proper meta tags for entity identification
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration
FIREBASE_SDK_SCRIPTS = """
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>"""

FIREBASE_CONFIG_SCRIPT = """
    <!-- Firebase Config -->
    <script src="../../../firebase-config.js"></script>"""

ENTITY_LOADER_SCRIPT = """
    <!-- Entity Dynamic Loader -->
    <script type="module" src="../../../js/entity-page-loader.js"></script>"""

class EntityPageMigrator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.stats = {
            'processed': 0,
            'migrated': 0,
            'skipped': 0,
            'errors': 0,
            'already_has_firebase': 0
        }
        self.issues = []
        self.migrated_pages = []

    def extract_entity_info(self, file_path: Path) -> Dict:
        """Extract entity metadata from file path and content"""
        parts = file_path.parts

        # Find mythology name
        mythology_idx = parts.index('mythos') + 1 if 'mythos' in parts else None
        if not mythology_idx or mythology_idx >= len(parts):
            return None

        mythology = parts[mythology_idx]

        # Determine entity type from path
        entity_type = None
        type_map = {
            'deities': 'deity',
            'heroes': 'hero',
            'creatures': 'creature',
            'cosmology': 'cosmology',
            'rituals': 'ritual',
            'texts': 'text',
            'symbols': 'symbol',
            'herbs': 'herb'
        }

        for part in parts:
            if part in type_map:
                entity_type = type_map[part]
                break

        if not entity_type:
            return None

        # Get entity ID from filename
        entity_id = file_path.stem

        # Skip index pages and search pages
        if entity_id in ['index', 'corpus-search']:
            return None

        # Map entity type back to collection name
        collection_map = {
            'deity': 'deities',
            'hero': 'heroes',
            'creature': 'creatures',
            'cosmology': 'cosmology',
            'ritual': 'rituals',
            'text': 'texts',
            'symbol': 'symbols',
            'herb': 'herbs'
        }

        return {
            'mythology': mythology,
            'type': entity_type,
            'id': entity_id,
            'collection': collection_map.get(entity_type, entity_type + 's')
        }

    def has_firebase_sdk(self, content: str) -> bool:
        """Check if page already has Firebase SDK"""
        return 'firebase-app-compat.js' in content or 'firebase.initializeApp' in content

    def has_entity_loader(self, content: str) -> bool:
        """Check if page already has entity loader"""
        return 'entity-page-loader.js' in content or 'entity-loader.js' in content

    def calculate_script_depth(self, file_path: Path) -> str:
        """Calculate relative path depth for scripts"""
        # Count how deep the file is from base
        mythos_idx = None
        for i, part in enumerate(file_path.parts):
            if part == 'mythos':
                mythos_idx = i
                break

        if mythos_idx is None:
            return '../../../'

        # Calculate depth from mythos directory
        # Number of directories from file to mythos, plus one to get to root
        depth = len(file_path.parts) - mythos_idx - 2  # -2 for mythos itself and filename
        return '../' * (depth + 1)  # +1 to get to root where firebase-config.js is

    def add_meta_tags(self, content: str, entity_info: Dict) -> str:
        """Add or update entity metadata tags"""
        # Check if meta tags already exist
        if 'name="mythology"' in content and 'name="entity-type"' in content:
            return content

        meta_tags = f'''  <!-- Entity Metadata for Dynamic Loading -->
  <meta name="mythology" content="{entity_info['mythology']}">
  <meta name="entity-type" content="{entity_info['type']}">
  <meta name="entity-id" content="{entity_info['id']}">'''

        # Insert after charset/viewport meta tags
        pattern = r'(<meta[^>]*viewport[^>]*>)'
        replacement = r'\1\n' + meta_tags

        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, count=1)
        else:
            # Try to insert after <head>
            content = content.replace('<head>', f'<head>\n{meta_tags}', 1)

        return content

    def add_firebase_scripts(self, content: str, script_depth: str) -> str:
        """Add Firebase SDK and config scripts"""
        # Adjust script paths based on depth
        firebase_sdk = FIREBASE_SDK_SCRIPTS
        firebase_config = FIREBASE_CONFIG_SCRIPT.replace('../../../', script_depth)
        entity_loader = ENTITY_LOADER_SCRIPT.replace('../../../', script_depth)

        scripts_to_add = firebase_sdk + firebase_config + entity_loader

        # Try to insert before </head>
        if '</head>' in content:
            content = content.replace('</head>', f'{scripts_to_add}\n</head>', 1)
        else:
            # Fallback: insert after last script tag in head
            # Find the last script tag before </head> or body
            head_end = content.find('</head>')
            if head_end == -1:
                head_end = content.find('<body')

            if head_end > 0:
                # Insert before that position
                content = content[:head_end] + scripts_to_add + '\n' + content[head_end:]

        return content

    def add_dynamic_loading_marker(self, content: str, entity_info: Dict) -> str:
        """Add data attributes to main content area for dynamic loading"""
        # Add data-entity-page attribute to main or body
        if '<main' in content and 'data-entity-page' not in content:
            content = re.sub(
                r'<main([^>]*)>',
                f'<main\\1 data-entity-page="true" data-entity-type="{entity_info["type"]}" data-entity-id="{entity_info["id"]}" data-mythology="{entity_info["mythology"]}">',
                content,
                count=1
            )

        return content

    def migrate_page(self, file_path: Path) -> Tuple[bool, str]:
        """Migrate a single page"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract entity info
            entity_info = self.extract_entity_info(file_path)
            if not entity_info:
                return False, f"Could not extract entity info from path: {file_path}"

            # Check if already has Firebase
            if self.has_firebase_sdk(content):
                self.stats['already_has_firebase'] += 1
                return False, f"Already has Firebase SDK: {file_path}"

            # Calculate script depth
            script_depth = self.calculate_script_depth(file_path)

            # Perform migration
            original_content = content

            # 1. Add meta tags
            content = self.add_meta_tags(content, entity_info)

            # 2. Add Firebase scripts
            content = self.add_firebase_scripts(content, script_depth)

            # 3. Add dynamic loading marker
            content = self.add_dynamic_loading_marker(content, entity_info)

            # Only write if content changed
            if content != original_content:
                # Backup original file
                backup_path = file_path.with_suffix('.html.bak')
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)

                # Write updated file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

                self.stats['migrated'] += 1
                self.migrated_pages.append(str(file_path))
                return True, f"Successfully migrated: {file_path}"
            else:
                self.stats['skipped'] += 1
                return False, f"No changes needed: {file_path}"

        except Exception as e:
            self.stats['errors'] += 1
            error_msg = f"Error migrating {file_path}: {str(e)}"
            self.issues.append(error_msg)
            return False, error_msg

    def migrate_pages_from_list(self, page_list: List[str], max_pages: int = 100) -> Dict:
        """Migrate pages from a list of file paths"""
        print(f"\n{'='*80}")
        print(f"ENTITY PAGE FIREBASE MIGRATION")
        print(f"{'='*80}\n")
        print(f"Processing up to {max_pages} pages...\n")

        pages_to_process = page_list[:max_pages]

        for i, page_path in enumerate(pages_to_process, 1):
            self.stats['processed'] += 1

            # Convert backslashes to forward slashes and create Path
            page_path = page_path.replace('\\', '/')
            full_path = self.base_path / page_path

            print(f"[{i}/{len(pages_to_process)}] Processing: {page_path}")

            if not full_path.exists():
                error_msg = f"File not found: {full_path}"
                print(f"  [ERROR] {error_msg}")
                self.issues.append(error_msg)
                self.stats['errors'] += 1
                continue

            success, message = self.migrate_page(full_path)
            if success:
                print(f"  [OK] Migrated successfully")
            else:
                print(f"  [SKIP] {message.split(':')[0]}")

        return self.generate_report()

    def generate_report(self) -> Dict:
        """Generate migration report"""
        report = {
            'summary': {
                'total_processed': self.stats['processed'],
                'successfully_migrated': self.stats['migrated'],
                'already_had_firebase': self.stats['already_has_firebase'],
                'skipped': self.stats['skipped'],
                'errors': self.stats['errors']
            },
            'migrated_pages': self.migrated_pages,
            'issues': self.issues
        }

        print(f"\n{'='*80}")
        print(f"MIGRATION REPORT")
        print(f"{'='*80}\n")
        print(f"Total Processed:        {self.stats['processed']}")
        print(f"Successfully Migrated:  {self.stats['migrated']}")
        print(f"Already Had Firebase:   {self.stats['already_has_firebase']}")
        print(f"Skipped (No Changes):   {self.stats['skipped']}")
        print(f"Errors:                 {self.stats['errors']}")
        print(f"\n{'='*80}\n")

        if self.issues:
            print(f"Issues encountered: {len(self.issues)}")
            for issue in self.issues[:10]:  # Show first 10
                print(f"  - {issue}")
            if len(self.issues) > 10:
                print(f"  ... and {len(self.issues) - 10} more")

        return report

def main():
    # Load page list from validation file
    base_path = Path('H:/Github/EyesOfAzrael')

    print("Loading validation data...")
    with open(base_path / 'DYNAMIC_SYSTEM_VALIDATION.json', 'r', encoding='utf-8') as f:
        validation_data = json.load(f)

    # Extract page paths from validationErrors
    page_list = [error['path'] for error in validation_data.get('validationErrors', [])]

    print(f"Found {len(page_list)} pages in validationErrors")

    # Create migrator instance
    migrator = EntityPageMigrator(base_path)

    # Migrate first 100 pages
    report = migrator.migrate_pages_from_list(page_list, max_pages=100)

    # Save report
    report_path = base_path / 'ENTITY_MIGRATION_REPORT.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\nFull report saved to: {report_path}")

    return report

if __name__ == '__main__':
    main()
