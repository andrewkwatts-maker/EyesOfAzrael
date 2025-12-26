#!/usr/bin/env python3
"""
Upload Enhanced Assets to Firebase
Uploads all polished entities from firebase-assets-enhanced/ to Firestore
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from pathlib import Path
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate('eyesofazrael-firebase-adminsdk-fbsvc-8366e4dac5.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Base directory
base_dir = Path('firebase-assets-enhanced')

# Collections to upload (in priority order)
collections = [
    # High Priority
    'deities',
    'cosmology',
    'heroes',
    # Medium Priority
    'creatures',
    'texts',
    'items',
    'places',
    'herbs',
    # Low Priority
    'rituals',
    'symbols',
    'concepts',
    'events'
]

def upload_collection(collection_name):
    """Upload all entities in a collection"""
    print(f"\n{'='*80}")
    print(f">> Uploading {collection_name.upper()}...")
    print('='*80)

    collection_dir = base_dir / collection_name
    if not collection_dir.exists():
        print(f"  WARNING: Directory not found: {collection_dir}")
        return 0, 0

    uploaded = 0
    errors = 0
    batch = db.batch()
    batch_size = 0
    max_batch = 500  # Firestore batch limit

    # Find all JSON files for this collection
    for json_file in collection_dir.rglob('*.json'):
        # Skip summary/report files
        filename = json_file.name.lower()
        if any(skip in filename for skip in ['summary', 'report', '_all', 'index', 'readme']):
            continue

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle array of entities vs single entity
            entities = data if isinstance(data, list) else [data]

            for entity in entities:
                if 'id' not in entity:
                    print(f"  WARNING: Skipping entity without ID in {json_file.name}")
                    continue

                doc_id = entity['id']

                # Add upload metadata
                entity['_uploadedAt'] = datetime.now().isoformat()
                entity['_enhanced'] = True

                doc_ref = db.collection(collection_name).document(doc_id)
                batch.set(doc_ref, entity)
                batch_size += 1
                uploaded += 1

                # Commit batch if reaching limit
                if batch_size >= max_batch:
                    batch.commit()
                    print(f"  OK Committed batch of {batch_size} entities")
                    batch = db.batch()
                    batch_size = 0

        except Exception as e:
            print(f"  ERROR with {json_file.name}: {e}")
            errors += 1

    # Commit remaining batch
    if batch_size > 0:
        batch.commit()
        print(f"  OK Committed final batch of {batch_size} entities")

    print(f"\n  SUCCESS: Uploaded {uploaded} entities to {collection_name}")
    if errors > 0:
        print(f"  WARNING: {errors} errors encountered")

    return uploaded, errors

def main():
    """Main upload process"""
    print('='*80)
    print('FIREBASE ENHANCED ASSETS UPLOAD')
    print('='*80)
    print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    total_uploaded = 0
    total_errors = 0

    for collection in collections:
        count, errors = upload_collection(collection)
        total_uploaded += count
        total_errors += errors

    print('\n' + '='*80)
    print('UPLOAD COMPLETE')
    print('='*80)
    print(f"\nSUCCESS: Total Uploaded: {total_uploaded} entities")
    if total_errors > 0:
        print(f"WARNING: Total Errors: {total_errors}")
    print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print('='*80 + '\n')

if __name__ == '__main__':
    main()
