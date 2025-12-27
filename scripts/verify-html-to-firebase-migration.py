"""
HTML to Firebase Migration Verification Script
==============================================

This script analyzes all HTML files in the project and compares them to Firebase JSON content
to verify migration completion. It creates a CSV report with bidirectional match percentages.

Output: migration-verification-report.csv
"""

import os
import re
import json
import csv
from pathlib import Path
from collections import defaultdict
from difflib import SequenceMatcher
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
def init_firebase():
    """Initialize Firebase Admin SDK with service account"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        # Initialize with service account
        cred_path = "H:/Github/EyesOfAzrael/eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json"
        if not os.path.exists(cred_path):
            print(f"ERROR: Service account file not found at {cred_path}")
            print("Please ensure the Firebase service account JSON exists")
            return None

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully")

    return firestore.client()

# Extract text content from HTML
def extract_text_from_html(html_content):
    """Extract meaningful text content from HTML, excluding tags and scripts"""
    # Remove script and style tags
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)

    # Remove HTML comments
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)

    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)

    # Decode HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&amp;', '&')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove common boilerplate
    text = re.sub(r'Eyes of Azrael', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Copyright.*?\d{4}', '', text, flags=re.IGNORECASE)

    return text.strip().lower()

# Extract text from Firebase document
def extract_text_from_firebase_doc(doc_data):
    """Extract all text content from a Firebase document recursively"""
    text_parts = []

    def extract_recursive(obj):
        if isinstance(obj, dict):
            for key, value in obj.items():
                # Skip metadata fields
                if key in ['id', 'type', 'order', 'timestamp', 'created', 'updated', 'icon', 'image']:
                    continue
                extract_recursive(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_recursive(item)
        elif isinstance(obj, str):
            text_parts.append(obj.lower())

    extract_recursive(doc_data)
    return ' '.join(text_parts).strip()

# Calculate similarity percentage
def calculate_similarity(text1, text2):
    """Calculate similarity between two text strings (0-100%)"""
    if not text1 or not text2:
        return 0.0

    # Use SequenceMatcher for fuzzy matching
    return SequenceMatcher(None, text1, text2).ratio() * 100

# Calculate bidirectional match percentages
def calculate_match_percentages(html_text, firebase_text):
    """
    Calculate two percentages:
    1. HTML text found in Firebase (html_in_firebase_pct)
    2. Firebase text found in HTML (firebase_in_html_pct)
    """
    if not html_text or not firebase_text:
        return 0.0, 0.0

    # Tokenize texts into words
    html_words = set(html_text.split())
    firebase_words = set(firebase_text.split())

    # Remove very common words (stop words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                  'can', 'could', 'may', 'might', 'must', 'shall', 'should'}

    html_words = html_words - stop_words
    firebase_words = firebase_words - stop_words

    if not html_words or not firebase_words:
        return 0.0, 0.0

    # Calculate percentage of HTML words found in Firebase
    html_in_firebase = len(html_words & firebase_words) / len(html_words) * 100

    # Calculate percentage of Firebase words found in HTML
    firebase_in_html = len(firebase_words & html_words) / len(firebase_words) * 100

    return round(html_in_firebase, 2), round(firebase_in_html, 2)

# Find all HTML files
def find_html_files(base_path):
    """Find all HTML files in the project, excluding certain directories"""
    exclude_dirs = {
        'node_modules', '.git', 'dist', 'build', 'examples', 'tests',
        'debug', 'temp', 'templates', 'components'
    }

    html_files = []
    base_path = Path(base_path)

    for html_file in base_path.rglob('*.html'):
        # Skip excluded directories
        if any(excl in html_file.parts for excl in exclude_dirs):
            continue

        # Skip test and example files
        if 'test' in html_file.name.lower() or 'example' in html_file.name.lower():
            continue

        html_files.append(html_file)

    return sorted(html_files)

# Fetch all Firebase collections
def fetch_firebase_data(db):
    """Fetch all documents from all relevant Firebase collections"""
    collections_to_check = [
        'mythologies',
        'deities',
        'heroes',
        'creatures',
        'items',
        'places',
        'rituals',
        'texts',
        'herbs',
        'symbols',
        'cosmology',
        'magic',
        'archetypes'
    ]

    firebase_data = {}

    for collection_name in collections_to_check:
        try:
            docs = db.collection(collection_name).stream()
            firebase_data[collection_name] = []

            for doc in docs:
                doc_dict = doc.to_dict()
                doc_dict['_id'] = doc.id
                doc_dict['_collection'] = collection_name
                firebase_data[collection_name].append(doc_dict)

            print(f"Fetched {len(firebase_data[collection_name])} documents from {collection_name}")
        except Exception as e:
            print(f"Warning: Could not fetch collection {collection_name}: {e}")
            firebase_data[collection_name] = []

    return firebase_data

# Find best matching Firebase asset for HTML file
def find_best_match(html_file, html_text, firebase_data):
    """Find the best matching Firebase asset for an HTML file"""
    best_match = {
        'collection': 'None',
        'asset_id': 'None',
        'asset_name': 'None',
        'html_in_firebase_pct': 0.0,
        'firebase_in_html_pct': 0.0,
        'overall_similarity': 0.0
    }

    # Try to determine expected collection from path
    path_lower = str(html_file).lower()

    for collection_name, docs in firebase_data.items():
        for doc in docs:
            firebase_text = extract_text_from_firebase_doc(doc)

            if not firebase_text:
                continue

            # Calculate bidirectional match percentages
            html_in_fb, fb_in_html = calculate_match_percentages(html_text, firebase_text)

            # Calculate overall similarity for ranking
            overall_sim = calculate_similarity(html_text, firebase_text)

            # Update best match if this is better
            if overall_sim > best_match['overall_similarity']:
                best_match = {
                    'collection': collection_name,
                    'asset_id': doc.get('_id', 'unknown'),
                    'asset_name': doc.get('name', doc.get('title', doc.get('_id', 'unknown'))),
                    'html_in_firebase_pct': html_in_fb,
                    'firebase_in_html_pct': fb_in_html,
                    'overall_similarity': round(overall_sim, 2)
                }

    return best_match

# Calculate migration percentage
def calculate_migration_percentage(html_in_fb, fb_in_html, overall_sim):
    """
    Calculate overall migration percentage based on:
    - HTML text found in Firebase (weight: 40%)
    - Firebase text found in HTML (weight: 40%)
    - Overall similarity (weight: 20%)
    """
    migration_pct = (html_in_fb * 0.4 + fb_in_html * 0.4 + overall_sim * 0.2)
    return round(migration_pct, 2)

# Main verification function
def verify_migration(base_path):
    """Main function to verify HTML to Firebase migration"""
    print("=" * 80)
    print("HTML to Firebase Migration Verification")
    print("=" * 80)

    # Initialize Firebase
    print("\n[1/5] Initializing Firebase...")
    db = init_firebase()
    if not db:
        print("ERROR: Could not initialize Firebase")
        return

    # Fetch Firebase data
    print("\n[2/5] Fetching Firebase data...")
    firebase_data = fetch_firebase_data(db)
    total_firebase_docs = sum(len(docs) for docs in firebase_data.values())
    print(f"Total Firebase documents: {total_firebase_docs}")

    # Find HTML files
    print("\n[3/5] Finding HTML files...")
    html_files = find_html_files(base_path)
    print(f"Found {len(html_files)} HTML files to analyze")

    # Analyze each HTML file
    print("\n[4/5] Analyzing HTML files and finding matches...")
    results = []

    for i, html_file in enumerate(html_files, 1):
        try:
            # Read HTML file
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()

            # Extract text
            html_text = extract_text_from_html(html_content)

            if not html_text or len(html_text) < 50:
                # Skip files with minimal content
                continue

            # Find best matching Firebase asset
            match = find_best_match(html_file, html_text, firebase_data)

            # Calculate migration percentage
            migration_pct = calculate_migration_percentage(
                match['html_in_firebase_pct'],
                match['firebase_in_html_pct'],
                match['overall_similarity']
            )

            # Get relative path
            rel_path = html_file.relative_to(base_path)

            results.append({
                'html_file': str(rel_path),
                'html_word_count': len(html_text.split()),
                'firebase_collection': match['collection'],
                'firebase_asset_id': match['asset_id'],
                'firebase_asset_name': match['asset_name'],
                'html_text_in_asset_pct': match['html_in_firebase_pct'],
                'asset_text_in_html_pct': match['firebase_in_html_pct'],
                'overall_similarity_pct': match['overall_similarity'],
                'migration_percentage': migration_pct,
                'migration_status': get_migration_status(migration_pct)
            })

            if i % 10 == 0:
                print(f"  Processed {i}/{len(html_files)} files...")

        except Exception as e:
            print(f"  Error processing {html_file}: {e}")
            continue

    # Write CSV report
    print("\n[5/5] Writing CSV report...")
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
            'overall_similarity_pct',
            'migration_percentage',
            'migration_status'
        ]

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"\nReport written to: {csv_path}")
    print(f"Total files analyzed: {len(results)}")

    # Print summary statistics
    print_summary(results)

def get_migration_status(migration_pct):
    """Get migration status based on percentage"""
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

def print_summary(results):
    """Print summary statistics"""
    print("\n" + "=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)

    total = len(results)
    complete = sum(1 for r in results if r['migration_status'] == 'Complete')
    mostly = sum(1 for r in results if r['migration_status'] == 'Mostly Migrated')
    partial = sum(1 for r in results if r['migration_status'] == 'Partially Migrated')
    minimal = sum(1 for r in results if r['migration_status'] == 'Minimal Migration')
    not_migrated = sum(1 for r in results if r['migration_status'] == 'Not Migrated')

    avg_migration = sum(r['migration_percentage'] for r in results) / total if total > 0 else 0
    avg_html_in_fb = sum(r['html_text_in_asset_pct'] for r in results) / total if total > 0 else 0
    avg_fb_in_html = sum(r['asset_text_in_html_pct'] for r in results) / total if total > 0 else 0

    print(f"\nTotal Files Analyzed: {total}")
    print(f"\nMigration Status Breakdown:")
    print(f"  Complete (90%+):          {complete:4d} ({complete/total*100:5.1f}%)")
    print(f"  Mostly Migrated (70-89%): {mostly:4d} ({mostly/total*100:5.1f}%)")
    print(f"  Partially Migrated (50-69%): {partial:4d} ({partial/total*100:5.1f}%)")
    print(f"  Minimal Migration (25-49%): {minimal:4d} ({minimal/total*100:5.1f}%)")
    print(f"  Not Migrated (<25%):      {not_migrated:4d} ({not_migrated/total*100:5.1f}%)")

    print(f"\nAverage Metrics:")
    print(f"  Overall Migration %:       {avg_migration:.2f}%")
    print(f"  HTML text in Firebase %:   {avg_html_in_fb:.2f}%")
    print(f"  Firebase text in HTML %:   {avg_fb_in_html:.2f}%")

    print("\n" + "=" * 80)

    # Print top unmigrated files
    unmigrated = sorted(
        [r for r in results if r['migration_percentage'] < 50],
        key=lambda x: x['migration_percentage']
    )[:10]

    if unmigrated:
        print("\nTop 10 Files Needing Migration:")
        print("-" * 80)
        for r in unmigrated:
            print(f"  {r['html_file']:<60} {r['migration_percentage']:>5.1f}%")

if __name__ == '__main__':
    base_path = "H:/Github/EyesOfAzrael"
    verify_migration(base_path)
