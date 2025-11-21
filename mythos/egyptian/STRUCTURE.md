# Egyptian Mythology - Structure & Data Guidelines

**Tradition Color:** #CD853F (Peru/Bronze)
**Icon:** ☥ (Ankh)
**Status:** In Development - Ready for Parallel Work

## Quick Reference

### Priority Deities (Create First):
1. **Ra** ☀️ - Sun god, creator
2. **Osiris** 👑 - Death, resurrection, afterlife king
3. **Isis** 🪶 - Magic, motherhood, healing

### Priority Herbs:
1. **Blue Lotus** 🌸 - Sacred to Ra, psychoactive
2. **Papyrus** 📜 - Writing, knowledge
3. **Acacia** 🌳 - Tree of Life, shittim wood

### Color Scheme:
```css
--mythos-primary: #CD853F;    /* Peru/Bronze */
--mythos-secondary: #DAA520;  /* Goldenrod */
```

## 📁 Standard Folder Structure

Follow same structure as Norse/Greek:
- deities/ (Ra, Osiris, Isis, Horus, Set, Anubis, Thoth, Bastet, Sekhmet, Hathor, Ptah, Sobek)
- cosmology/ (creation.html, afterlife.html, duat.html, ennead.html)
- heroes/ (Pharaohs, priests)
- creatures/ (Sphinx, Ammit, Apep serpent)
- herbs/ (Blue lotus, papyrus, acacia, frankincense, myrrh, henna, saffron)
- rituals/ (Mummification, Opening of Mouth, calendar.html, offerings.html)
- magic/ (Heka, amulets, Book of the Dead spells)
- path/ (6 stages: Wab → Web → Hem-Netjer → Hery-Heb → Sem → High Priest)
- texts/ (Pyramid Texts, Coffin Texts, Book of the Dead, Book of Gates)
- symbols/ (Ankh, Eye of Horus, Scarab, Was scepter, Djed pillar)

## Cross-Tradition Mappings

**Ra → Similar to:**
- Apollo (Greek) - Sun god
- Sol (Roman) - Sun
- Surya (Hindu) - Solar deity
- Lugh (Celtic) - Light god

**Osiris → Similar to:**
- Hades (Greek) - Underworld king
- Odin (Norse) - Death wisdom
- Yama (Hindu) - Death god

**Isis → Similar to:**
- Athena (Greek) - Wisdom
- Freya (Norse) - Magic & love
- Mary (Christian) - Mother figure

## Egyptian-Specific Features

### Duat Journey (afterlife.html)
- Hall of Ma'at, weighing of heart
- 12 hours/gates journey
- Osiris judgment
- Fields of Aaru (paradise)
- Link to: All other afterlife.html pages

### Priesthood Path (6 stages)
1. **Wab Priest** (Pure One) - 1-2 years: Purification, temple service
2. **Web Priest** (Pure Priest) - 3-5 years: Daily rituals, offerings
3. **Hem-Netjer** (God's Servant) - 6-10 years: Specific deity service
4. **Hery-Heb** (Master of Scrolls) - 11-20 years: Ritual texts, magic
5. **Sem Priest** (Embalmer) - 20-30 years: Mummification mysteries
6. **High Priest** (Hem-Netjer-Tepi) - 30+ years: Temple leadership

### Key Rituals
- **Opening of the Mouth** - Animating statues/mummies
- **Daily Temple Ritual** - Awakening, feeding, clothing deity
- **Opet Festival** - Rejuvenating pharaoh's ka
- **Sed Festival** - Pharaoh renewal (30 year jubilee)

## 📚 Source Material

**Primary Sources:**
- Pyramid Texts (Old Kingdom, 2400-2300 BCE)
- Coffin Texts (Middle Kingdom, 2100-1800 BCE)
- Book of the Dead (New Kingdom, 1550-50 BCE)
- Temple inscriptions (Karnak, Luxor, Abydos)

**Modern Scholarship:**
- E.A. Wallis Budge - "The Gods of the Egyptians"
- Adolf Erman - "Handbook of Egyptian Religion"
- Jan Assmann - "Death and Salvation in Ancient Egypt"

## Priority Tasks

**Week 1:**
- [ ] Update index.html with modular nav
- [ ] Create deities/index.html (Ennead overview)
- [ ] Create Ra, Osiris, Isis pages
- [ ] Create cosmology/duat.html (Duat journey)
- [ ] Create cosmology/afterlife.html (standardized)

**Week 2:**
- [ ] Create herbs/blue-lotus.html, papyrus.html, acacia.html
- [ ] Create rituals/mummification.html
- [ ] Create rituals/calendar.html (standardized)
- [ ] Create rituals/offerings.html (standardized)

**Week 3:**
- [ ] Create path/index.html and all 6 stages
- [ ] Complete remaining deities (9 more)

---

**Status:** Structure Defined
**Template:** Use `_scripts/TEMPLATE_deity.html` and `TEMPLATE_herb.html`
**Cross-links:** Link to jewish/greek/norse similar concepts
