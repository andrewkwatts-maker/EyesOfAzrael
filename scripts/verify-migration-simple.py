"""
HTML to Firebase Migration Verification Script (Simple Version)
================================================================

This script analyzes all HTML files and compares them to Firebase JSON content.
Uses Firebase REST API (no admin SDK required).

Output: migration-verification-report.csv

Column definitions:
- html_text_in_asset_pct: Percentage of HTML text found in the Firebase asset
- asset_text_in_html_pct: Percentage of Firebase asset text found in the HTML
"""

import os
import re
import json
import csv
import requests
from pathlib import Path
from difflib import SequenceMatcher

# Firebase configuration
FIREBASE_PROJECT_ID = "eyesofazrael"
FIREBASE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

def extract_text_from_html(html_content):
    """Extract meaningful text content from HTML"""
    # Remove script and style tags
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)

    # Remove HTML comments
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)

    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)

    # Decode HTML entities
    entities = {
        '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&amp;': '&',
        '&quot;': '"', '&#39;': "'", '&mdash;': '-', '&ndash;': '-',
        '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"'
    }
    for entity, char in entities.items():
        text = text.replace(entity, char)

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    return text.strip().lower()

def extract_text_from_firebase_doc(doc_data):
    """Extract all text content from a Firebase document"""
    text_parts = []

    def extract_recursive(obj):
        if isinstance(obj, dict):
            # Handle Firestore value format
            if 'stringValue' in obj:
                text_parts.append(obj['stringValue'].lower())
            elif 'integerValue' in obj or 'doubleValue' in obj or 'booleanValue' in obj:
                pass  # Skip numeric/boolean values
            elif 'arrayValue' in obj:
                if 'values' in obj['arrayValue']:
                    for item in obj['arrayValue']['values']:
                        extract_recursive(item)
            elif 'mapValue' in obj:
                if 'fields' in obj['mapValue']:
                    extract_recursive(obj['mapValue']['fields'])
            else:
                # Regular dict
                for key, value in obj.items():
                    # Skip metadata fields
                    if key in ['id', 'type', 'order', 'timestamp', 'created', 'updated',
                              'icon', 'image', 'name', 'createTime', 'updateTime']:
                        continue
                    extract_recursive(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_recursive(item)
        elif isinstance(obj, str):
            text_parts.append(obj.lower())

    extract_recursive(doc_data)
    return ' '.join(text_parts).strip()

def calculate_match_percentages(html_text, firebase_text):
    """
    Calculate bidirectional match percentages:
    1. html_text_in_asset_pct: % of HTML words found in Firebase
    2. asset_text_in_html_pct: % of Firebase words found in HTML
    """
    if not html_text or not firebase_text:
        return 0.0, 0.0

    # Tokenize into words
    html_words = set(w for w in html_text.split() if len(w) > 2)
    firebase_words = set(w for w in firebase_text.split() if len(w) > 2)

    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'this',
        'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them'
    }

    html_words -= stop_words
    firebase_words -= stop_words

    if not html_words or not firebase_words:
        return 0.0, 0.0

    # Calculate percentages
    common_words = html_words & firebase_words
    html_in_firebase = len(common_words) / len(html_words) * 100
    firebase_in_html = len(common_words) / len(firebase_words) * 100

    return round(html_in_firebase, 2), round(firebase_in_html, 2)

def fetch_firebase_collection(collection_name):
    """Fetch all documents from a Firebase collection via REST API"""
    try:
        url = f"{FIREBASE_BASE_URL}/{collection_name}"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            if 'documents' in data:
                return data['documents']
        return []
    except Exception as e:
        print(f"  Warning: Could not fetch {collection_name}: {e}")
        return []

def find_html_files(base_path):
    """Find all relevant HTML files"""
    exclude_dirs = {
        'node_modules', '.git', 'dist', 'build', 'examples', 'tests',
        'debug', 'temp', 'templates', 'components', 'test'
    }

    html_files = []
    base_path = Path(base_path)

    for html_file in base_path.rglob('*.html'):
        # Skip excluded directories
        if any(excl in html_file.parts for excl in exclude_dirs):
            continue

        # Skip test and example files
        name_lower = html_file.name.lower()
        if 'test' in name_lower or 'example' in name_lower or 'demo' in name_lower:
            continue

        html_files.append(html_file)

    return sorted(html_files)

def get_asset_name(doc):
    """Extract asset name from Firebase document"""
    fields = doc.get('fields', {})

    # Try different name fields
    for name_field in ['name', 'title', 'id']:
        if name_field in fields:
            if 'stringValue' in fields[name_field]:
                return fields[name_field]['stringValue']

    # Use document ID as fallback
    doc_path = doc.get('name', '')
    return doc_path.split('/')[-1] if doc_path else 'unknown'

def find_best_match(html_text, firebase_data):
    """Find best matching Firebase asset"""
    best_match = {
        'collection': 'None',
        'asset_id': 'None',
        'asset_name': 'None',
        'html_in_firebase_pct': 0.0,
        'firebase_in_html_pct': 0.0,
        'combined_score': 0.0
    }

    for collection_name, docs in firebase_data.items():
        for doc in docs:
            firebase_text = extract_text_from_firebase_doc(doc)

            if not firebase_text or len(firebase_text) < 20:
                continue

            html_in_fb, fb_in_html = calculate_match_percentages(html_text, firebase_text)

            # Combined score (average of both percentages)
            combined = (html_in_fb + fb_in_html) / 2

            if combined > best_match['combined_score']:
                doc_path = doc.get('name', '')
                doc_id = doc_path.split('/')[-1] if doc_path else 'unknown'

                best_match = {
                    'collection': collection_name,
                    'asset_id': doc_id,
                    'asset_name': get_asset_name(doc),
                    'html_in_firebase_pct': html_in_fb,
                    'firebase_in_html_pct': fb_in_html,
                    'combined_score': round(combined, 2)
                }

    return best_match

