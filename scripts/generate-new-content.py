#!/usr/bin/env python3
"""
Content Discovery & Generation Pipeline for Eyes of Azrael

Discovers missing mythology topics, checks for duplicates, and uses
Gemini to generate new Firebase assets for upload.

Usage:
    python scripts/generate-new-content.py                  # Full run
    python scripts/generate-new-content.py --dry-run        # Preview only
    python scripts/generate-new-content.py --test 5         # Generate 5 test entities
    python scripts/generate-new-content.py --mythology greek # Only Greek mythology
    python scripts/generate-new-content.py --collection creatures  # Only creatures
"""

import os
import sys
import json
import time
import glob
import re
import argparse
import logging
from datetime import datetime, timezone
from pathlib import Path

# ============================================================
# Configuration
# ============================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyB5BGm2MOI97sKKmsTumSSvkGl7bfvL4Ow")
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

REQUESTS_PER_MINUTE = 10
RATE_LIMIT_SECONDS = 60.0 / REQUESTS_PER_MINUTE  # 6s between requests
MAX_RETRIES = 3
RETRY_BACKOFF = [10, 30, 60]

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "firebase-assets-downloaded"
CHECKPOINT_FILE = BASE_DIR / "scripts" / "content-gen-checkpoint.json"
LOG_FILE = BASE_DIR / "scripts" / "content-generation.log"

COLLECTIONS = [
    "deities", "heroes", "creatures", "items", "places",
    "texts", "rituals", "herbs", "symbols", "cosmology",
    "archetypes", "magic", "beings"
]

# Mythologies to generate content for, ordered by priority
# Focus on well-known mythologies that are underrepresented
MYTHOLOGY_TARGETS = {
    "greek": {"deities": 350, "heroes": 150, "creatures": 180, "items": 100, "places": 80, "texts": 30, "rituals": 25, "symbols": 20},
    "norse": {"deities": 180, "heroes": 80, "creatures": 100, "items": 80, "places": 50, "texts": 20, "rituals": 20, "symbols": 15},
    "egyptian": {"deities": 220, "heroes": 60, "creatures": 80, "items": 60, "places": 60, "texts": 25, "rituals": 25, "symbols": 20},
    "hindu": {"deities": 200, "heroes": 80, "creatures": 80, "items": 50, "places": 50, "texts": 30, "rituals": 30, "symbols": 20},
    "japanese": {"deities": 100, "heroes": 60, "creatures": 100, "items": 50, "places": 40, "texts": 20, "rituals": 20, "symbols": 15},
    "chinese": {"deities": 100, "heroes": 80, "creatures": 80, "items": 50, "places": 40, "texts": 25, "rituals": 20, "symbols": 15},
    "celtic": {"deities": 80, "heroes": 60, "creatures": 60, "items": 40, "places": 40, "texts": 15, "rituals": 15, "symbols": 15},
    "roman": {"deities": 100, "heroes": 60, "creatures": 50, "items": 40, "places": 50, "texts": 20, "rituals": 20, "symbols": 15},
    "sumerian": {"deities": 80, "heroes": 40, "creatures": 40, "items": 30, "places": 30, "texts": 15, "rituals": 15},
    "aztec": {"deities": 60, "heroes": 30, "creatures": 40, "items": 25, "places": 25, "texts": 15, "rituals": 15},
    "mayan": {"deities": 50, "heroes": 30, "creatures": 40, "items": 25, "places": 25, "texts": 15, "rituals": 15},
    "slavic": {"deities": 60, "heroes": 30, "creatures": 50, "items": 25, "places": 25, "rituals": 15},
    "polynesian": {"deities": 50, "heroes": 30, "creatures": 40, "items": 25, "places": 25},
    "persian": {"deities": 50, "heroes": 40, "creatures": 40, "items": 25, "places": 25, "texts": 15},
    "finnish": {"deities": 40, "heroes": 25, "creatures": 30, "items": 20, "places": 20},
    "yoruba": {"deities": 50, "heroes": 25, "creatures": 30, "items": 20, "places": 20, "rituals": 15},
    "incan": {"deities": 40, "heroes": 25, "creatures": 25, "items": 20, "places": 25, "rituals": 15},
    "korean": {"deities": 40, "heroes": 25, "creatures": 40, "items": 20, "places": 20},
    "mesopotamian": {"deities": 60, "heroes": 30, "creatures": 30, "items": 25, "places": 25, "texts": 15},
    "aboriginal": {"deities": 40, "heroes": 25, "creatures": 35, "items": 15, "places": 25},
}

# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(str(LOG_FILE), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)

# ============================================================
# Existing Content Index
# ============================================================

class ContentIndex:
    """Index of all existing entities for duplicate detection."""

    def __init__(self):
        self.by_name = {}       # lowercase name -> file path
        self.by_id = {}         # entity id -> file path
        self.by_collection = {} # collection -> set of names
        self.all_names = set()  # all lowercase names for fuzzy match

    def build(self):
        """Scan all asset files and build the index."""
        log.info("Building content index...")
        count = 0
        for col in COLLECTIONS:
            col_dir = ASSETS_DIR / col
            if not col_dir.exists():
                continue
            self.by_collection[col] = set()
            for f in col_dir.glob("*.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    if isinstance(data, list):
                        continue  # Skip index/array files
                    name = data.get("name", "").strip()
                    eid = data.get("id", f.stem)
                    if name:
                        key = name.lower()
                        self.by_name[key] = str(f)
                        self.all_names.add(key)
                        self.by_collection[col].add(key)
                    self.by_id[eid] = str(f)
                    count += 1
                except Exception:
                    pass
        log.info(f"Indexed {count} entities across {len(self.by_collection)} collections")

    def exists(self, name, collection=None):
        """Check if an entity with this name already exists."""
        key = name.lower().strip()
        if collection:
            return key in self.by_collection.get(collection, set())
        return key in self.all_names

    def find_similar(self, name):
        """Find similar existing names (simple substring match)."""
        key = name.lower().strip()
        matches = []
        for existing in self.all_names:
            if key in existing or existing in key:
                matches.append(existing)
        return matches[:5]

# ============================================================
# Topic Discovery
# ============================================================

TOPIC_DISCOVERY_PROMPT = """You are an expert mythology scholar. I need you to identify {count} notable {collection_label} from {mythology} mythology that are MISSING from our encyclopedia.

Our encyclopedia already contains these {collection_label} from {mythology} mythology:
{existing_list}

Please identify {count} REAL, historically documented {collection_label} from {mythology} mythology that are NOT in the list above. Focus on:
- Well-documented figures/entities from primary sources
- Important but often overlooked entries
- Entities that appear in major mythological texts
- Do NOT invent fictional entities - only real mythological ones

For each entity, provide:
- name: The most common English name
- alternate_names: Other names/spellings (array)
- brief: A one-sentence description (under 100 chars)
- significance: Why this entity matters (one sentence)
- primary_source: The main mythological text/tradition it appears in

Return as a JSON array of objects. Return ONLY valid JSON, no markdown fences."""

def discover_topics(mythology, collection, existing_names, count, dry_run=False):
    """Use Gemini to discover missing topics for a mythology+collection."""
    collection_labels = {
        "deities": "gods, goddesses, and divine beings",
        "heroes": "heroes, heroines, and legendary figures",
        "creatures": "mythological creatures and beasts",
        "items": "magical items, weapons, and artifacts",
        "places": "mythological places, realms, and sacred sites",
        "texts": "sacred texts, epics, and mythological writings",
        "rituals": "rituals, ceremonies, and sacred practices",
        "herbs": "sacred plants, herbs, and botanical elements",
        "symbols": "sacred symbols and emblems",
        "cosmology": "cosmological concepts and world structures",
        "archetypes": "mythological archetypes and motifs",
        "magic": "magical systems and supernatural practices",
        "beings": "supernatural beings and spirits"
    }

    label = collection_labels.get(collection, collection)
    # Cap existing names list to avoid prompt being too long for Gemini
    sorted_names = sorted(existing_names)
    max_names = min(80, len(sorted_names))
    existing_str = ", ".join(sorted_names[:max_names])
    if len(sorted_names) > max_names:
        existing_str += f"... and {len(sorted_names) - max_names} more (total: {len(sorted_names)} existing)"

    prompt = TOPIC_DISCOVERY_PROMPT.format(
        count=count,
        collection_label=label,
        mythology=mythology.title(),
        existing_list=existing_str or "(none yet)"
    )

    if dry_run:
        log.info(f"  [DRY RUN] Would discover {count} {collection} for {mythology}")
        return []

    result = call_gemini(prompt)
    if not result:
        return []

    # Parse the list
    if isinstance(result, list):
        return result
    if isinstance(result, dict) and "entities" in result:
        return result["entities"]
    return []

# ============================================================
# Entity Generation
# ============================================================

ENTITY_GENERATION_PROMPT = """You are an expert mythology scholar and encyclopedia writer. Generate a COMPLETE, detailed encyclopedia entry for the following mythological entity.

Entity: {name}
Type: {entity_type}
Mythology: {mythology}
Brief: {brief}
Primary Source: {primary_source}

Generate a comprehensive JSON object with ALL of these fields:

{{
  "id": "{entity_id}",
  "name": "{name}",
  "type": "{entity_type}",
  "mythology": "{mythology}",
  "status": "published",
  "authorId": "ai-generated",
  "generatedBy": "gemini-content-generator",
  "shortDescription": "Concise 1-2 sentence summary (max 200 chars)",
  "description": "Comprehensive 200-400 word description covering origin, role, significance, and key myths",
  "subtitle": "5-10 word poetic/evocative subtitle",
  "icon": "Single emoji that best represents this entity",
  {type_specific_fields}
  "extendedContent": [
    {{"title": "Origins & Mythology", "content": "150-300 word section on origins and primary myths"}},
    {{"title": "Role & Significance", "content": "150-300 word section on cultural/religious role"}},
    {{"title": "Symbolism & Interpretation", "content": "150-300 word section on symbolic meaning"}},
    {{"title": "Legacy & Influence", "content": "150-300 word section on modern cultural impact"}}
  ],
  "sources": [
    {{"author": "Author Name", "work": "Source Text", "description": "Brief description of the source"}},
    {{"author": "Author Name", "work": "Source Text", "description": "Brief description of the source"}}
  ],
  "associations": [
    {{"type": "element/animal/color/concept", "name": "Associated thing", "significance": "Why it's associated"}}
  ],
  "cross_cultural_parallels": [
    {{"name": "Similar entity name", "mythology": "Their mythology", "similarity": "How they're similar"}}
  ],
  "companions": [
    {{"name": "Related entity", "relationship": "parent/child/lover/rival/ally", "description": "Brief description"}}
  ],
  "cultural": {{
    "worshipPractices": [{{"name": "Practice name", "description": "Description"}}],
    "festivals": [{{"name": "Festival name", "timing": "When", "description": "Description"}}],
    "modernLegacy": "Description of modern cultural impact"
  }},
  "corpusSearch": {{
    "canonical": ["{name}"],
    "variants": ["alternate name 1", "alternate name 2"]
  }}
}}

RULES:
- Return ONLY valid JSON - no markdown fences, no explanation
- Content must be historically/mythologically accurate
- Write in an encyclopedic but engaging tone
- All strings must be properly escaped for JSON
- Use real historical sources, not made-up references
- Cross-cultural parallels should reference real entities from other mythologies
- Companions should reference real mythological figures"""

TYPE_SPECIFIC_FIELDS = {
    "deity": '"domains": ["3-6 domains of influence"], "powers": ["5-8 supernatural abilities"], "symbols": ["3-6 sacred symbols"],',
    "hero": '"achievements": ["4-6 major feats/accomplishments"], "weapons": ["2-4 signature weapons/tools"], "quests": ["2-3 major quests or adventures"],',
    "creature": '"abilities": ["4-6 supernatural abilities"], "habitat": "Primary habitat/dwelling", "appearance": "Physical description (2-3 sentences)", "classification": "Type of creature (beast/spirit/undead/etc)",',
    "item": '"powers": ["3-5 magical properties"], "materials": ["Materials it is made from"], "wielders": ["Notable wielders/owners"], "origin": "How the item was created",',
    "place": '"characteristics": ["4-6 notable features"], "location": "Mythological location/realm", "significance": "Why this place matters in mythology", "inhabitants": ["Notable inhabitants"],',
    "text": '"author": "Traditional author/origin", "period": "Approximate period", "themes": ["3-5 major themes"], "significance": "Why this text matters",',
    "ritual": '"purpose": "What the ritual achieves", "participants": ["Who performs it"], "elements": ["Key ritual elements"], "timing": "When it is performed",',
    "herb": '"properties": ["3-5 magical/medicinal properties"], "usage": "How it is used", "habitat": "Where it grows", "lore": "Mythological significance",',
    "symbol": '"meaning": "Primary symbolic meaning", "usage": ["Where/how the symbol is used"], "origin": "Origin of the symbol",',
    "cosmology": '"realm": "Which cosmic realm/level", "significance": "Role in cosmic structure", "inhabitants": ["Notable inhabitants"], "connections": ["Connected realms/concepts"],',
    "archetype": '"examples": ["3-5 mythological examples"], "themes": ["Core thematic elements"], "psychological": "Jungian/psychological interpretation",',
    "magic": '"type": "Type of magic system", "practitioners": ["Who uses this magic"], "components": ["Key components/requirements"], "effects": ["What it can achieve"],',
    "being": '"nature": "Type of supernatural being", "abilities": ["3-5 abilities"], "realm": "Where they exist", "role": "Their role in mythology",',
}


def generate_entity(topic, collection, mythology, dry_run=False):
    """Generate a complete entity from a discovered topic."""
    name = topic.get("name", "")
    brief = topic.get("brief", "")
    primary_source = topic.get("primary_source", "traditional sources")

    # Build entity ID
    entity_id = make_entity_id(name, mythology)

    # Get type-specific fields
    entity_type = collection.rstrip("s") if collection != "cosmology" else "cosmology"
    if collection == "heroes":
        entity_type = "hero"
    type_fields = TYPE_SPECIFIC_FIELDS.get(entity_type, TYPE_SPECIFIC_FIELDS.get("being", ""))

    prompt = ENTITY_GENERATION_PROMPT.format(
        name=name,
        entity_type=entity_type,
        mythology=mythology,
        brief=brief,
        primary_source=primary_source,
        entity_id=entity_id,
        type_specific_fields=type_fields
    )

    if dry_run:
        log.info(f"  [DRY RUN] Would generate: {name} ({entity_type}, {mythology})")
        return None

    result = call_gemini(prompt)
    if not result or not isinstance(result, dict):
        log.warning(f"  [FAIL] Bad response for {name}")
        return None

    # Ensure required fields
    result["id"] = entity_id
    result["name"] = name
    result["type"] = entity_type
    result["mythology"] = mythology
    result["status"] = "published"
    result["authorId"] = "ai-generated"
    result["generatedBy"] = "gemini-content-generator"
    result["createdAt"] = datetime.now(timezone.utc).isoformat()

    # Add alternate names to corpus search
    alt_names = topic.get("alternate_names", [])
    if alt_names:
        if "corpusSearch" not in result:
            result["corpusSearch"] = {}
        result["corpusSearch"]["canonical"] = [name]
        result["corpusSearch"]["variants"] = alt_names

    return result


def make_entity_id(name, mythology):
    """Generate a filesystem-safe entity ID."""
    # Normalize name
    clean = name.lower().strip()
    clean = re.sub(r'[^a-z0-9\s\-]', '', clean)
    clean = re.sub(r'\s+', '-', clean)
    clean = clean.strip('-')

    # Prefix with mythology if not already
    if not clean.startswith(mythology.lower()):
        return f"{mythology.lower()}_{clean}"
    return clean


def save_entity(entity, collection):
    """Save entity to the firebase assets directory."""
    entity_id = entity.get("id", "unknown")
    filename = f"{entity_id}.json"
    filepath = ASSETS_DIR / collection / filename

    # Don't overwrite existing files
    if filepath.exists():
        log.warning(f"  [SKIP] File already exists: {filepath.name}")
        return False

    filepath.write_text(
        json.dumps(entity, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    return True

# ============================================================
# Gemini API
# ============================================================

def repair_json(text):
    """Attempt to fix common JSON issues from Gemini responses."""
    if not text:
        return None
    try:
        # Fix unquoted string values line by line
        # Pattern: lines like   "key": some unquoted text here
        unquoted_re = re.compile(
            r'^(\s*"[^"]+"\s*:\s*)'   # "key":
            r'([A-Za-z].*?)$'          # unquoted value starting with letter
        )
        lines = text.split('\n')
        fixed_lines = []
        for line in lines:
            m = unquoted_re.match(line)
            if m:
                prefix = m.group(1)
                value = m.group(2).rstrip().rstrip(',')
                # Escape quotes and backslashes in the value
                value = value.replace('\\', '\\\\').replace('"', '\\"')
                fixed_lines.append(f'{prefix}"{value}",')
            else:
                fixed_lines.append(line)

        fixed = '\n'.join(fixed_lines)
        # Remove trailing commas before } or ]
        fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
        # Remove double commas
        fixed = re.sub(r',\s*,', ',', fixed)
        return fixed
    except Exception:
        return None


def call_gemini(prompt):
    """Call Gemini API and return parsed JSON response."""
    import urllib.request
    import urllib.error

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json"
        }
    }).encode("utf-8")

    headers = {"Content-Type": "application/json"}

    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(GEMINI_URL, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))

            # Handle blocked/empty responses
            candidates = body.get("candidates", [])
            if not candidates:
                log.warning(f"  No candidates in response. Filters: {body.get('promptFeedback', {})}")
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                    time.sleep(wait)
                    continue
                return None

            candidate = candidates[0]
            finish_reason = candidate.get("finishReason", "")
            if finish_reason == "SAFETY":
                log.warning(f"  Response blocked by safety filter")
                return None

            parts = candidate.get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                log.warning(f"  Empty response parts. Finish: {finish_reason}")
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                    time.sleep(wait)
                    continue
                return None

            text = parts[0]["text"].strip()

            # Remove markdown code fences
            if text.startswith("```"):
                text = re.sub(r'^```(?:json)?\s*', '', text)
                text = re.sub(r'\s*```$', '', text)

            # Try direct parse first
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass

            # Try to extract JSON array or object from the text
            for pattern in [r'\[[\s\S]*\]', r'\{[\s\S]*\}']:
                match = re.search(pattern, text)
                if match:
                    try:
                        return json.loads(match.group())
                    except json.JSONDecodeError:
                        continue

            # Try to repair common JSON issues (unquoted values, trailing commas)
            repaired = repair_json(text)
            if repaired:
                try:
                    result = json.loads(repaired)
                    log.info("  JSON repair successful")
                    return result
                except json.JSONDecodeError as repair_err:
                    log.warning(f"  Repair attempted but still invalid: {repair_err}")

            # Log the problematic response for debugging
            preview = text[:300] if text else "(empty)"
            log.warning(f"  Response preview: {preview}")
            raise json.JSONDecodeError("No valid JSON found in response", text[:100] if text else "", 0)

        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                log.warning(f"  Rate limited ({e.code}), waiting {wait}s...")
                time.sleep(wait)
                continue
            log.error(f"  HTTP error {e.code}: {e.reason}")
            return None
        except json.JSONDecodeError as e:
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                log.warning(f"  JSON parse error: {e}, retrying in {wait}s...")
                time.sleep(wait)
                continue
            log.error(f"  JSON parse error after {MAX_RETRIES} attempts: {e}")
            return None
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
                log.warning(f"  Error: {e}, retrying in {wait}s...")
                time.sleep(wait)
                continue
            log.error(f"  Failed after {MAX_RETRIES} attempts: {e}")
            return None

    return None

