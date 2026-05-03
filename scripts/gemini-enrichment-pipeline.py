#!/usr/bin/env python3
"""
Gemini Enrichment Pipeline
==========================
Periodically sends entities to Gemini API to fill missing schema fields.
Processes work packages in batches with rate limiting, retry logic, and progress tracking.

Usage:
    python scripts/gemini-enrichment-pipeline.py                    # Process all collections
    python scripts/gemini-enrichment-pipeline.py --collection deities  # Single collection
    python scripts/gemini-enrichment-pipeline.py --batch-size 50       # Custom batch size
    python scripts/gemini-enrichment-pipeline.py --dry-run             # Preview only
    python scripts/gemini-enrichment-pipeline.py --resume              # Resume from last checkpoint
    python scripts/gemini-enrichment-pipeline.py --fields shortDescription,extendedContent  # Specific fields only
"""

import json
import os
import sys
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# ============================================================
# Configuration
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyB5BGm2MOI97sKKmsTumSSvkGl7bfvL4Ow")
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

SCRIPT_DIR = Path(__file__).parent
ASSETS_DIR = SCRIPT_DIR.parent / "firebase-assets-downloaded"
WORK_PACKAGES_DIR = SCRIPT_DIR / "work-packages"
CHECKPOINT_FILE = SCRIPT_DIR / "enrichment-checkpoint.json"
PROGRESS_FILE = SCRIPT_DIR / "enrichment-progress.json"

# Rate limiting - Gemini free tier: 15 RPM for flash
REQUESTS_PER_MINUTE = 10
RATE_LIMIT_SECONDS = 60.0 / REQUESTS_PER_MINUTE  # 6s between requests
MAX_RETRIES = 3
RETRY_BACKOFF = [10, 30, 60]  # seconds between retries

COLLECTION_TO_TYPE = {
    "deities": "deity", "creatures": "creature", "heroes": "hero",
    "items": "item", "places": "place", "concepts": "concept",
    "magic": "magic", "rituals": "ritual", "texts": "text",
    "symbols": "symbol", "herbs": "herb", "archetypes": "archetype",
    "cosmology": "cosmology", "beings": "being"
}

# ============================================================
# Field descriptions for Gemini prompts (per entity type)
# ============================================================

