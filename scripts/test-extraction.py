#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Extraction Script
Tests HTML to JSON extraction on 10 sample files across different mythologies and entity types

Usage:
    python scripts/test-extraction.py
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Import the extractor
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# Import with proper module name
if os.path.exists(os.path.join(script_dir, 'html-to-json-extractor.py')):
    import importlib.util
    spec = importlib.util.spec_from_file_location("html_to_json_extractor",
                                                   os.path.join(script_dir, "html-to-json-extractor.py"))
    html_to_json_extractor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(html_to_json_extractor)
    HTMLToJSONExtractor = html_to_json_extractor.HTMLToJSONExtractor
else:
    print("ERROR: html-to-json-extractor.py not found in scripts directory")
    sys.exit(1)

# Test files - diverse sample across mythologies and entity types
TEST_FILES = [
    # Egyptian deity with hieroglyphs
    {
        'path': 'mythos/egyptian/deities/ra.html',
        'expected_type': 'deity',
        'expected_mythology': 'egyptian',
        'features': ['hieroglyphs', 'forms_section', 'author_theories']
    },
    # Greek deity
    {
        'path': 'mythos/greek/deities/zeus.html',
        'expected_type': 'deity',
        'expected_mythology': 'greek'
    },
    # Greek hero with labors
    {
        'path': 'mythos/greek/heroes/heracles.html',
        'expected_type': 'hero',
        'expected_mythology': 'greek',
        'features': ['labors_grid']
    },
    # Greek hero
    {
        'path': 'mythos/greek/heroes/perseus.html',
        'expected_type': 'hero',
        'expected_mythology': 'greek'
    },
    # Norse deity
    {
        'path': 'mythos/norse/deities/odin.html',
        'expected_type': 'deity',
        'expected_mythology': 'norse'
    },
    # Hindu deity
    {
        'path': 'mythos/hindu/deities/shiva.html',
        'expected_type': 'deity',
        'expected_mythology': 'hindu'
    },
    # Babylonian deity with theories
    {
        'path': 'mythos/babylonian/deities/marduk.html',
        'expected_type': 'deity',
        'expected_mythology': 'babylonian',
        'features': ['extra_theories']
    },
    # Buddhist deity
    {
        'path': 'mythos/buddhist/deities/avalokiteshvara.html',
        'expected_type': 'deity',
        'expected_mythology': 'buddhist'
    },
    # Egyptian deity (smaller)
    {
        'path': 'mythos/egyptian/deities/anubis.html',
        'expected_type': 'deity',
        'expected_mythology': 'egyptian'
    },
    # Greek hero
    {
        'path': 'mythos/greek/heroes/odysseus.html',
        'expected_type': 'hero',
        'expected_mythology': 'greek'
    }
]


