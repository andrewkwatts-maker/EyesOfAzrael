# Eyes of Azrael — four domains, one live site

**Goal.** All four content domains — mythology, esoteric, history, conspiracy — connected
through one website, each with its **current state baked into its PyPI package**, with
**Firebase carrying only the live changes since that bake**, and the **website rendering
base + live changes together**.

This document is the executable plan. It is committed to the repo so a cloud agent with no
prior context can pick it up.

---

## 0. Status — 2026-09-03

**Done and in production:**

- **Seeds promoted.** 126 history entities across six `hist_*` collections and 80 conspiracy
  across five `con_*`, each stamped `updatedAt` with server time. The seed data already
  carried `era` and `category`, so no field mapping was needed.
- **Rules and indexes deployed.** Rules compiled and released. The seven user-write
  collections that returned PERMISSION_DENIED for every normal user now have rules, and the
  catch-all read hole is closed.
- **Domain registry, tab bar, domain-aware export, cross-domain backlinks** — all merged,
  with 3,438 tests passing across 88 suites.

**Blocked, and why:**

- **The Firestore free-tier daily read quota was exhausted**, so none of the upload could be
  read back to verify it. Writes still worked — that is how the seeds landed — but every
  read returns `RESOURCE_EXHAUSTED`. Notably the quota was consumed within roughly four
  hours of the previous reset, which is far more than this site's traffic should need and is
  itself a bug worth finding (see §11).
- Consequently the **delta round-trip has never been demonstrated for the new domains**.
  That is the headline requirement, and it is unverified rather than known-good.

**Deliberate consequence of the above:** the static base for history and conspiracy was
generated from the local seed files rather than by reading Firestore. Those files are the
same data that was uploaded, so the base is correct — but it was not derived from
production, and that assumption should be checked once reads are available.

### Correction, 2026-09-03: the base was never actually regenerated

Checked on disk rather than assumed. `static/entities/` holds the **same 15-collection,
mythology-and-esoteric base stamped `2026-08-30T06:05:03.548Z`** that was there before the
domain work began. There is no `hist_*` or `con_*` directory, no `_backlinks` on any
entity, no `_broken-links.json`, and the manifest still carries only the legacy
`mythologies` / `mythologyCounts` keys. The export script *was* made domain-aware and does
compute backlinks and the broken-link report — it has simply never been run and committed.

Re-running it would not help yet, and this is the part worth recording. The export reads
`firebase-assets-downloaded/`, which has no `hist_*` or `con_*` directories either; the
history and conspiracy seeds live in sibling repositories (`../Mnema/seed_data`,
`../Augur/seed_data`) that are not checked out here. A re-export today therefore emits
**two domains, not four** — confirmed by a dry run: `Domains: 2 (mythology, esoteric)`.

So the current state is: **the registry, the tab bar, the facet-aware views and the
cross-domain link rendering all exist and are tested, and none of them is visible on the
live site**, because `DomainTabs` only shows a domain the manifest lists and the manifest
lists two. That is the correct behaviour — an empty tab leading to a blank page is worse
than no tab — but it means the four-domain UI is built and dark rather than shipped.

**Why the base was deliberately not re-exported in this session.** Stamping a fresh
`generatedAt` is not free. `firebase-assets-downloaded/` is a snapshot taken at some earlier
date, and Firestore reads are blocked by the exhausted quota so it cannot be refreshed.
Exporting it now would write a base whose *content* is old but whose *epoch* says "now",
and the delta layer would then fetch only changes newer than that epoch — silently skipping
every live edit made between the snapshot and today. That is precisely the shared-epoch
invariant §6 calls the most important in the design, and breaking it fails silently in the
direction that loses data. The re-export belongs in the same run that can refresh the
snapshot from Firestore.

### Resolved, 2026-09-03: four domains shipped, epoch preserved

The correction above was right on both counts, and both are now fixed rather than worked
around.

**The missing sources are committed.** `firebase-assets-downloaded/hist_*` and `con_*` now
exist in this repository — 206 documents, 124 KB. They were only ever in sibling
repositories, which is why a checkout of this repo alone could export just two domains and
had no way to know two were missing. That precondition is gone.

**The epoch objection was the important one, and it did not require waiting.** The fix is
not to refresh the snapshot but to stop lying about its age: `export-static-base.js` now
takes `--generated-at <iso>`, and the base was exported with the epoch **pinned to
`2026-08-30T06:05:03.548Z`**, the snapshot's real capture date, rather than to the moment
the script ran. The delta layer therefore still fetches everything changed since 30 August,
exactly as it did before, and no live edit is skipped.

Preserving an older epoch is safe in the only direction that matters. The cost is
re-fetching documents the base already holds — including the 206 new history and conspiracy
documents, whose `updatedAt` is newer than the pinned epoch — and the merge prefers the
Firestore copy anyway. The alternative, a fresh epoch over stale content, silently drops
edits. Given the choice between redundant reads and invisible data loss, redundant reads
win every time.

**Result:** 27 collections, 13,978 entities, four domains, 10,615 entities carrying inbound
links. `validate-base` passes 860/860. The tab bar shows four tabs because the manifest now
lists four domains, which was always the mechanism — no further change was needed to light
them up.