FIELD_DESCRIPTIONS = {
    "deity": {
        "shortDescription": "A concise 1-2 sentence summary of this deity (max 200 characters). Focus on their primary domain and mythology.",
        "subtitle": "A poetic or descriptive subtitle (5-10 words) capturing the deity's essence.",
        "icon": "A single emoji character that best represents this deity.",
        "description": "A comprehensive 200-400 word description covering the deity's role, mythology, significance, and major myths.",
        "powers": "An array of 5-8 supernatural powers and abilities as strings (e.g., ['Lightning control', 'Shape-shifting', 'Immortality']).",
        "domains": "An array of 3-6 divine domains this deity rules over (e.g., ['War', 'Thunder', 'Justice']).",
        "symbols": "An array of 3-6 sacred symbols associated with this deity (e.g., ['Lightning bolt', 'Eagle', 'Oak tree']).",
        "extendedContent": "An array of 3-4 article sections, each as {\"title\": \"string\", \"content\": \"string\"} with 150-300 word markdown content. Cover: Origins & Birth, Major Myths & Stories, Worship & Cult, Legacy & Influence.",
        "sources": "An array of 2-3 scholarly sources, each as {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}. Use real academic/historical sources.",
        "associations": "An array of 5-8 symbolic associations, each as {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"} where type is one of: color, element, concept, animal, number, celestial.",
        "cultural": "An object with: {\"worshipPractices\": [{\"name\": \"string\", \"description\": \"string\"}], \"festivals\": [{\"name\": \"string\", \"timing\": \"string\", \"description\": \"string\"}], \"modernLegacy\": \"string describing modern cultural impact\"}.",
        "cross_cultural_parallels": "An array of 3-5 parallels to deities in other mythologies, each as {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"deity\", \"similarity\": \"string describing the parallel\"}.",
        "companions": "An array of 2-4 associated figures, each as {\"name\": \"string\", \"relationship\": \"string (lover/rival/ally/parent/child)\", \"description\": \"string\", \"category\": \"string (deities/heroes/creatures)\"}."
    },
    "creature": {
        "shortDescription": "A concise 1-2 sentence summary of this creature (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character representing this creature.",
        "description": "A 200-400 word description of this mythological creature.",
        "abilities": "An array of 5-8 supernatural abilities as strings.",
        "habitat": "A 1-3 sentence description of this creature's natural environment.",
        "appearance": "A 2-4 sentence description of this creature's physical appearance.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words. Cover: Origins, Physical Description & Powers, Role in Mythology, Cultural Significance.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}.",
        "associations": "An array of 5-8 symbolic associations, each {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"}.",
        "cultural": "Object with: {\"worshipPractices\": [{\"name\": \"string\", \"description\": \"string\"}], \"modernLegacy\": \"string\"}.",
        "cross_cultural_parallels": "Array of 3-5 parallels, each {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"creature\", \"similarity\": \"string\"}."
    },
    "hero": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this legendary hero.",
        "achievements": "An array of 5-8 notable deeds/achievements as strings.",
        "weapons": "An array of 3-5 legendary weapons or tools used by this hero.",
        "companions": "An array of 3-5 allies/companions, each as {\"name\": \"string\", \"relationship\": \"string\", \"description\": \"string\", \"category\": \"string\"}.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words. Cover: Early Life, Greatest Quests, Legacy.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}.",
        "associations": "An array of 5-8 symbolic associations, each {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"}.",
        "cultural": "Object with: {\"worshipPractices\": [{\"name\": \"string\", \"description\": \"string\"}], \"modernLegacy\": \"string\"}.",
        "cross_cultural_parallels": "Array of 3-5 parallels, each {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"hero\", \"similarity\": \"string\"}."
    },
    "item": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this sacred/mythological item.",
        "powers": "An array of 3-6 magical properties as strings.",
        "materials": "An array of 2-4 materials this item is made from (e.g., ['Divine gold', 'Dragon bone']).",
        "wielders": "An array of 2-4 historical owners/wielders, each as {\"name\": \"string\", \"mythology\": \"string\", \"context\": \"string\"}.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}.",
        "associations": "An array of 5-8 symbolic associations, each {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"}.",
        "cultural": "Object with: {\"modernLegacy\": \"string\"}.",
        "cross_cultural_parallels": "Array of 3-5 parallels, each {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"item\", \"similarity\": \"string\"}."
    },
    "place": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this sacred place.",
        "characteristics": "An array of 5-8 defining characteristics as strings.",
        "significance": "A 2-3 sentence description of spiritual/cultural significance.",
        "location": "An object with {\"cosmological\": \"string describing the cosmic/geographical context\"}.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}.",
        "associations": "An array of 5-8 symbolic associations, each {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"}.",
        "cultural": "Object with: {\"worshipPractices\": [{\"name\": \"string\", \"description\": \"string\"}], \"modernLegacy\": \"string\"}.",
        "cross_cultural_parallels": "Array of 3-5 parallels, each {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"place\", \"similarity\": \"string\"}."
    },
    "magic": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description.",
        "magicType": "The type of magic system (e.g., 'elemental', 'divine', 'shamanic', 'ceremonial').",
        "practitioners": "An array of 3-5 types of practitioners as strings.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "ritual": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description.",
        "ritualType": "The type of ritual (e.g., 'initiation', 'seasonal', 'funerary', 'purification').",
        "purpose": "A 1-2 sentence description of the ritual's purpose.",
        "participants": "An array of 3-5 types of participants as strings.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "text": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description.",
        "textType": "The type of text (e.g., 'scripture', 'epic', 'hymn', 'prophecy', 'law code').",
        "author": "The attributed author or tradition (string).",
        "themes": "An array of 3-6 major themes as strings.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "symbol": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description.",
        "symbolType": "The type of symbol (e.g., 'sacred', 'protective', 'alchemical', 'cosmic').",
        "meaning": "A 2-3 sentence description of the symbol's meaning.",
        "usage": "A 2-3 sentence description of how the symbol is used.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "herb": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this sacred plant.",
        "properties": "An array of 5-8 traditional/mythological properties as strings.",
        "uses": "An array of 5-8 traditional uses as strings.",
        "habitat": "A 1-2 sentence description of where this plant grows.",
        "extendedContent": "An array of 3-4 article sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "archetype": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A poetic subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this archetype across world mythology.",
        "category": "The archetype category (e.g., 'cosmic', 'heroic', 'transformative', 'divine').",
        "manifestations": "An array of 5-8 mythological manifestations, each as {\"mythology\": \"string\", \"entity\": \"string\", \"description\": \"string\"}.",
        "extendedContent": "An array of 3-4 sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}.",
        "associations": "An array of 5-8 symbolic associations, each {\"type\": \"string\", \"name\": \"string\", \"significance\": \"string\"}.",
        "cultural": "Object with: {\"modernLegacy\": \"string\"}.",
        "cross_cultural_parallels": "Array of 3-5 parallels, each {\"mythology\": \"string\", \"entity\": \"string\", \"category\": \"archetype\", \"similarity\": \"string\"}.",
        "companions": "Array of 2-4 associated figures, each {\"name\": \"string\", \"relationship\": \"string\", \"description\": \"string\", \"category\": \"string\"}."
    },
    "cosmology": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this cosmological concept.",
        "category": "The category (e.g., 'creation', 'afterlife', 'cosmic structure').",
        "significance": "A 2-3 sentence description of significance.",
        "extendedContent": "An array of 3-4 sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "being": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description of this mythological being.",
        "abilities": "An array of 5-8 powers/abilities as strings.",
        "appearance": "A 2-4 sentence physical description.",
        "extendedContent": "An array of 3-4 sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    },
    "concept": {
        "shortDescription": "A concise 1-2 sentence summary (max 200 characters).",
        "subtitle": "A descriptive subtitle (5-10 words).",
        "icon": "A single emoji character.",
        "description": "A 200-400 word description.",
        "category": "The concept category (e.g., 'philosophical', 'spiritual', 'cosmological').",
        "relatedConcepts": "An array of 3-5 related concept names as strings.",
        "extendedContent": "An array of 3-4 sections, each {\"title\": \"string\", \"content\": \"string\"} with 150-300 words.",
        "sources": "An array of 2-3 scholarly sources, each {\"author\": \"string\", \"title\": \"string\", \"description\": \"string\"}."
    }
}


