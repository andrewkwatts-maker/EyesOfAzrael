#!/usr/bin/env python3
"""
PHASE 3.1: VALIDATE ALL EXTRACTED JSON FILES
Comprehensive validation of 582+ extracted JSON files before Firebase upload.

This script performs:
1. JSON syntax validation
2. Schema validation (required fields, data types)
3. Data integrity checks (duplicates, cross-references)
4. Special character verification (Unicode support)
5. Firebase compatibility checks (field names, sizes, depth)

Author: Eyes of Azrael Migration Team
Date: 2025-12-15
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Set, Any, Tuple

# Project configuration
PROJECT_ROOT = Path(r"h:\Github\EyesOfAzrael")
DATA_DIR = PROJECT_ROOT / "data" / "entities"
TEST_DIR = PROJECT_ROOT / "test-extraction-results"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

# Supported mythologies
SUPPORTED_MYTHOLOGIES = [
    "egyptian", "norse", "greek", "roman", "hindu", "buddhist",
    "chinese", "japanese", "celtic", "sumerian", "babylonian",
    "mayan", "aztec", "incan", "slavic", "polynesian", "african",
    "native_american", "australian", "persian", "mesopotamian",
    "phoenician", "canaanite", "hittite", "etruscan", "gnostic",
    "hermetic", "kabbalistic", "jewish", "christian", "islamic",
    "apocryphal", "occult", "alchemical", "comparative", "other"
]

# Supported entity types
SUPPORTED_TYPES = [
    "deity", "hero", "creature", "place", "item", "concept",
    "text", "symbol", "ritual", "magic", "cosmology", "angel",
    "demon", "path", "herb", "weapon", "artifact", "event",
    "organization", "practice", "philosophy", "unknown", "other"
]

# Required fields for all entities
REQUIRED_FIELDS = ["id", "name", "type", "mythology"]

# Unicode ranges for special characters
UNICODE_RANGES = {
    "egyptian_hieroglyphs": (0x13000, 0x1342F),
    "sanskrit_diacritics": [(0x0900, 0x097F), (0x1CD0, 0x1CFF)],
    "chinese_characters": (0x4E00, 0x9FFF),
    "hebrew": (0x0590, 0x05FF),
    "arabic": (0x0600, 0x06FF),
    "greek_extended": (0x1F00, 0x1FFF),
    "cyrillic": (0x0400, 0x04FF),
    "devanagari": (0x0900, 0x097F)
}

# Validation results storage
validation_results = {
    "total_files": 0,
    "syntax_errors": [],
    "schema_violations": [],
    "duplicate_ids": [],
    "broken_references": [],
    "firebase_issues": [],
    "special_char_warnings": [],
    "files_ready": [],
    "files_need_fixes": [],
    "statistics": {
        "by_mythology": defaultdict(int),
        "by_type": defaultdict(int),
        "by_status": defaultdict(int)
    }
}


def validate_json_syntax(file_path: Path) -> Tuple[bool, Any, str]:
    """Validate JSON syntax and encoding."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return True, data, ""
    except json.JSONDecodeError as e:
        return False, None, f"JSON syntax error: {e}"
    except UnicodeDecodeError as e:
        return False, None, f"Encoding error: {e}"
    except Exception as e:
        return False, None, f"Unexpected error: {e}"


def validate_schema(data: Dict, file_path: Path) -> List[str]:
    """Validate required fields and data types."""
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"Missing required field: {field}")
        elif not data[field]:
            errors.append(f"Empty required field: {field}")

    # Validate data types
    if "id" in data and not isinstance(data["id"], str):
        errors.append(f"Field 'id' must be string, got {type(data['id']).__name__}")

    if "name" in data and not isinstance(data["name"], str):
        errors.append(f"Field 'name' must be string, got {type(data['name']).__name__}")

    if "type" in data:
        if not isinstance(data["type"], str):
            errors.append(f"Field 'type' must be string, got {type(data['type']).__name__}")
        elif data["type"] not in SUPPORTED_TYPES:
            errors.append(f"Invalid type '{data['type']}'. Must be one of: {', '.join(SUPPORTED_TYPES)}")

    if "mythology" in data:
        if not isinstance(data["mythology"], str):
            errors.append(f"Field 'mythology' must be string, got {type(data['mythology']).__name__}")
        elif data["mythology"] not in SUPPORTED_MYTHOLOGIES:
            errors.append(f"Invalid mythology '{data['mythology']}'. Must be one of: {', '.join(SUPPORTED_MYTHOLOGIES)}")

    # Check array fields are not empty if present
    array_fields = ["alternate_names", "symbols", "domains", "titles"]
    for field in array_fields:
        if field in data:
            if not isinstance(data[field], list):
                errors.append(f"Field '{field}' must be array, got {type(data[field]).__name__}")
            # Note: Empty arrays are allowed, just checking type

    # Validate completeness score if present
    if "extraction_metadata" in data and "completeness_score" in data["extraction_metadata"]:
        score = data["extraction_metadata"]["completeness_score"]
        if not isinstance(score, (int, float)):
            errors.append(f"Completeness score must be numeric, got {type(score).__name__}")
        elif score < 0 or score > 100:
            errors.append(f"Completeness score must be 0-100, got {score}")

    return errors


