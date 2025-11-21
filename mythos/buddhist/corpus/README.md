# Buddhist Corpus Search

This directory contains pre-indexed search data for the Buddhist Sutras corpus.

## Files

- `buddhist_corpus_index.json` - Pre-indexed search results for 23 common Buddhist terms
- `sutra_titles.json` - List of all 17 sutras with Chinese and Pinyin titles

## Indexed Terms

The following terms have been pre-indexed for quick searching:

### Deities
- **佛** (fo) - Buddha - 52 occurrences
- **观音** (guan yin) - Avalokiteshvara/Guanyin - 0 occurrences
- **观世音** (guan shi yin) - Avalokiteshvara - 0 occurrences
- **菩萨** (pu sa) - Bodhisattva - 6 occurrences

### Concepts
- **般若** (bo re) - Prajna (Wisdom) - 13 occurrences
- **涅槃** (nie pan) - Nirvana - 4 occurrences
- **菩提** (pu ti) - Bodhi (Enlightenment) - 15 occurrences
- **空** (kong) - Emptiness/Sunyata - 20 occurrences
- **色** (se) - Form/Matter - 36 occurrences
- **法** (fa) - Dharma (Teaching/Law) - 50 occurrences
- **业** (ye) - Karma - 50 occurrences
- **智慧** (zhi hui) - Wisdom - 2 occurrences
- **慈悲** (ci bei) - Compassion - 2 occurrences

### Mantras and Sutras
- **咒** (zhou) - Mantra/Dharani - 7 occurrences
- **唵** (an) - Om - 34 occurrences
- **舍利子** (she li zi) - Shariputra - 4 occurrences
- **僧** (seng) - Sangha (Community) - 20 occurrences

## Example Searches

### Search by Chinese Character
- Search for Buddha: `corpus-search.html?term=佛`
- Search for Emptiness: `corpus-search.html?term=空`
- Search for Dharma: `corpus-search.html?term=法`

### Search by Pinyin
- Search for Buddha: `corpus-search.html?term=fo`
- Search for Prajna: `corpus-search.html?term=bo re`
- Search for Bodhisattva: `corpus-search.html?term=pu sa`

### Search by English
- Search for Buddha: `corpus-search.html?term=buddha`
- Search for Dharma: `corpus-search.html?term=dharma`
- Search for Karma: `corpus-search.html?term=karma`

## Corpus Contents

The Buddhist Sutras corpus includes 17 Mahayana Buddhist texts:

1. **般若波罗蜜多心经** (bō ruò bō luó mì duō xīn jīng) - Heart Sutra
2. **千手千眼无碍大悲心陀罗尼** (qiān shǒu qiān yǎn wú ài dà bēi xīn tuó luó ní) - Great Compassion Dharani
3. **六字真言** (lìu zì zhēn yán) - Six Syllable Mantra
4. **观音灵感真言** (guān yīn líng gǎn zhēn yán) - Guanyin Mantra
5. And 13 more mantras and sutras...

## Regenerating the Index

To update the search index with new terms or refresh the data:

```bash
cd buddhistsutras-interface
python generate_search_index.py
```

This will regenerate `buddhist_corpus_index.json` with the latest data from the corpus.