# ============================================================
# Gemini API
# ============================================================

def call_gemini(prompt: str) -> Optional[dict]:
    """Call Gemini API and return parsed JSON response."""
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json"
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        GEMINI_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                # Strip markdown fences if present
                text = text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if e.fp else ""
            if e.code == 429:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                print(f"    Rate limited (429), waiting {wait}s (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            elif e.code == 503:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                print(f"    Service unavailable (503), waiting {wait}s (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            else:
                print(f"    API error {e.code}: {error_body[:200]}")
                return None
        except json.JSONDecodeError as e:
            print(f"    JSON parse error: {e}")
            return None
        except Exception as e:
            print(f"    Request error: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_BACKOFF[attempt])
                continue
            return None
    return None


def build_prompt(entity: dict, missing_fields: list, entity_type: str) -> Optional[str]:
    """Build a Gemini prompt for enriching missing fields."""
    field_descs = FIELD_DESCRIPTIONS.get(entity_type, FIELD_DESCRIPTIONS.get("concept", {}))

    fields_to_gen = []
    for f in missing_fields:
        if f in field_descs:
            fields_to_gen.append(f'  "{f}": {field_descs[f]}')

    if not fields_to_gen:
        return None

    existing_desc = (entity.get("description", "") or "")[:400]
    mythology = entity.get("mythology", "unknown")

    return f"""You are an expert mythology scholar and encyclopedia writer. Generate ONLY the missing JSON fields for this entity.

ENTITY:
  Name: {entity.get('name', 'Unknown')}
  Type: {entity_type}
  Mythology: {mythology}
  ID: {entity.get('id', 'unknown')}
  {f'Existing description: {existing_desc}' if existing_desc else ''}

GENERATE THESE FIELDS AS A JSON OBJECT:
{chr(10).join(fields_to_gen)}

RULES:
- Return ONLY valid JSON - no markdown fences, no explanation, no preamble
- Content must be historically/mythologically accurate and scholarly
- Write in an encyclopedic but engaging tone
- Extended content sections should be substantive (150-300 words each)
- Do NOT include fields not listed above
- For "icon", provide exactly ONE emoji character
- For shortDescription, keep under 200 characters
- All strings must be properly escaped for JSON"""


# ============================================================
# Entity validation
# ============================================================

def has_field(entity: dict, field: str) -> bool:
    """Check if entity has a populated field (strict)."""
    val = entity.get(field)
    if val is None or val == "":
        return False

    if field == "description":
        return isinstance(val, str) and len(val.strip()) >= 100
    elif field == "shortDescription":
        return isinstance(val, str) and len(val.strip()) >= 20
    elif field == "subtitle":
        return isinstance(val, str) and len(val.strip()) >= 5
    elif field == "icon":
        return isinstance(val, str) and len(val.strip()) >= 1
    elif field == "extendedContent":
        return isinstance(val, list) and len(val) >= 3
    elif field == "sources":
        return isinstance(val, list) and len(val) >= 2
    elif field == "associations":
        return isinstance(val, list) and len(val) >= 3
    elif field == "cultural":
        return isinstance(val, dict) and len(val) >= 1
    elif field == "cross_cultural_parallels":
        return isinstance(val, list) and len(val) >= 1
    elif field == "companions":
        return isinstance(val, list) and len(val) >= 1
    elif isinstance(val, list):
        return len(val) > 0
    elif isinstance(val, dict):
        return len(val) > 0
    elif isinstance(val, str):
        return len(val.strip()) >= 3
    return True


# ============================================================
# Enrichment logic
# ============================================================

def load_work_package(collection: str) -> Optional[dict]:
    """Load a work package for a collection."""
    wp_file = WORK_PACKAGES_DIR / f"wp-{collection}.json"
    if not wp_file.exists():
        return None
    with open(wp_file) as f:
        return json.load(f)


def load_checkpoint() -> dict:
    """Load processing checkpoint."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return {"processed": {}, "last_run": None}


def save_checkpoint(checkpoint: dict):
    """Save processing checkpoint."""
    checkpoint["last_run"] = datetime.now(timezone.utc).isoformat()
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(checkpoint, f, indent=2)


def enrich_entity(file_path: str, missing_fields: list, entity_type: str, dry_run: bool = False) -> dict:
    """Enrich a single entity via Gemini API."""
    full_path = ASSETS_DIR / file_path

    if not full_path.exists():
        return {"status": "skipped", "reason": "file not found"}

    try:
        with open(full_path, encoding="utf-8") as f:
            entity = json.load(f)
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        return {"status": "skipped", "reason": f"read error: {e}"}

    # Re-check which fields are actually missing (may have been enriched in a prior run)
    actually_missing = [f for f in missing_fields if not has_field(entity, f)]

    if not actually_missing:
        return {"status": "skipped", "reason": "already complete"}

    prompt = build_prompt(entity, actually_missing, entity_type)
    if not prompt:
        return {"status": "skipped", "reason": "no describable fields"}

    if dry_run:
        return {"status": "dry-run", "fields": actually_missing}

    generated = call_gemini(prompt)
    if not generated:
        return {"status": "failed", "reason": "API call failed"}

    # Merge generated fields (only missing ones)
    fields_added = 0
    for field in actually_missing:
        if field in generated and not has_field(entity, field):
            entity[field] = generated[field]
            fields_added += 1

    # Add enrichment metadata
    entity["enrichedAt"] = datetime.now(timezone.utc).isoformat()
    entity["enrichedBy"] = "gemini-2.0-flash"
    entity["_enrichmentVersion"] = entity.get("_enrichmentVersion", 0) + 1

    # Write back
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(entity, f, indent=2, ensure_ascii=False)

    return {"status": "enriched", "fields_added": fields_added, "fields_requested": len(actually_missing)}


def process_collection(collection: str, checkpoint: dict, args) -> dict:
    """Process all entities in a collection's work package."""
    wp = load_work_package(collection)
    if not wp:
        print(f"  No work package found for {collection}")
        return {"processed": 0, "enriched": 0, "failed": 0, "skipped": 0}

    entity_type = wp.get("entityType", collection)
    processed_set = set(checkpoint["processed"].get(collection, []))

    stats = {"processed": 0, "enriched": 0, "failed": 0, "skipped": 0, "fields_added": 0}

    # Flatten all entities from field groups
    all_entities = []
    for group in wp["fieldGroups"]:
        fields = group["fields"]
        # Filter by requested fields if specified
        if args.fields:
            fields = [f for f in fields if f in args.fields]
            if not fields:
                continue
        for entity in group["entities"]:
            if entity["file"] not in processed_set:
                all_entities.append({"entity": entity, "fields": fields if args.fields else group["fields"]})

    # Skip hub/index pages
    all_entities = [e for e in all_entities if "Collection" not in e["entity"].get("name", "") and "-hub-" not in e["entity"]["file"]]

    total = min(len(all_entities), args.batch_size - stats["processed"]) if args.batch_size else len(all_entities)

    if total == 0:
        print(f"  All entities already processed")
        return stats

    print(f"  Processing {total}/{len(all_entities)} entities...")

    for i, item in enumerate(all_entities[:total]):
        entity = item["entity"]
        fields = item["fields"]

        name = entity.get("name", entity["id"])
        print(f"  [{i+1}/{total}] {name} ({len(fields)} fields)")

        try:
            result = enrich_entity(entity["file"], fields, entity_type, args.dry_run)
        except Exception as e:
            result = {"status": "failed", "reason": str(e)}

        stats["processed"] += 1

        if result["status"] == "enriched":
            stats["enriched"] += 1
            stats["fields_added"] += result.get("fields_added", 0)
            print(f"    [OK] +{result['fields_added']} fields")
        elif result["status"] == "failed":
            stats["failed"] += 1
            print(f"    [FAIL] {result.get('reason', 'unknown')}")
        elif result["status"] == "skipped":
            stats["skipped"] += 1
            print(f"    [SKIP] {result.get('reason', '')}")
        elif result["status"] == "dry-run":
            print(f"    [DRY RUN] would add: {', '.join(result['fields'])}")

        # Track in checkpoint
        if collection not in checkpoint["processed"]:
            checkpoint["processed"][collection] = []
        checkpoint["processed"][collection].append(entity["file"])
        save_checkpoint(checkpoint)

        # Rate limit
        if not args.dry_run and i < total - 1:
            time.sleep(RATE_LIMIT_SECONDS)

    return stats


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Gemini Enrichment Pipeline")
    parser.add_argument("--collection", help="Process a specific collection only")
    parser.add_argument("--batch-size", type=int, default=0, help="Max entities per collection (0=unlimited)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--fields", help="Comma-separated list of specific fields to enrich")
    parser.add_argument("--reset", action="store_true", help="Clear checkpoint and start fresh")
    args = parser.parse_args()

    if args.fields:
        args.fields = set(args.fields.split(","))

    print("=" * 50)
    print("  Gemini Enrichment Pipeline")
    print("=" * 50)
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"  Collection: {args.collection or 'all'}")
    print(f"  Batch size: {args.batch_size or 'unlimited'}")
    print(f"  Fields: {', '.join(args.fields) if args.fields else 'all'}")
    print(f"  Rate: {REQUESTS_PER_MINUTE} req/min ({RATE_LIMIT_SECONDS:.1f}s interval)")
    print("=" * 50)
    print()

    # Checkpoint management
    if args.reset and CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()
        print("Checkpoint cleared.\n")

    checkpoint = load_checkpoint() if args.resume else {"processed": {}, "last_run": None}

    if args.resume and checkpoint.get("last_run"):
        print(f"Resuming from checkpoint ({checkpoint['last_run']})")
        total_done = sum(len(v) for v in checkpoint["processed"].values())
        print(f"Already processed: {total_done} entities\n")

    # Determine collections to process
    collections = [args.collection] if args.collection else list(COLLECTION_TO_TYPE.keys())
    # Remove concepts from default runs (5000+ entities, process separately)
    if not args.collection and "concepts" in collections:
        collections.remove("concepts")
        print("Note: 'concepts' collection excluded from default run (5000+ entities).")
        print("       Use --collection concepts to process separately.\n")

    overall_stats = {"processed": 0, "enriched": 0, "failed": 0, "skipped": 0, "fields_added": 0}

    for collection in collections:
        wp_file = WORK_PACKAGES_DIR / f"wp-{collection}.json"
        if not wp_file.exists():
            continue

        print(f"\n{'-' * 50}")
        print(f"Collection: {collection}")
        print(f"{'-' * 50}")

        stats = process_collection(collection, checkpoint, args)

        for k in overall_stats:
            overall_stats[k] += stats.get(k, 0)

    # Final summary
    print(f"\n{'=' * 50}")
    print("FINAL SUMMARY")
    print(f"{'=' * 50}")
    print(f"  Processed: {overall_stats['processed']}")
    print(f"  Enriched:  {overall_stats['enriched']}")
    print(f"  Failed:    {overall_stats['failed']}")
    print(f"  Skipped:   {overall_stats['skipped']}")
    print(f"  Fields added: {overall_stats['fields_added']}")

    # Save progress report
    progress = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dry_run": args.dry_run,
        "overall_stats": overall_stats,
        "checkpoint_file": str(CHECKPOINT_FILE)
    }
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)

    print(f"\nProgress saved to: {PROGRESS_FILE}")
    print(f"Checkpoint saved to: {CHECKPOINT_FILE}")

    if overall_stats["failed"] > 0:
        print(f"\nWARNING: {overall_stats['failed']} entities failed. Re-run with --resume to retry.")


if __name__ == "__main__":
    main()
