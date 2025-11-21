# Sumerian Mythology - Structure & Data Guidelines

**Tradition Color:** #8B4513
**Icon:** 𒀭
**Status:** In Development - Ready for Parallel Work

## Quick Reference

### Priority Deities (Create First):
1. **An**
2. **Enlil**
3. **Inanna**

### Priority Herbs:
1. **Date Palm**
2. **Cedar**
3. **Tamarisk**

### Color Scheme:
```css
--mythos-primary: #8B4513;
--mythos-secondary: #D2691E;
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
- path/ (6 stages: Temple Servant, Ens, Gala Priest, Lum Priest, En Priest, Ensi)
- texts/ (sacred writings)
- symbols/ (sacred symbols, sigils)

## Cross-Tradition Deity Mappings

Link Sumerian deities to similar figures in other traditions.
See `_documentation/TEMPLATE_GUIDE.md` for deity equivalence table.

## Sumerian-Specific Features

### Spiritual Path (6 Stages)
1. **Temple Servant** (Stage 1) - 0-1 years
2. **Ens** (Stage 2) - 1-5 years
3. **Gala Priest** (Stage 3) - 5-10 years
4. **Lum Priest** (Stage 4) - 10-15 years
5. **En Priest** (Stage 5) - 15-20 years
6. **Ensi** (Stage 6) - 20+ years

## 📚 Source Material

**Primary Sources:**
- Epic of Gilgamesh
- Enuma Elish
- Cuneiform tablets
- Temple hymns

**Modern Scholarship:**
See tradition-specific academic sources.

## Priority Tasks

**Week 1:**
- [ ] Update index.html with modular navigation
- [ ] Create deities/index.html (pantheon overview)
- [ ] Create 3 priority deity pages: An, Enlil, Inanna
- [ ] Create cosmology/creation.html (STANDARDIZED)
- [ ] Create cosmology/afterlife.html (STANDARDIZED)

**Week 2:**
- [ ] Create herbs/index.html
- [ ] Create 3 priority herb pages: Date Palm, Cedar, Tamarisk
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

Every Sumerian page should link to similar concepts in:
- Jewish/Kabbalah (reference implementation)
- Greek, Norse, Egyptian (major traditions)
- Other traditions as relevant

## ✅ Quality Checklist

Before marking any page complete:
- [ ] Uses correct color scheme (#8B4513, #D2691E)
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
