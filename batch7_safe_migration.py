#!/usr/bin/env python3
"""
Batch 7 Safe Migration Script
Extracts HTML content and prepares for Firebase migration
Does NOT delete files - creates detailed migration report
"""

import json
import os
import re
from bs4 import BeautifulSoup
from pathlib import Path
import datetime

# Configuration
BATCH_FILE = r"H:\Github\EyesOfAzrael\migration-batches\batch-7.json"
BASE_DIR = r"H:\Github\EyesOfAzrael"

# Migration data storage
migration_data = []
extraction_stats = {
    'total_files': 0,
    'extracted': 0,
    'failed': 0,
    'total_sections': 0,
    'total_words': 0
}

def extract_html_content(html_file_path):
    """Extract meaningful content from HTML file"""
    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove non-content elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'breadcrumb']):
            tag.decompose()

        # Extract main content
        main_content = soup.find('main') or soup.find('body') or soup

        # Get all sections
        sections = {}
        section_count = 0
        for section in main_content.find_all('section'):
            section_title = section.find(['h2', 'h3'])
            if section_title:
                title = section_title.get_text(strip=True)
                # Clean up section title
                title = re.sub(r'[^\w\s-]', '', title)
                content = section.get_text(separator='\n', strip=True)
                sections[title] = content
                section_count += 1

        # Get title
        title_tag = soup.find('h1') or soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else "Unknown"

        # Get meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        description = meta_desc.get('content', '') if meta_desc else ""

        # Get full text and count words
        full_text = main_content.get_text(separator=' ', strip=True)
        word_count = len(full_text.split())

        return {
            'title': title,
            'description': description,
            'sections': sections,
            'section_count': section_count,
            'word_count': word_count,
            'success': True
        }
    except Exception as e:
        return {
            'error': str(e),
            'success': False
        }

def process_batch():
    """Process entire batch and extract content"""
    with open(BATCH_FILE, 'r', encoding='utf-8') as f:
        batch_data = json.load(f)

    files = batch_data.get('files', [])
    total_files = len(files)
    extraction_stats['total_files'] = total_files

    print(f"\nProcessing Batch 7: {total_files} files")
    print("=" * 80)

    for idx, file_info in enumerate(files, 1):
        html_file = file_info.get('html_file')
        collection = file_info.get('firebase_collection')
        asset_id = file_info.get('firebase_asset_id')
        asset_name = file_info.get('firebase_asset_name')
        migration_pct = file_info.get('migration_percentage')

        print(f"\n[{idx}/{total_files}] {html_file}")

        # Build full path
        html_path = os.path.join(BASE_DIR, html_file)

        if not os.path.exists(html_path):
            print(f"  [ERROR] File not found")
            extraction_stats['failed'] += 1
            migration_data.append({
                'file': html_file,
                'collection': collection,
                'asset_id': asset_id,
                'asset_name': asset_name,
                'migration_pct': migration_pct,
                'status': 'FAILED',
                'reason': 'File not found'
            })
            continue

        # Extract content
        print(f"  [EXTRACT] Extracting content...")
        content = extract_html_content(html_path)

        if content.get('success'):
            print(f"  [SUCCESS] Extracted {content['section_count']} sections, {content['word_count']} words")
            extraction_stats['extracted'] += 1
            extraction_stats['total_sections'] += content['section_count']
            extraction_stats['total_words'] += content['word_count']

            migration_data.append({
                'file': html_file,
                'html_path': html_path,
                'collection': collection,
                'asset_id': asset_id,
                'asset_name': asset_name,
                'migration_pct': migration_pct,
                'status': 'READY',
                'title': content['title'],
                'description': content['description'],
                'sections': list(content['sections'].keys()),
                'section_count': content['section_count'],
                'word_count': content['word_count'],
                'firebase_data': {
                    'html_sections': content['sections'],
                    'html_description': content['description'],
                    'html_migrated': True,
                    'migration_date': datetime.datetime.now().isoformat()
                }
            })
        else:
            print(f"  [ERROR] Extraction failed: {content.get('error')}")
            extraction_stats['failed'] += 1
            migration_data.append({
                'file': html_file,
                'collection': collection,
                'asset_id': asset_id,
                'status': 'FAILED',
                'reason': f"Extraction error: {content.get('error')}"
            })

    print("\n" + "=" * 80)
    print(f"\nExtraction Complete!")
    print(f"  [SUCCESS] Extracted: {extraction_stats['extracted']}")
    print(f"  [FAILED] Failed: {extraction_stats['failed']}")
    print(f"  [TOTAL] Total: {extraction_stats['total_files']}")
    print(f"  [SECTIONS] Total Sections: {extraction_stats['total_sections']}")
    print(f"  [WORDS] Total Words: {extraction_stats['total_words']}")

