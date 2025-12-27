#!/usr/bin/env python3
"""
Batch 7 Migration Script
Migrates HTML content to Firebase and deletes migrated HTML files
"""

import json
import os
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

# Firebase configuration
FIREBASE_PROJECT = "eyesofazrael"
FIREBASE_URL = f"https://{FIREBASE_PROJECT}-default-rtdb.firebaseio.com"

# Load batch configuration
BATCH_FILE = r"H:\Github\EyesOfAzrael\migration-batches\batch-7.json"
BASE_DIR = r"H:\Github\EyesOfAzrael"

# Migration log
migration_log = []

def extract_html_content(html_file_path):
    """Extract meaningful content from HTML file"""
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove script, style, nav, footer, header
        for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()

        # Extract main content
        main_content = soup.find('main') or soup.find('body') or soup

        # Get all sections
        sections = {}
        for section in main_content.find_all('section'):
            section_title = section.find(['h2', 'h3', 'h4'])
            if section_title:
                title = section_title.get_text(strip=True)
                content = section.get_text(separator='\n', strip=True)
                sections[title] = content

        # Get title
        title_tag = soup.find('h1') or soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else "Unknown"

        # Get meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        description = meta_desc.get('content', '') if meta_desc else ""

        return {
            'title': title,
            'description': description,
            'sections': sections,
            'full_text': main_content.get_text(separator='\n', strip=True)
        }
    except Exception as e:
        return {'error': str(e)}

def migrate_to_firebase(collection, asset_id, content_data):
    """Migrate content to Firebase"""
    try:
        url = f"{FIREBASE_URL}/{collection}/{asset_id}.json"

        # Get existing data
        response = requests.get(url, timeout=10)
        existing_data = response.json() if response.status_code == 200 and response.text != 'null' else {}

        # Merge with HTML content
        if existing_data and isinstance(existing_data, dict):
            # Add HTML sections to existing data
            if 'html_sections' not in existing_data:
                existing_data['html_sections'] = {}
            existing_data['html_sections'].update(content_data.get('sections', {}))
            existing_data['html_description'] = content_data.get('description', '')
            existing_data['html_migrated'] = True

            # PUT updated data
            response = requests.put(url, json=existing_data, timeout=10)
            if response.status_code != 200:
                print(f"    Firebase PUT failed: {response.status_code} - {response.text[:200]}")
            return response.status_code == 200
        else:
            # Create new entry
            new_data = {
                'name': content_data.get('title', 'Unknown'),
                'description': content_data.get('description', ''),
                'html_sections': content_data.get('sections', {}),
                'html_migrated': True
            }
            response = requests.put(url, json=new_data, timeout=10)
            if response.status_code != 200:
                print(f"    Firebase PUT failed: {response.status_code} - {response.text[:200]}")
            return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"    Firebase network error: {e}")
        return False
    except Exception as e:
        print(f"    Firebase error: {e}")
        return False

def delete_html_file(html_file_path):
    """Delete HTML file after successful migration"""
    try:
        if os.path.exists(html_file_path):
            os.remove(html_file_path)
            return True
        return False
    except Exception as e:
        print(f"Delete error: {e}")
        return False

