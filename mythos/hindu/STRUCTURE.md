# Hindu Mythology - Structure & Data Guidelines

**Tradition Color:** #FF6347
**Icon:** 🕉️
**Status:** In Development - Ready for Parallel Work

## Quick Reference

### Priority Deities (Create First):
1. **Brahma**
2. **Vishnu**
3. **Shiva**

### Priority Herbs:
1. **Tulsi**
2. **Ashwagandha**
3. **Neem**

### Color Scheme:
```css
--mythos-primary: #FF6347;
--mythos-secondary: #FF8C00;
```

## 📁 Standard Folder Structure

Follow universal structure documented in `_documentation/TEMPLATE_GUIDE.md`:
- deities/ (gods, goddesses, divine figures)
- cosmology/ (creation.html, afterlife.html, realms)
- heroes/ (legendary mortals, culture heroes)
- creatures/ (mythical beings, monsters)
- herbs/ (sacred plants, preparations.html)
- rituals/ (ceremonies, calendar.html, offerings.html)
- magic/ (magical systems, practices)
- path/ (6 stages: Brahmachari, Grihastha, Vanaprastha, Sannyasi, Guru, Mahatma)
- texts/ (sacred writings)
- symbols/ (sacred symbols, sigils)

## Cross-Tradition Deity Mappings

Link Hindu deities to similar figures in other traditions.
See `_documentation/TEMPLATE_GUIDE.md` for deity equivalence table.

## Hindu-Specific Features

### Spiritual Path (6 Stages)
1. **Brahmachari** (Stage 1) - 0-1 years
2. **Grihastha** (Stage 2) - 1-5 years
3. **Vanaprastha** (Stage 3) - 5-10 years
4. **Sannyasi** (Stage 4) - 10-15 years
5. **Guru** (Stage 5) - 15-20 years
6. **Mahatma** (Stage 6) - 20+ years

## 📚 Source Material

**Primary Sources:**
- Vedas
- Upanishads
- Bhagavad Gita
- Puranas

**Modern Scholarship:**
See tradition-specific academic sources.

## Priority Tasks

**Week 1:**
- [ ] Update index.html with modular navigation
- [ ] Create deities/index.html (pantheon overview)
- [ ] Create 3 priority deity pages: Brahma, Vishnu, Shiva
- [ ] Create cosmology/creation.html (STANDARDIZED)
- [ ] Create cosmology/afterlife.html (STANDARDIZED)

**Week 2:**
- [ ] Create herbs/index.html
- [ ] Create 3 priority herb pages: Tulsi, Ashwagandha, Neem
- [ ] Create herbs/preparations.html (STANDARDIZED)
- [ ] Create rituals/calendar.html (STANDARDIZED)
- [ ] Create rituals/offerings.html (STANDARDIZED)

**Week 3:**
- [ ] Create path/index.html and all 6 stages (STANDARDIZED)
- [ ] Complete remaining deity pages (aim for 10-15 total)

**Week 4+:**
- [ ] Expand heroes, creatures, magic systems
- [ ] Add texts and symbols sections
- [ ] Cross-link to all other traditions

## 🔗 Required Cross-Links

Every Hindu page should link to similar concepts in:
- Jewish/Kabbalah (reference implementation)
- Greek, Norse, Egyptian (major traditions)
- Other traditions as relevant

## ✅ Quality Checklist

Before marking any page complete:
- [ ] Uses correct color scheme (#FF6347, #FF8C00)
- [ ] Has breadcrumb navigation
- [ ] Includes "Related Concepts" with cross-tradition links
- [ ] Cites primary sources
- [ ] Has practical applications section
- [ ] Uses templates from `_scripts/TEMPLATE_*.html`
- [ ] All links work and point to correct locations

---

**Status:** Structure Defined - Ready for Development
**Template:** Use `_scripts/TEMPLATE_deity.html` and `TEMPLATE_herb.html`
**Documentation:** See `_documentation/TEMPLATE_GUIDE.md` for complete details
**Estimated Completion:** 4-6 weeks for core, 3-4 months for full completion