# ============================================================
# Checkpoint
# ============================================================

def load_checkpoint():
    """Load checkpoint for resume capability."""
    if CHECKPOINT_FILE.exists():
        try:
            return json.loads(CHECKPOINT_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"generated": [], "discovered": {}, "last_run": None, "stats": {"total": 0, "success": 0, "skipped": 0, "failed": 0}}


def save_checkpoint(checkpoint):
    """Save checkpoint to disk."""
    checkpoint["last_run"] = datetime.now(timezone.utc).isoformat()
    CHECKPOINT_FILE.write_text(
        json.dumps(checkpoint, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

# ============================================================
# Main Pipeline
# ============================================================

def run_pipeline(args):
    """Main content generation pipeline."""
    dry_run = args.dry_run
    test_limit = args.test
    target_mythology = args.mythology
    target_collection = args.collection

    log.info("=" * 60)
    log.info("CONTENT GENERATION PIPELINE")
    log.info("=" * 60)
    log.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    if test_limit:
        log.info(f"Test mode: generating {test_limit} entities only")
    if target_mythology:
        log.info(f"Mythology filter: {target_mythology}")
    if target_collection:
        log.info(f"Collection filter: {target_collection}")

    # Build content index
    index = ContentIndex()
    index.build()

    # Load checkpoint
    checkpoint = load_checkpoint()
    generated_set = set(checkpoint.get("generated", []))

    stats = {"discovered": 0, "generated": 0, "skipped": 0, "failed": 0, "duplicate": 0}
    total_generated = 0

    # Iterate through mythology targets
    mythologies = {target_mythology: MYTHOLOGY_TARGETS.get(target_mythology, {"deities": 20, "heroes": 15, "creatures": 15, "items": 10, "places": 10})} if target_mythology else MYTHOLOGY_TARGETS

    for mythology, targets in mythologies.items():
        if test_limit and total_generated >= test_limit:
            break

        log.info(f"\n--- {mythology.upper()} MYTHOLOGY ---")

        collections = {target_collection: targets.get(target_collection, 15)} if target_collection else targets

        for collection, target_count in collections.items():
            if test_limit and total_generated >= test_limit:
                break

            if collection not in COLLECTIONS:
                continue

            # Get existing names for this mythology+collection
            col_dir = ASSETS_DIR / collection
            existing_names = set()
            if col_dir.exists():
                for f in col_dir.glob("*.json"):
                    try:
                        data = json.loads(f.read_text(encoding="utf-8"))
                        if isinstance(data, dict):
                            m = data.get("mythology", "")
                            if m.lower() == mythology.lower():
                                name = data.get("name", "")
                                if name:
                                    existing_names.add(name)
                    except Exception:
                        pass

            current_count = len(existing_names)
            if current_count >= target_count:
                log.info(f"  [{collection}] Already have {current_count}/{target_count} - skipping")
                continue

            needed = min(target_count - current_count, 25)  # Cap at 25 per batch
            if test_limit:
                needed = min(needed, test_limit - total_generated)

            log.info(f"  [{collection}] Have {current_count}/{target_count}, discovering {needed} new topics...")

            # Phase 1: Discover topics
            topics = discover_topics(mythology, collection, existing_names, needed, dry_run)
            if not topics:
                log.info(f"  [{collection}] No new topics discovered")
                continue

            stats["discovered"] += len(topics)
            log.info(f"  [{collection}] Discovered {len(topics)} topics")

            # Rate limit after discovery call
            time.sleep(RATE_LIMIT_SECONDS)

            # Phase 2: Generate each entity
            for topic in topics:
                if test_limit and total_generated >= test_limit:
                    break

                name = topic.get("name", "unknown")
                entity_id = make_entity_id(name, mythology)

                # Skip if already generated
                if entity_id in generated_set:
                    log.info(f"    [SKIP] Already generated: {name}")
                    stats["skipped"] += 1
                    continue

                # Check for duplicates
                if index.exists(name, collection):
                    log.info(f"    [DUP] Already exists: {name}")
                    stats["duplicate"] += 1
                    continue

                # Also check by ID
                if (ASSETS_DIR / collection / f"{entity_id}.json").exists():
                    log.info(f"    [DUP] File exists: {entity_id}.json")
                    stats["duplicate"] += 1
                    continue

                # Check similar names
                similar = index.find_similar(name)
                if similar:
                    log.info(f"    [NOTE] Similar existing: {', '.join(similar[:3])}")

                log.info(f"    Generating: {name}...")

                entity = generate_entity(topic, collection, mythology, dry_run)

                if entity:
                    if save_entity(entity, collection):
                        stats["generated"] += 1
                        total_generated += 1
                        generated_set.add(entity_id)
                        checkpoint["generated"] = list(generated_set)
                        index.all_names.add(name.lower())
                        if collection in index.by_collection:
                            index.by_collection[collection].add(name.lower())
                        log.info(f"    [OK] Saved {entity_id}.json (+{len(entity.get('extendedContent', []))} sections)")
                    else:
                        stats["skipped"] += 1
                else:
                    stats["failed"] += 1

                # Save checkpoint periodically
                if total_generated % 5 == 0:
                    save_checkpoint(checkpoint)

                # Rate limit
                time.sleep(RATE_LIMIT_SECONDS)

            log.info(f"  [{collection}] Batch complete")

    # Final checkpoint save
    save_checkpoint(checkpoint)

    # Summary
    log.info("\n" + "=" * 60)
    log.info("GENERATION COMPLETE")
    log.info("=" * 60)
    log.info(f"  Topics discovered: {stats['discovered']}")
    log.info(f"  Entities generated: {stats['generated']}")
    log.info(f"  Duplicates skipped: {stats['duplicate']}")
    log.info(f"  Already generated:  {stats['skipped']}")
    log.info(f"  Failed:             {stats['failed']}")
    log.info(f"  Total new files:    {stats['generated']}")

    return stats


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Content Discovery & Generation Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    parser.add_argument("--test", type=int, default=0, help="Generate N test entities only")
    parser.add_argument("--mythology", type=str, default=None, help="Only process this mythology")
    parser.add_argument("--collection", type=str, default=None, help="Only process this collection")
    args = parser.parse_args()

    try:
        run_pipeline(args)
    except KeyboardInterrupt:
        log.info("\nInterrupted by user. Checkpoint saved.")
    except Exception as e:
        log.error(f"Pipeline error: {e}", exc_info=True)
        sys.exit(1)