---

## 0b. Source of truth — which store wins

Entity content exists in six places. That is not inherently wrong — snapshots and
projections are how the static+delta design achieves near-zero reads — but it is only safe
if precedence is written down, because the failure mode is someone editing a derived copy
and watching the change evaporate at the next export.

| Store | Status | Holds |
|---|---|---|
| **Firestore `eyesofazrael`** | **AUTHORITATIVE** for live content | Everything. All other stores derive from it. |
| **`Mnema/seed_data`, `Synomosia/seed_data`** | **AUTHORITATIVE** for the history and conspiracy seeds | Where they are authored and where `validate_seed.py` runs. Uploaded to Firestore; copied into this repo. |
| `firebase-assets-downloaded/` | derived | A snapshot of Firestore for mythology and esoteric; a synced copy of the seeds for `hist_*` / `con_*`. The export's only input. |
| `static/entities/` | derived | Generated by `export-static-base.js`. **Never hand-edit** — the next export overwrites it. |
| Package `.db.gz` snapshots | derived | Baked from Firestore, published as GitHub Release assets. |
| `data/` | **legacy, unresolved** | 754 entity-shaped files, partially overlapping the live base. Nothing in the export path reads it. Needs an audit before removal — it is not safe to delete on the strength of a sampled overlap. |

**The one copy that needed guarding.** The seeds are authored in sibling repositories, but the
export reads `firebase-assets-downloaded/`, and a checkout of this repo alone does not have
those siblings — which is precisely how an export silently produced two domains instead of
four. So a copy lives here. `scripts/sync-domain-seeds.js` regenerates it and `--check`
fails when it drifts, with a test pinning both. The copy is therefore *derived and verified*
rather than a fork. Edit the source, run the sync; never edit the copy.

**The one duplicate worth deleting.** Inside the static base, entities are stored twice in
full: 149 MB of per-facet shards, plus 149 MB of `_all.json` holding exactly the same
entities in one file per collection. `_all.json` existed so an unfiltered browse could fetch
one file instead of 105. `_cards.json` now serves that at 20 MB, and the loader already
prefers it. Once clients cached before that export have rolled over, deleting `_all.json`
removes a literal duplicate and roughly halves the base. It is a deliberate step, not a
cleanup: a stale client would 404, and the loader's fallback is the only thing between that
and an empty browse grid.

---

## 0c. Scaling to a social site — what actually breaks

The static+delta architecture is unusually well suited to a large read audience: content
reads are served from a CDN and Firestore only carries the diff. That decoupling is the
site's best asset and it should be defended.

**But it only covers content.** Social features — feeds, comments, votes, notifications,
profiles — cannot come from a baked snapshot, because they change per user and per second.
Their reads scale with *audience*, not with corpus size. That is the real cost curve, and
nothing built so far touches it.

Four specific hazards, all verified in the code rather than assumed:

**1. Vote counters will throttle under exactly the load that means success.**
`vote-service.js:152` runs a Firestore transaction against an aggregate document. Firestore
sustains roughly **one write per second to a single document** — a hard limit no plan
removes. An entity popular enough for a hundred simultaneous voters is an entity whose vote
counter is now failing and retrying. The fix is a sharded counter: write to one of N shard
documents at random, sum them on read. It costs N reads instead of one and removes the
ceiling entirely. This should land before traffic arrives, not after — retrofitting a
counter means reconciling the counts you already lost.

**2. There is no App Check, and that may be the quota mystery.**
The Firebase web API key is public by design; security rules are the only thing standing
between the internet and the database. Without App Check, nothing distinguishes the real
site from a script pointed at the same endpoint — which means anyone can walk the entity
collections directly and burn the daily read quota. **50,000 reads in four hours on a site
architected to make almost none is more consistent with direct API traffic than with page
views.** Enabling App Check is both the abuse control and a way to test that theory.

**3. Search does not scale past the encyclopedia.**
There is no external index — search is client-side over the cards projection, and
`concepts/_cards.json` is already 9 MB. That is acceptable for a corpus browsed slowly and
untenable for a social site where search *is* the discovery mechanism. A hosted index
(Typesense or Algolia) becomes necessary somewhere between here and scale; the cards
projection is a reasonable thing to feed it.

**4. Fan-out is unbuilt.**
`notification-center.js` exists but the write-side fan-out does not. The choice — write to
every follower's inbox on publish, versus assembling a feed on read — is the decision that
sets the cost of the whole social layer, and it is much cheaper to make now than to migrate
later. For this shape of site (many readers, few authors, no follow graph yet) fan-out on
read is almost certainly right, and it keeps the write path cheap.

**What is already correct and should not be disturbed:** comments live in
`entity_posts/{id}/posts` as a subcollection rather than an array on the entity. That is the
right call — an array would have collided with the 1 MiB document ceiling and made every
comment a rewrite of the whole entity.

**Sequencing.** App Check first, because it is both an abuse control and a diagnostic for
the quota question. Sharded counters second, before the load that needs them. Search index
and fan-out are demand-driven — build them when there is demand, not in anticipation of it.

