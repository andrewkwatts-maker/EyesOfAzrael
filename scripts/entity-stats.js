/**
 * Entity Statistics Generator
 * Generates comprehensive statistics about the entity system
 */

const fs = require('fs').promises;
const path = require('path');
const EntityLoader = require('./entity-loader');

class EntityStatsGenerator {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(__dirname, '..');
        this.loader = new EntityLoader({ baseDir: this.baseDir, verbose: false });
        this.stats = null;
    }

    /**
     * Generate all statistics
     */
    async generate() {
        await this.loader.initialize();

        const entities = this.loader.getAllEntitiesLight();

        this.stats = {
            generated: new Date().toISOString(),
            version: '2.0.0',
            overview: this.generateOverview(entities),
            byType: this.generateByType(entities),
            byMythology: this.generateByMythology(entities),
            byCategory: this.generateByCategory(entities),
            byElement: this.generateByElement(entities),
            bySefirot: this.generateBySefirot(entities),
            byArchetype: this.generateByArchetype(entities),
            completeness: this.generateCompleteness(entities),
            connectivity: this.generateConnectivity(entities),
            temporal: this.generateTemporal(entities),
            geographical: this.generateGeographical(entities),
            topEntities: this.generateTopEntities(entities)
        };

        return this.stats;
    }

    /**
     * Generate overview statistics
     */
    generateOverview(entities) {
        return {
            totalEntities: entities.length,
            entitiesWithIcons: entities.filter(e => e.icon).length,
            entitiesWithColors: entities.filter(e => e.colors && e.colors.primary).length,
            entitiesWithDescriptions: entities.filter(e => e.shortDescription).length,
            entitiesWithFullDescriptions: entities.filter(e => e.fullDescription || e.longDescription).length,
            crossMythologyEntities: entities.filter(e => e.mythologies && e.mythologies.length > 1).length,
            avgMythologiesPerEntity: this.average(entities.map(e => e.mythologies ? e.mythologies.length : 0)),
            avgTagsPerEntity: this.average(entities.map(e => e.tags ? e.tags.length : 0)),
            avgRelatedEntities: this.average(entities.map(e => {
                if (!e.relatedCount) return 0;
                return Object.values(e.relatedCount).reduce((sum, n) => sum + n, 0);
            }))
        };
    }

    /**
     * Generate statistics by entity type
     */
    generateByType(entities) {
        const types = {};

        entities.forEach(entity => {
            if (!types[entity.type]) {
                types[entity.type] = {
                    count: 0,
                    withIcons: 0,
                    withDescriptions: 0,
                    withSources: 0,
                    avgRelatedEntities: []
                };
            }

            types[entity.type].count++;

            if (entity.icon) types[entity.type].withIcons++;
            if (entity.shortDescription) types[entity.type].withDescriptions++;
            if (entity.sources && entity.sources.length > 0) types[entity.type].withSources++;

            if (entity.relatedCount) {
                const total = Object.values(entity.relatedCount).reduce((sum, n) => sum + n, 0);
                types[entity.type].avgRelatedEntities.push(total);
            }
        });

        // Calculate averages
        Object.keys(types).forEach(type => {
            types[type].avgRelatedEntities = this.average(types[type].avgRelatedEntities);
        });

        return types;
    }

    /**
     * Generate statistics by mythology
     */
    generateByMythology(entities) {
        const mythologies = {};

        entities.forEach(entity => {
            if (!entity.mythologies) return;

            entity.mythologies.forEach(myth => {
                if (!mythologies[myth]) {
                    mythologies[myth] = {
                        count: 0,
                        types: {},
                        exclusiveCount: 0,
                        crossMythologyCount: 0
                    };
                }

                mythologies[myth].count++;

                // Track by type within mythology
                if (!mythologies[myth].types[entity.type]) {
                    mythologies[myth].types[entity.type] = 0;
                }
                mythologies[myth].types[entity.type]++;

                // Track exclusive vs cross-mythology
                if (entity.mythologies.length === 1) {
                    mythologies[myth].exclusiveCount++;
                } else {
                    mythologies[myth].crossMythologyCount++;
                }
            });
        });

        // Sort by count
        return Object.fromEntries(
            Object.entries(mythologies).sort(([, a], [, b]) => b.count - a.count)
        );
    }

    /**
     * Generate statistics by category
     */
    generateByCategory(entities) {
        const categories = {};

        entities.forEach(entity => {
            if (!entity.category) return;

            if (!categories[entity.category]) {
                categories[entity.category] = {
                    count: 0,
                    types: {},
                    entities: []
                };
            }

            categories[entity.category].count++;

            if (!categories[entity.category].types[entity.type]) {
                categories[entity.category].types[entity.type] = 0;
            }
            categories[entity.category].types[entity.type]++;

            categories[entity.category].entities.push({
                id: entity.id,
                name: entity.name,
                type: entity.type
            });
        });

        return categories;
    }

    /**
     * Generate statistics by element
     */
    generateByElement(entities) {
        const elements = {};

        entities.forEach(entity => {
            const element = entity.element || entity.metaphysicalProperties?.primaryElement;
            if (!element) return;

            if (!elements[element]) {
                elements[element] = {
                    count: 0,
                    types: {},
                    mythologies: {}
                };
            }

            elements[element].count++;

            // By type
            if (!elements[element].types[entity.type]) {
                elements[element].types[entity.type] = 0;
            }
            elements[element].types[entity.type]++;

            // By mythology
            if (entity.mythologies) {
                entity.mythologies.forEach(myth => {
                    if (!elements[element].mythologies[myth]) {
                        elements[element].mythologies[myth] = 0;
                    }
                    elements[element].mythologies[myth]++;
                });
            }
        });

        return elements;
    }

    /**
     * Generate statistics by Sefirot
     */
    generateBySefirot(entities) {
        const sefirot = {};

        entities.forEach(entity => {
            const entitySefirot = entity.sefirot || entity.metaphysicalProperties?.sefirot;
            if (!entitySefirot || !Array.isArray(entitySefirot)) return;

            entitySefirot.forEach(sefirah => {
                if (!sefirot[sefirah]) {
                    sefirot[sefirah] = {
                        count: 0,
                        entities: []
                    };
                }

                sefirot[sefirah].count++;
                sefirot[sefirah].entities.push({
                    id: entity.id,
                    name: entity.name,
                    type: entity.type
                });
            });
        });

        return sefirot;
    }

    /**
     * Generate statistics by archetype
     */
    generateByArchetype(entities) {
        const archetypes = {};

        entities.forEach(entity => {
            if (!entity.archetypes || !Array.isArray(entity.archetypes)) return;

            entity.archetypes.forEach(arch => {
                const category = arch.category || arch.id;
                if (!category) return;

                if (!archetypes[category]) {
                    archetypes[category] = {
                        count: 0,
                        avgScore: [],
                        entities: []
                    };
                }

                archetypes[category].count++;

                if (arch.score) {
                    archetypes[category].avgScore.push(arch.score);
                }

                archetypes[category].entities.push({
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    score: arch.score
                });
            });
        });

        // Calculate average scores
        Object.keys(archetypes).forEach(category => {
            archetypes[category].avgScore = this.average(archetypes[category].avgScore);
            // Sort entities by score
            archetypes[category].entities.sort((a, b) => (b.score || 0) - (a.score || 0));
        });

        return archetypes;
    }

    /**
     * Generate metadata completeness statistics
     */
    generateCompleteness(entities) {
        const fields = [
            'shortDescription',
            'fullDescription',
            'longDescription',
            'linguistic',
            'geographical',
            'temporal',
            'cultural',
            'metaphysicalProperties',
            'colors',
            'archetypes',
            'relatedEntities',
            'sources'
        ];

        const completeness = {
            byField: {},
            distribution: {
                '0-25%': 0,
                '26-50%': 0,
                '51-75%': 0,
                '76-100%': 0
            },
            avgCompleteness: 0
        };

        // Count presence of each field
        fields.forEach(field => {
            completeness.byField[field] = {
                count: 0,
                percentage: 0
            };
        });

        const completenessScores = [];

        entities.forEach(entity => {
            let presentFields = 0;

            fields.forEach(field => {
                if (entity[field]) {
                    completeness.byField[field].count++;
                    presentFields++;
                }
            });

            const score = (presentFields / fields.length) * 100;
            completenessScores.push(score);

            // Distribution
            if (score <= 25) {
                completeness.distribution['0-25%']++;
            } else if (score <= 50) {
                completeness.distribution['26-50%']++;
            } else if (score <= 75) {
                completeness.distribution['51-75%']++;
            } else {
                completeness.distribution['76-100%']++;
            }
        });

        // Calculate percentages
        fields.forEach(field => {
            completeness.byField[field].percentage = Math.round(
                (completeness.byField[field].count / entities.length) * 100
            );
        });

        completeness.avgCompleteness = Math.round(this.average(completenessScores));

        return completeness;
    }

    /**
     * Generate connectivity statistics
     */
    generateConnectivity(entities) {
        const connectivity = {
            totalConnections: 0,
            avgConnectionsPerEntity: 0,
            mostConnected: [],
            leastConnected: [],
            isolatedEntities: 0,
            connectionsByType: {}
        };

        const connectionCounts = [];

        entities.forEach(entity => {
            if (!entity.relatedCount) {
                connectionCounts.push(0);
                connectivity.isolatedEntities++;
                return;
            }

            const total = Object.values(entity.relatedCount).reduce((sum, n) => sum + n, 0);
            connectionCounts.push(total);
            connectivity.totalConnections += total;

            // Track by type
            Object.entries(entity.relatedCount).forEach(([type, count]) => {
                if (!connectivity.connectionsByType[type]) {
                    connectivity.connectionsByType[type] = 0;
                }
                connectivity.connectionsByType[type] += count;
            });
        });

        connectivity.avgConnectionsPerEntity = this.average(connectionCounts);

        // Most connected
        const sorted = [...entities].sort((a, b) => {
            const aTotal = Object.values(a.relatedCount || {}).reduce((sum, n) => sum + n, 0);
            const bTotal = Object.values(b.relatedCount || {}).reduce((sum, n) => sum + n, 0);
            return bTotal - aTotal;
        });

        connectivity.mostConnected = sorted.slice(0, 10).map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            connections: Object.values(e.relatedCount || {}).reduce((sum, n) => sum + n, 0)
        }));

        connectivity.leastConnected = sorted.slice(-10).reverse().map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            connections: Object.values(e.relatedCount || {}).reduce((sum, n) => sum + n, 0)
        }));

        return connectivity;
    }

    /**
     * Generate temporal coverage statistics
     */
    generateTemporal(entities) {
        const temporal = {
            withTemporalData: 0,
            withFirstAttestation: 0,
            withHistoricalDate: 0,
            byCulturalPeriod: {},
            timeline: []
        };

        entities.forEach(entity => {
            if (entity.temporal) {
                temporal.withTemporalData++;

                if (entity.temporal.firstAttestation) {
                    temporal.withFirstAttestation++;

                    // Add to timeline
                    temporal.timeline.push({
                        id: entity.id,
                        name: entity.name,
                        type: entity.type,
                        date: entity.temporal.firstAttestation.date,
                        display: entity.temporal.firstAttestation.date?.display
                    });
                }

                if (entity.temporal.historicalDate) {
                    temporal.withHistoricalDate++;
                }

                if (entity.temporal.culturalPeriod) {
                    const period = entity.temporal.culturalPeriod;
                    if (!temporal.byCulturalPeriod[period]) {
                        temporal.byCulturalPeriod[period] = [];
                    }
                    temporal.byCulturalPeriod[period].push({
                        id: entity.id,
                        name: entity.name,
                        type: entity.type
                    });
                }
            }
        });

        // Sort timeline by year
        temporal.timeline.sort((a, b) => {
            const aYear = a.date?.year || 0;
            const bYear = b.date?.year || 0;
            return aYear - bYear;
        });

        return temporal;
    }

    /**
     * Generate geographical coverage statistics
     */
    generateGeographical(entities) {
        const geographical = {
            withGeographicalData: 0,
            withCoordinates: 0,
            byRegion: {},
            byModernCountry: {},
            entitiesWithLocation: []
        };

        entities.forEach(entity => {
            if (entity.geographical) {
                geographical.withGeographicalData++;

                // Check for coordinates
                const hasCoords = entity.geographical.primaryLocation?.coordinates ||
                    entity.geographical.originPoint?.coordinates;

                if (hasCoords) {
                    geographical.withCoordinates++;

                    const coords = entity.geographical.primaryLocation?.coordinates ||
                        entity.geographical.originPoint?.coordinates;

                    geographical.entitiesWithLocation.push({
                        id: entity.id,
                        name: entity.name,
                        type: entity.type,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        accuracy: coords.accuracy
                    });
                }

                // By region
                if (entity.geographical.region) {
                    const region = entity.geographical.region;
                    if (!geographical.byRegion[region]) {
                        geographical.byRegion[region] = [];
                    }
                    geographical.byRegion[region].push({
                        id: entity.id,
                        name: entity.name,
                        type: entity.type
                    });
                }

                // By modern country
                if (entity.geographical.modernCountries) {
                    entity.geographical.modernCountries.forEach(country => {
                        if (!geographical.byModernCountry[country]) {
                            geographical.byModernCountry[country] = [];
                        }
                        geographical.byModernCountry[country].push({
                            id: entity.id,
                            name: entity.name,
                            type: entity.type
                        });
                    });
                }
            }
        });

        return geographical;
    }

    /**
     * Generate top entities in various categories
     */
    generateTopEntities(entities) {
        return {
            mostTags: this.getTopByProperty(entities, e => e.tags?.length || 0, 10),
            mostMythologies: this.getTopByProperty(entities, e => e.mythologies?.length || 0, 10),
            mostSources: this.getTopByProperty(entities, e => e.sources?.length || 0, 10),
            mostArchetypes: this.getTopByProperty(entities, e => e.archetypes?.length || 0, 10)
        };
    }

    /**
     * Helper: Get top entities by a property
     */
    getTopByProperty(entities, propertyFn, limit) {
        return [...entities]
            .map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                value: propertyFn(e)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }

    /**
     * Helper: Calculate average
     */
    average(numbers) {
        if (numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        return Math.round((sum / numbers.length) * 100) / 100;
    }

    /**
     * Save statistics to file
     */
    async save(outputPath) {
        if (!this.stats) {
            throw new Error('No statistics generated. Call generate() first.');
        }

        await fs.writeFile(
            outputPath,
            JSON.stringify(this.stats, null, 2),
            'utf-8'
        );
    }

    /**
     * Generate HTML dashboard
     */
    generateHTML() {
        if (!this.stats) {
            throw new Error('No statistics generated. Call generate() first.');
        }

        const s = this.stats;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entity System Statistics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: rgba(255,255,255,0.95);
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header .meta {
            color: #666;
            font-size: 0.9rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: rgba(255,255,255,0.95);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .stat-card h2 {
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: #667eea;
        }
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #764ba2;
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        .progress-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s;
        }
        .list-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .list-item:last-child {
            border-bottom: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Entity System Statistics</h1>
            <div class="meta">
                Generated: ${new Date(s.generated).toLocaleString()} |
                Version: ${s.version}
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${s.overview.totalEntities}</div>
                <div class="stat-label">Total Entities</div>
            </div>

            <div class="stat-card">
                <div class="stat-value">${s.completeness.avgCompleteness}%</div>
                <div class="stat-label">Avg Metadata Completeness</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${s.completeness.avgCompleteness}%"></div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-value">${s.connectivity.avgConnectionsPerEntity.toFixed(1)}</div>
                <div class="stat-label">Avg Connections Per Entity</div>
            </div>

            <div class="stat-card">
                <div class="stat-value">${s.overview.crossMythologyEntities}</div>
                <div class="stat-label">Cross-Mythology Entities</div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h2>By Type</h2>
                ${Object.entries(s.byType).map(([type, data]) => `
                    <div class="list-item">
                        <span>${type}</span>
                        <strong>${data.count}</strong>
                    </div>
                `).join('')}
            </div>

            <div class="stat-card">
                <h2>By Mythology (Top 10)</h2>
                ${Object.entries(s.byMythology).slice(0, 10).map(([myth, data]) => `
                    <div class="list-item">
                        <span>${myth}</span>
                        <strong>${data.count}</strong>
                    </div>
                `).join('')}
            </div>

            <div class="stat-card">
                <h2>Most Connected Entities</h2>
                ${s.connectivity.mostConnected.slice(0, 10).map(e => `
                    <div class="list-item">
                        <span>${e.name} (${e.type})</span>
                        <strong>${e.connections}</strong>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="stat-card" style="margin-top: 1.5rem;">
            <h2>Completeness Distribution</h2>
            ${Object.entries(s.completeness.distribution).map(([range, count]) => `
                <div class="list-item">
                    <span>${range} complete</span>
                    <strong>${count} entities</strong>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Save HTML dashboard
     */
    async saveHTML(outputPath) {
        const html = this.generateHTML();
        await fs.writeFile(outputPath, html, 'utf-8');
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityStatsGenerator;
}