def check_duplicate_ids(all_files_data: Dict[str, Dict]) -> List[Dict]:
    """Check for duplicate IDs across all files."""
    id_tracker = defaultdict(list)
    duplicates = []

    for file_path, data in all_files_data.items():
        if "id" in data:
            entity_id = data["id"]
            id_tracker[entity_id].append(file_path)

    for entity_id, file_paths in id_tracker.items():
        if len(file_paths) > 1:
            duplicates.append({
                "id": entity_id,
                "files": file_paths,
                "count": len(file_paths)
            })

    return duplicates


def validate_cross_references(data: Dict, all_ids: Set[str]) -> List[str]:
    """Validate cross-references to other entities."""
    errors = []

    # Check relatedEntities if present
    if "relatedEntities" in data and isinstance(data["relatedEntities"], list):
        for related in data["relatedEntities"]:
            if isinstance(related, str) and related not in all_ids:
                errors.append(f"Related entity '{related}' not found in collection")

    # Check interlinks if present
    if "interlinks" in data and isinstance(data["interlinks"], dict):
        for category, links in data["interlinks"].items():
            if isinstance(links, list):
                for link in links:
                    if isinstance(link, dict) and "id" in link:
                        if link["id"] not in all_ids:
                            errors.append(f"Interlinked entity '{link['id']}' not found in collection")

    return errors


def check_special_characters(data: Dict, file_path: Path) -> List[Dict]:
    """Check for special Unicode characters."""
    warnings = []
    content = json.dumps(data)

    for char_type, ranges in UNICODE_RANGES.items():
        if isinstance(ranges, tuple):
            ranges = [ranges]

        for start, end in ranges:
            for char in content:
                if start <= ord(char) <= end:
                    warnings.append({
                        "file": str(file_path),
                        "type": char_type,
                        "char": char,
                        "code": f"U+{ord(char):04X}"
                    })
                    break  # Only report once per file per type

    return warnings