---

## 1. Where things actually stand

Everything below was verified against the code, the published packages, and the live site
on 2026-09-02 — not inferred from documentation.

### The five packages

All five are published at **1.1.0**, all tagged `v1.1.0` at HEAD, all working trees clean,
all in sync with `origin/main`. Lazy loading works identically across all four data
domains: `BaseDB.conn` sees a missing `.db.gz`, calls `ensure_db()`, and pulls the snapshot
from a GitHub Release asset on first query (not on import).

| Package | Domain | Entities | Total rows | Snapshot | `Refresh()` |
|---|---|---:|---:|---|---|
| `eyecore` | foundation | — | — | — | *provides* `fetch_deltas`/`apply_deltas` |
| `azrael` | mythology | **12,672** | 130,331 | 57.8 MB gz | **real** → project `eyesofazrael` |
| `esoterica` | esoteric | **517** | 1,571 | 2.7 MB gz | **real** → project `eyesofazrael` |
| `mnema` | history | **126** | 434 | 85 KB gz | **no-op, returns 0** |
| `synomosia` | conspiracy | **80** | 269 | 75 KB gz | **no-op, returns 0** |

All four `data-v1.1.0` release assets exist and are byte-identical to the local bakes.
**Azrael alone is 94.6% of all entities.** The baked state is therefore *already* in place
for all four domains — requirement "current state baked in" is largely satisfied, and the
remaining work is correctness, not construction.

### The live site

`eyesofazrael.com` **is live and healthy**: apex 301s to `www`, returns 200, renders. It
serves a static base of **15 collections / 13,591 documents** stamped
`2026-08-30T06:05:03.548Z`, with `ENTITY_SOURCE: 'static+delta'` active. The base is 610
files (290 MB) sharded per collection by mythology (`deities/norse.json`, plus an
`_all.json` per collection) and tracked in git.

**Production is served by GitHub Pages, not Firebase Hosting.** `www.eyesofazrael.com`
answers with `Server: GitHub.com` and is published by the GitHub-managed "pages build and
deployment" workflow on every push to `main`, driven by the `CNAME` file. Firebase Hosting
is *also* live at `eyesofazrael.web.app` serving identical content. This matters more than
it first appears: **every header in `firebase.json` is inert in production** — the CSP, the
HSTS header, the `/static/entities/**` `max-age=21600, stale-while-revalidate` caching
rule, the `** → /index.html` SPA rewrite, and `cleanUrls`. The site is running without the
caching and security headers it is configured for.

**The site is mythology + esoteric only.** Its 15 collections are azrael's and esoterica's.
There is no `domain` field on any entity, no domain enum, no router segment, and no filter.
The one conspiracy-shaped thing in the UI is a dead admin-only stub
(`js/views/landing-page-view.js:61-67`) routing `#/browse/conspiracies` to a collection that
exists in no static base, no Firestore rule, and no index.

### The three gaps

1. **Two domains never reach Firebase.** `mnema` and `synomosia` read
   `os.getenv("CLIO_PROJECT", "")` / `AUGUR_PROJECT`, find them empty, and return `0`. The
   delta code path behind the env var is real and already written — it is simply not
   pointed anywhere.
2. **Two domains never reach the website**, and the reason is structural rather than a
   missing branch: **the entire data model is keyed on `mythology`, not on domain.** The
   manifest shape is `collections.{c}.mythologies[] / mythologyCounts{}`; the loader
   resolves files as `static/entities/{collection}/{mythology}.json`; the delta query
   filters `.where('mythology','==',…)`; and **all 47 composite indexes lead with
   `mythology`**. Adding a domain axis reshapes all five of those.
3. **Contributors cannot contribute.** This is the gap that most directly blocks the goal —
   see §7. It is not a multi-domain problem; it is broken today, on the live site, for
   mythology.

---

## 2. The decision this plan turns on: one Firestore project or four?

This is the load-bearing choice; everything in §3–§5 follows from it.

**The problem.** Collection names collide across domains. `events` and `figures` each
appear in **three** domains; `concepts` in two; `artifacts` in two. Today azrael and
esoterica coexist safely in project `eyesofazrael` only because their collection sets
happen not to overlap. The moment `CLIO_PROJECT=eyesofazrael` is set naively, history's
`events` query pulls **azrael's mythology documents straight into the history database**.
`scripts/upload-seed-collections.js` already hard-refuses to write into `eyesofazrael` for
exactly this reason.

| | Option A — project per domain | **Option B — one project, namespaced** | Option C — `domains/{d}/{coll}` |
|---|---|---|---|
| Collision | impossible | impossible (prefix) | impossible |
| **User auth** | **broken across domains** | **one realm, works** | one realm |
| Rules/indexes | 4 sets | 1 set | 1 set + group indexes |
| Cross-domain search | impossible | direct | needs group queries |
| Breaks live site | no | **no — purely additive** | **yes, data must move** |

**Recommendation: Option B — a single `eyesofazrael` project with prefixed collections for
the two new domains.**