class ExtractionTester:
    """Test extraction on sample files"""

    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.extractor = HTMLToJSONExtractor("extraction-templates.json")
        self.results = []

    def test_file(self, test_config: dict) -> dict:
        """Test extraction on a single file"""
        file_path = self.base_path / test_config['path']

        print(f"\n{'='*80}")
        print(f"Testing: {test_config['path']}")
        print('='*80)

        if not file_path.exists():
            return {
                'file': test_config['path'],
                'status': 'file_not_found',
                'passed': False
            }

        try:
            # Extract
            result = self.extractor.extract_from_file(str(file_path))

            # Validate
            validation = self.validate_extraction(result, test_config)

            return {
                'file': test_config['path'],
                'status': 'completed',
                'passed': validation['passed'],
                'validation': validation,
                'data': result
            }

        except Exception as e:
            print(f"ERROR: {e}")
            return {
                'file': test_config['path'],
                'status': 'error',
                'passed': False,
                'error': str(e)
            }

    def validate_extraction(self, result: dict, test_config: dict) -> dict:
        """Validate extraction results"""
        checks = {}
        passed = True

        # Check extraction status
        if result.get('status') in ['extraction_failed', 'skipped']:
            checks['extraction_status'] = False
            passed = False
            print(f"❌ Extraction failed or skipped: {result.get('status')}")
        else:
            checks['extraction_status'] = True
            print("✓ Extraction completed")

        # Check required fields
        required_fields = ['name', 'type', 'mythology', 'description']
        for field in required_fields:
            if result.get(field):
                checks[f'has_{field}'] = True
            else:
                checks[f'has_{field}'] = False
                passed = False
                print(f"❌ Missing required field: {field}")

        if all(checks.get(f'has_{f}') for f in required_fields):
            print(f"✓ All required fields present")

        # Check expected values
        if test_config.get('expected_type'):
            if result.get('type') == test_config['expected_type']:
                checks['correct_type'] = True
                print(f"✓ Type: {result.get('type')}")
            else:
                checks['correct_type'] = False
                passed = False
                print(f"❌ Type mismatch: expected {test_config['expected_type']}, got {result.get('type')}")

        if test_config.get('expected_mythology'):
            if result.get('mythology') == test_config['expected_mythology']:
                checks['correct_mythology'] = True
                print(f"✓ Mythology: {result.get('mythology')}")
            else:
                checks['correct_mythology'] = False
                passed = False
                print(f"❌ Mythology mismatch: expected {test_config['expected_mythology']}, got {result.get('mythology')}")

        # Check features
        if test_config.get('features'):
            for feature in test_config['features']:
                if feature == 'labors_grid' and result.get('labors'):
                    checks['has_labors_grid'] = True
                    print(f"✓ Labor grid extracted: {len(result['labors'])} labors")
                elif feature == 'forms_section' and result.get('forms'):
                    checks['has_forms'] = True
                    print(f"✓ Forms extracted: {len(result['forms'])} forms")
                elif feature == 'hieroglyphs' and isinstance(result.get('icon'), dict):
                    checks['has_hieroglyphs'] = True
                    print(f"✓ Hieroglyphs preserved")
                elif feature == 'author_theories' and result.get('alternative_theories'):
                    checks['has_theories'] = True
                    print(f"✓ Theories extracted: {len(result['alternative_theories'])}")
                elif feature == 'extra_theories' and result.get('alternative_theories'):
                    checks['has_extra_theories'] = True
                    print(f"✓ Extra theories extracted")

        # Check sections
        sections_found = []
        if result.get('attributes'):
            sections_found.append(f"Attributes ({len(result['attributes'])})")
        if result.get('mythology_stories'):
            sections_found.append("Mythology")
        if result.get('relationships'):
            sections_found.append("Relationships")
        if result.get('worship'):
            sections_found.append("Worship")

        print(f"✓ Sections: {', '.join(sections_found)}")

        # Check completeness score
        score = result.get('extraction_metadata', {}).get('completeness_score', 0)
        print(f"✓ Completeness: {score}%")

        if score >= 70:
            checks['good_completeness'] = True
        else:
            checks['good_completeness'] = False
            print(f"⚠ Low completeness score")

        # Check warnings
        warnings = result.get('extraction_metadata', {}).get('warnings', [])
        if warnings:
            print(f"⚠ Warnings: {len(warnings)}")
            for w in warnings[:3]:
                print(f"  - {w}")

        return {
            'passed': passed,
            'checks': checks,
            'score': score,
            'warnings_count': len(warnings)
        }

    def run_all_tests(self) -> dict:
        """Run all test files"""
        print("="*80)
        print("HTML TO JSON EXTRACTION - TEST SUITE")
        print("="*80)
        print(f"Testing {len(TEST_FILES)} sample files")
        print(f"Base path: {self.base_path.absolute()}")

        for test_config in TEST_FILES:
            result = self.test_file(test_config)
            self.results.append(result)

        return self.generate_report()

    def generate_report(self) -> dict:
        """Generate summary report"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)

        passed = sum(1 for r in self.results if r['passed'])
        failed = len(self.results) - passed

        print(f"\nTotal Tests: {len(self.results)}")
        print(f"Passed: {passed} ✓")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/len(self.results)*100):.1f}%")

        # Detailed results
        print("\n" + "-"*80)
        print("DETAILED RESULTS")
        print("-"*80)

        for result in self.results:
            status_icon = "✓" if result['passed'] else "❌"
            print(f"{status_icon} {result['file']}")

            if result['status'] == 'completed':
                validation = result.get('validation', {})
                score = validation.get('score', 0)
                warnings = validation.get('warnings_count', 0)
                print(f"   Completeness: {score}% | Warnings: {warnings}")
            elif result['status'] == 'error':
                print(f"   Error: {result.get('error')}")
            elif result['status'] == 'file_not_found':
                print(f"   File not found")

        # Generate output files
        output_dir = Path("test-extraction-results")
        output_dir.mkdir(exist_ok=True)

        # Save individual extractions
        for result in self.results:
            if result.get('data'):
                filename = Path(result['file']).stem + '.json'
                output_file = output_dir / filename

                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result['data'], f, indent=2, ensure_ascii=False)

        # Save summary report
        report = {
            'test_run': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'total_tests': len(self.results),
                'passed': passed,
                'failed': failed,
                'success_rate': round(passed/len(self.results)*100, 1)
            },
            'results': [
                {
                    'file': r['file'],
                    'passed': r['passed'],
                    'status': r['status'],
                    'validation': r.get('validation', {})
                }
                for r in self.results
            ]
        }

        report_file = output_dir / 'test-report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"\n✓ Results saved to: {output_dir.absolute()}")
        print(f"✓ Test report: {report_file}")

        return report


def main():
    """Main entry point"""
    # Find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Change to project root
    os.chdir(project_root)

    # Run tests
    tester = ExtractionTester(project_root)
    report = tester.run_all_tests()

    # Exit with appropriate code
    if report['test_run']['failed'] == 0:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {report['test_run']['failed']} tests failed")
        sys.exit(1)


if __name__ == '__main__':
    main()
