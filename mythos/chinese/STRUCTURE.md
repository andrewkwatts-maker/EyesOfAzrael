# Chinese Mythology - Structure & Data Guidelines

**Tradition Color:** #DC143C
**Icon:** ☯️
**Status:** In Development - Ready for Parallel Work

## Quick Reference

### Priority Deities (Create First):
1. **Jade Emperor**
2. **Guanyin**
3. **Guan Yu**

### Priority Herbs:
1. **Ginseng**
2. **Goji Berry**
3. **Chrysanthemum**

### Color Scheme:
```css
--mythos-primary: #DC143C;
--mythos-secondary: #FF4500;
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
- path/ (6 stages: Disciple, Adept, Master, Immortal Candidate, Immortal, Celestial)
- texts/ (sacred writings)
- symbols/ (sacred symbols, sigils)

## Cross-Tradition Deity Mappings

Link Chinese deities to similar figures in other traditions.
See `_documentation/TEMPLATE_GUIDE.md` for deity equivalence table.

## Chinese-Specific Features

### Spiritual Path (6 Stages)
1. **Disciple** (Stage 1) - 0-1 years
2. **Adept** (Stage 2) - 1-5 years
3. **Master** (Stage 3) - 5-10 years
4. **Immortal Candidate** (Stage 4) - 10-15 years
5. **Immortal** (Stage 5) - 15-20 years
6. **Celestial** (Stage 6) - 20+ years

## 📚 Source Material

**Primary Sources:**
- I Ching
- Tao Te Ching
- Journey to West
- Fengshen Yanyi

**Modern Scholarship:**
See tradition-specific academic sources.

## Priority Tasks

**Week 1:**
- [ ] Update index.html with modular navigation
- [ ] Create deities/index.html (pantheon overview)
- [ ] Create 3 priority deity pages: Jade Emperor, Guanyin, Guan Yu
- [ ] Create cosmology/creation.html (STANDARDIZED)
- [ ] Create cosmology/afterlife.html (STANDARDIZED)

**Week 2:**
- [ ] Create herbs/index.html
- [ ] Create 3 priority herb pages: Ginseng, Goji Berry, Chrysanthemum
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

Every Chinese page should link to similar concepts in:
- Jewish/Kabbalah (reference implementation)
- Greek, Norse, Egyptian (major traditions)
- Other traditions as relevant

## ✅ Quality Checklist

Before marking any page complete:
- [ ] Uses correct color scheme (#DC143C, #FF4500)
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
