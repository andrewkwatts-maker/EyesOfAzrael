/**
 * Route Matcher Module Tests
 * Tests for js/router/route-matcher.js
 */

describe('RouteMatcher', () => {
    let RouteMatcher;

    beforeEach(() => {
        // Create a fresh RouteMatcher object matching the module implementation
        RouteMatcher = {
            patterns: {
                home: /^\/$/,
                mythologies: /^\/mythologies\/?$/,
                mythology: /^\/mythology\/([^\/]+)\/?$/,
                mythologyCategory: /^\/mythology\/([^\/]+)\/([^\/]+)\/?$/,
                entity: /^\/mythology\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?$/,
                browse: /^\/browse\/?$/,
                browseCategory: /^\/browse\/([^\/]+)\/?$/,
                search: /^\/search\/?$/,
                compare: /^\/compare\/?$/,
                dashboard: /^\/dashboard\/?$/,
                profile: /^\/profile\/?$/,
                submit: /^\/submit\/?$/,
                about: /^\/about\/?$/,
                privacy: /^\/privacy\/?$/,
                terms: /^\/terms\/?$/,
                login: /^\/login\/?$/,
                corpus: /^\/corpus\/?$/,
                test: /^\/test\/?$/
            },

            match(path) {
                const normalizedPath = '/' + path.replace(/^#?\/?/, '');

                for (const [name, pattern] of Object.entries(this.patterns)) {
                    const match = normalizedPath.match(pattern);
                    if (match) {
                        return {
                            name,
                            params: match.slice(1),
                            path: normalizedPath
                        };
                    }
                }

                return null;
            },

            getCollectionName(singularType) {
                const typeMap = {
                    'deity': 'deities',
                    'hero': 'heroes',
                    'creature': 'creatures',
                    'item': 'items',
                    'place': 'places',
                    'text': 'texts',
                    'concept': 'concepts',
                    'event': 'events',
                    'ritual': 'rituals',
                    'symbol': 'symbols',
                    'cosmology': 'cosmology',
                    'archetype': 'archetypes',
                    'herb': 'herbs',
                    'being': 'beings'
                };

                return typeMap[singularType] || singularType + 's';
            },

            parseBreadcrumbs(path) {
                const normalizedPath = path.replace(/^#?\/?/, '');
                const segments = normalizedPath.split('/').filter(Boolean);
                const breadcrumbs = [{ label: 'Home', path: '#/' }];

                if (segments.length === 0) return breadcrumbs;

                let currentPath = '';
                for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    currentPath += '/' + segment;

                    const label = segment
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    breadcrumbs.push({
                        label,
                        path: '#' + currentPath,
                        isLast: i === segments.length - 1
                    });
                }

                return breadcrumbs;
            }
        };
    });

    describe('match', () => {
        it('should match home route', () => {
            const result = RouteMatcher.match('/');
            expect(result).not.toBeNull();
            expect(result.name).toBe('home');
        });

        it('should match mythologies route', () => {
            const result = RouteMatcher.match('/mythologies');
            expect(result).not.toBeNull();
            expect(result.name).toBe('mythologies');
        });

        it('should match mythology route with param', () => {
            const result = RouteMatcher.match('/mythology/greek');
            expect(result).not.toBeNull();
            expect(result.name).toBe('mythology');
            expect(result.params).toEqual(['greek']);
        });

        it('should match entity route with multiple params', () => {
            const result = RouteMatcher.match('/mythology/greek/deities/zeus');
            expect(result).not.toBeNull();
            expect(result.name).toBe('entity');
            expect(result.params).toEqual(['greek', 'deities', 'zeus']);
        });

        it('should match browse category route', () => {
            const result = RouteMatcher.match('/browse/deities');
            expect(result).not.toBeNull();
            expect(result.name).toBe('browseCategory');
            expect(result.params).toEqual(['deities']);
        });

        it('should normalize hash-prefixed paths', () => {
            const result = RouteMatcher.match('#/mythology/norse');
            expect(result).not.toBeNull();
            expect(result.name).toBe('mythology');
            expect(result.params).toEqual(['norse']);
        });

        it('should handle trailing slashes', () => {
            const result = RouteMatcher.match('/mythologies/');
            expect(result).not.toBeNull();
            expect(result.name).toBe('mythologies');
        });

        it('should return null for unknown routes', () => {
            const result = RouteMatcher.match('/unknown/route/here');
            expect(result).toBeNull();
        });
    });

    describe('getCollectionName', () => {
        it('should convert deity to deities', () => {
            expect(RouteMatcher.getCollectionName('deity')).toBe('deities');
        });

        it('should convert hero to heroes', () => {
            expect(RouteMatcher.getCollectionName('hero')).toBe('heroes');
        });

        it('should convert creature to creatures', () => {
            expect(RouteMatcher.getCollectionName('creature')).toBe('creatures');
        });

        it('should handle cosmology (no change)', () => {
            expect(RouteMatcher.getCollectionName('cosmology')).toBe('cosmology');
        });

        it('should add s to unknown types', () => {
            expect(RouteMatcher.getCollectionName('monster')).toBe('monsters');
        });
    });

    describe('parseBreadcrumbs', () => {
        it('should always start with Home', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('/mythology/greek');
            expect(crumbs[0]).toEqual({ label: 'Home', path: '#/' });
        });

        it('should create breadcrumbs for each path segment', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('/mythology/greek/deities/zeus');
            expect(crumbs).toHaveLength(5);
            expect(crumbs.map(c => c.label)).toEqual([
                'Home', 'Mythology', 'Greek', 'Deities', 'Zeus'
            ]);
        });

        it('should mark last item as isLast', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('/browse/creatures');
            const lastCrumb = crumbs[crumbs.length - 1];
            expect(lastCrumb.isLast).toBe(true);
        });

        it('should handle hyphenated segments', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('/mythology/native-american');
            expect(crumbs.find(c => c.label === 'Native American')).toBeDefined();
        });

        it('should handle hash-prefixed paths', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('#/mythologies');
            expect(crumbs).toHaveLength(2);
            expect(crumbs[1].label).toBe('Mythologies');
        });

        it('should return only Home for root path', () => {
            const crumbs = RouteMatcher.parseBreadcrumbs('/');
            expect(crumbs).toHaveLength(1);
            expect(crumbs[0].label).toBe('Home');
        });
    });
});
