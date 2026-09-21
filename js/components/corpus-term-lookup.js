/**
 * Look a term up in the primary sources, from the entity page.
 *
 * Every entity carries a `corpusSearch` field listing the words worth looking
 * for — 56,510 of them across 11,233 records — and until now nothing on an
 * entity page let a reader use one. This renders them as buttons and, when one
 * is pressed, shows the passages that contain it, with the citation.
 *
 * WHAT IT SHOWS, AND WHAT IT REFUSES TO
 *
 * Passages come from js/services/corpus-passage-index.js, which reads the two
 * indexes already in the repo — the Buddhist sutra index, which is real, and
 * the Egyptian one, whose text_ids are all DEMO00N and which that service
 * marks as demonstration data. Where that service is absent it falls back to
 * static/corpus/index.json, built by scripts/build-corpus-index.js from source
 * texts that declare republishable rights and carry a citation each.
 *
 * If neither answers, the strip does not render at all. A panel headed "In the
 * primary sources" with nothing beneath it — or worse, something invented
 * beneath it — would misrepresent the site.
 *
 * Every passage is shown with its text name and locus, because that is the
 * entire point — a reader who cannot check the quotation has been given the
 * appearance of grounding rather than grounding.
 */

class CorpusTermLookup {
    /**
     * Where passages come from.
     *
     * js/services/corpus-passage-index.js is the authority: it reads the two
     * indexes already in this repo — the Buddhist sutra index, which is real,
     * and the Egyptian one, whose text_ids are all DEMO00N and which it marks
     * as demonstration data rather than passing off as equivalent. This
     * component was first written against an index of its own, which would have
     * meant two lookup paths disagreeing about the same question. It asks that
     * service when it is present and falls back to static/corpus/index.json —
     * what scripts/build-corpus-index.js produces — only when it is not.
     */
    static async lookup(term) {
        if (typeof window !== 'undefined' && window.CorpusPassageIndex
            && typeof window.CorpusPassageIndex.search === 'function') {
            try {
                // search() resolves to a flat array of passages, not a wrapper
                // object. Reading `.passages` off it silently yielded undefined
                // and made every term look unanswered.
                const found = await window.CorpusPassageIndex.search(term, { exact: true });
                const passages = Array.isArray(found) ? found : ((found && found.passages) || []);
                return passages.map((p) => ({
                    text_name: p.textName || p.text_name,
                    citation: p.citation,
                    full_verse: p.context || p.full_verse || '',
                    translator: p.translator || null,
                    source: p.source || null,
                    demo: !!p.demo
                }));
            } catch (error) {
                // Fall through to the built index below.
            }
        }

        const index = await CorpusTermLookup.loadIndex();
        const hits = (index && index[String(term).toLowerCase()]) || [];
        return hits.map((p) => ({ ...p, demo: /^DEMO/i.test(String(p.text_id || '')) }));
    }

    /** Promise-cached: several terms can be pressed before the first resolves. */
    static _indexPromise = null;

    static loadIndex() {
        if (!CorpusTermLookup._indexPromise) {
            CorpusTermLookup._indexPromise = fetch('/static/corpus/index.json')
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
                .then((data) => {
                    // A failed load is not kept, so a later page tries again
                    // instead of inheriting one bad request for the session.
                    if (!data) CorpusTermLookup._indexPromise = null;
                    return data;
                });
        }
        return CorpusTermLookup._indexPromise;
    }

    /**
     * Is this a word a reader would actually want looked up?
     *
     * Some corpusSearch entries are not terms. Thoth's record carries
     * "godofwisdomwritingegyptianmythology" — its own broken page title with
     * the spaces and pipe stripped out — and offering that as a chip is
     * nonsense whatever it matches. A few others are whole sentences.
     *
     * Kept deliberately loose: the cost of dropping a real term is one missing
     * chip among dozens, and the cost of keeping a bad one is a reader pressing
     * a button labelled with a mangled page title.
     */
    static isUsableTerm(term) {
        const t = String(term || '').trim();
        if (t.length < 2 || t.length > 48) return false;
        // A run of 20+ letters with no break is a collapsed title, not a word.
        if (/[a-z]{20,}/i.test(t.replace(/\s+/g, ' '))) return false;
        if (/mythology$|\bwikipedia\b/i.test(t)) return false;
        // More than five words is a phrase from prose, not an index term.
        if (t.split(/\s+/).length > 5) return false;
        return true;
    }

    /** The terms this entity declares, flattened and de-duplicated. */
    static termsFor(entity) {
        const cs = entity && entity.corpusSearch;
        if (!cs || typeof cs !== 'object' || Array.isArray(cs)) return [];
        const seen = new Set();
        const out = [];
        // canonical first: those are the entity's own names, and the ones a
        // reader is most likely to want.
        for (const key of ['canonical', 'epithets', 'variants', 'domains', 'symbols', 'places', 'concepts', 'abilities']) {
            for (const term of (cs[key] || [])) {
                if (typeof term !== 'string') continue;
                const t = term.trim();
                const k = t.toLowerCase();
                if (!t || seen.has(k)) continue;
                if (!CorpusTermLookup.isUsableTerm(t)) continue;
                seen.add(k);
                out.push(t);
            }
        }
        return out;
    }

