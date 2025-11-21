# Islamic Mythology - Structure & Data Guidelines

**Tradition Color:** #008000
**Icon:** ☪️
**Status:** In Development - Ready for Parallel Work

## Quick Reference

### Priority Deities (Create First):
1. **Allah**
2. **Angels (Jibreel/Gabriel)**
3. **Prophets**

### Priority Herbs:
1. **Black Seed**
2. **Senna**
3. **Miswak**

### Color Scheme:
```css
--mythos-primary: #008000;
--mythos-secondary: #00CED1;
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
- path/ (6 stages: Murid, Salik, Dervish, Sheikh, Qutb, Ghawth)
- texts/ (sacred writings)
- symbols/ (sacred symbols, sigils)

## Cross-Tradition Deity Mappings

Link Islamic deities to similar figures in other traditions.
See `_documentation/TEMPLATE_GUIDE.md` for deity equivalence table.

## Islamic-Specific Features

### Spiritual Path (6 Stages)
1. **Murid** (Stage 1) - 0-1 years
2. **Salik** (Stage 2) - 1-5 years
3. **Dervish** (Stage 3) - 5-10 years
4. **Sheikh** (Stage 4) - 10-15 years
5. **Qutb** (Stage 5) - 15-20 years
6. **Ghawth** (Stage 6) - 20+ years

## 📚 Source Material

**Primary Sources:**
- Quran
- Hadith
- Sufi texts
- Tafsir

**Modern Scholarship:**
See tradition-specific academic sources.

## Priority Tasks

**Week 1:**
- [ ] Update index.html with modular navigation
- [ ] Create deities/index.html (pantheon overview)
- [ ] Create 3 priority deity pages: Allah, Angels (Jibreel/Gabriel), Prophets
- [ ] Create cosmology/creation.html (STANDARDIZED)
- [ ] Create cosmology/afterlife.html (STANDARDIZED)

**Week 2:**
- [ ] Create herbs/index.html
- [ ] Create 3 priority herb pages: Black Seed, Senna, Miswak
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

Every Islamic page should link to similar concepts in:
- Jewish/Kabbalah (reference implementation)
- Greek, Norse, Egyptian (major traditions)
- Other traditions as relevant

## ✅ Quality Checklist

Before marking any page complete:
- [ ] Uses correct color scheme (#008000, #00CED1)
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