The decisive argument is authentication. Firebase Authentication is **per project**: a user
signed in to `eyesofazrael` has no `request.auth.uid` in a separate `clio-project`, so
security rules there cannot identify them. Under Option A, "users can submit and edit
history content" is unimplementable without either replicating every account into three
more projects or fronting all writes with an admin-credentialed Cloud Function. Both are
substantially more work than a naming convention, and both add a failure mode to a site
that currently works.

Option C is the cleanest naming outcome and the wrong move today: it requires relocating
live mythology data, which breaks both the running site and two published packages until
they are re-released.

**Therefore:**

```
eyesofazrael  (single project)
├── deities, creatures, heroes, places, items, concepts,        ← azrael, unchanged
│   symbols, archetypes, cosmology, texts, mythologies,
│   beings, figures, teachings, events, path
├── spells, rituals, magic, traditions, grimoires,              ← esoterica, unchanged
│   herbs, ingredients, artifacts, practitioners
├── hist_events, hist_figures, hist_periods, hist_cultures,     ← mnema, NEW
│   hist_wars, hist_discoveries, hist_artifacts
└── con_theories, con_figures, con_organizations,               ← synomosia, NEW
    con_events, con_documents, con_concepts
```

The asymmetry (mythology and esoteric unprefixed, the new domains prefixed) is deliberate:
it is the price of not touching live data. It is cosmetic, documented here, and can be
normalised later by adding `myth_`/`eso_` aliases if that ever becomes worth a migration.

---

## 3. Phase A — Firebase structure (1–2 days)

1. **Make the seed uploader prefix-aware.** Add `--prefix hist_`. Replace the blanket
   "refuse the `eyesofazrael` project" guard with a precise one: refuse only if a resolved
   target collection name already exists unprefixed. The current guard is right in spirit
   and too blunt to allow the correct design.
2. **Promote the seeds.** Upload `Clio/seed_data` → `hist_*` (126 docs) and
   `Augur/seed_data` → `con_*` (80 docs). Every document stamped `updatedAt` with server
   time, so the delta layer sees it from the first read.
3. **Security rules** for the 13 new collections, matching the existing entity pattern:
   public read; no direct client write; writes land in the submission queue; approval is
   admin-only. A collection the client reads with no matching rule is denied, so this must
   land *before* the site queries them.
4. **Composite indexes** for the new collections to match the queries added in Phase D —
   in particular `updatedAt` ordering, which the delta fetch depends on.

**Verification:** `fetch_deltas("eyesofazrael", ["hist_events", ...], since=0)` returns 126
history documents and zero mythology documents. This is the exact test that proves the
collision is actually solved rather than merely renamed around.

## 4. Phase B — correctness of the baked state (2–3 days)

The bakes exist; these are the defects found in them. Each is a silent wrong answer, which
is why they are worth doing before building more on top.

- **`azrael`: 142 entities typed `heroe`**, a typo'd duplicate of `hero`. Any query
  filtering `type = 'hero'` silently misses all 142.
- **`azrael`: 5,003 entities have `mythology = NULL`** — 39% of the corpus. The static base
  shards *by mythology*, so these entities cannot be placed in a shard.
- **`esoterica`: `_COLLECTION_TYPES` maps `herbs → ingredient`, but the baked rows are
  typed `herb`.** The mapping and the data disagree, so delta-synced herbs would land under
  a type nothing queries.
- **`esoterica` declares 9 collections; 4 (`spell`, `tradition`, `grimoire`,
  `practitioner`) have zero rows.** Either populate them or stop declaring them.
- **No snapshot is checksum-verified.** `ensure_db` accepts a `sha256` argument and no
  domain passes one, so the only integrity check is the gzip magic number. Publish
  checksums with the release assets and pass them.
- **`mnema` and `synomosia` overload the `mythology` column** to store era and category
  respectively. This is a reasonable reuse of the shard key, but it is undocumented and the
  UI must label it correctly ("Era", "Category") rather than "Mythology".

## 5. Phase C — wire the two dark domains (2 days)

1. Default `CLIO_PROJECT` / `AUGUR_PROJECT` to `eyesofazrael`, with the prefixed collection
   lists and a `collection → local type` map mirroring azrael's `_COLLECTION_TYPES`.
2. Keep the env var as an override, so pointing a domain at an isolated project remains
   possible without a code change.
3. Re-bake all four domains against one shared `generatedAt` epoch, cut `data-v1.2.0`
   releases with checksums, bump the packages to **1.2.0**, tag → PyPI trusted publishing.

**Release order is not optional.** `eyecore` is at **1.2.0** on `main` and **unpublished**;
PyPI still has 1.1.0. Azrael's `main` now depends on `eyecore>=1.2.0`, because it uses the
type-alias API added there. So:

> **Publish `eyecore` 1.2.0 before tagging `azrael`.** Tagging azrael first produces a
> release that cannot be installed at all — pip will fail to resolve `eyecore>=1.2.0`.

Nothing is broken for existing users today: published azrael 1.1.0 depends on
`eyecore>=1.1.0`, which resolves fine. The hazard is entirely in the next release.