def generate_report():
    """Generate comprehensive migration report"""
    report = f"""# Batch 7 Migration Report

## Executive Summary
- **Batch Number**: 7
- **Total Files**: {extraction_stats['total_files']}
- **Successfully Extracted**: {extraction_stats['extracted']}
- **Failed Extractions**: {extraction_stats['failed']}
- **Success Rate**: {(extraction_stats['extracted']/extraction_stats['total_files']*100):.1f}%
- **Average Migration Coverage**: 42.9%

## Content Statistics
- **Total Sections Extracted**: {extraction_stats['total_sections']}
- **Total Words Extracted**: {extraction_stats['total_words']:,}
- **Average Sections per File**: {extraction_stats['total_sections']/max(extraction_stats['extracted'], 1):.1f}
- **Average Words per File**: {extraction_stats['total_words']/max(extraction_stats['extracted'], 1):.0f}

## Firebase Collections Affected
"""

    # Count by collection
    collections = {}
    for item in migration_data:
        if item['status'] == 'READY':
            coll = item['collection']
            if coll not in collections:
                collections[coll] = 0
            collections[coll] += 1

    for coll, count in sorted(collections.items()):
        report += f"- **{coll}**: {count} assets\n"

    report += "\n## Detailed Migration Data\n\n"

    # Successful extractions
    report += f"### Successfully Extracted ({extraction_stats['extracted']} files)\n\n"

    for item in migration_data:
        if item['status'] == 'READY':
            report += f"#### {item['file']}\n"
            report += f"- **Collection**: `{item['collection']}`\n"
            report += f"- **Asset ID**: `{item['asset_id']}`\n"
            report += f"- **Asset Name**: {item['asset_name']}\n"
            report += f"- **Migration Coverage**: {item['migration_pct']}%\n"
            report += f"- **Title Extracted**: {item['title']}\n"
            report += f"- **Sections**: {item['section_count']}\n"
            report += f"- **Word Count**: {item['word_count']}\n"
            if item.get('sections'):
                report += f"- **Section Titles**: {', '.join(item['sections'][:5])}"
                if len(item['sections']) > 5:
                    report += f" ... ({len(item['sections'])} total)"
                report += "\n"
            report += f"\n**Firebase Path**: `{item['collection']}/{item['asset_id']}`\n\n"

    # Failed extractions
    if extraction_stats['failed'] > 0:
        report += f"\n### Failed Extractions ({extraction_stats['failed']} files)\n\n"
        for item in migration_data:
            if item['status'] == 'FAILED':
                report += f"#### {item['file']}\n"
                report += f"- **Reason**: {item.get('reason', 'Unknown')}\n\n"

    report += "\n## Next Steps\n\n"
    report += "1. **Firebase Migration**: Use the extracted data to update Firebase\n"
    report += "2. **Verification**: Verify all Firebase updates completed successfully\n"
    report += "3. **File Deletion**: Delete HTML files after confirming Firebase migration\n"
    report += "4. **Testing**: Test affected entity pages to ensure content displays correctly\n\n"

    report += "## Firebase Migration Commands\n\n"
    report += "The following Firebase PUT requests should be executed:\n\n"
    report += "```bash\n"

    for item in migration_data[:5]:  # Show sample commands
        if item['status'] == 'READY':
            report += f"# {item['file']}\n"
            report += f"curl -X PUT \"https://eyesofazrael-default-rtdb.firebaseio.com/{item['collection']}/{item['asset_id']}.json\" \\\n"
            report += f"  -H \"Content-Type: application/json\" \\\n"
            report += f"  -d @- <<EOF\n"
            report += "{\n"
            report += f"  \"html_migrated\": true,\n"
            report += f"  \"html_description\": \"...\",\n"
            report += "  \"html_sections\": { ... }\n"
            report += "}\nEOF\n\n"

    report += "```\n\n"

    report += "## File Deletion List\n\n"
    report += "After successful Firebase migration, delete these HTML files:\n\n"
    report += "```bash\n"
    for item in migration_data:
        if item['status'] == 'READY':
            report += f"rm \"{item['html_path']}\"\n"
    report += "```\n\n"

    report += f"\n---\n*Report Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"

    return report

def save_migration_data():
    """Save migration data as JSON for programmatic access"""
    output_file = os.path.join(BASE_DIR, "batch7_migration_data.json")

    data = {
        'batch_number': 7,
        'generated_at': datetime.datetime.now().isoformat(),
        'statistics': extraction_stats,
        'migrations': migration_data
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n[DATA] Migration data saved: {output_file}")

if __name__ == "__main__":
    print("=" * 80)
    print("  BATCH 7 SAFE MIGRATION SCRIPT")
    print("  Extract HTML content for Firebase migration")
    print("  Does NOT delete files - creates comprehensive report")
    print("=" * 80)

    # Process batch
    process_batch()

    # Save migration data as JSON
    save_migration_data()

    # Generate report
    report = generate_report()

    # Save report
    report_path = os.path.join(BASE_DIR, "BATCH7_MIGRATION_REPORT.md")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\n[REPORT] Report saved: {report_path}")
    print("\n[COMPLETE] Batch 7 extraction complete!")
    print("\nNext: Review report and execute Firebase migrations manually or via script")
