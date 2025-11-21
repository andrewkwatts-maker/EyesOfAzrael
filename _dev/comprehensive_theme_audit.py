#!/usr/bin/env python3
"""
Comprehensive Theme Compliance Audit
Checks all aspects of theme integration across the project
"""

import os
import re
from pathlib import Path
from collections import defaultdict
import json

ROOT_DIR = Path(__file__).parent.parent
EXCLUDE_DIRS = {'.svn', '_dev', '__pycache__', 'node_modules'}

class ComprehensiveThemeAuditor:
    def __init__(self):
        self.results = {
            'theme_system': {'compliant': [], 'issues': []},
            'css_variables': {'good': [], 'needs_improvement': []},
            'header_structure': {'standardized': [], 'needs_work': []},
            'backgrounds': {'themed': [], 'hardcoded': []},
            'colors': {'using_vars': [], 'hardcoded': []},
            'components': {'compliant': [], 'issues': []},
        }
        self.stats = defaultdict(int)
        self.issues_by_type = defaultdict(list)

    def check_theme_system(self, file_path, content):
        """Check if file has complete theme system"""
        has_theme_base = bool(re.search(r'theme-base\.css', content))
        has_theme_picker = bool(re.search(r'theme-picker\.js', content))
        has_theme_animations = bool(re.search(r'theme-animations\.js', content))

        if has_theme_base and has_theme_picker and has_theme_animations:
            return 'complete'
        elif has_theme_base or has_theme_picker:
            return 'partial'
        else:
            return 'missing'

    def check_css_variables(self, file_path, content):
        """Analyze CSS variable usage vs hardcoded values"""
        issues = []

        # Extract style blocks
        style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
        inline_styles = re.findall(r'style="([^"]*)"', content, re.IGNORECASE)

        all_styles = '\n'.join(style_blocks) + '\n'.join(inline_styles)

        # Check for hardcoded colors
        hardcoded_colors = re.findall(r'(?:color|background|border-color|box-shadow|fill|stroke)\s*:\s*([#][0-9a-fA-F]{3,8}|rgb\(|rgba\()', all_styles)

        # Check for CSS variable usage
        css_var_usage = re.findall(r'var\(--[a-z-]+\)', all_styles)

        if hardcoded_colors and len(hardcoded_colors) > 5:
            issues.append(f"Many hardcoded colors ({len(hardcoded_colors)} found)")

        if css_var_usage:
            self.stats['files_using_css_vars'] += 1
        else:
            if style_blocks or inline_styles:
                issues.append("No CSS variables used in styles")

        return issues

    def check_header_structure(self, file_path, content):
        """Check if header follows standardized structure"""
        issues = []

        # Check for header element
        has_header = bool(re.search(r'<header[^>]*>', content, re.IGNORECASE))

        if not has_header:
            issues.append("No <header> element")
            return issues

        # Extract header content
        header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL | re.IGNORECASE)
        if header_match:
            header_content = header_match.group(1)

            # Check for breadcrumb navigation
            has_breadcrumb = bool(re.search(r'breadcrumb|nav', header_content, re.IGNORECASE))

            # Check for h1
            has_h1 = bool(re.search(r'<h1[^>]*>', header_content, re.IGNORECASE))

            if not has_h1:
                issues.append("Header missing <h1>")

            if not has_breadcrumb:
                issues.append("Header missing breadcrumb navigation")

        return issues

    def check_backgrounds(self, file_path, content):
        """Check if backgrounds use theme variables"""
        issues = []

        # Extract style blocks
        style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
        all_styles = '\n'.join(style_blocks)

        # Look for background declarations
        bg_hardcoded = re.findall(r'background(?:-color)?\s*:\s*[#][0-9a-fA-F]{3,8}', all_styles)
        bg_with_vars = re.findall(r'background(?:-color)?\s*:.*?var\(--color-', all_styles)

        if bg_hardcoded and not bg_with_vars:
            issues.append(f"Hardcoded backgrounds ({len(bg_hardcoded)} found)")

        return issues

    def check_color_usage(self, file_path, content):
        """Detailed check of color usage patterns"""
        issues = []

        style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
        all_styles = '\n'.join(style_blocks)

        # Count different color patterns
        hardcoded_hex = len(re.findall(r'[#][0-9a-fA-F]{3,8}', all_styles))
        hardcoded_rgb = len(re.findall(r'rgb\([^)]+\)', all_styles))
        using_color_vars = len(re.findall(r'var\(--color-', all_styles))

        score = 0
        if using_color_vars > 0:
            score += 2
        if hardcoded_hex > 10:
            score -= 1
            issues.append(f"High hardcoded hex usage ({hardcoded_hex})")
        if hardcoded_rgb > 5:
            score -= 1
            issues.append(f"Hardcoded RGB values ({hardcoded_rgb})")

        return score, issues

    def check_component_classes(self, file_path, content):
        """Check if common component classes are used properly"""
        issues = []

        # Common component classes that should be styled with theme vars
        components = [
            'glass-card', 'nav-card', 'mythos-card', 'hero-section',
            'attribute-card', 'stat-card', 'magic-card', 'herb-card'
        ]

        for component in components:
            if re.search(rf'class="[^"]*{component}', content):
                # Check if this component is styled
                style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
                all_styles = '\n'.join(style_blocks)

                if component in all_styles:
                    # Check if it uses CSS variables
                    component_styles = re.search(rf'\.{component}[^{{]*{{([^}}]+)}}', all_styles, re.DOTALL)
                    if component_styles:
                        component_css = component_styles.group(1)
                        if not re.search(r'var\(--', component_css):
                            issues.append(f"Component '{component}' not using CSS variables")

        return issues

    def audit_file(self, file_path):
        """Perform comprehensive audit on a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            rel_path = str(file_path.relative_to(ROOT_DIR))
            self.stats['total_files'] += 1

            file_issues = []

            # 1. Theme System Check
            theme_status = self.check_theme_system(file_path, content)
            if theme_status != 'complete':
                file_issues.append(f"Theme system: {theme_status}")

            # 2. CSS Variables Check
            css_issues = self.check_css_variables(file_path, content)
            file_issues.extend(css_issues)

            # 3. Header Structure Check
            header_issues = self.check_header_structure(file_path, content)
            file_issues.extend(header_issues)

            # 4. Background Check
            bg_issues = self.check_backgrounds(file_path, content)
            file_issues.extend(bg_issues)

            # 5. Color Usage Check
            color_score, color_issues = self.check_color_usage(file_path, content)
            file_issues.extend(color_issues)

            # 6. Component Classes Check
            component_issues = self.check_component_classes(file_path, content)
            file_issues.extend(component_issues)

            # Categorize file
            if not file_issues:
                self.results['fully_compliant'] = self.results.get('fully_compliant', [])
                self.results['fully_compliant'].append(rel_path)
                self.stats['fully_compliant'] += 1
            else:
                self.results['needs_improvement'] = self.results.get('needs_improvement', [])
                self.results['needs_improvement'].append({
                    'path': rel_path,
                    'issues': file_issues,
                    'issue_count': len(file_issues)
                })
                self.stats['needs_improvement'] += 1

                # Track issue types
                for issue in file_issues:
                    issue_type = issue.split(':')[0] if ':' in issue else issue.split('(')[0]
                    self.issues_by_type[issue_type].append(rel_path)

        except Exception as e:
            self.stats['errors'] += 1
            print(f"Error processing {file_path.relative_to(ROOT_DIR)}: {e}")

    def scan_all_files(self):
        """Scan all HTML files"""
        print("Scanning all HTML files...")
        for file_path in ROOT_DIR.rglob('*.html'):
            if any(excluded in file_path.parts for excluded in EXCLUDE_DIRS):
                continue
            self.audit_file(file_path)

    def generate_report(self):
        """Generate comprehensive report"""
        print("\n" + "=" * 80)
        print("COMPREHENSIVE THEME COMPLIANCE AUDIT")
        print("=" * 80)
        print()

        # Summary
        print("OVERALL SUMMARY")
        print("-" * 80)
        print(f"Total files scanned: {self.stats['total_files']}")
        print(f"Fully compliant:     {self.stats['fully_compliant']} ({self.stats['fully_compliant']/max(self.stats['total_files'],1)*100:.1f}%)")
        print(f"Needs improvement:   {self.stats['needs_improvement']} ({self.stats['needs_improvement']/max(self.stats['total_files'],1)*100:.1f}%)")
        print(f"Files using CSS vars: {self.stats['files_using_css_vars']} ({self.stats['files_using_css_vars']/max(self.stats['total_files'],1)*100:.1f}%)")
        print()

        # Issue breakdown
        print("ISSUE BREAKDOWN BY TYPE")
        print("-" * 80)
        sorted_issues = sorted(self.issues_by_type.items(), key=lambda x: len(x[1]), reverse=True)
        for issue_type, files in sorted_issues[:15]:
            print(f"{issue_type:40s} {len(files):4d} files")
        print()

        # Top files needing work
        if self.results.get('needs_improvement'):
            print("TOP FILES NEEDING IMPROVEMENT (by issue count)")
            print("-" * 80)
            sorted_files = sorted(
                self.results['needs_improvement'],
                key=lambda x: x['issue_count'],
                reverse=True
            )
            for item in sorted_files[:20]:
                print(f"\n{item['path']} ({item['issue_count']} issues)")
                for issue in item['issues'][:5]:
                    print(f"  - {issue}")

        print()
        print("=" * 80)

        # Save detailed results
        output_file = ROOT_DIR / '_dev' / 'comprehensive_audit_report.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'stats': dict(self.stats),
                'results': self.results,
                'issues_by_type': {k: len(v) for k, v in self.issues_by_type.items()}
            }, f, indent=2)

        print(f"\nDetailed results saved to: {output_file}")

        # Generate actionable recommendations
        print("\n" + "=" * 80)
        print("ACTIONABLE RECOMMENDATIONS")
        print("=" * 80)

        recommendations = []

        if 'Hardcoded backgrounds' in self.issues_by_type:
            count = len(self.issues_by_type['Hardcoded backgrounds'])
            recommendations.append(f"1. Replace hardcoded backgrounds with CSS variables in {count} files")

        if 'Many hardcoded colors' in self.issues_by_type:
            count = len(self.issues_by_type['Many hardcoded colors'])
            recommendations.append(f"2. Replace hardcoded colors with theme variables in {count} files")

        if 'No CSS variables used in styles' in self.issues_by_type:
            count = len(self.issues_by_type['No CSS variables used in styles'])
            recommendations.append(f"3. Add CSS variable usage to {count} files with custom styles")

        if 'Header missing breadcrumb navigation' in self.issues_by_type:
            count = len(self.issues_by_type['Header missing breadcrumb navigation'])
            recommendations.append(f"4. Add breadcrumb navigation to {count} files")

        if recommendations:
            for rec in recommendations:
                print(rec)
        else:
            print("No major issues found! Project is in excellent shape.")

        print("\n" + "=" * 80)

def main():
    auditor = ComprehensiveThemeAuditor()
    auditor.scan_all_files()
    auditor.generate_report()

if __name__ == '__main__':
    main()
