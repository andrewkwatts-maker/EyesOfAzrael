# Corpus sources

Drop one JSON file here per source text. `scripts/build-corpus-index.js` reads
this directory and builds `static/corpus/index.json`, which is what the site
looks words up in.

This directory is empty on purpose. **Nothing generates its contents.** The
site's whole reason for quoting primary sources is to let a reader check a
claim; a passage invented to fill a panel defeats that completely, and does it
while looking authoritative. An empty panel is unhelpful, an invented line from
the Pyramid Texts is false. `build-corpus-index.js` has no generation step and
should not be given one.

## File format

```json
{
  "text_id": "pyr",
  "text_name": "Pyramid Texts",
  "tradition": "egyptian",
  "language": "Middle Egyptian",
  "translator": "Samuel A. B. Mercer, 1952",
  "rights": "public domain",
  "source_url": "https://www.sacred-texts.com/egy/pyt/index.htm",
  "passages": [
    {
      "citation": "Utterance 217",
      "text": "The doors of the horizon are opened, the bolts are drawn back…"
    }
  ]
}
```

### Required

| Field | Why |
|---|---|
| `text_id` | Short, stable, unique. Appears in every index entry. |
| `text_name` | What the reader is shown. |
| `rights` | Must clearly permit republication — `public domain`, `CC0`, or `CC-BY`. The importer rejects anything else, including a missing value. A source that cannot be shown cannot ground a claim. |
| `passages[].citation` | A locus a reader can follow: an utterance, chapter, line or tablet number. A passage with no citation is not a source. |
| `passages[].text` | The passage itself. |

### Recommended

`tradition`, `language`, `translator`, `source_url`. The translator matters —
readers comparing two renderings of the same line need to know whose it is, and
translation choices are exactly where a mythological argument tends to live.

## Choosing texts

Translations published before 1929 are public domain in the US; many standard
ones qualify (Budge, Mercer, Griffith, Müller's *Sacred Books of the East*).
Modern translations usually do not, however widely they are posted online.
Prefer a scholarly edition with a stable citation scheme over a website's
paraphrase — the citation is the part doing the work.

## Checking your work

```
node scripts/build-corpus-index.js --from data/corpus-sources          # report
node scripts/build-corpus-index.js --from data/corpus-sources --write  # build
node scripts/validate-corpus-wiring.js                                 # verify
```

The validator reports coverage two ways: how much of the 45,579-term vocabulary
is answerable, and — the number that matters — how many entity pages would
actually show a reader something.