def validate_firebase_compatibility(data: Dict, file_path: Path) -> List[str]:
    """Check Firebase Firestore compatibility."""
    errors = []

    # Check field names (no dots, no starting with __)
    def check_field_names(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if "." in key:
                    errors.append(f"Field name contains dot: {path}.{key}")
                if key.startswith("__"):
                    errors.append(f"Field name starts with __: {path}.{key}")
                check_field_names(value, f"{path}.{key}" if path else key)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                check_field_names(item, f"{path}[{i}]")

    check_field_names(data)

    # Check document size (max 1MB)
    doc_size = len(json.dumps(data).encode('utf-8'))
    if doc_size > 1024 * 1024:  # 1MB
        errors.append(f"Document size {doc_size} bytes exceeds 1MB limit")

    # Check nested depth (max 20 levels)
    def get_depth(obj, current_depth=0):
        if current_depth > 20:
            return current_depth
        if isinstance(obj, dict):
            if not obj:
                return current_depth
            return max(get_depth(v, current_depth + 1) for v in obj.values())
        elif isinstance(obj, list):
            if not obj:
                return current_depth
            return max(get_depth(item, current_depth + 1) for item in obj)
        return current_depth

    depth = get_depth(data)
    if depth > 20:
        errors.append(f"Nested object depth {depth} exceeds 20 level limit")

    # Check array sizes (max 1000 items recommended)
    def check_array_sizes(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                check_array_sizes(value, f"{path}.{key}" if path else key)
        elif isinstance(obj, list):
            if len(obj) > 1000:
                errors.append(f"Array at {path} has {len(obj)} items (>1000 not recommended)")
            for i, item in enumerate(obj):
                check_array_sizes(item, f"{path}[{i}]")

    check_array_sizes(data)

    return errors


def validate_links(data: Dict) -> List[str]:
    """Validate link formats."""
    errors = []

    if "links" in data:
        links = data["links"]
        if isinstance(links, dict):
            for link_type in ["internal", "external", "corpus"]:
                if link_type in links and isinstance(links[link_type], list):
                    for i, link in enumerate(links[link_type]):
                        if isinstance(link, dict):
                            if "href" not in link:
                                errors.append(f"Link {link_type}[{i}] missing 'href' field")
                        elif not isinstance(link, str):
                            errors.append(f"Link {link_type}[{i}] must be string or object")

    return errors


def find_all_json_files() -> List[Path]:
    """Find all JSON files to validate."""
    json_files = []

    # Check data/entities directory
    if DATA_DIR.exists():
        json_files.extend(DATA_DIR.rglob("*.json"))

    # Check test extraction results
    if TEST_DIR.exists():
        json_files.extend(TEST_DIR.glob("*.json"))

    # Exclude report files
    json_files = [f for f in json_files if "report" not in f.name.lower()]

    return json_files


def validate_all_files():
    """Main validation process."""
    print("=" * 80)
    print("PHASE 3.1: VALIDATE ALL EXTRACTED JSON FILES")
    print("Eyes of Azrael - Firebase Migration Validation")
    print("=" * 80)
    print()

    # Find all JSON files
    print("Step 1: Scanning for JSON files...")
    json_files = find_all_json_files()
    validation_results["total_files"] = len(json_files)
    print(f"Found {len(json_files)} JSON files to validate")
    print()

    # Load all valid files for cross-reference checking
    print("Step 2: Validating JSON syntax and loading data...")
    all_files_data = {}
    all_ids = set()

    for i, file_path in enumerate(json_files, 1):
        if i % 50 == 0:
            print(f"  Processed {i}/{len(json_files)} files...")

        rel_path = str(file_path.relative_to(PROJECT_ROOT))

        # Syntax validation
        is_valid, data, error = validate_json_syntax(file_path)

        if not is_valid:
            validation_results["syntax_errors"].append({
                "file": rel_path,
                "error": error
            })
            validation_results["files_need_fixes"].append(rel_path)
            validation_results["statistics"]["by_status"]["syntax_error"] += 1
            continue

        all_files_data[rel_path] = data
        if "id" in data:
            all_ids.add(data["id"])

    print(f"  Successfully loaded {len(all_files_data)} valid JSON files")
    print()

    # Schema and detailed validation
    print("Step 3: Validating schemas and data integrity...")

    for i, (rel_path, data) in enumerate(all_files_data.items(), 1):
        if i % 50 == 0:
            print(f"  Validated {i}/{len(all_files_data)} files...")

        file_issues = []

        # Schema validation
        schema_errors = validate_schema(data, Path(rel_path))
        if schema_errors:
            file_issues.extend(schema_errors)
            for error in schema_errors:
                validation_results["schema_violations"].append({
                    "file": rel_path,
                    "error": error
                })

        # Cross-reference validation
        ref_errors = validate_cross_references(data, all_ids)
        if ref_errors:
            file_issues.extend(ref_errors)
            for error in ref_errors:
                validation_results["broken_references"].append({
                    "file": rel_path,
                    "error": error
                })

        # Firebase compatibility
        fb_errors = validate_firebase_compatibility(data, Path(rel_path))
        if fb_errors:
            file_issues.extend(fb_errors)
            for error in fb_errors:
                validation_results["firebase_issues"].append({
                    "file": rel_path,
                    "error": error
                })

        # Link validation
        link_errors = validate_links(data)
        if link_errors:
            file_issues.extend(link_errors)
            for error in link_errors:
                validation_results["schema_violations"].append({
                    "file": rel_path,
                    "error": error
                })

        # Special character checking
        special_chars = check_special_characters(data, Path(rel_path))
        if special_chars:
            validation_results["special_char_warnings"].extend(special_chars)

        # Categorize file
        if file_issues:
            validation_results["files_need_fixes"].append(rel_path)
            validation_results["statistics"]["by_status"]["needs_fixes"] += 1
        else:
            validation_results["files_ready"].append(rel_path)
            validation_results["statistics"]["by_status"]["ready"] += 1

        # Track by mythology and type
        if "mythology" in data:
            validation_results["statistics"]["by_mythology"][data["mythology"]] += 1
        if "type" in data:
            validation_results["statistics"]["by_type"][data["type"]] += 1

    print(f"  Completed detailed validation")
    print()

    # Check for duplicate IDs
    print("Step 4: Checking for duplicate IDs...")
    duplicates = check_duplicate_ids(all_files_data)
    validation_results["duplicate_ids"] = duplicates
    if duplicates:
        print(f"  Found {len(duplicates)} duplicate ID conflicts")
    else:
        print(f"  No duplicate IDs found")
    print()

    # Generate reports
    print("Step 5: Generating validation reports...")
    generate_validation_report()
    generate_validation_json()
    print()

    # Print summary
    print_validation_summary()


def generate_validation_report():
    """Generate VALIDATION_REPORT.md."""
    report_path = PROJECT_ROOT / "VALIDATION_REPORT.md"

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# JSON Validation Report - Phase 3.1\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Phase:** 3.1 - Pre-Firebase Validation\n\n")

        # Executive Summary
        f.write("## Executive Summary\n\n")
        total = validation_results["total_files"]
        ready = len(validation_results["files_ready"])
        needs_fixes = len(validation_results["files_need_fixes"])
        syntax_errors = len(validation_results["syntax_errors"])

        f.write(f"- **Total Files Scanned:** {total}\n")
        f.write(f"- **Files Ready for Upload:** {ready} ({ready/total*100:.1f}%)\n")
        f.write(f"- **Files Needing Fixes:** {needs_fixes} ({needs_fixes/total*100:.1f}%)\n")
        f.write(f"- **Syntax Errors:** {syntax_errors}\n")
        f.write(f"- **Schema Violations:** {len(validation_results['schema_violations'])}\n")
        f.write(f"- **Duplicate IDs:** {len(validation_results['duplicate_ids'])}\n")
        f.write(f"- **Broken References:** {len(validation_results['broken_references'])}\n")
        f.write(f"- **Firebase Issues:** {len(validation_results['firebase_issues'])}\n\n")

        # Pass/Fail Status
        if syntax_errors == 0 and len(validation_results['duplicate_ids']) == 0:
            f.write("### Overall Status: ✅ PASS\n\n")
            f.write("All critical validations passed. Files are ready for Firebase upload.\n\n")
        else:
            f.write("### Overall Status: ⚠️ NEEDS ATTENTION\n\n")
            f.write("Critical issues found that must be resolved before upload.\n\n")

        # Detailed Results
        f.write("## Validation Results by Category\n\n")

        # Syntax Errors
        f.write("### 1. JSON Syntax Errors\n\n")
        if validation_results["syntax_errors"]:
            f.write(f"Found {len(validation_results['syntax_errors'])} files with syntax errors:\n\n")
            for error in validation_results["syntax_errors"][:20]:
                f.write(f"- **{error['file']}**\n")
                f.write(f"  - Error: {error['error']}\n\n")
            if len(validation_results["syntax_errors"]) > 20:
                f.write(f"\n*...and {len(validation_results['syntax_errors']) - 20} more*\n\n")
        else:
            f.write("✅ No syntax errors found\n\n")

        # Schema Violations
        f.write("### 2. Schema Violations\n\n")
        if validation_results["schema_violations"]:
            f.write(f"Found {len(validation_results['schema_violations'])} schema violations:\n\n")
            # Group by error type
            error_types = defaultdict(list)
            for violation in validation_results["schema_violations"]:
                error_types[violation['error']].append(violation['file'])

            for error, files in sorted(error_types.items(), key=lambda x: len(x[1]), reverse=True):
                f.write(f"#### {error}\n\n")
                f.write(f"Affects {len(files)} files:\n\n")
                for file in files[:10]:
                    f.write(f"- {file}\n")
                if len(files) > 10:
                    f.write(f"\n*...and {len(files) - 10} more*\n")
                f.write("\n")
        else:
            f.write("✅ No schema violations found\n\n")

        # Duplicate IDs
        f.write("### 3. Duplicate IDs\n\n")
        if validation_results["duplicate_ids"]:
            f.write(f"Found {len(validation_results['duplicate_ids'])} duplicate ID conflicts:\n\n")
            for dup in validation_results["duplicate_ids"]:
                f.write(f"#### ID: `{dup['id']}` ({dup['count']} instances)\n\n")
                for file in dup['files']:
                    f.write(f"- {file}\n")
                f.write("\n")
        else:
            f.write("✅ No duplicate IDs found\n\n")

        # Firebase Compatibility
        f.write("### 4. Firebase Compatibility Issues\n\n")
        if validation_results["firebase_issues"]:
            f.write(f"Found {len(validation_results['firebase_issues'])} Firebase compatibility issues:\n\n")
            for issue in validation_results["firebase_issues"][:20]:
                f.write(f"- **{issue['file']}**\n")
                f.write(f"  - {issue['error']}\n\n")
            if len(validation_results["firebase_issues"]) > 20:
                f.write(f"\n*...and {len(validation_results['firebase_issues']) - 20} more*\n\n")
        else:
            f.write("✅ All files are Firebase compatible\n\n")

        # Special Characters
        f.write("### 5. Special Character Usage\n\n")
        if validation_results["special_char_warnings"]:
            char_types = defaultdict(int)
            for warning in validation_results["special_char_warnings"]:
                char_types[warning['type']] += 1

            f.write(f"Found {len(validation_results['special_char_warnings'])} instances of special characters:\n\n")
            f.write("| Character Type | Count |\n")
            f.write("|----------------|-------|\n")
            for char_type, count in sorted(char_types.items(), key=lambda x: x[1], reverse=True):
                f.write(f"| {char_type.replace('_', ' ').title()} | {count} |\n")
            f.write("\n")
        else:
            f.write("ℹ️ No special Unicode characters detected\n\n")

        # Statistics
        f.write("## Content Statistics\n\n")

        f.write("### By Mythology\n\n")
        f.write("| Mythology | Files |\n")
        f.write("|-----------|-------|\n")
        for myth, count in sorted(validation_results["statistics"]["by_mythology"].items(),
                                  key=lambda x: x[1], reverse=True):
            f.write(f"| {myth.title()} | {count} |\n")
        f.write("\n")

        f.write("### By Entity Type\n\n")
        f.write("| Type | Files |\n")
        f.write("|------|-------|\n")
        for etype, count in sorted(validation_results["statistics"]["by_type"].items(),
                                   key=lambda x: x[1], reverse=True):
            f.write(f"| {etype.title()} | {count} |\n")
        f.write("\n")

        # Recommendations
        f.write("## Recommendations\n\n")

        if validation_results["syntax_errors"]:
            f.write("### Critical - Fix Syntax Errors\n\n")
            f.write("1. Review and fix all JSON syntax errors\n")
            f.write("2. Ensure proper UTF-8 encoding\n")
            f.write("3. Validate JSON structure\n\n")

        if validation_results["duplicate_ids"]:
            f.write("### Critical - Resolve Duplicate IDs\n\n")
            f.write("1. Each entity must have a unique ID\n")
            f.write("2. Consider adding mythology prefix to IDs\n")
            f.write("3. Update MIGRATION_TRACKER.json after fixes\n\n")

        if validation_results["schema_violations"]:
            f.write("### High Priority - Fix Schema Violations\n\n")
            f.write("1. Add missing required fields\n")
            f.write("2. Correct invalid mythology/type values\n")
            f.write("3. Ensure proper data types\n\n")

        if validation_results["firebase_issues"]:
            f.write("### Medium Priority - Firebase Compatibility\n\n")
            f.write("1. Fix field names (remove dots, __prefixes)\n")
            f.write("2. Reduce document size if needed\n")
            f.write("3. Flatten deep nested structures\n\n")

        f.write("## Next Steps\n\n")
        f.write("1. **Fix Critical Issues:** Address all syntax errors and duplicate IDs\n")
        f.write("2. **Review Schema Violations:** Update files to match required schema\n")
        f.write("3. **Test Firebase Upload:** Upload a sample batch to test\n")
        f.write("4. **Proceed to Phase 3.2:** Batch upload validated files\n\n")

        # Files Ready for Upload
        f.write("## Files Ready for Upload\n\n")
        if validation_results["files_ready"]:
            f.write(f"The following {len(validation_results['files_ready'])} files passed all validations:\n\n")
            # Group by mythology
            ready_by_myth = defaultdict(list)
            for file in validation_results["files_ready"]:
                # Extract mythology from path or data
                for myth in SUPPORTED_MYTHOLOGIES:
                    if myth in file.lower():
                        ready_by_myth[myth].append(file)
                        break
                else:
                    ready_by_myth["other"].append(file)

            for myth, files in sorted(ready_by_myth.items()):
                f.write(f"### {myth.title()} ({len(files)} files)\n\n")
                f.write(f"✅ Ready for upload\n\n")
        else:
            f.write("⚠️ No files are ready for upload. All files need fixes.\n\n")

    print(f"  Generated {report_path}")


def generate_validation_json():
    """Generate validation-results.json."""
    results_path = PROJECT_ROOT / "validation-results.json"

    # Convert defaultdict to regular dict for JSON serialization
    json_results = {
        "generated_at": datetime.now().isoformat(),
        "total_files": validation_results["total_files"],
        "summary": {
            "files_ready": len(validation_results["files_ready"]),
            "files_need_fixes": len(validation_results["files_need_fixes"]),
            "syntax_errors": len(validation_results["syntax_errors"]),
            "schema_violations": len(validation_results["schema_violations"]),
            "duplicate_ids": len(validation_results["duplicate_ids"]),
            "broken_references": len(validation_results["broken_references"]),
            "firebase_issues": len(validation_results["firebase_issues"]),
            "special_char_warnings": len(validation_results["special_char_warnings"])
        },
        "details": {
            "syntax_errors": validation_results["syntax_errors"],
            "schema_violations": validation_results["schema_violations"],
            "duplicate_ids": validation_results["duplicate_ids"],
            "broken_references": validation_results["broken_references"],
            "firebase_issues": validation_results["firebase_issues"],
            "special_char_warnings": validation_results["special_char_warnings"]
        },
        "file_lists": {
            "ready_for_upload": validation_results["files_ready"],
            "needs_fixes": validation_results["files_need_fixes"]
        },
        "statistics": {
            "by_mythology": dict(validation_results["statistics"]["by_mythology"]),
            "by_type": dict(validation_results["statistics"]["by_type"]),
            "by_status": dict(validation_results["statistics"]["by_status"])
        }
    }

    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(json_results, f, indent=2, ensure_ascii=False)

    print(f"  Generated {results_path}")


def print_validation_summary():
    """Print validation summary to console."""
    print("=" * 80)
    print("VALIDATION COMPLETE")
    print("=" * 80)
    print()

    total = validation_results["total_files"]
    ready = len(validation_results["files_ready"])
    needs_fixes = len(validation_results["files_need_fixes"])

    print(f"Total Files Validated: {total}")
    print(f"Files Ready for Upload: {ready} ({ready/total*100:.1f}%)")
    print(f"Files Needing Fixes: {needs_fixes} ({needs_fixes/total*100:.1f}%)")
    print()

    print("ISSUES FOUND:")
    print("-" * 50)
    print(f"  Syntax Errors:        {len(validation_results['syntax_errors'])}")
    print(f"  Schema Violations:    {len(validation_results['schema_violations'])}")
    print(f"  Duplicate IDs:        {len(validation_results['duplicate_ids'])}")
    print(f"  Broken References:    {len(validation_results['broken_references'])}")
    print(f"  Firebase Issues:      {len(validation_results['firebase_issues'])}")
    print(f"  Special Char Warnings: {len(validation_results['special_char_warnings'])}")
    print()

    if validation_results["syntax_errors"] == 0 and len(validation_results['duplicate_ids']) == 0:
        print("STATUS: ✅ PASS - Ready for Firebase upload")
    else:
        print("STATUS: ⚠️  NEEDS ATTENTION - Fix critical issues before upload")
    print()

    print("DELIVERABLES CREATED:")
    print(f"  1. {PROJECT_ROOT / 'VALIDATION_REPORT.md'}")
    print(f"  2. {PROJECT_ROOT / 'validation-results.json'}")
    print()
    print("=" * 80)


if __name__ == "__main__":
    try:
        validate_all_files()
    except Exception as e:
        print(f"\n❌ VALIDATION FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
