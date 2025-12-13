#!/usr/bin/env node

/**
 * Generate Data Quality Report
 *
 * Analyzes parsed data and generates comprehensive quality metrics
 */

const fs = require('fs');
const path = require('path');

const PARSED_DATA_DIR = path.join(__dirname, '..', 'parsed_data');

function generateQualityReport() {
    const allDataPath = path.join(PARSED_DATA_DIR, 'all_mythologies_parsed.json');
    const allData = JSON.parse(fs.readFileSync(allDataPath, 'utf8'));

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalMythologies: 0,
            totalDeities: 0,
            totalDomains: 0,
            totalSymbols: 0,
            totalRelationships: 0
        },
        quality: {
            deitiesWithNames: 0,
            deitiesWithDescriptions: 0,
            deitiesWithDomains: 0,
            deitiesWithSymbols: 0,
            deitiesWithRelationships: 0,
            deitiesWithCorpusLinks: 0
        },
        byMythology: {}
    };

    Object.entries(allData).forEach(([mythId, data]) => {
        report.summary.totalMythologies++;

        const mythReport = {
            name: data.mythology.title,
            icon: data.mythology.icon,
            deityCount: data.deities.length,
            quality: {
                withDomains: 0,
                withSymbols: 0,
                withDescriptions: 0,
                withRelationships: 0
            },
            topDeities: []
        };

        data.deities.forEach(deity => {
            report.summary.totalDeities++;

            if (deity.name && deity.name !== mythId) report.quality.deitiesWithNames++;
            if (deity.description && deity.description.length > 20) {
                report.quality.deitiesWithDescriptions++;
                mythReport.quality.withDescriptions++;
            }
            if (deity.domains && deity.domains.length > 0) {
                report.quality.deitiesWithDomains++;
                mythReport.quality.withDomains++;
                report.summary.totalDomains += deity.domains.length;
            }
            if (deity.symbols && deity.symbols.length > 0) {
                report.quality.deitiesWithSymbols++;
                mythReport.quality.withSymbols++;
                report.summary.totalSymbols += deity.symbols.length;
            }
            if (deity.relationships && Object.keys(deity.relationships).length > 0) {
                report.quality.deitiesWithRelationships++;
                mythReport.quality.withRelationships++;
                report.summary.totalRelationships++;
            }
            if (deity.primarySources && deity.primarySources.length > 0) {
                report.quality.deitiesWithCorpusLinks++;
            }

            // Track top deities for sample
            if (mythReport.topDeities.length < 3) {
                mythReport.topDeities.push({
                    name: deity.name,
                    domains: deity.domains?.length || 0,
                    symbols: deity.symbols?.length || 0,
                    description: deity.description ? deity.description.substring(0, 100) : ''
                });
            }
        });

        report.byMythology[mythId] = mythReport;
    });

    // Calculate percentages
    const total = report.summary.totalDeities;
    report.qualityPercentages = {
        names: ((report.quality.deitiesWithNames / total) * 100).toFixed(1) + '%',
        descriptions: ((report.quality.deitiesWithDescriptions / total) * 100).toFixed(1) + '%',
        domains: ((report.quality.deitiesWithDomains / total) * 100).toFixed(1) + '%',
        symbols: ((report.quality.deitiesWithSymbols / total) * 100).toFixed(1) + '%',
        relationships: ((report.quality.deitiesWithRelationships / total) * 100).toFixed(1) + '%',
        corpusLinks: ((report.quality.deitiesWithCorpusLinks / total) * 100).toFixed(1) + '%'
    };

    // Overall quality score
    const scores = [
        report.quality.deitiesWithNames / total,
        report.quality.deitiesWithDescriptions / total,
        report.quality.deitiesWithDomains / total,
        report.quality.deitiesWithSymbols / total,
        report.quality.deitiesWithRelationships / total,
        report.quality.deitiesWithCorpusLinks / total
    ];
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    report.overallQualityScore = (avgScore * 100).toFixed(1) + '%';

    return report;
}

function printReport(report) {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 DATA QUALITY REPORT');
    console.log('═'.repeat(70));

    console.log('\n📈 Summary:');
    console.log(`   Mythologies: ${report.summary.totalMythologies}`);
    console.log(`   Deities: ${report.summary.totalDeities}`);
    console.log(`   Total Domains: ${report.summary.totalDomains}`);
    console.log(`   Total Symbols: ${report.summary.totalSymbols}`);
    console.log(`   Total Relationships: ${report.summary.totalRelationships}`);

    console.log('\n✅ Quality Metrics:');
    console.log(`   Names: ${report.qualityPercentages.names}`);
    console.log(`   Descriptions: ${report.qualityPercentages.descriptions}`);
    console.log(`   Domains: ${report.qualityPercentages.domains}`);
    console.log(`   Symbols: ${report.qualityPercentages.symbols}`);
    console.log(`   Relationships: ${report.qualityPercentages.relationships}`);
    console.log(`   Corpus Links: ${report.qualityPercentages.corpusLinks}`);

    console.log(`\n🎯 Overall Quality Score: ${report.overallQualityScore}`);

    console.log('\n📚 Top Mythologies by Deity Count:');
    const sortedMyths = Object.entries(report.byMythology)
        .sort((a, b) => b[1].deityCount - a[1].deityCount)
        .slice(0, 10);

    sortedMyths.forEach(([id, myth]) => {
        console.log(`   ${myth.icon || '📖'} ${myth.name}: ${myth.deityCount} deities`);
        console.log(`      Domains: ${myth.quality.withDomains}/${myth.deityCount}, Symbols: ${myth.quality.withSymbols}/${myth.deityCount}`);
    });
}

// Main execution
const report = generateQualityReport();
printReport(report);

// Save report
const reportPath = path.join(PARSED_DATA_DIR, 'quality_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n💾 Report saved to: ${reportPath}`);