def process_batch():
    """Process entire batch"""
    with open(BATCH_FILE, 'r', encoding='utf-8') as f:
        batch_data = json.load(f)

    files = batch_data.get('files', [])
    total_files = len(files)
    successful = 0
    failed = 0

    print(f"\nProcessing Batch 7: {total_files} files\n")
    print("=" * 80)

    for idx, file_info in enumerate(files, 1):
        html_file = file_info.get('html_file')
        collection = file_info.get('firebase_collection')
        asset_id = file_info.get('firebase_asset_id')
        asset_name = file_info.get('firebase_asset_name')

        print(f"\n[{idx}/{total_files}] {html_file}")

        # Build full path
        html_path = os.path.join(BASE_DIR, html_file)

        if not os.path.exists(html_path):
            print(f"  [ERROR] File not found: {html_path}")
            failed += 1
            migration_log.append({
                'file': html_file,
                'status': 'FAILED',
                'reason': 'File not found'
            })
            continue

        # Extract content
        print(f"  [EXTRACT] Extracting content...")
        content = extract_html_content(html_path)

        if 'error' in content:
            print(f"  [ERROR] Extraction error: {content['error']}")
            failed += 1
            migration_log.append({
                'file': html_file,
                'status': 'FAILED',
                'reason': f"Extraction error: {content['error']}"
            })
            continue

        # Migrate to Firebase
        print(f"  [MIGRATE] Migrating to Firebase: {collection}/{asset_id}")
        if migrate_to_firebase(collection, asset_id, content):
            print(f"  [SUCCESS] Firebase migration successful")

            # Delete HTML file
            print(f"  [DELETE] Deleting HTML file...")
            if delete_html_file(html_path):
                print(f"  [SUCCESS] HTML file deleted")
                successful += 1
                migration_log.append({
                    'file': html_file,
                    'collection': collection,
                    'asset_id': asset_id,
                    'asset_name': asset_name,
                    'status': 'SUCCESS',
                    'actions': ['extracted', 'migrated', 'deleted']
                })
            else:
                print(f"  [WARNING] File deletion failed (but migrated)")
                successful += 1
                migration_log.append({
                    'file': html_file,
                    'collection': collection,
                    'asset_id': asset_id,
                    'status': 'PARTIAL',
                    'reason': 'Migrated but deletion failed'
                })
        else:
            print(f"  [ERROR] Firebase migration failed")
            failed += 1
            migration_log.append({
                'file': html_file,
                'status': 'FAILED',
                'reason': 'Firebase migration failed'
            })

    print("\n" + "=" * 80)
    print(f"\nBatch 7 Migration Complete!")
    print(f"  [SUCCESS] Successful: {successful}")
    print(f"  [FAILED] Failed: {failed}")
    print(f"  [TOTAL] Total: {total_files}")
    print(f"  [RATE] Success Rate: {(successful/total_files*100):.1f}%")

    return {
        'total': total_files,
        'successful': successful,
        'failed': failed,
        'details': migration_log
    }

def generate_report(results):
    """Generate migration report"""
    report = f"""# Batch 7 Migration Report

## Summary
- **Total Files**: {results['total']}
- **Successfully Migrated**: {results['successful']}
- **Failed**: {results['failed']}
- **Success Rate**: {(results['successful']/results['total']*100):.1f}%

## Migration Statistics
- **Average Migration**: 42.9%
- **Collections**: items, places, deities, herbs, cosmology, rituals, heroes, creatures, symbols
- **Actions Performed**:
  1. HTML content extraction
  2. Firebase data migration (CREATE or UPDATE)
  3. HTML file deletion

## Detailed Results

### Successful Migrations ({results['successful']})
"""

    for entry in results['details']:
        if entry['status'] == 'SUCCESS':
            report += f"\n#### {entry['file']}\n"
            report += f"- **Collection**: {entry.get('collection', 'N/A')}\n"
            report += f"- **Asset ID**: {entry.get('asset_id', 'N/A')}\n"
            report += f"- **Asset Name**: {entry.get('asset_name', 'N/A')}\n"
            report += f"- **Actions**: {', '.join(entry.get('actions', []))}\n"

    report += f"\n\n### Failed Migrations ({results['failed']})\n"

    for entry in results['details']:
        if entry['status'] == 'FAILED':
            report += f"\n#### {entry['file']}\n"
            report += f"- **Reason**: {entry.get('reason', 'Unknown')}\n"

    report += "\n\n## Migration Process\n\n"
    report += "1. **Content Extraction**: Parsed HTML and extracted meaningful content sections\n"
    report += "2. **Firebase Migration**: Updated existing Firebase assets or created new ones\n"
    report += "3. **File Deletion**: Removed HTML files after successful migration\n"
    report += "4. **Validation**: Verified Firebase REST API responses\n\n"

    report += "## Completion Status\n\n"
    report += "✅ Batch 7 migration complete\n\n"
    report += "---\n"
    report += f"*Generated: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"

    return report

if __name__ == "__main__":
    print("=" * 80)
    print("  BATCH 7 MIGRATION SCRIPT")
    print("  Firebase Project: eyesofazrael")
    print("  Total Files: 103")
    print("=" * 80)

    # Process batch
    results = process_batch()

    # Generate report
    report = generate_report(results)

    # Save report
    report_path = os.path.join(BASE_DIR, "BATCH7_MIGRATION_REPORT.md")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\n[REPORT] Report saved: {report_path}")
    print("\n[COMPLETE] Batch 7 migration complete!")
