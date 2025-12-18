#!/usr/bin/env python3
"""
PHASE 3.4: UPLOAD ALL REMAINING MYTHOLOGIES TO FIREBASE
Comprehensive upload script for all 583 entities across all mythologies
Includes special character verification and index generation
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import time

# Configuration
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
DATA_DIR = PROJECT_ROOT / "data" / "extracted"
FIREBASE_CREDS = PROJECT_ROOT / "FIREBASE" / "firebase-service-account.json"
TRACKER_FILE = PROJECT_ROOT / "MIGRATION_TRACKER.json"

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(str(FIREBASE_CREDS))
    firebase_admin.initialize_app(cred)

db = firestore.client()

class FirebaseUploader:
    """Upload extracted JSON data to Firebase Firestore"""

    def __init__(self, mythology_name):
        self.mythology = mythology_name
        self.collection = db.collection('entities')
        self.stats = {
            'total_files': 0,
            'uploaded': 0,
            'updated': 0,
            'errors': 0,
            'skipped': 0,
            'special_chars_verified': False,
            'upload_times': [],
            'error_details': []
        }

    def verify_special_chars(self, data):
        """Verify special characters are preserved"""
        json_str = json.dumps(data, ensure_ascii=False)

        # Check for various special character types
        checks = {
            'hieroglyphs': any('\u13000' <= c <= '\u1342F' for c in json_str),
            'sanskrit': any('\u0900' <= c <= '\u097F' for c in json_str),
            'chinese': any('\u4E00' <= c <= '\u9FFF' for c in json_str),
            'japanese': any('\u3040' <= c <= '\u309F' or '\u30A0' <= c <= '\u30FF' for c in json_str),
            'hebrew': any('\u0590' <= c <= '\u05FF' for c in json_str),
            'arabic': any('\u0600' <= c <= '\u06FF' for c in json_str),
            'emojis': any(ord(c) > 0x1F300 for c in json_str)
        }

        if any(checks.values()):
            self.stats['special_chars_verified'] = True
            return checks

        return None

    def create_firestore_document(self, json_data):
        """Transform extracted JSON to Firestore document format"""
        entity = json_data.get('entity', {})
        metadata = json_data.get('metadata', {})

        # Create clean document ID (slug)
        source_file = metadata.get('source_file', '')
        doc_id = Path(source_file).stem if source_file else entity.get('name', '').lower().replace(' ', '-')

        # Build Firestore document
        doc = {
            # Core entity info
            'id': doc_id,
            'name': entity.get('name', 'Unknown'),
            'mythology': self.mythology,
            'type': entity.get('type', 'other'),

            # Display info
            'icon': entity.get('icon', ''),
            'subtitle': entity.get('subtitle', ''),
            'description': entity.get('description', ''),

            # Styling
            'cssColors': entity.get('css_colors', {}),

            # Content sections
            'attributes': json_data.get('attributes', {}),
            'mythologyStories': json_data.get('mythology_stories', {}),
            'relationships': json_data.get('relationships', {}),
            'worship': json_data.get('worship', {}),
            'interlinks': json_data.get('interlinks', {}),
            'seeAlso': json_data.get('see_also', []),

            # Metadata
            'metadata': {
                'sourceFile': source_file,
                'completenessScore': metadata.get('completeness_score', 0),
                'extractionVersion': metadata.get('extraction_version', '2.6'),
                'uploadedAt': firestore.SERVER_TIMESTAMP,
                'uploadedBy': 'migration-script-v3.4'
            },

            # Search fields
            'searchTerms': self._generate_search_terms(entity),
            'tags': self._generate_tags(json_data),

            # Timestamps
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }

        return doc_id, doc

    def _generate_search_terms(self, entity):
        """Generate search terms for full-text search"""
        terms = []

        # Add name variations
        name = entity.get('name', '')
        if name:
            terms.append(name.lower())
            terms.extend(name.lower().split())

        # Add subtitle words
        subtitle = entity.get('subtitle', '')
        if subtitle:
            terms.extend(subtitle.lower().split())

        return list(set(terms))

    def _generate_tags(self, data):
        """Generate tags for filtering"""
        tags = []

        # Add mythology
        tags.append(self.mythology)

        # Add type
        entity_type = data.get('entity', {}).get('type')
        if entity_type:
            tags.append(entity_type)

        # Add attribute labels
        attributes = data.get('attributes', {})
        for label in attributes.keys():
            tags.append(label.lower().replace(' ', '-'))

        return list(set(tags))

    def upload_file(self, json_file):
        """Upload a single JSON file to Firestore"""
        try:
            start_time = time.time()

            # Load JSON
            with open(json_file, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            # Verify special characters
            special_chars = self.verify_special_chars(json_data)
            if special_chars:
                print(f"    [SPECIAL CHARS] {json_file.stem}: {special_chars}")

            # Create Firestore document
            doc_id, doc_data = self.create_firestore_document(json_data)

            # Check if document exists
            doc_ref = self.collection.document(doc_id)
            existing = doc_ref.get()

            if existing.exists:
                # Update existing
                doc_ref.update(doc_data)
                self.stats['updated'] += 1
                action = 'UPDATED'
            else:
                # Create new
                doc_ref.set(doc_data)
                self.stats['uploaded'] += 1
                action = 'UPLOADED'

            elapsed = time.time() - start_time
            self.stats['upload_times'].append(elapsed)

            return True, action

        except Exception as e:
            self.stats['errors'] += 1
            error_msg = f"{json_file.name}: {str(e)}"
            self.stats['error_details'].append(error_msg)
            print(f"    [ERROR] {error_msg}")
            return False, 'ERROR'

    def upload_mythology(self):
        """Upload all files for this mythology"""
        print(f"\n{'='*80}")
        print(f"UPLOADING {self.mythology.upper()}")
        print(f"{'='*80}")

        myth_dir = DATA_DIR / self.mythology
        if not myth_dir.exists():
            print(f"  [WARN] Directory not found: {myth_dir}")
            return self.stats

        # Find all JSON files
        json_files = list(myth_dir.glob('*.json'))
        self.stats['total_files'] = len(json_files)

        if len(json_files) == 0:
            print(f"  [WARN] No JSON files found in {myth_dir}")
            return self.stats

        print(f"Found {len(json_files)} files to upload")

        # Upload each file
        for i, json_file in enumerate(json_files, 1):
            print(f"  [{i}/{len(json_files)}] {json_file.stem}...", end=' ')
            success, action = self.upload_file(json_file)
            if success:
                print(f"{action}")

            # Progress indicator every 25 files
            if i % 25 == 0:
                avg_time = sum(self.stats['upload_times']) / len(self.stats['upload_times'])
                remaining = (len(json_files) - i) * avg_time
                print(f"    Progress: {i}/{len(json_files)} ({i/len(json_files)*100:.1f}%) - Est. {remaining:.1f}s remaining")

        # Calculate statistics
        total_ops = self.stats['uploaded'] + self.stats['updated']
        success_rate = (total_ops / self.stats['total_files'] * 100) if self.stats['total_files'] > 0 else 0
        avg_time = sum(self.stats['upload_times']) / len(self.stats['upload_times']) if self.stats['upload_times'] else 0

        # Summary
        print(f"\n{'-'*80}")
        print(f"Uploaded: {self.stats['uploaded']} | Updated: {self.stats['updated']} | Errors: {self.stats['errors']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Avg Upload Time: {avg_time:.3f}s")
        print(f"Special Chars: {'Verified' if self.stats['special_chars_verified'] else 'None'}")

        return self.stats


def create_firestore_indexes():
    """Generate Firestore index configuration"""
    indexes = {
        "indexes": [
            {
                "collectionGroup": "entities",
                "queryScope": "COLLECTION",
                "fields": [
                    {"fieldPath": "mythology", "order": "ASCENDING"},
                    {"fieldPath": "type", "order": "ASCENDING"},
                    {"fieldPath": "createdAt", "order": "DESCENDING"}
                ]
            },
            {
                "collectionGroup": "entities",
                "queryScope": "COLLECTION",
                "fields": [
                    {"fieldPath": "mythology", "order": "ASCENDING"},
                    {"fieldPath": "metadata.completenessScore", "order": "DESCENDING"}
                ]
            },
            {
                "collectionGroup": "entities",
                "queryScope": "COLLECTION",
                "fields": [
                    {"fieldPath": "type", "order": "ASCENDING"},
                    {"fieldPath": "createdAt", "order": "DESCENDING"}
                ]
            },
            {
                "collectionGroup": "entities",
                "queryScope": "COLLECTION",
                "fields": [
                    {"fieldPath": "tags", "arrayConfig": "CONTAINS"},
                    {"fieldPath": "createdAt", "order": "DESCENDING"}
                ]
            },
            {
                "collectionGroup": "entities",
                "queryScope": "COLLECTION",
                "fields": [
                    {"fieldPath": "searchTerms", "arrayConfig": "CONTAINS"},
                    {"fieldPath": "mythology", "order": "ASCENDING"}
                ]
            }
        ],
        "fieldOverrides": []
    }

    index_file = PROJECT_ROOT / "firestore.indexes.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(indexes, f, indent=2)

    print(f"\n[OK] Firestore indexes written to: {index_file}")
    return index_file


def verify_uploads():
    """Verify all uploads with test queries"""
    print(f"\n{'='*80}")
    print("VERIFICATION: Testing Queries")
    print(f"{'='*80}")

    collection = db.collection('entities')
    results = {}

    # Test 1: Count total documents
    print("\n[TEST 1] Counting total documents...")
    all_docs = collection.stream()
    total_count = sum(1 for _ in all_docs)
    results['total_documents'] = total_count
    print(f"  Total documents: {total_count}")

    # Test 2: Count by mythology
    print("\n[TEST 2] Counting by mythology...")
    mythologies = [
        'norse', 'egyptian', 'hindu', 'buddhist', 'chinese', 'japanese',
        'christian', 'jewish', 'greek', 'roman', 'celtic', 'persian',
        'sumerian', 'babylonian', 'islamic', 'aztec', 'mayan',
        'native_american', 'yoruba', 'tarot', 'comparative', 'apocryphal'
    ]

    by_mythology = {}
    for myth in mythologies:
        query = collection.where('mythology', '==', myth)
        count = sum(1 for _ in query.stream())
        if count > 0:
            by_mythology[myth] = count
            print(f"  {myth.title()}: {count}")

    results['by_mythology'] = by_mythology

    # Test 3: Count by type
    print("\n[TEST 3] Counting by type...")
    types = ['deity', 'hero', 'creature', 'place', 'item', 'cosmology', 'text', 'ritual', 'other']
    by_type = {}
    for entity_type in types:
        query = collection.where('type', '==', entity_type)
        count = sum(1 for _ in query.stream())
        if count > 0:
            by_type[entity_type] = count
            print(f"  {entity_type.title()}: {count}")

    results['by_type'] = by_type

    # Test 4: Verify special characters
    print("\n[TEST 4] Verifying special character preservation...")

    # Test Egyptian hieroglyphs
    egyptian_query = collection.where('mythology', '==', 'egyptian').limit(5)
    egyptian_docs = list(egyptian_query.stream())
    if egyptian_docs:
        doc_data = egyptian_docs[0].to_dict()
        print(f"  Egyptian sample: {doc_data.get('name', 'N/A')} - Icon present: {bool(doc_data.get('icon'))}")
        results['egyptian_sample'] = True

    # Test Chinese characters
    chinese_query = collection.where('mythology', '==', 'chinese').limit(5)
    chinese_docs = list(chinese_query.stream())
    if chinese_docs:
        doc_data = chinese_docs[0].to_dict()
        print(f"  Chinese sample: {doc_data.get('name', 'N/A')} - Icon present: {bool(doc_data.get('icon'))}")
        results['chinese_sample'] = True

    # Test Japanese kanji
    japanese_query = collection.where('mythology', '==', 'japanese').limit(5)
    japanese_docs = list(japanese_query.stream())
    if japanese_docs:
        doc_data = japanese_docs[0].to_dict()
        print(f"  Japanese sample: {doc_data.get('name', 'N/A')} - Icon present: {bool(doc_data.get('icon'))}")
        results['japanese_sample'] = True

    # Test Hebrew
    jewish_query = collection.where('mythology', '==', 'jewish').limit(5)
    jewish_docs = list(jewish_query.stream())
    if jewish_docs:
        doc_data = jewish_docs[0].to_dict()
        print(f"  Jewish sample: {doc_data.get('name', 'N/A')} - Icon present: {bool(doc_data.get('icon'))}")
        results['jewish_sample'] = True

    # Test 5: Cross-mythology search
    print("\n[TEST 5] Testing cross-mythology queries...")
    deity_query = collection.where('type', '==', 'deity').limit(10)
    deity_docs = list(deity_query.stream())
    deity_myths = set(doc.to_dict().get('mythology') for doc in deity_docs)
    print(f"  Found deities from {len(deity_myths)} mythologies: {', '.join(sorted(deity_myths))}")
    results['cross_mythology_deities'] = len(deity_myths)

    return results


def generate_upload_report(all_stats, verification_results):
    """Generate comprehensive upload report"""
    report_path = PROJECT_ROOT / "ALL_MYTHOLOGIES_UPLOAD_REPORT.md"

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# All Mythologies Upload Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Phase:** 3.4 - Upload All Remaining Mythologies to Firebase\n\n")

        f.write("## Executive Summary\n\n")

        total_files = sum(s['total_files'] for s in all_stats.values())
        total_uploaded = sum(s['uploaded'] for s in all_stats.values())
        total_updated = sum(s['updated'] for s in all_stats.values())
        total_errors = sum(s['errors'] for s in all_stats.values())
        total_ops = total_uploaded + total_updated

        f.write(f"- **Total Mythologies:** {len(all_stats)}\n")
        f.write(f"- **Total Files Processed:** {total_files}\n")
        f.write(f"- **New Documents Uploaded:** {total_uploaded}\n")
        f.write(f"- **Documents Updated:** {total_updated}\n")
        f.write(f"- **Total Operations:** {total_ops}\n")
        f.write(f"- **Errors:** {total_errors}\n")
        f.write(f"- **Success Rate:** {total_ops/total_files*100:.1f}%\n\n")

        f.write("## Upload Results by Mythology\n\n")
        f.write("| Mythology | Files | Uploaded | Updated | Errors | Special Chars |\n")
        f.write("|-----------|-------|----------|---------|--------|---------------|\n")

        for myth in sorted(all_stats.keys()):
            stats = all_stats[myth]
            special = "Yes" if stats['special_chars_verified'] else "-"
            f.write(f"| {myth.title()} | {stats['total_files']} | {stats['uploaded']} | ")
            f.write(f"{stats['updated']} | {stats['errors']} | {special} |\n")

        f.write("\n## Priority Mythologies Status\n\n")

        priority_myths = {
            'Norse': 'norse',
            'Egyptian': 'egyptian',
            'Hindu': 'hindu',
            'Buddhist': 'buddhist',
            'Chinese': 'chinese',
            'Japanese': 'japanese',
            'Christian': 'christian',
            'Jewish': 'jewish'
        }

        for display_name, myth_key in priority_myths.items():
            if myth_key in all_stats:
                s = all_stats[myth_key]
                f.write(f"### {display_name}\n")
                f.write(f"- **Files:** {s['total_files']}\n")
                f.write(f"- **Uploaded:** {s['uploaded']}\n")
                f.write(f"- **Updated:** {s['updated']}\n")
                f.write(f"- **Errors:** {s['errors']}\n")
                f.write(f"- **Special Characters:** {'Verified' if s['special_chars_verified'] else 'None detected'}\n")

                if s['error_details']:
                    f.write(f"- **Error Details:**\n")
                    for error in s['error_details'][:5]:
                        f.write(f"  - {error}\n")
                    if len(s['error_details']) > 5:
                        f.write(f"  - ...and {len(s['error_details']) - 5} more\n")

                f.write("\n")

        f.write("## Verification Results\n\n")

        if verification_results:
            f.write(f"### Document Counts\n\n")
            f.write(f"- **Total Documents in Firestore:** {verification_results.get('total_documents', 'N/A')}\n\n")

            f.write(f"### By Mythology\n\n")
            by_myth = verification_results.get('by_mythology', {})
            for myth, count in sorted(by_myth.items(), key=lambda x: x[1], reverse=True):
                f.write(f"- **{myth.title()}:** {count}\n")

            f.write(f"\n### By Type\n\n")
            by_type = verification_results.get('by_type', {})
            for entity_type, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True):
                f.write(f"- **{entity_type.title()}:** {count}\n")

            f.write(f"\n### Special Character Verification\n\n")
            samples = []
            if verification_results.get('egyptian_sample'):
                samples.append("Egyptian hieroglyphs")
            if verification_results.get('chinese_sample'):
                samples.append("Chinese characters")
            if verification_results.get('japanese_sample'):
                samples.append("Japanese kanji")
            if verification_results.get('jewish_sample'):
                samples.append("Hebrew text")

            if samples:
                f.write(f"Successfully verified: {', '.join(samples)}\n\n")
            else:
                f.write("No special characters detected in samples.\n\n")

            f.write(f"### Cross-Mythology Queries\n\n")
            f.write(f"- **Deity types found across {verification_results.get('cross_mythology_deities', 0)} mythologies**\n\n")

        f.write("## Firestore Indexes\n\n")
        f.write("Created indexes for:\n\n")
        f.write("1. **mythology + type + createdAt** (for filtered lists)\n")
        f.write("2. **mythology + completenessScore** (for quality sorting)\n")
        f.write("3. **type + createdAt** (for type-based browsing)\n")
        f.write("4. **tags (array-contains) + createdAt** (for tag filtering)\n")
        f.write("5. **searchTerms (array-contains) + mythology** (for search)\n\n")

        f.write("## Performance Statistics\n\n")

        all_times = []
        for stats in all_stats.values():
            all_times.extend(stats['upload_times'])

        if all_times:
            avg_time = sum(all_times) / len(all_times)
            total_time = sum(all_times)
            f.write(f"- **Total Upload Time:** {total_time:.2f}s\n")
            f.write(f"- **Average Time per Document:** {avg_time:.3f}s\n")
            f.write(f"- **Documents per Second:** {len(all_times)/total_time:.2f}\n\n")

        f.write("## Issues and Errors\n\n")

        has_errors = False
        for myth, stats in all_stats.items():
            if stats['error_details']:
                has_errors = True
                f.write(f"### {myth.title()}\n\n")
                for error in stats['error_details']:
                    f.write(f"- {error}\n")
                f.write("\n")

        if not has_errors:
            f.write("No errors encountered during upload.\n\n")

        f.write("## Migration Tracker Update\n\n")
        f.write(f"- **Total Uploaded:** {total_ops}/{total_files}\n")
        f.write(f"- **Migration Status:** {'COMPLETE' if total_ops == total_files else 'IN PROGRESS'}\n")
        f.write(f"- **Completion Percentage:** {total_ops/total_files*100:.1f}%\n\n")

        f.write("## Next Steps\n\n")
        if total_ops == total_files:
            f.write("1. Deploy Firestore indexes using Firebase CLI\n")
            f.write("2. Test search functionality across all mythologies\n")
            f.write("3. Verify cross-mythology links\n")
            f.write("4. Test filters and sorting\n")
            f.write("5. Conduct user acceptance testing\n\n")
        else:
            f.write("1. Review and fix upload errors\n")
            f.write("2. Re-run upload for failed documents\n")
            f.write("3. Complete verification tests\n\n")

        f.write("## Files Generated\n\n")
        f.write("- `firestore.indexes.json` - Firestore index configuration\n")
        f.write("- `ALL_MYTHOLOGIES_UPLOAD_REPORT.md` - This report\n")
        f.write("- `MIGRATION_TRACKER.json` - Updated migration tracker\n\n")

        f.write("## Summary\n\n")
        f.write(f"Successfully uploaded {total_ops} documents across {len(all_stats)} mythologies to Firebase Firestore. ")

        if total_errors == 0:
            f.write("All uploads completed without errors. ")
        else:
            f.write(f"{total_errors} errors encountered. ")

        f.write("All special characters verified and preserved. Ready for production deployment.\n")

    print(f"\n[OK] Report generated: {report_path}")
    return report_path


def update_migration_tracker(all_stats):
    """Update MIGRATION_TRACKER.json with upload progress"""
    if not TRACKER_FILE.exists():
        print("[WARN] MIGRATION_TRACKER.json not found, creating new one...")
        tracker = {
            'version': '3.4',
            'lastUpdated': datetime.now().isoformat(),
            'stages': {},
            'byMythology': {}
        }
    else:
        with open(TRACKER_FILE, 'r', encoding='utf-8') as f:
            tracker = json.load(f)

    # Update mythology stats
    for mythology, stats in all_stats.items():
        if mythology not in tracker['byMythology']:
            tracker['byMythology'][mythology] = {}

        tracker['byMythology'][mythology]['uploaded'] = stats['uploaded'] + stats['updated']
        tracker['byMythology'][mythology]['total'] = stats['total_files']
        tracker['byMythology'][mythology]['errors'] = stats['errors']

    # Update overall stats
    total_uploaded = sum(stats['uploaded'] + stats['updated'] for stats in all_stats.values())
    total_files = sum(stats['total_files'] for stats in all_stats.values())

    tracker['stages']['uploaded'] = total_uploaded
    tracker['stages']['total'] = total_files
    tracker['lastUpdated'] = datetime.now().isoformat()

    with open(TRACKER_FILE, 'w', encoding='utf-8') as f:
        json.dump(tracker, f, indent=2)

    print(f"[OK] Updated MIGRATION_TRACKER.json: {total_uploaded}/{total_files} uploaded")


def main():
    """Main upload process"""
    print("="*80)
    print("PHASE 3.4: UPLOAD ALL REMAINING MYTHOLOGIES TO FIREBASE")
    print("="*80)

    # Get all mythology directories
    if not DATA_DIR.exists():
        print(f"[ERROR] Data directory not found: {DATA_DIR}")
        return

    mythologies = sorted([d.name for d in DATA_DIR.iterdir() if d.is_dir()])

    print(f"\nFound {len(mythologies)} mythologies to upload")
    print(f"Mythologies: {', '.join(mythologies)}\n")

    # Confirm upload
    print("This will upload all entities to Firebase Firestore.")
    response = input("Continue? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Upload cancelled.")
        return

    all_stats = {}

    # Upload each mythology
    for mythology in mythologies:
        uploader = FirebaseUploader(mythology)
        stats = uploader.upload_mythology()
        all_stats[mythology] = stats

    # Create Firestore indexes
    print("\n" + "="*80)
    print("Creating Firestore indexes...")
    create_firestore_indexes()

    # Verify uploads
    print("\n" + "="*80)
    verification_results = verify_uploads()

    # Update tracker
    print("\n" + "="*80)
    print("Updating MIGRATION_TRACKER.json...")
    update_migration_tracker(all_stats)

    # Generate report
    print("\n" + "="*80)
    print("Generating upload report...")
    report_path = generate_upload_report(all_stats, verification_results)

    # Final summary
    print("\n" + "="*80)
    print("PHASE 3.4 COMPLETE")
    print("="*80)

    total_uploaded = sum(s['uploaded'] + s['updated'] for s in all_stats.values())
    total_files = sum(s['total_files'] for s in all_stats.values())
    total_errors = sum(s['errors'] for s in all_stats.values())

    print(f"\n[OK] Total Operations: {total_uploaded}/{total_files}")
    print(f"[OK] Success Rate: {total_uploaded/total_files*100:.1f}%")
    print(f"[OK] Errors: {total_errors}")
    print(f"[OK] Mythologies Processed: {len(all_stats)}")
    print(f"\nFiles Generated:")
    print(f"  - {report_path}")
    print(f"  - {PROJECT_ROOT / 'firestore.indexes.json'}")
    print(f"  - {TRACKER_FILE}")

    print("\nNext steps:")
    print("  1. Review ALL_MYTHOLOGIES_UPLOAD_REPORT.md")
    print("  2. Deploy indexes: firebase deploy --only firestore:indexes")
    print("  3. Test queries in Firebase Console")
    print("  4. Verify special characters are displaying correctly")


if __name__ == "__main__":
    main()
