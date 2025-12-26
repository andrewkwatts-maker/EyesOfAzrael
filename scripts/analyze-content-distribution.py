#!/usr/bin/env python3
"""
Content Distribution Analysis
Identifies mythologies and entity types with minimal content
Generates recommendations for content expansion
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class ContentAnalyzer:
    def __init__(self):
        self.base_dir = Path('h:/Github/EyesOfAzrael/mythos')
        self.entity_types = ['deities', 'cosmology', 'heroes', 'creatures', 'rituals',
                            'herbs', 'symbols', 'concepts', 'figures', 'texts',
                            'locations', 'magic', 'path']

    def count_files(self):
        """Count all content files by mythology and type"""
        distribution = defaultdict(lambda: defaultdict(int))

        for mythology_dir in self.base_dir.iterdir():
            if not mythology_dir.is_dir():
                continue

            mythology = mythology_dir.name

            for entity_type in self.entity_types:
                type_dir = mythology_dir / entity_type

                # Also check beings directory
                if entity_type == 'creatures':
                    beings_dir = mythology_dir / 'beings'
                    if beings_dir.exists():
                        html_files = [f for f in beings_dir.glob('*.html') if f.name != 'index.html']
                        distribution[mythology]['creatures'] += len(html_files)

                if type_dir.exists():
                    html_files = [f for f in type_dir.glob('*.html') if f.name != 'index.html']
                    distribution[mythology][entity_type] = len(html_files)

        return distribution

    def analyze(self):
        """Analyze content distribution and identify gaps"""
        distribution = self.count_files()

        # Calculate totals
        mythology_totals = {}
        type_totals = defaultdict(int)

        for mythology, types in distribution.items():
            total = sum(types.values())
            mythology_totals[mythology] = total

            for entity_type, count in types.items():
                type_totals[entity_type] += count

        # Sort by total content (ascending = sparse first)
        sorted_mythologies = sorted(mythology_totals.items(), key=lambda x: x[1])

        print("="*80)
        print("CONTENT DISTRIBUTION ANALYSIS")
        print("="*80)
        print()

        # Show sparse mythologies
        print("🔍 MYTHOLOGIES WITH MINIMAL CONTENT (< 10 entities):")
        print("-"*80)
        sparse_mythologies = []
        for mythology, total in sorted_mythologies:
            if total < 10:
                sparse_mythologies.append(mythology)
                print(f"  {mythology:20s} {total:3d} entities")
                # Show what they have
                for entity_type in self.entity_types:
                    count = distribution[mythology].get(entity_type, 0)
                    if count > 0:
                        print(f"    - {entity_type}: {count}")
        print()

        # Show well-covered mythologies
        print("✅ WELL-COVERED MYTHOLOGIES (> 20 entities):")
        print("-"*80)
        for mythology, total in sorted_mythologies:
            if total >= 20:
                print(f"  {mythology:20s} {total:3d} entities")
        print()

        # Show entity type distribution
        print("📊 ENTITY TYPE DISTRIBUTION:")
        print("-"*80)
        for entity_type in sorted(type_totals.keys(), key=lambda x: type_totals[x], reverse=True):
            count = type_totals[entity_type]
            mythologies_with_type = [m for m in distribution if distribution[m].get(entity_type, 0) > 0]
            print(f"  {entity_type:15s} {count:3d} total across {len(mythologies_with_type):2d} mythologies")
        print()

        # Identify gaps (mythologies missing common entity types)
        print("⚠️  CONTENT GAPS:")
        print("-"*80)

        gaps = {}
        for mythology in distribution.keys():
            missing = []

            # Every mythology should have deities
            if distribution[mythology].get('deities', 0) == 0:
                missing.append('deities (CRITICAL)')

            # Major mythologies should have cosmology
            if mythology_totals[mythology] >= 5:
                if distribution[mythology].get('cosmology', 0) == 0:
                    missing.append('cosmology')
                if distribution[mythology].get('heroes', 0) == 0:
                    missing.append('heroes')
                if distribution[mythology].get('creatures', 0) == 0:
                    missing.append('creatures')

            if missing:
                gaps[mythology] = missing

        for mythology in sorted(gaps.keys()):
            print(f"  {mythology}:")
            for gap in gaps[mythology]:
                print(f"    - Missing: {gap}")
        print()

        # Generate recommendations
        print("💡 RECOMMENDATIONS FOR CONTENT EXPANSION:")
        print("="*80)

        recommendations = []

        # Priority 1: Sparse mythologies that need core content
        print("\n🔴 PRIORITY 1: Add core deities and cosmology")
        print("-"*80)
        for mythology in sparse_mythologies:
            deity_count = distribution[mythology].get('deities', 0)
            cosmo_count = distribution[mythology].get('cosmology', 0)

            if deity_count < 5:
                needed = 5 - deity_count
                print(f"  {mythology}: Add {needed} more deities (currently {deity_count})")
                recommendations.append({
                    'mythology': mythology,
                    'type': 'deity',
                    'count': needed,
                    'priority': 1
                })

            if cosmo_count == 0:
                print(f"  {mythology}: Add cosmology (creation myth, afterlife)")
                recommendations.append({
                    'mythology': mythology,
                    'type': 'cosmology',
                    'count': 2,
                    'priority': 1,
                    'specific': ['creation', 'afterlife']
                })

        # Priority 2: Expand well-covered mythologies with missing types
        print("\n🟡 PRIORITY 2: Expand well-covered mythologies")
        print("-"*80)
        for mythology, total in sorted_mythologies:
            if total >= 10:
                # Check for missing entity types
                if distribution[mythology].get('herbs', 0) == 0:
                    print(f"  {mythology}: Add sacred herbs/plants")
                    recommendations.append({
                        'mythology': mythology,
                        'type': 'herb',
                        'count': 3,
                        'priority': 2
                    })

                if distribution[mythology].get('symbols', 0) == 0:
                    print(f"  {mythology}: Add sacred symbols")
                    recommendations.append({
                        'mythology': mythology,
                        'type': 'symbol',
                        'count': 2,
                        'priority': 2
                    })

                if distribution[mythology].get('rituals', 0) == 0:
                    print(f"  {mythology}: Add rituals/ceremonies")
                    recommendations.append({
                        'mythology': mythology,
                        'type': 'ritual',
                        'count': 2,
                        'priority': 2
                    })

        # Priority 3: Add variety to all mythologies
        print("\n🟢 PRIORITY 3: Add variety and depth")
        print("-"*80)
        for mythology, total in sorted_mythologies:
            if total >= 5:
                hero_count = distribution[mythology].get('heroes', 0)
                creature_count = distribution[mythology].get('creatures', 0)

                if hero_count < 2:
                    needed = 2 - hero_count
                    print(f"  {mythology}: Add {needed} hero/heroine")
                    recommendations.append({
                        'mythology': mythology,
                        'type': 'hero',
                        'count': needed,
                        'priority': 3
                    })

                if creature_count < 2:
                    needed = 2 - creature_count
                    print(f"  {mythology}: Add {needed} mythical creature")
                    recommendations.append({
                        'mythology': mythology,
                        'type': 'creature',
                        'count': needed,
                        'priority': 3
                    })

        print()
        print("="*80)
        print(f"TOTAL RECOMMENDATIONS: {len(recommendations)}")
        print("="*80)

        # Save recommendations to file
        with open('content_expansion_recommendations.json', 'w', encoding='utf-8') as f:
            json.dump({
                'distribution': {m: dict(t) for m, t in distribution.items()},
                'totals': mythology_totals,
                'sparse_mythologies': sparse_mythologies,
                'gaps': gaps,
                'recommendations': recommendations
            }, f, indent=2, ensure_ascii=False)

        print("\n💾 Analysis saved to: content_expansion_recommendations.json")

        return recommendations

if __name__ == '__main__':
    analyzer = ContentAnalyzer()
    analyzer.analyze()
