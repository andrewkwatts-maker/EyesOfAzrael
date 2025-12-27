#!/usr/bin/env python3
"""
Firebase Upload Script for Batch 7
Uploads extracted content to Firebase Realtime Database
"""

import json
import requests
import time

# Configuration
FIREBASE_PROJECT = "eyesofazrael"
FIREBASE_URL = f"https://{FIREBASE_PROJECT}-default-rtdb.firebaseio.com"
DATA_FILE = "H:\\Github\\EyesOfAzrael\\batch7_migration_data.json"

# Statistics
stats = {
    'total': 0,
    'uploaded': 0,
    'updated': 0,
    'failed': 0,
    'skipped': 0
}

def upload_to_firebase(collection, asset_id, firebase_data):
    """Upload data to Firebase"""
    try:
        url = f"{FIREBASE_URL}/{collection}/{asset_id}.json"

        # Get existing data
        get_response = requests.get(url, timeout=10)

        if get_response.status_code == 200 and get_response.text != 'null':
            # Update existing
            existing_data = get_response.json()
            if isinstance(existing_data, dict):
                # Merge new HTML content
                existing_data.update(firebase_data)
                patch_response = requests.patch(url, json=firebase_data, timeout=10)

                if patch_response.status_code == 200:
                    print(f"    [UPDATED] {collection}/{asset_id}")
                    stats['updated'] += 1
                    return True
                else:
                    print(f"    [ERROR] PATCH failed: {patch_response.status_code}")
                    stats['failed'] += 1
                    return False
        else:
            # Create new
            put_response = requests.put(url, json=firebase_data, timeout=10)

            if put_response.status_code == 200:
                print(f"    [CREATED] {collection}/{asset_id}")
                stats['uploaded'] += 1
                return True
            else:
                print(f"    [ERROR] PUT failed: {put_response.status_code}")
                stats['failed'] += 1
                return False

    except requests.exceptions.RequestException as e:
        print(f"    [ERROR] Network error: {e}")
        stats['failed'] += 1
        return False
    except Exception as e:
        print(f"    [ERROR] {e}")
        stats['failed'] += 1
        return False

def main():
    print("=" * 80)
    print("  FIREBASE BATCH 7 UPLOAD")
    print(f"  Project: {FIREBASE_PROJECT}")
    print("=" * 80)

    # Load migration data
    print(f"\nLoading migration data...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    migrations = [m for m in data['migrations'] if m['status'] == 'READY']
    stats['total'] = len(migrations)

    print(f"Found {stats['total']} assets to upload\n")
    print("=" * 80)

    # Upload each asset
    for idx, migration in enumerate(migrations, 1):
        collection = migration['collection']
        asset_id = migration['asset_id']
        firebase_data = migration['firebase_data']

        print(f"\n[{idx}/{stats['total']}] {migration['file']}")
        print(f"  Collection: {collection}, Asset: {asset_id}")

        # Upload to Firebase
        upload_to_firebase(collection, asset_id, firebase_data)

        # Rate limiting
        time.sleep(0.1)

    # Summary
    print("\n" + "=" * 80)
    print("\nUpload Summary:")
    print(f"  Total Assets: {stats['total']}")
    print(f"  Uploaded (new): {stats['uploaded']}")
    print(f"  Updated (existing): {stats['updated']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Success Rate: {((stats['uploaded'] + stats['updated']) / stats['total'] * 100):.1f}%")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nUpload interrupted by user")
    except Exception as e:
        print(f"\n\nFatal error: {e}")