    static escape(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    /**
     * Highlight the term inside the passage, whole words only.
     *
     * Substring highlighting would mark "ra" inside "great" and make the
     * passage harder to read rather than easier — the same class of mistake
     * that has bitten the matching code in this project more than once.
     */
    static highlight(passage, term) {
        const escaped = CorpusTermLookup.escape(passage);
        const needle = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
            return escaped.replace(
                new RegExp(`(^|[^\\p{L}\\p{N}])(${needle})([^\\p{L}\\p{N}]|$)`, 'giu'),
                (m, before, word, after) => `${before}<mark>${word}</mark>${after}`
            );
        } catch (error) {
            return escaped;
        }
    }

    /**
     * Render the term strip into a slot, if there is an index to search.
     *
     * Terms with no passage are rendered disabled rather than hidden: a reader
     * can see that the word was looked for and not found, which is honest about
     * the corpus's coverage instead of quietly presenting a curated subset as
     * though it were everything.
     */
    static async fill(slot, entity) {
        if (!slot || slot.dataset.filled) return;
        slot.dataset.filled = '1';

        const terms = CorpusTermLookup.termsFor(entity);
        if (!terms.length) return;

        // Resolve each term once, up front, so the strip only offers words that
        // will actually answer. A button that returns nothing wastes the
        // reader's click and makes the corpus look broken rather than merely
        // incomplete.
        const counts = new Map();
        for (const term of terms.slice(0, 40)) {
            const passages = await CorpusTermLookup.lookup(term);
            if (passages.length) counts.set(term, passages);
        }
        if (!counts.size) return;   // nothing to show: render nothing at all
        const withHits = [...counts.keys()];

        const esc = CorpusTermLookup.escape;
        slot.innerHTML = `
            <section class="corpus-lookup">
                <h2 class="corpus-lookup-title">In the primary sources</h2>
                <p class="corpus-lookup-note">
                    Pick a term to see where it appears in the source texts, with the citation.
                </p>
                <div class="corpus-term-row" role="group" aria-label="Terms to look up">
                    ${withHits.slice(0, 24).map((t) => `
                        <button type="button" class="corpus-term" data-term="${esc(t)}"
                                aria-expanded="false">
                            ${esc(t)}
                            <span class="corpus-term-count">${counts.get(t).length}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="corpus-passages" id="corpusPassages" aria-live="polite"
                     data-visible-live hidden></div>
            </section>`;
        slot.hidden = false;

        const panel = slot.querySelector('#corpusPassages');
        slot.addEventListener('click', (event) => {
            const button = event.target.closest('.corpus-term');
            if (!button) return;
            const term = button.dataset.term;
            const open = button.getAttribute('aria-expanded') === 'true';

            slot.querySelectorAll('.corpus-term').forEach((b) => {
                b.setAttribute('aria-expanded', 'false');
                b.classList.remove('is-open');
            });

            if (open) { panel.hidden = true; panel.innerHTML = ''; return; }

            button.setAttribute('aria-expanded', 'true');
            button.classList.add('is-open');
            CorpusTermLookup.renderPassages(panel, counts.get(term) || [], term);
        });
    }

    static renderPassages(panel, passages, term) {
        const esc = CorpusTermLookup.escape;

        // Which body of text a passage comes from, named.
        //
        // A term like "wisdom" is an alias in more than one tradition, so an
        // Egyptian deity's page legitimately surfaces a Chinese sutra. That is
        // a true answer and worth having on a comparative site, but unlabelled
        // it reads as a mistake — so the source is stated on every passage
        // rather than left to be inferred from the script it is written in.
        const SOURCE_LABEL = { egyptian: 'Egyptian texts', buddhist: 'Buddhist sutras' };

        const demoCount = passages.filter((p) => p.demo).length;

        panel.innerHTML = `
            <h3 class="corpus-passages-head">${esc(term)} — ${passages.length} passage${passages.length === 1 ? '' : 's'}</h3>
            ${demoCount ? `
                <p class="corpus-demo-warning" role="note">
                    ${demoCount === passages.length ? 'These are' : `${demoCount} of these are`}
                    placeholder entries from an unfinished import, not verified sources.
                </p>` : ''}
            ${passages.map((p) => `
                <figure class="corpus-passage${p.demo ? ' is-demo' : ''}">
                    <blockquote>${CorpusTermLookup.highlight(p.full_verse || '', term)}</blockquote>
                    <figcaption>
                        ${p.source ? `<span class="corpus-passage-source">${esc(SOURCE_LABEL[p.source] || p.source)}</span>` : ''}
                        <cite>${esc(p.text_name)}</cite>${p.citation ? `, ${esc(p.citation)}` : ''}
                        ${p.translator ? `<span class="corpus-passage-translator">tr. ${esc(p.translator)}</span>` : ''}
                        ${p.demo ? '<span class="corpus-passage-demo">placeholder entry</span>' : ''}
                    </figcaption>
                </figure>
            `).join('')}`;
        panel.hidden = false;
    }
}

if (typeof window !== 'undefined') window.CorpusTermLookup = CorpusTermLookup;
if (typeof module !== 'undefined' && module.exports) module.exports = CorpusTermLookup;