def calculate_migration_percentage(html_in_fb, fb_in_html):
    """Calculate overall migration percentage (average of both directions)"""
    return round((html_in_fb + fb_in_html) / 2, 2)

def get_migration_status(migration_pct):
    """Get migration status label"""
    if migration_pct >= 90:
        return "Complete"
    elif migration_pct >= 70:
        return "Mostly Migrated"
    elif migration_pct >= 50:
        return "Partially Migrated"
    elif migration_pct >= 25:
        return "Minimal Migration"
    else:
        return "Not Migrated"

def main():
    """Main verification function"""
    print("=" * 80)
    print("HTML to Firebase Migration Verification (Simple)")
    print("=" * 80)

    base_path = "H:/Github/EyesOfAzrael"

    # Fetch Firebase data
    print("\n[1/4] Fetching Firebase data...")
    collections = [
        'mythologies', 'deities', 'heroes', 'creatures', 'items',
        'places', 'rituals', 'texts', 'herbs', 'symbols',
        'cosmology', 'magic', 'archetypes'
    ]

    firebase_data = {}
    for collection in collections:
        docs = fetch_firebase_collection(collection)
        firebase_data[collection] = docs
        print(f"  {collection}: {len(docs)} documents")

    total_docs = sum(len(docs) for docs in firebase_data.values())
    print(f"\nTotal Firebase documents: {total_docs}")

    # Find HTML files
    print("\n[2/4] Finding HTML files...")
    html_files = find_html_files(base_path)
    print(f"Found {len(html_files)} HTML files")

    # Analyze files
    print("\n[3/4] Analyzing files...")
    results = []

    for i, html_file in enumerate(html_files, 1):
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()

            html_text = extract_text_from_html(html_content)

            if len(html_text) < 50:
                continue

            match = find_best_match(html_text, firebase_data)
            migration_pct = calculate_migration_percentage(
                match['html_in_firebase_pct'],
                match['firebase_in_html_pct']
            )

            rel_path = html_file.relative_to(base_path)

            results.append({
                'html_file': str(rel_path).replace('\\', '/'),
                'html_word_count': len(html_text.split()),
                'firebase_collection': match['collection'],
                'firebase_asset_id': match['asset_id'],
                'firebase_asset_name': match['asset_name'],
                'html_text_in_asset_pct': match['html_in_firebase_pct'],
                'asset_text_in_html_pct': match['firebase_in_html_pct'],
                'migration_percentage': migration_pct,
                'migration_status': get_migration_status(migration_pct)
            })

            if i % 20 == 0:
                print(f"  Processed {i}/{len(html_files)}...")

        except Exception as e:
            print(f"  Error processing {html_file.name}: {e}")

    # Write CSV
    print("\n[4/4] Writing report...")
    csv_path = os.path.join(base_path, 'migration-verification-report.csv')

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'html_file',
            'html_word_count',
            'firebase_collection',
            'firebase_asset_id',
            'firebase_asset_name',
            'html_text_in_asset_pct',
            'asset_text_in_html_pct',
            'migration_percentage',
            'migration_status'
        ]

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        # Sort by migration percentage (lowest first)
        results.sort(key=lambda x: x['migration_percentage'])
        writer.writerows(results)

    print(f"\nReport written to: {csv_path}")

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    total = len(results)
    if total == 0:
        print("No files analyzed")
        return

    by_status = {}
    for r in results:
        status = r['migration_status']
        by_status[status] = by_status.get(status, 0) + 1

    print(f"\nTotal Files: {total}")
    print("\nMigration Status:")
    for status in ["Complete", "Mostly Migrated", "Partially Migrated", "Minimal Migration", "Not Migrated"]:
        count = by_status.get(status, 0)
        pct = count / total * 100
        print(f"  {status:20s}: {count:4d} ({pct:5.1f}%)")

    avg_migration = sum(r['migration_percentage'] for r in results) / total
    avg_html_in_fb = sum(r['html_text_in_asset_pct'] for r in results) / total
    avg_fb_in_html = sum(r['asset_text_in_html_pct'] for r in results) / total

    print(f"\nAverage Migration %:        {avg_migration:.2f}%")
    print(f"Average HTML in Firebase %: {avg_html_in_fb:.2f}%")
    print(f"Average Firebase in HTML %: {avg_fb_in_html:.2f}%")

    # Show files needing migration
    needs_work = [r for r in results if r['migration_percentage'] < 50]
    if needs_work:
        print(f"\n\nFiles Needing Migration ({len(needs_work)} files):")
        print("-" * 80)
        for r in needs_work[:15]:
            print(f"  {r['html_file']:<65s} {r['migration_percentage']:>5.1f}%")
        if len(needs_work) > 15:
            print(f"  ... and {len(needs_work) - 15} more")

    print("\n" + "=" * 80)

if __name__ == '__main__':
    main()
