# Japanese Mythology Section - Action Items

## Status Overview
- ✅ **Links:** All working (0 broken)
- ✅ **Core Content:** Excellent quality
- ⚠️ **Styling:** 6 pages need CSS modernization
- ⚠️ **Content:** 8 missing pages

---

## High Priority - Styling Updates

### Update Deity Pages to Modern CSS (6 pages)

All deity individual pages use old hardcoded CSS that doesn't work with the theme picker.

**Pages to Update:**
1. `deities/amaterasu.html`
2. `deities/susanoo.html`
3. `deities/tsukuyomi.html`
4. `deities/izanagi.html`
5. `deities/izanami.html`
6. `deities/index.html`

**Required Changes:**

#### Remove Old Inline Styles
```html
<!-- DELETE THIS -->
<style>
    :root {
        --mythos-primary: #C41E3A;
        --mythos-secondary: #FFD700;
        --mythos-primary-rgb: 196, 30, 58;
    }

    .deity-header {
        background: linear-gradient(135deg, var(--mythos-primary), var(--mythos-secondary));
        /* ... */
    }

    .attribute-card {
        background: rgba(196, 30, 58, 0.1);
        /* ... */
    }
</style>
```

#### Replace with Modern Patterns
```html
<!-- Hero section -->
<div class="hero-section">
  <div class="hero-icon-display">☀️</div>
  <h2 class="card-title-large">Amaterasu-Omikami</h2>
  <p class="hero-description">...</p>
</div>

<!-- Glass cards -->
<div class="glass-card">
  <h3 class="card-title">Names & Epithets</h3>
  <div class="deity-grid">
    <div class="subsection-card">
      <h4 style="color: var(--color-primary);">Primary Name</h4>
      <p>...</p>
    </div>
  </div>
</div>
```

**Key CSS Variables to Use:**
- `var(--color-primary)` - Theme's primary color
- `var(--color-secondary)` - Theme's secondary color
- `var(--color-surface-rgb)` - For rgba backgrounds
- `var(--spacing-lg)`, `var(--spacing-xl)` - Spacing
- `var(--radius-lg)`, `var(--radius-md)` - Border radius
- `var(--shadow-lg)`, `var(--shadow-xl)` - Box shadows

**Reference Page:** See `index.html` for complete modern styling example

---

## High Priority - Missing Core Myths

### Create Missing Myth Pages (3 pages)

1. **myths/creation-of-japan.html**
   - Izanagi and Izanami stir the cosmic ocean with jeweled spear
   - Formation of Onogoro Island
   - The sacred marriage pillar ritual
   - Birth of the eight great islands
   - Significance: Foundation of Japan's sacred geography

2. **myths/amaterasu-cave.html**
   - Susanoo's rampage in Takamagahara
   - Amaterasu hides in Ama-no-Iwato cave
   - World plunges into darkness
   - The 8 million kami gather
   - Ame-no-Uzume's ecstatic dance
   - Pulling Amaterasu out with mirror and jewels
   - Origin of sacred kagura dance
   - Restoration of light to the world

3. **myths/susanoo-orochi.html**
   - Description of Yamata-no-Orochi (8 heads, 8 tails)
   - The weeping couple and their daughter Kushinadahime
   - Susanoo's bargain: slay the dragon, marry the girl
   - Transforming Kushinadahime into a comb
   - The 8 vats of sake trick
   - Slaying the drunken dragon
   - Discovery of Kusanagi-no-Tsurugi in the tail
   - Marriage and building palace at Suga
   - Susanoo's first waka poem
   - Redemption from chaos-bringer to protector

**Template:** Use `myths/izanagi-yomi.html` as structural template
- Hero section with myth title
- Story sections with glass-cards
- Key characters section
- Symbolic interpretations
- Cross-cultural parallels
- See also links

---

## Medium Priority - Missing Deities

### Create Missing Deity Pages (5 pages)

1. **deities/inari.html** - God of Rice & Prosperity
   - One of most popular kami (32,000+ shrines)
   - God of rice, foxes (kitsune), fertility, prosperity, sake
   - Gender-fluid/ambiguous deity
   - Fushimi Inari Taisha (Kyoto) - famous torii gates
   - Fox messengers/servants
   - Agricultural deity and merchant patron

