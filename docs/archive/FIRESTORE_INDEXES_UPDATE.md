# Firestore Indexes Manual Update Guide

## Quick Instructions

Since `firestore.indexes.json` contains comments (which prevent automatic editing), you need to manually add the content collection indexes.

### Step 1: Open the File

Open `H:/Github/EyesOfAzrael/firestore.indexes.json` in your text editor.

### Step 2: Find the Insert Location

Scroll to the end of the file and find this section (around line 374-381):

```json
    {
      "collectionGroup": "taxonomies",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentId", "order": "ASCENDING" },
        { "fieldPath": "depth", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Step 3: Add a Comma

Add a comma after the closing brace of the last taxonomies index:

```json
      ]
    },    <-- ADD COMMA HERE
```

Should become:

```json
      ]
    },
```

### Step 4: Insert Content Indexes

After the comma, BEFORE the closing `]` for the indexes array, paste the following:

```json

    // ===== CONTENT COLLECTION INDEXES =====
    // For default and user-submitted mythology content

    // Basic status + timestamp
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Default vs User filtering
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    },

    // Content type queries
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    },

    // Mythology filtering
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    },

    // Mythology + Content Type (MOST COMMON QUERY)
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "title", "order": "ASCENDING" }
      ]
    },

    // Mythology + Section
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "section", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Default content filtering by mythology and type
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isDefault", "order": "ASCENDING" },
        { "fieldPath": "mythology", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "title", "order": "ASCENDING" }
      ]
    },

    // Section filtering
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "section", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // User submissions by author
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },

    // Popular/trending queries
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "views", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "views", "order": "DESCENDING" }
      ]
    },

    // Array field queries (tags, relatedMythologies)
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "relatedMythologies", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "content",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "relatedMythologies", "arrayConfig": "CONTAINS" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    }
```

### Step 5: Verify Format

Make sure your final structure looks like this:

```json
{
  "indexes": [
    // ... all existing indexes ...

    {
      "collectionGroup": "taxonomies",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentId", "order": "ASCENDING" },
        { "fieldPath": "depth", "order": "ASCENDING" }
      ]
    },

    // ===== CONTENT COLLECTION INDEXES =====
    {
      "collectionGroup": "content",
      ...
    },
    ...
    {
      "collectionGroup": "content",
      ...
    }
  ],
  "fieldOverrides": []
}
```

### Step 6: Save and Deploy

1. Save the file
2. Deploy to Firebase:

```bash
cd H:/Github/EyesOfAzrael
firebase deploy --only firestore:indexes
```

3. Wait for deployment (may take 5-10 minutes for all indexes to build)
4. Verify in Firebase Console: Firestore > Indexes tab

---

## Alternative: Copy from Backup

If you prefer, I've created a backup at `firestore.indexes.json.backup`. You can:

1. Manually copy the content indexes from section above
2. Paste them into your `firestore.indexes.json`
3. Deploy as shown in Step 6

---

## Index Building Time

- Simple indexes: ~1-5 minutes
- Composite indexes with multiple fields: ~5-15 minutes
- All content indexes together: ~10-30 minutes (depends on existing data)

You can monitor progress in the Firebase Console under Firestore > Indexes.

---

## Verification

After deployment, verify indexes are active:

```bash
firebase firestore:indexes
```

Or check in Firebase Console:
1. Go to Firebase Console
2. Select your project
3. Navigate to Firestore Database > Indexes
4. Look for "content" collection indexes
5. Status should show "Enabled" (not "Building")

---

## If You Get Errors

### "Index already exists"
- This is fine - it means the index is already deployed
- Skip that particular index

### "Invalid index configuration"
- Check JSON syntax (missing commas, brackets)
- Ensure proper nesting
- Validate JSON format

### "Permission denied"
- Make sure you're logged in: `firebase login`
- Verify you have admin access to the Firebase project

---

## Summary

Total indexes to add: **22 content-related indexes**

These enable efficient queries for:
- Default vs user content filtering
- Mythology + content type combinations
- Popular/trending content
- User submissions
- Tag and cross-mythology searches

Once deployed, you're ready to run the content migration!