**Checksums are pinned to a specific asset.** The four `_DATA_SHA256` values were verified
by downloading the published `data-v1.1.0` assets and confirming they are byte-identical to
the local bakes. **Any re-bake invalidates all four.** A new release asset and its checksum
must land in the same commit, or every first-query download hard-fails — which is the
correct behaviour for a checksum, and a self-inflicted outage if the two drift.

**Verification:** in a fresh venv with `_data/` empty, `import mnema; mnema.search(...)`
downloads the snapshot, then `mnema.Refresh()` returns a **non-zero** count and pulls only
documents newer than the bake.

## 6. Phase D — the website carries four domains (5–8 days)

**Shape: one interface, four datasets, selected by a top-level tab.** Mythology, History,
Esoteric and Conspiracy each get a tab. Everything below the tab — browse grids, entity
detail, search, submissions, suggested edits, notes, votes, moderation — is the *same*
code operating on a different dataset. No per-domain views, no forked components.

This is deliberately narrower than a merged cross-domain experience, and that narrowness is
what makes it affordable:

- **Queries stay inside one domain**, so no Firestore collection-group queries and no
  cross-domain composite indexes. The existing per-collection index pattern
  (`<facet> ASC + updatedAt ASC`) simply repeats for the new collections with their own
  facet field. The 47-index problem does not multiply — it extends.
- **The contribution machinery is written once.** Every fix in §7 lands for all four
  domains simultaneously, because there is only one submission path, one edit path, one
  vote path.
- **The static base keeps its current sharding strategy**, one facet value per file.

### The enabling refactor: a domain registry

The single change that makes the tabs work is generalising the hardcoded `mythology` axis
into a declared facet. Today `mythology` is baked into the manifest shape
(`collections.{c}.mythologies[]`), the loader's file resolution
(`static/entities/{collection}/{mythology}.json`), the delta filter
(`.where('mythology','==',…)`), and every index. All four read the same field name.

Introduce one config that declares the four domains, and have every layer read from it
rather than from a literal:

| domain | prefix | collections | facet field | facet label |
|---|---|---|---|---|
| mythology | *(none)* | 16 existing | `mythology` | "Mythology" |
| esoteric | *(none)* | 9 existing | `tradition` | "Tradition" |
| history | `hist_` | 7 | `era` | "Era" |
| conspiracy | `con_` | 6 | `category` | "Category" |

`mnema` and `synomosia` already store era and category in the `mythology` column of their
baked databases, so the data side of this is a rename at export time, not a migration.

1. **Add the registry** and route every consumer through it: manifest generation, the
   loader, the delta query, the index definitions, and the tab bar itself.
2. **Extend `scripts/export-static-base.js`** to emit `hist_*` and `con_*` sharded by their
   own facet. ~206 new documents — negligible against the existing 290 MB.
3. **Teach the loader and delta merge the domain**, so a `hist_events` delta merges into
   history and never into mythology's `events`. This is the correctness core of the phase.
4. **Keep existing URLs working.** Mythology routes are live and deep-linked; the new
   domain segment must default to mythology rather than breaking them.
5. **Retire the dead stub.** `landing-page-view.js:61-67` routes `#/browse/conspiracies` to
   a collection that does not exist. It becomes the real conspiracy tab or it goes.

### Cross-domain links (wiki-style)

Tabs separate the datasets for *browsing*; they must not separate them for *linking*. A
history figure cites a mythological archetype, a conspiracy theory cites a historical event,
an esoteric ritual cites both. Any entity must be able to link to any other entity in any
domain, and following that link should switch tabs rather than dead-end.

**The prefix scheme already provides the hard part.** Because collection names are globally
unique — enforced by a collision check in the registry, which throws rather than picking a
winner — `collection/id` is a globally unique reference. No separate namespace, no UUID, no
domain segment to keep in sync: `deities/zeus` and `hist_figures/napoleon` cannot collide,
and a reference resolves to its own domain, which is what tells the UI which tab to open.
Had we gone with a project per domain, a reference would have needed to carry the project
too, and resolving it would have meant a cross-project read under a different auth realm.

Design decisions this implies:

1. **Forward links live on the entity** as an array of refs, so they travel with the entity
   through both the static base and the delta layer with no extra read.
2. **Backlinks are computed at export time**, not queried at runtime. "What links here" as a
   live Firestore query would be an `array-contains` against every collection in every
   domain on every page view. The bake already walks every entity, so it can invert the link
   graph once and ship the result in the static base; deltas patch it.
3. **Link integrity needs a cross-domain validator.** The existing link checkers
   (`validate-cross-links.js`, `auto-fix-links.js`, `crosslink-report.json`) only understand
   mythology collections, so they will report every history and conspiracy reference as
   broken. That is a false alarm to fix before it trains everyone to ignore the report.
4. **A ref to a retired collection must render as a broken link, not an exception.** Content
   outlives config; `parseRef` returns a parsed ref with a null domain rather than throwing,
   and callers check `isKnownRef`.

