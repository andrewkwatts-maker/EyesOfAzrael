# Suite data pipeline — one page

This repo's Firestore project (`eyesofazrael`) is the **source of truth** for
the whole Eyes of Azrael suite. Everything else — the website's static base
and the Python packages' baked databases — is a snapshot of it, with
Firestore serving only the *diff* on top (documents whose `updatedAt` is
newer than the snapshot's `generated_at`).

## Refresh + republish the website base

```bash
python scripts/download-assets-rest.py   # refresh firebase-assets-downloaded/ (public REST, no admin key)
npm run export-base                      # regenerate static/entities/ + manifest
npm run validate-base                    # 600+ consistency checks, exits 1 on drift
npm run test:ci                          # jest gate
npx firebase-tools deploy --only hosting # (CI auto-deploy needs the FIREBASE_SERVICE_ACCOUNT secret, currently unset)
```

The site serves entities from `/static/entities/` (flag `ENTITY_SOURCE:
'static+delta'` in `js/config/features.js`) and queries Firestore only for
post-base changes.

## Re-bake the Python packages

Each bake reads the same downloaded assets — no Firebase auth needed — and
stamps `meta.generated_at` so `Refresh()` knows its epoch:

```bash
# azrael (mythology, 16 collections)
cd ../Azrael    && python scripts/bake.py --source ../EyesOfAzrael/firebase-assets-downloaded

# esoterica (magic: rituals/herbs/magic)
cd ../Apocrypha && python scripts/bake.py --source ../EyesOfAzrael/firebase-assets-downloaded

# mnema + synomosia bake from their committed seed_data/ (no upstream yet)
cd ../Clio      && python scripts/validate_seed.py && python scripts/bake.py --source seed_data
cd ../Augur     && python scripts/validate_seed.py && python scripts/bake.py --source seed_data
```

## Ship the new snapshots

Baked `.db.gz` files are **GitHub Release assets**, not git content — the
packages lazy-download them on first query (via `eyecore>=1.1.0`) and
`Refresh()` merges Firestore deltas afterwards:

```bash
gh release create data-vX.Y.Z src/<pkg>/_data/<pkg>.db.gz --repo andrewkwatts-maker/<Repo>
# bump the _DATA_URL in the package's _query.py, version-sync, then:
git tag vX.Y.Z && git push --tags        # tag triggers the PyPI publish workflow
```

Suite repos: EyeCore→`eyecore`, Azrael→`azrael`, Apocrypha→`esoterica`,
Clio→`mnema`, Augur→`synomosia`.
