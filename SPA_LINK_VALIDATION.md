# SPA Link Validation Report

**Generated:** 2026-04-26T00:14:23.334Z

**Total SPA Links:** 71

**Unique URLs:** 71


## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ OK | 20 | 28.2% |
| ❌ Broken | 51 | 71.8% |
| ⚠️ Warnings | 0 | 0.0% |


## Broken Links


### MISSING ROUTE (17)

| URL | Sources | Fix |
|-----|---------|-----|
| `#/favorites` | docs\api\auth-guard-simple.js.html | Add route pattern to spa-navigation.js |
| `#/settings` | docs\api\auth-guard-simple.js.html, docs\api\header-nav.js.html | Add route pattern to spa-navigation.js |
| `#/corpus-explorer` | docs\api\components_asset-corpus-search.js.html | Add route pattern to spa-navigation.js |
| `#/${r.mythology || ` | docs\api\components_asset-corpus-search.js.html | Add route pattern to spa-navigation.js |
| `#/archetypes/${this.escapeHtml(archetypeId)}` | docs\api\components_entity-detail-viewer.js.html | Add route pattern to spa-navigation.js |
| `#/${entityType}/${id}` | docs\api\components_hero-renderer.js.html | Add route pattern to spa-navigation.js |
| `#/notifications` | docs\api\components_notification-center.js.html | Add route pattern to spa-navigation.js |
| `#/settings/notifications` | docs\api\components_notification-center.js.html | Add route pattern to spa-navigation.js |
| `#/${this.escapeAttr(entityRef)}` | docs\api\components_universal-display-renderer.js.html | Add route pattern to spa-navigation.js |
| `#\/` | docs\api\fix-syntax.js.html | Add route pattern to spa-navigation.js |
| `#/profile` | docs\api\header-nav.js.html | Add route pattern to spa-navigation.js |
| `#/mythology/` | docs\api\spa-navigation.js.html | Add route pattern to spa-navigation.js |
| `#/mythologies/${mythology}` | docs\api\views_entity-detail-view.js.html | Add route pattern to spa-navigation.js |
| `#/mythologies/norse` | docs\api\views_landing-page-view.js.html | Add route pattern to spa-navigation.js |
| `#/search?sort=newest` | docs\api\views_landing-page-view.js.html | Add route pattern to spa-navigation.js |
| `#/signup` | docs\api\views_landing-page-view.js.html | Add route pattern to spa-navigation.js |
| `#/search?mode=corpus` | index.html | Add route pattern to spa-navigation.js |

### INVALID CATEGORY (9)

| URL | Sources | Fix |
|-----|---------|-----|
| `#/browse/${entityType}` | docs\api\components_category-landing-view.js.html, docs\api\components_category-landing-view.js.html (+3) | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/${type}s` | docs\api\entity-loader.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/${entityType}?related=${currentEntityId || ` | docs\api\page-asset-renderer.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/${type}/${mythologyId}` | docs\api\spa-navigation.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/${this.category}` | docs\api\views_browse-category-view.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/deities?q=zeus` | docs\api\views_landing-page-view.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/creatures?q=dragon` | docs\api\views_landing-page-view.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/heroes?q=hercules` | docs\api\views_landing-page-view.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |
| `#/browse/items?q=excalibur` | docs\api\views_landing-page-view.js.html | Valid categories: deities, heroes, creatures, texts, rituals, herbs, cosmology, magic, items, places, symbols, archetypes |

### INVALID MYTHOLOGY (17)

| URL | Sources | Fix |
|-----|---------|-----|
| `#/mythology/${mythology}/${entityType}/${entity.id}` | docs\api\components_category-landing-view.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology.name}/${this.pluralize(entityType)}` | docs\api\components_category-landing-view.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}` | docs\api\components_entity-detail-viewer.js.html, docs\api\components_entity-type-browser.js.html (+1) | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}/${entityType}` | docs\api\components_entity-detail-viewer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}/${routeType}` | docs\api\components_entity-detail-viewer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${entity.mythology || mythology}/${entityRouteType}/${entity.id}` | docs\api\components_entity-detail-viewer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${entity.mythology || mythology}/${cat.singular}/${entity.id}` | docs\api\components_entity-detail-viewer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology.id}` | docs\api\components_mythology-browser.js.html, docs\api\components_mythology-browser.js.html (+2) | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythId}/${section.plural}` | docs\api\components_mythology-overview.js.html, docs\api\components_mythology-overview.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${this.mythology}/place/${place.id}` | docs\api\components_schema-section-renderer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${this.mythology}/item/${item.id}` | docs\api\components_schema-section-renderer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}/${entityType}/${entityId}` | docs\api\components_search-view-complete.js.html, docs\api\components_search-view-complete.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${this.escapeAttr(entity.mythology)}/${entityType}/${entityId}` | docs\api\components_universal-display-renderer.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${myth.id}` | docs\api\spa-navigation.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}/${category}/${entity.id}` | docs\api\spa-navigation.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/mythology/${mythology}/${categoryType}` | docs\api\spa-navigation.js.html, docs\api\spa-navigation.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |
| `#/entity/${this.category}/${entity.mythology}/${entity.id}` | docs\api\views_browse-category-view.js.html | Valid mythologies: greek, norse, egyptian, hindu, chinese, japanese, celtic, babylonian, sumerian, persian, roman, aztec, mayan, buddhist, christian, jewish, islamic, yoruba, native_american, apocryphal |

### INVALID FORMAT (8)

| URL | Sources | Fix |
|-----|---------|-----|
| `#/entity/archetypes/${this.escapeHtml(archetypeId)}` | docs\api\components_comprehensive-metadata-renderer.js.html | N/A |
| `#/entity/${this.escapeHtml(linkCollection)}/${this.slugify(name)}` | docs\api\components_schema-section-renderer.js.html | N/A |
| `#/entity/deities/${deity.id || this.slugify(deity.name)}` | docs\api\components_schema-section-renderer.js.html | N/A |
| `#/entity/${note.entityCollection}/${note.entityId}` | docs\api\views_user-profile-view.js.html | N/A |
| `#/entity/${entity.collection || entity.type}/${doc.id}` | docs\api\views_user-profile-view.js.html | N/A |
| `#/entity/${perspective.entityCollection}/${perspective.entityId}?perspective=${this.userId}` | docs\api\views_user-profile-view.js.html | N/A |
| `#/entity/${rel.fromEntityCollection}/${rel.fromEntityId}` | docs\api\views_user-profile-view.js.html | N/A |
| `#/entity/${rel.toEntityCollection}/${rel.toEntityId}` | docs\api\views_user-profile-view.js.html | N/A |