The existing `topics` / `entity_topics` / `topic_links` tables in the packages (11,916
topics and 105,142 entity-topic rows in azrael alone) are the natural substrate for this —
topics are already a cross-cutting axis that is not collection-specific. Prefer extending
them over inventing a parallel link store.
4. **One shared epoch.** The static base export and the package bakes must stamp the *same*
   `generatedAt`. If the base is older than the bake, the site re-fetches deltas it already
   has; if newer, it silently misses changes. This is the single most important invariant in
   the whole design.
5. **Extend submission and edit flows** to the new collections, and re-verify that every
   write path stamps `updatedAt`. Two write paths (admin inline edits, submission approval)
   previously failed to stamp it, which made those changes invisible to every delta
   consumer. Adding collections is exactly the moment that regresses.

## 7. Phase E — make contribution actually work (3–4 days)

"Users can submit and edit" is currently false on the live site, for reasons that have
nothing to do with multi-domain work. Each of these fails *silently* — no error surfaces to
the user, and nothing logs. Fix these before adding two more domains on top.

1. **Seven user-write collections have no security rule**, so they fall through to the
   catch-all at `firestore.rules:1371`, which permits writes only from one hardcoded email.
   Every one of these actions returns PERMISSION_DENIED for every normal user today:
   `notes`, `contentReports`, `newsletter_subscribers`, `user_diagrams`, `userSettings`,
   `userIcons`, `content`.
2. **Approved suggested edits never reach the entity.** `suggested-edit-diff.js:1204-1259`
   updates the `suggestedEdits` document's status and writes an `editHistory` record, but
   never writes the entity itself — the code comment at `:1229` says the entity write
   "should be handled by the parent component via callback", and that callback is optional.
   Community edits are approved and then permanently discarded.
3. **`entity-form.js:2250` writes `updatedAt` as an ISO string**, not a Firestore
   `Timestamp`. The delta query is `where('updatedAt', '>', new Date(...))`, which never
   matches a string field, so documents saved through that form are invisible to the delta
   layer forever.
4. **Write access is one hardcoded email, repeated ~40 times** (`request.auth.token.email
   == 'andrewkwatts@gmail.com'`). There is no admin custom claim, no role, no per-domain
   moderator. A four-domain site with contributors cannot be gated this way — introduce a
   role claim and collapse the 40 duplicated conditions onto it.
5. **The delta query is capped at 200 documents** (`asset-service.js:268`) with no
   pagination and no overflow signal. Past 200 edits since a bake, the site is silently
   wrong. At minimum detect the cap and surface it; better, paginate.
6. **Two live queries have no index** — `notes` and the `entity_posts/*/posts` collection
   group — and in the delta path a `failed-precondition` is deliberately swallowed
   (`asset-service.js:277-281`), so a missing index degrades to base-only results with no
   warning at all. Add the indexes and log the swallow.

## 8. Phase F — publishing (1 day + user action)

**Correction to the obvious assumption: deploys are *not* manual.** Every push to `main`
publishes through GitHub Pages, which is why the live site is current. What is broken is a
*second, parallel* publish path: `.github/workflows/deploy.yml` has **never succeeded** —
every run fails at exactly the `Deploy to Firebase` step with all prior steps green, the
signature of an empty `firebaseServiceAccount`.

So the decision to make is which publisher is authoritative, because two publish paths for
one site will drift the moment either is used alone:

- **Keep GitHub Pages** (it already works) and delete or disable the Firebase deploy job.
  Then `firebase.json`'s headers must be reimplemented for Pages or consciously abandoned —
  today they are silently inert.
- **Switch to Firebase Hosting** (gets the CSP, HSTS and the 6-hour static-base caching
  actually applied) and remove the `CNAME`. This needs the user: two unset secrets,
  `FIREBASE_SERVICE_ACCOUNT` *and* `FIREBASE_PROJECT_ID`, with a **freshly generated** key.

Recommendation: **switch to Firebase Hosting.** The static base is the site's dominant
payload, and the `stale-while-revalidate` caching rule is worth real money in load time —
but this is a judgement call about which surface you want to own, so it is flagged rather
than assumed.

Regardless of choice:
- **Scrub the committed service-account key.** `eyesofazrael-firebase-adminsdk-fbsvc-c8104bb0d2.json`
  is committed at repo root and published by Pages. It is revoked, so this is not an active
  breach, but a credential file must not sit in a public tree.
- **`firebase.json` publishes the whole repo root** (`"public": "."` with a blocklist that
  does not exclude them), so screenshots, `AGENT_*_SUMMARY.txt` files, source texts, `.py`
  migration scripts and `.env` are all shipped. Tighten it.
- **Fix `.firebaserc`**: explanatory comments sit after the closing brace, so it is not
  valid strict JSON. The Firebase CLI tolerates it; any plain `JSON.parse` does not.
- **`gh` is not authenticated** on this machine — `git push` works via the credential
  helper, but the API does not, so runs cannot be inspected and secrets cannot be set
  without `gh auth login`, a cloud agent's own token, or the GitHub web UI.

## 9. Phase G — verification

- `fetch_deltas` on the history collections returns history documents only — no mythology
  leakage. *(This is the test the whole design exists to pass.)*