2. **deities/okuninushi.html** - God of Nation-Building
   - Heir of Susanoo (son or son-in-law)
   - Creator deity of Izumo
   - God of nation-building, agriculture, medicine, magic
   - Married Suseri-hime (Susanoo's daughter)
   - Trials from Susanoo
   - Ceded rulership to Amaterasu's grandson
   - Izumo Taisha (major shrine)

3. **deities/hachiman.html** - God of War
   - Syncretic deity (Shinto + Buddhist)
   - Identified with Emperor Ojin
   - God of war, archery, samurai
   - Divine protector of Japan
   - 40,000+ Hachiman shrines
   - Patron of Minamoto clan
   - Often depicted with bow

4. **deities/raijin.html** - God of Thunder
   - Thunder and lightning deity
   - Depicted with drums (taiko)
   - Often paired with Fujin
   - Red or blue skin, demonic appearance
   - Guardian deity
   - Weather controller

5. **deities/fujin.html** - God of Wind
   - Wind deity
   - Carries wind bag
   - Often paired with Raijin
   - Green skin, demonic appearance
   - Storm deity
   - Appears in famous Tawaraya Sotatsu screen

**Template:** Use `deities/amaterasu.html` as structural template (but modernize CSS)
- Hero section with deity icon and description
- Names & epithets section
- Attributes & domains
- Mythology & stories
- Family relationships
- Worship & sacred sites
- Cross-cultural parallels
- See also links

---

## Testing & Validation

After making changes, run validation scripts:

```bash
cd mythos/japanese

# Verify no broken links
node validate-links.js

# Check styling compliance
node validate-styles.js

# Verify content completeness
node validate-content.js
```

**Expected Results After Completion:**
- validate-links.js: ✅ 0 broken links
- validate-styles.js: ✅ 0 pages with old styling
- validate-content.js: ✅ 0 missing expected pages

---

## CSS Modernization Checklist

For each deity page update:

- [ ] Remove entire `<style>` block with `:root` variables
- [ ] Change `class="deity-header"` to `class="hero-section"`
- [ ] Add `class="hero-icon-display"` to deity icon
- [ ] Change `class="attribute-card"` to `class="subsection-card"` or `class="glass-card"`
- [ ] Replace `style="color: var(--mythos-primary)"` with `style="color: var(--color-primary)"`
- [ ] Replace any hardcoded colors with theme variables
- [ ] Test with theme picker (should adapt to all themes)
- [ ] Verify responsive design still works

---

## Quick Reference - Modern CSS Classes

### Layout
- `.hero-section` - Main header section with gradient background
- `.glass-card` - Translucent card with backdrop blur
- `.subsection-card` - Nested content card with left border accent

### Typography
- `.hero-icon-display` - Large centered icon (4rem)
- `.card-title-large` - Major heading
- `.card-title` - Section heading
- `.hero-description` - Hero section description text

### Grids
- `.deity-grid` - Auto-fit grid for cards
- `.section-grid` - General section grid
- `.parallel-grid` - Cross-cultural parallels grid

### Special
- `.interlink-panel` - Cross-mythology linking section
- `.breadcrumb` - Navigation breadcrumbs
- `.see-also-section` - Related links section

---

## Notes

- All existing content is excellent quality
- No broken links anywhere in the section
- Main issue is CSS theming compatibility
- Missing pages are referenced but not critical for functionality
- Scripts provide ongoing validation framework

**Estimated Time:**
- CSS updates: ~2-3 hours (6 pages)
- Missing myths: ~3-4 hours (3 comprehensive pages)
- Missing deities: ~4-5 hours (5 detailed pages)
- **Total: ~10-12 hours of work**

---

## When Complete

After all updates:
1. Run all three validation scripts - should pass 100%
2. Test theme picker on all pages
3. Verify responsive design on mobile
4. Check cross-links to other mythology sections
5. Update this TODO.md to mark completion
6. Consider creating similar validation framework for other mythology sections
