# Eyes of Azrael — four domains, one live site

**Goal.** All four content domains — mythology, esoteric, history, conspiracy — connected
through one website, each with its **current state baked into its PyPI package**, with
**Firebase carrying only the live changes since that bake**, and the **website rendering
base + live changes together**.

This document is the executable plan. It is committed to the repo so a cloud agent with no
prior context can pick it up.

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
`_all.json` per collection), tracked in git, and included in the Firebase Hosting deploy.

**The site is mythology + esoteric only.** Its 15 collections are azrael's and esoterica's.
There is no history and no conspiracy content on the site at all.

### The three gaps

1. **Two domains never reach Firebase.** `mnema` and `synomosia` read
   `os.getenv("CLIO_PROJECT", "")` / `AUGUR_PROJECT`, find them empty, and return `0`. The
   delta code path behind the env var is real and already written — it is simply not
   pointed anywhere.
2. **Two domains never reach the website.** The static base export and the entity loader
   know nothing about history or conspiracy.
3. **Deploys are manual.** The site is current because it was pushed by hand with the
   Firebase CLI. The GitHub Actions deploy does not run — see §6.

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

**Verification:** in a fresh venv with `_data/` empty, `import mnema; mnema.search(...)`
downloads the snapshot, then `mnema.Refresh()` returns a **non-zero** count and pulls only
documents newer than the bake.

## 6. Phase D — the website carries four domains (3–5 days)

1. **Extend `scripts/export-static-base.js`** to emit the `hist_*` and `con_*` collections,
   sharded by their own shard key (era / category) exactly as mythology collections shard
   by mythology. ~206 new documents — negligible next to the existing 290 MB.
2. **Teach the loader and delta merge the four domains**, so a `hist_events` delta merges
   into history and never into mythology's `events`.
3. **Surface domain in the UI** — navigation, search scoping, and filters — with correct
   per-domain shard labels ("Era" for history, "Category" for conspiracy).
4. **One shared epoch.** The static base export and the package bakes must stamp the *same*
   `generatedAt`. If the base is older than the bake, the site re-fetches deltas it already
   has; if newer, it silently misses changes. This is the single most important invariant in
   the whole design.
5. **Extend submission and edit flows** to the new collections, and re-verify that every
   write path stamps `updatedAt`. Two write paths (admin inline edits, submission approval)
   previously failed to stamp it, which made those changes invisible to every delta
   consumer. Adding collections is exactly the moment that regresses.

## 7. Phase E — deploys run from GitHub Actions (0.5 day + user action)

The site is current only because it was deployed by hand. `.github/workflows/deploy.yml` is
structurally sound — it triggers on push to `main`, gates on a `test` job running
`npm run test:ci` (which exists), and deploys via `FirebaseExtended/action-hosting-deploy`.
Nothing about the workflow needs rewriting. What blocks it is credentials, and **both items
need the user** — neither can be done from this machine:

- **Two repository secrets are unset**: `FIREBASE_SERVICE_ACCOUNT` *and*
  `FIREBASE_PROJECT_ID` (the workflow reads the project id from a secret too, so supplying
  only the key still fails). The service account key must be **freshly generated** from the
  Firebase console — the key previously on disk is revoked and must not be reused.
- **The `gh` CLI is no longer authenticated** on this machine (`git push` still works via
  the credential helper, but the GitHub API does not). Workflow runs cannot be inspected
  and secrets cannot be set until `gh auth login` is run, or the work is done from a cloud
  agent with its own token, or the secret is added through the GitHub web UI.

Also fix `.firebaserc`: it has explanatory comments appended after the closing brace, so it
is **not valid strict JSON**. The Firebase CLI tolerates this (it strips `//` comments); any
plain `JSON.parse` in a script or CI step does not.

## 8. Phase F — verification

- `fetch_deltas` on the history collections returns history documents only — no mythology
  leakage. *(This is the test the whole design exists to pass.)*
- Fresh venv per package, `_data/` empty: query → snapshot downloads → `Refresh()` returns
  non-zero for all four domains.
- Snapshot checksums verify; a corrupted download is rejected rather than cached.
- Live site serves all four domains; a document edited in Firestore appears on the site
  without a redeploy (this is the delta layer actually working).
- Static base `generatedAt` equals the bake epoch across all four domains.
- A push to `main` deploys via Actions with no manual step.

## 9. Effort

| Phase | Work | Estimate |
|---|---|---|
| A | Firebase structure, seed promotion, rules, indexes | 1–2 d |
| B | Baked-state correctness (6 defects) | 2–3 d |
| C | Wire mnema/synomosia, re-bake, release 1.2.0 | 2 d |
| D | Website: four domains, base + delta + UI | 3–5 d |
| E | Actions deploy | 0.5 d + user action |
| F | Verification | 1 d |
| | **Total** | **≈ 2–2.5 weeks** |

**Minimum viable slice:** A + C + D steps 1–2 → roughly one week, and it is the slice that
actually delivers the headline goal (all four domains live, baked state plus live changes).
B and E are correctness and automation, valuable but not on the critical path to "connected
and working".

## 10. Risks

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