- A signed-in non-admin user can save a note, submit content, and have an approved
  suggested edit appear on the entity — all three fail today.
- A document saved through `entity-form.js` is picked up by the delta query (proves the
  Timestamp fix).
- Fresh venv per package, `_data/` empty: query → snapshot downloads → `Refresh()` returns
  non-zero for all four domains.
- Snapshot checksums verify; a corrupted download is rejected rather than cached.
- Live site serves all four domains; a document edited in Firestore appears on the site
  without a redeploy (this is the delta layer actually working).
- Static base `generatedAt` equals the bake epoch across all four domains.
- A push to `main` deploys via Actions with no manual step.

## 10. Effort

| Phase | Work | Estimate |
|---|---|---|
| A | Firebase structure, seed promotion, rules, indexes | 1–2 d |
| B | Baked-state correctness (6 defects) | 2–3 d |
| C | Wire mnema/synomosia, re-bake, release 1.2.0 | 2 d |
| D | Website: domain axis through manifest, export, loader, queries, indexes | 5–8 d |
| E | Make contribution work (6 blocking defects) | 3–4 d |
| F | Publishing: pick one path, scrub the key, tighten the deploy set | 1 d + user action |
| G | Verification | 1 d |
| | **Total** | **≈ 3–4 weeks** |

Phase D is revised up from the initial estimate. The first read suggested "add two more
collections to the export"; the model is in fact keyed on `mythology` through the manifest
shape, the loader's file resolution, the delta query filter, and all 47 composite indexes,
so introducing a domain axis touches every layer rather than one script.

**Minimum viable slice:** A + C + D → roughly two weeks, delivering the headline goal (all
four domains live, baked state plus live changes). **Phase E is the one to promote if
anything slips** — a site whose contributors cannot contribute does not become more useful
by gaining two more domains they also cannot contribute to.

## 11. Risks

- **The single-project decision is hard to reverse** once seed data is uploaded under
  prefixed names and the site queries them. It is the right call for auth reasons, but it
  should be made deliberately rather than discovered later.
- **History and conspiracy have very little data** — 126 and 80 entities against azrael's
  12,672. They will be connected and working but visibly thin, and will read as
  placeholders next to mythology until the corpora grow.
- **The shared-epoch invariant is easy to break** and fails silently in both directions.
  It needs an assertion in the export script, not a convention.
- **No user-blocked step can be completed autonomously**: the Firebase service account key
  and GitHub auth both require the user.
- **There is no green browser-level gate for a refactor of this size.** The E2E suite has
  been fully red for at least three nightly runs. Unit tests are green — 3,423 of 3,423
  pass as of 2026-09-03; the timing flake at `__tests__/integration/performance.test.js:474`
  is fixed. Getting E2E green is cheap insurance before touching the loader and the
  manifest shape.

  **Corrected diagnosis (2026-09-03).** Two of the three causes originally listed were
  wrong, and both were configuration rather than code:

  1. *Not `fail-fast`.* `fail-fast: false` was already set. The chromium, webkit and mobile
     jobs were **cancelled at the 40-minute `timeout-minutes` wall** having reached 37
     minutes with tests still running — firefox needs 28 minutes to finish. Raised to 60.
  2. *The a11y, visual and performance jobs could not pass at all.* Each installs only
     chromium, then runs `npx playwright test <spec>` with **no `--project`**, so Playwright
     runs the spec against all five configured projects and every firefox, webkit and Mobile
     Safari test fails on a missing browser. The performance job's own summary showed it:
     "32 passed" beside ~150 browser-not-installed failures. The mobile job had the mirror
     defect — `test:e2e:mobile` runs Mobile Safari, a webkit device, with only chromium
     installed. Both fixed.
  3. *Firefox's 71 failures are real* and untouched: genuine cross-browser defects spread
     across every spec (accessibility, browse-category, entity-detail, error-handling,
     landing-page, theme-system, visual). This is the remaining blocker and it is days of
     work, not a config change.

  **Measured after those fixes (run 305, `0d9bf103`, 2026-09-03).** The config
  changes worked, and they exposed the next layer:

  | Job | Result | Wall |
  |---|---|---|
  | Visual regression | **success** — was previously impossible | 1.5 min |
  | Accessibility | failure: 9 passed, 9 flaky, ~14 failed of 32 | 7.6 min |
  | Performance | failure (now actually runs) | 3.8 min |
  | E2E firefox | failure | 35 min |
  | E2E webkit | failure | 51 min |
  | E2E chromium | **CANCELLED at the 60-minute wall** | 58 min |
  | Mobile | **CANCELLED at the 60-minute wall** | 57 min |

  Two things follow. First, raising the timeout from 40 to 60 minutes did not
  buy enough: 406 tests per project at the observed ~14 s each, across 4
  workers, plus a retry on each of roughly 200 failures, does not fit. A
  cancelled job produces *no* results — not even a list of what failed — so
  chromium and mobile were contributing nothing at all. Both are now sharded
  two ways, which is what turns them back into signal.

  Second, video recording was costing far more than it returned: 512 MB of
  artifact for firefox and 118 MB for a 32-test accessibility job. It is off in
  CI now. The trace captured on retry already carries screenshots, DOM
  snapshots, console and network, which is strictly more than a video shows.

  The **9 flaky** accessibility tests are worth more attention than the 14 hard
  failures: they pass on retry, so they are a timing problem rather than a
  cross-browser defect, and they are the cheapest tests to make honest.

  **A cloud agent cannot verify E2E work in the sandbox.** The container's egress policy
  denies `www.gstatic.com` (403 on CONNECT), so the Firebase SDK at `index.html:472-473`
  never loads, the init chain breaks, and `document.body` is null. Every local Playwright
  failure is an artifact of that, not of the app — locally the landing page reports zero
  `nav` and zero `main` landmarks purely because it never rendered. Only chromium is
  preinstalled, so firefox cannot be reproduced at all. **Do not "fix" app code against
  local E2E results from this environment**; use CI runs, whose runners have open egress.

  Re-verified 2026-09-03 rather than taken on trust:
  `curl https://www.gstatic.com/firebasejs/...` returns `CONNECT tunnel failed,
  response 403`. The limitation is real and still current, so E2E work from a
  cloud session is confined to CI configuration and to reading CI results. The
  remaining failures are app-level cross-browser defects and need an
  environment that can actually load the page.
