#!/usr/bin/env python3
"""Refresh firebase-assets-downloaded/ via the public Firestore REST API.

Fallback for scripts/download-all-firebase-assets.js that needs no admin-SDK
service account — the entity collections are public-read, so the website's
web API key (from firebase-config.js) is enough. Writes the same layout the
JS downloader and the suite's bake scripts expect: one JSON file per entity,
grouped in per-collection folders.

Usage:
    python scripts/download-assets-rest.py [--collections deities,herbs ...]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "firebase-assets-downloaded"
PROJECT = "eyesofazrael"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"

COLLECTIONS = [
    "deities", "heroes", "cosmology", "creatures", "rituals", "texts",
    "herbs", "symbols", "magic", "path", "figures", "places", "items",
    "beings", "angels", "teachings", "concepts", "events", "mythologies",
    "archetypes",
]


def _api_key() -> str:
    cfg = (ROOT / "firebase-config.js").read_text(encoding="utf-8")
    m = re.search(r"AIza[0-9A-Za-z_\-]{35}", cfg)
    if not m:
        sys.exit("No web API key found in firebase-config.js")
    return m.group(0)


def _decode(v: dict):
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return v["doubleValue"]
    if "booleanValue" in v:
        return v["booleanValue"]
    if "timestampValue" in v:
        return v["timestampValue"]
    if "nullValue" in v:
        return None
    if "mapValue" in v:
        return {k: _decode(x) for k, x in (v["mapValue"].get("fields") or {}).items()}
    if "arrayValue" in v:
        return [_decode(x) for x in (v["arrayValue"].get("values") or [])]
    return None


def _fetch_collection(coll: str, key: str) -> list[dict]:
    docs, token = [], None
    while True:
        url = f"{BASE}/{coll}?pageSize=300&key={key}"
        if token:
            url += f"&pageToken={token}"
        for attempt in range(5):
            try:
                with urllib.request.urlopen(url, timeout=60) as resp:
                    data = json.load(resp)
                break
            except urllib.error.HTTPError as exc:
                if exc.code == 429 and attempt < 4:
                    time.sleep(2 ** attempt)
                    continue
                raise
        for doc in data.get("documents", []):
            entity = {k: _decode(v) for k, v in (doc.get("fields") or {}).items()}
            entity.setdefault("id", doc["name"].rsplit("/", 1)[-1])
            docs.append(entity)
        token = data.get("nextPageToken")
        if not token:
            return docs


def _safe_filename(entity_id: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", entity_id)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--collections", help="Comma-separated subset (default: all)")
    args = ap.parse_args()
    collections = args.collections.split(",") if args.collections else COLLECTIONS
    key = _api_key()

    total = 0
    for coll in collections:
        try:
            docs = _fetch_collection(coll.strip(), key)
        except urllib.error.HTTPError as exc:
            print(f"  {coll}: SKIP (HTTP {exc.code})")
            continue
        out_dir = OUT / coll.strip()
        out_dir.mkdir(parents=True, exist_ok=True)
        for e in docs:
            path = out_dir / f"{_safe_filename(str(e['id']))}.json"
            path.write_text(
                json.dumps(e, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        print(f"  {coll}: {len(docs)}")
        total += len(docs)
    print(f"\nDone: {total} entities -> {OUT}")


if __name__ == "__main__":
    main()
