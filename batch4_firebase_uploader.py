import json
import requests
import time
import os
from datetime import datetime
from typing import Dict, List, Any

# Firebase Configuration
FIREBASE_PROJECT = "eyesofazrael"
FIREBASE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents"

# Tracking
upload_results = []
deletion_log = []
error_log = []
rollback_data = []

def read_extracted_content():
    """Read the extracted content JSON file"""
    with open('batch-4-extracted-content.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def read_batch_mapping():
    """Read the batch-4 mapping data"""
    with open('migration-batches/batch-4.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_content_to_firebase(collection: str, doc_id: str, content_data: Dict) -> Dict:
    """Upload/merge content to Firebase using REST API"""

    # Construct the document path
    doc_path = f"{FIREBASE_BASE_URL}/{collection}/{doc_id}"

    # Prepare the update with merge behavior
    # For PATCH, we need to structure the data with field paths
    fields = {}

    # Add extracted content fields
    if 'title' in content_data:
        fields['extracted_title'] = {'stringValue': content_data['title']}

    if 'headings' in content_data and content_data['headings']:
        # Store headings as an array
        headings_array = {
            'arrayValue': {
                'values': [{'stringValue': h} for h in content_data['headings']]
            }
        }
        fields['extracted_headings'] = headings_array

    if 'links' in content_data and content_data['links']:
        # Store links as an array of strings
        links_array = {
            'arrayValue': {
                'values': [{'stringValue': link} for link in content_data['links']]
            }
        }
        fields['extracted_links'] = links_array

    if 'lists' in content_data and content_data['lists']:
        # Store lists as an array
        lists_array = {
            'arrayValue': {
                'values': [{'stringValue': item} for item in content_data['lists']]
            }
        }
        fields['extracted_lists'] = lists_array

    # Add metadata
    fields['batch4_migration_timestamp'] = {'timestampValue': datetime.utcnow().isoformat() + 'Z'}
    fields['batch4_migration_status'] = {'stringValue': 'completed'}

    payload = {'fields': fields}

    # Use PATCH with updateMask to merge (not replace)
    update_mask = ','.join(fields.keys())

    try:
        response = requests.patch(
            f"{doc_path}?updateMask.fieldPaths={update_mask}",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code in [200, 204]:
            return {
                'success': True,
                'status_code': response.status_code,
                'response': response.text
            }
        else:
            # If PATCH fails, try POST (create new document)
            response = requests.post(
                f"{FIREBASE_BASE_URL}/{collection}?documentId={doc_id}",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code in [200, 201]:
                return {
                    'success': True,
                    'status_code': response.status_code,
                    'response': response.text,
                    'method': 'POST'
                }
            else:
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'error': response.text
                }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def delete_html_file(file_path: str) -> bool:
    """Delete HTML file after successful upload"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        else:
            print(f"Warning: File not found for deletion: {file_path}")
            return False
    except Exception as e:
        print(f"Error deleting file {file_path}: {str(e)}")
        return False

def process_batch():
    """Main processing function"""

    print("=" * 80)
    print("BATCH 4 FIREBASE UPLOAD & HTML DELETION")
    print("=" * 80)

    # Load data
    print("\nLoading batch data...")
    batch_data = read_batch_mapping()

    print("\nLoading extracted content...")
    extracted_data = read_extracted_content()

    total_files = len(extracted_data['files'])
    print(f"\nProcessing {total_files} files from Batch 4")
    print(f"Average migration: {batch_data['avg_migration_pct']:.2f}%\n")

    success_count = 0
    error_count = 0
    deleted_count = 0

    for idx, file_entry in enumerate(extracted_data['files'], 1):
        html_file = file_entry['source_file']
        collection = file_entry['collection']
        asset_id = file_entry['asset_id']
        content = file_entry['content']

        print(f"\n[{idx}/{total_files}] Processing: {html_file}")
        print(f"  -> Collection: {collection}, Asset ID: {asset_id}")

        # Upload to Firebase
        result = merge_content_to_firebase(collection, asset_id, content)

        if result['success']:
            print(f"  [OK] Upload successful (Status: {result['status_code']})")

            # Store rollback data
            rollback_data.append({
                'collection': collection,
                'document_id': asset_id,
                'html_file': html_file,
                'timestamp': datetime.utcnow().isoformat()
            })

            # Delete HTML file
            full_path = os.path.join(os.getcwd(), html_file)
            if delete_html_file(full_path):
                print(f"  [OK] HTML file deleted: {html_file}")
                deleted_count += 1
                deletion_log.append({
                    'file': html_file,
                    'deleted_at': datetime.utcnow().isoformat(),
                    'collection': collection,
                    'asset_id': asset_id
                })
            else:
                print(f"  [ERROR] Failed to delete HTML file: {html_file}")
                error_log.append({
                    'file': html_file,
                    'error': 'File deletion failed',
                    'collection': collection,
                    'asset_id': asset_id
                })

            success_count += 1

        else:
            print(f"  [ERROR] Upload failed: {result.get('error', 'Unknown error')}")
            print(f"  -> HTML file preserved for safety")
            error_count += 1

            error_log.append({
                'file': html_file,
                'collection': collection,
                'asset_id': asset_id,
                'error': result.get('error', 'Unknown error'),
                'status_code': result.get('status_code', 'N/A')
            })

        upload_results.append({
            'file': html_file,
            'collection': collection,
            'asset_id': asset_id,
            'success': result['success'],
            'deleted': result['success'] and (deleted_count == idx)
        })

        # Rate limiting - be gentle with Firebase
        time.sleep(0.1)

    # Save logs
    print("\n" + "=" * 80)
    print("Saving logs...")

    with open('batch4_deletion_log.json', 'w', encoding='utf-8') as f:
        json.dump(deletion_log, f, indent=2)
    print("[OK] Saved: batch4_deletion_log.json")

    if error_log:
        with open('batch4_upload_errors.json', 'w', encoding='utf-8') as f:
            json.dump(error_log, f, indent=2)
        print("[OK] Saved: batch4_upload_errors.json")

    with open('batch4_rollback_data.json', 'w', encoding='utf-8') as f:
        json.dump(rollback_data, f, indent=2)
    print("[OK] Saved: batch4_rollback_data.json")

    # Generate report
    generate_report(total_files, success_count, error_count, deleted_count)

def generate_report(total: int, success: int, errors: int, deleted: int):
    """Generate comprehensive upload report"""

    report = f"""# Batch 4 Firebase Upload Report

## Summary

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Total Files Processed:** {total}
**Successful Uploads:** {success}
**Failed Uploads:** {errors}
**HTML Files Deleted:** {deleted}
**Success Rate:** {(success/total*100):.2f}%

## Upload Statistics

- Files uploaded to Firebase: {success}
- Files with errors: {errors}
- HTML files successfully deleted: {deleted}
- HTML files preserved (due to errors): {errors}

## Collections Updated

"""

    # Count by collection
    collections = {}
    for result in upload_results:
        coll = result['collection']
        collections[coll] = collections.get(coll, 0) + 1

    for coll, count in sorted(collections.items()):
        report += f"- **{coll}**: {count} documents\n"

    report += "\n## Error Details\n\n"

    if error_log:
        report += f"Total errors: {len(error_log)}\n\n"
        for error in error_log[:10]:  # Show first 10 errors
            report += f"### {error['file']}\n"
            report += f"- Collection: {error['collection']}\n"
            report += f"- Asset ID: {error['asset_id']}\n"
            report += f"- Error: {error['error']}\n\n"

        if len(error_log) > 10:
            report += f"\n*See batch4_upload_errors.json for complete error list*\n"
    else:
        report += "No errors encountered! ✓\n"

    report += "\n## Rollback Information\n\n"
    report += f"Rollback data saved to: batch4_rollback_data.json\n"
    report += f"Total rollback entries: {len(rollback_data)}\n"
    report += "Rollback data preserved for 24 hours\n"

    report += "\n## Deletion Log\n\n"
    report += f"Deleted files logged to: batch4_deletion_log.json\n"
    report += f"Total files deleted: {len(deletion_log)}\n\n"

    if deletion_log:
        report += "### Sample Deletions\n\n"
        for del_entry in deletion_log[:5]:
            report += f"- {del_entry['file']} → {del_entry['collection']}/{del_entry['asset_id']}\n"

    report += "\n## Next Steps\n\n"
    report += "1. Verify Firebase data integrity\n"
    report += "2. Check error log if any failures occurred\n"
    report += "3. Review deletion log to confirm files were properly removed\n"
    report += "4. Rollback data available if needed within 24 hours\n"

    # Save report
    with open('BATCH4_UPLOAD_REPORT.md', 'w', encoding='utf-8') as f:
        f.write(report)

    print("\n" + "=" * 80)
    print("BATCH 4 UPLOAD COMPLETE")
    print("=" * 80)
    print(f"\nTotal Files: {total}")
    print(f"Successful: {success}")
    print(f"Errors: {errors}")
    print(f"Deleted: {deleted}")
    print(f"\n[OK] Report saved: BATCH4_UPLOAD_REPORT.md")
    print("=" * 80)

if __name__ == "__main__":
    process_batch()
