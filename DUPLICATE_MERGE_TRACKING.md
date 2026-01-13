# Duplicate Asset Merge Tracking

Generated: 2026-01-11

## Summary
- Total Duplicates Found: 70
- Cross-Cultural (OK to keep): 9
- Current Assets: 1,791
- Target: 10,000

## True Duplicates (Need Merge)

### Greek Deities
| Keep | Remove | Notes |
|------|--------|-------|
| deities/aphrodite.json | deities/greek_deity_aphrodite.json | Merge any unique content |
| deities/ares.json | deities/greek_deity_ares.json | |
| deities/artemis.json | deities/greek_deity_artemis.json | |
| deities/athena.json | deities/greek_deity_athena.json | |
| deities/cronos.json | deities/greek_deity_cronos.json | |
| deities/demeter.json | deities/greek_deity_demeter.json | |
| deities/dionysus.json | deities/greek_deity_dionysus.json | |

### Chinese Deities
| Keep | Remove | Notes |
|------|--------|-------|
| deities/dragon-kings.json | deities/chinese_dragon-kings.json | Merge content |
| deities/guan-yu.json | deities/chinese_guan-yu.json | |
| deities/jade-emperor.json | deities/chinese_jade-emperor.json | |
| deities/nezha.json | deities/chinese_nezha.json | |
| deities/xi-wangmu.json | deities/chinese_xi-wangmu.json | |
| deities/zao-jun.json | deities/chinese_zao-jun.json | |

### Cross-Type Duplicates
| Entity | Files | Resolution |
|--------|-------|------------|
| Ammit | deities/ammit.json, creatures/ammit.json | Keep as creature, remove deity |
| Anansi | deities/anansi.json, heroes/anansi.json | Keep both - different aspects |
| Bennu | deities/bennu.json, creatures/bennu.json | Keep as creature (it's a bird) |

## Cross-Cultural (Keep Both)
These are the same name but different mythologies - intentional:
- Apollo (Roman vs Greek)
- Pluto (Greek vs Roman)
- Gilgamesh (Babylonian vs Sumerian)
- Lotus (Egyptian vs Buddhist)
- Myrrh (Jewish vs Universal)

## Merge Strategy
1. Compare content of duplicates
2. Keep the file with richer content
3. Merge any unique fields from the removed file
4. Delete the duplicate
5. Update any references

## Status
- [ ] Greek deity duplicates merged
- [ ] Chinese deity duplicates merged
- [ ] Cross-type duplicates resolved