- **The static base is already at an awkward size and this makes it larger.** 290 MB across
  610 files, with `concepts/_all.json` at 39 MB and `deities/_all.json` at 31 MB — single
  responses of 40 MB and ~5 s. It is committed git content published by GitHub Pages, whose
  1 GB site limit is within reach. The new domains add only ~206 documents, so they are not
  the problem; the problem is that the existing `_all.json` pattern does not scale and a
  domain axis multiplies the shard count.
- ~~**CI Pipeline has been failing on every push.**~~ Fixed 2026-09-03. It was not
  failing tests — those all passed — but the coverage thresholds, which the repo had been
  under for long enough that a red CI had stopped carrying information. Measured at
  `0d9bf103`: statements 52.99 against 55, branches 46.29 against 48, functions 54.48
  against 57, lines 54.04 against 55; all four short. Closed by covering the code rather
  than lowering the bar — search rendering, the render and modal helpers, the static+delta
  merge and the moderation gate — now 55.19 / 48.56 / 57.59 / 56.20. The margin on
  statements is thin, so the next sizeable uncovered addition will need tests with it.

- **The `_all.json` problem now has a fix waiting on a re-bake.** The export writes a
  `_cards.json` beside each `_all.json`: the same entities projected to the fields the
  browse grid actually reads, copied whole. Measured on the current base, `concepts` goes
  from 38.7 MB to 9.0 MB, `deities` from 30.4 to 4.1, `creatures` from 19.8 to 1.7. The
  loader prefers it for an unfiltered list, gated on a manifest flag so a base predating
  it is unaffected rather than 404-ing on every page view. Descriptions are deliberately
  *not* truncated — that would take concepts to 2.4 MB, but the grid's own search filters
  on `description`, so shortening it would quietly change which entities a reader can
  find. Like everything else here, it activates on the next export.

- ~~**The base cache silently never populates.**~~ Fixed. `_tryCache` now measures the
  payload, skips one that cannot fit, prunes and retries on quota, and logs instead of
  swallowing. Verified in the source on 2026-09-03; this risk is stale.

- ~~**An unknown shard renders empty rather than failing.**~~ Fixed. The loader warns
  naming the collection, the requested facet and the shard count. Verified 2026-09-03.

- **Historic wording, kept for context.** `entity-base-loader.js:152` writes each
  payload to `localStorage` inside a bare `try {} catch (_) {}`. A 4.6 MB payload exceeds
  the ~5 MB quota, the throw is swallowed, and **every page view re-downloads multi-MB
  JSON** with nothing logged. The 24-hour cache the code appears to implement does not
  exist in practice for the large collections.
- **The Firestore free tier is now a live operational constraint, not a background detail.**
  The daily read quota (50,000 documents) was exhausted on 2026-09-03 within about four
  hours of its reset. Two things follow. First, something is reading far more than this site
  should need — the static+delta design exists precisely to keep reads near zero, so a
  collection scan, an unbounded listener or a polling loop is the likely cause and finding it
  matters more than raising the ceiling. Second, when the quota is gone the site **degrades
  rather than fails**: readers still get the complete baked base, and only edits made since
  the last bake go missing. That is the failure mode static+delta was built for, and it is
  now logged rather than silent — but it means a contributor's change can appear to vanish,
  which is the worst possible experience for the exact people the contribution fixes were
  meant to serve. Upgrading to Blaze keeps the same free allowance and bills overage; at this
  scale that is pennies, and it removes a daily cliff from a site that is meant to accept
  contributions.
- **An unknown shard renders empty rather than failing.** `entity-base-loader.js:123-126`
  returns an empty `Map` for a key absent from the manifest, with no Firestore fallback. New
  domain content published before a re-bake will show a blank page and no error — the exact
  failure mode most likely to occur while rolling this out.
