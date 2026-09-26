/**
 * TimelineDisplay — chronology for entities that have one
 *
 * The component reads entity.temporal, a field 76 of 13,585 entities carry.
 * The corpus keeps its chronology in entity.timeline: an array of
 * { date, event }, on 4,965 entities and holding 17,243 events. Nothing read
 * it, so the richest field in the data contributed nothing and almost every
 * entity produced "No timeline data available" — on a component that, in any
 * case, nothing ever constructed.
 *
 * Its dates are prose rather than structured values, and the old parser took
 * the first run of digits, which misreads the common forms in ways that
 * reorder the timeline. These tests pin the orderings that matters.
 */

require('../../js/components/timeline-display.js');

const makeTimeline = () => new window.TimelineDisplay();

/** Event titles in the order they were rendered. */
const renderedTitles = (html) =>
    [...html.matchAll(/timeline__event-title">([^<]*)</g)].map((m) => m[1]);

describe('TimelineDisplay.parseYearString', () => {
    let t;
    beforeEach(() => { t = makeTimeline(); });

    test('a plain year is itself — 39% of the corpus dates', () => {
        expect(t.getYear('1947')).toBe(1947);
    });

    test('BCE is negative, so it sorts before the common era', () => {
        // "c. 3000 BCE" read as +3000 put the oldest events after the 20th
        // century, which is the worst of the misreadings.
        expect(t.getYear('c. 3000 BCE')).toBe(-3000);
        expect(t.getYear('~2450 BCE')).toBe(-2450);
        expect(t.getYear('c. 360 BC')).toBe(-360);
    });

    test('"Present" is now, not year zero', () => {
        const year = new Date().getFullYear();
        expect(t.getYear('Present')).toBe(year);
        expect(t.getYear('today')).toBe(year);
        expect(t.getYear('Ongoing')).toBe(year);
    });

    test('a century becomes a year inside that century, not the ordinal', () => {
        // "Early 20th Century" read as year 20 sorted it among antiquity.
        expect(t.getYear('20th Century')).toBe(1950);
        expect(t.getYear('Early 20th Century')).toBe(1910);
        expect(t.getYear('Late 20th Century')).toBe(1990);
        expect(t.getYear('1st Century AD')).toBe(50);
    });

    test('a century range takes its first century', () => {
        expect(t.getYear('1st-3rd Century CE')).toBe(50);
    });

    test('a BCE century is negative', () => {
        expect(t.getYear('late 4th century BCE')).toBe(-390);
    });

    test('a full date yields its year, not its day', () => {
        // "April 20, 2010" read as year 20 under first-digits parsing.
        expect(t.getYear('April 20, 2010')).toBe(2010);
    });

    test('a decade yields the start of the decade', () => {
        expect(t.getYear('1980s')).toBe(1980);
        expect(t.getYear('1950s-1970s')).toBe(1950);
    });

    test('a year range yields its start', () => {
        expect(t.getYear('2006-2011')).toBe(2006);
    });

    test('a string with no year is 0, the established "no year" signal', () => {
        expect(t.getYear('Various')).toBe(0);
        expect(t.getYear('')).toBe(0);
    });

    test('numbers and structured dates still work', () => {
        expect(t.getYear(1947)).toBe(1947);
        expect(t.getYear({ year: -800 })).toBe(-800);
        expect(t.getYear({ start: { year: 1200 } })).toBe(1200);
        expect(t.getYear(null)).toBe(0);
    });
});

describe('TimelineDisplay.sortEvents', () => {
    let t;
    beforeEach(() => { t = makeTimeline(); });

    test('orders BCE before CE', () => {
        const out = t.sortEvents([
            { date: '1947', title: 'modern' },
            { date: 'c. 3000 BCE', title: 'ancient' }
        ]);
        expect(out.map((e) => e.title)).toEqual(['ancient', 'modern']);
    });

    test('puts "Present" last', () => {
        const out = t.sortEvents([
            { date: 'Present', title: 'now' },
            { date: '1947', title: 'then' }
        ]);
        expect(out.map((e) => e.title)).toEqual(['then', 'now']);
    });

    test('puts an undated event after the dated ones', () => {
        // At year 0 it landed in the middle of the BCE entries.
        const out = t.sortEvents([
            { date: 'Various', title: 'undated' },
            { date: 'c. 500 BCE', title: 'ancient' },
            { date: '1900', title: 'modern' }
        ]);
        expect(out.map((e) => e.title)).toEqual(['ancient', 'modern', 'undated']);
    });
});

describe('TimelineDisplay.render with entity.timeline', () => {
    let t;
    beforeEach(() => { t = makeTimeline(); });

    test('builds a timeline from the field the corpus actually uses', () => {
        const html = t.render({
            timeline: [
                { date: '1947', event: 'The Roswell incident' },
                { date: '2000', event: 'Publication of the book' }
            ]
        });
        expect(html).not.toContain('No timeline data');
        expect(html).toContain('data-event-count="2"');
        expect(html).toContain('The Roswell incident');
    });

    test('maps the stored `event` key onto the rendered title', () => {
        const html = t.render({ timeline: [{ date: '1947', event: 'Roswell' }] });
        expect(html).toContain('timeline__event-title">Roswell<');
    });

    test('renders events in chronological order regardless of stored order', () => {
        const html = t.render({
            timeline: [
                { date: 'Present', event: 'still going' },
                { date: 'c. 3000 BCE', event: 'the beginning' },
                { date: '1947', event: 'the middle' }
            ]
        });
        expect(renderedTitles(html)).toEqual(['the beginning', 'the middle', 'still going']);
    });

    test('escapes event text rather than emitting it as markup', () => {
        const html = t.render({ timeline: [{ date: '1947', event: '<img src=x onerror=alert(1)>' }] });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    test('skips entries with no event text instead of rendering blank rows', () => {
        const html = t.render({
            timeline: [{ date: '1947', event: 'real' }, { date: '1948' }, null]
        });
        expect(html).toContain('data-event-count="1"');
    });

    test('still reports the empty state when the entity has no chronology', () => {
        expect(t.render({ name: 'Zeus' })).toContain('No timeline data');
    });

    test('a timeline field that is not an array is ignored, not fatal', () => {
        expect(() => t.render({ timeline: 'sometime' })).not.toThrow();
    });

    test('combines entity.timeline with temporal events', () => {
        const html = t.render({
            timeline: [{ date: '1947', event: 'from timeline' }],
            temporal: { firstAttestation: { date: '800', source: 'Homer' } }
        });
        expect(html).toContain('data-event-count="2"');
        expect(html).toContain('from timeline');
        expect(html).toContain('First Attestation');
    });
});

describe('TimelineDisplay.render with temporal.historicalDate', () => {
    let t;
    beforeEach(() => { t = makeTimeline(); });

    test('plots the attested span, which every temporal entity carries', () => {
        // historicalDate is on all 76 entities that have `temporal`, and was
        // the only one of its fields nothing read.
        const html = t.render({
            temporal: {
                historicalDate: {
                    start: { year: -1000, display: 'c. 1000 BCE' },
                    end: { year: 70, display: '70 CE' },
                    display: '1000 BCE - 70 CE'
                }
            }
        });
        expect(html).not.toContain('No timeline data');
        expect(html).toContain('data-event-count="2"');
        expect(renderedTitles(html)).toEqual(['Earliest attested use', 'Latest attested use']);
    });

    test('a start with no end still plots', () => {
        const html = t.render({
            temporal: { historicalDate: { start: { year: 600 } } }
        });
        expect(html).toContain('data-event-count="1"');
    });

    test('uses a string timelinePosition as the era label', () => {
        // The corpus stores timelinePosition as prose, not as the object with
        // keyMoments that the other branch looks for.
        const html = t.render({
            timeline: [{ date: '700', event: 'composed' }],
            temporal: { timelinePosition: 'Medieval/Classical' }
        });
        expect(html).toContain('Medieval/Classical');
    });

    test('culturalPeriod still wins over timelinePosition', () => {
        const html = t.render({
            timeline: [{ date: '700', event: 'composed' }],
            temporal: {
                culturalPeriod: 'Medieval Tantric Period',
                timelinePosition: 'Medieval/Classical'
            }
        });
        expect(html).toContain('Medieval Tantric Period');
    });
});
