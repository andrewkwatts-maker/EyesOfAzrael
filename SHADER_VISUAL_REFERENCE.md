# Shader Visual Reference Guide

This guide describes what each shader looks like and when to use it.

## 🌊 Water Shader

### Visual Description
```
TOP OF SCREEN:
  ≈≈≈≈≈≈≈≈≈≈≈≈≈    <- Gentle waves
  ≋≋≋≋≋≋≋≋≋≋≋≋≋    <- Wave motion

MIDDLE:
  ✧   ·  ·   ✧    <- Subtle caustics (light patterns)
    ·       ·      <- Moving light patches
  ·    ✧     ·

THROUGHOUT:
     o              <- Rising bubble
       o            <- Rising bubble
         o          <- Rising bubble

COLOR PALETTE:
  Deep: #011014 (very dark blue-green)
  Light: #1a4d66 (medium blue-green)
```

### When to Use
- Greek mythology (Poseidon, ocean deities)
- Norse mythology (sea gods, Njord)
- Any water-related content
- Oceanic themes

### Effect Characteristics
- **Intensity**: Subtle, barely noticeable
- **Motion**: Slow, gentle undulation
- **Focus**: Top 15% of screen for waves
- **Performance**: Very efficient (simple FBM)

---

## 🔥 Fire Shader

### Visual Description
```
EDGES ONLY:
║ ︻   ≋   ︻ ║    <- Flames around border
║≋   ︾     ≋║    <- Flickering edge fire
║   ≋   ︻  ≋║

CENTER AREA:
    ·              <- Rising embers
  ·   ·            <- Glowing particles
      ·  ·         <- Ember trails
        ·     ·

BOTTOM:
  ·   ·   ·   ·    <- Source of embers

COLOR PALETTE:
  Base: #050201 (very dark)
  Ember: #ff4d0d (orange-red)
  Hot: #ffcc1a (yellow-orange)
```

### When to Use
- Hindu mythology (Agni, fire gods)
- Persian mythology (sacred fire)
- Aztec mythology (fire deities)
- Any fire-themed content

### Effect Characteristics
- **Intensity**: Medium, noticeable but not overwhelming
- **Motion**: Flicker + rising particles
- **Focus**: Screen edges + rising embers
- **Performance**: Moderate (domain warping)

---

## ✨ Night Sky Shader

### Visual Description
```
TOP PORTION (60-100%):
  ∼∼∼∼∼∼∼∼∼∼∼∼∼    <- Subtle aurora
  ≈≈≈≈≈≈≈≈≈≈≈≈≈    <- Flowing colors
  ∼∼∼∼∼∼∼∼∼∼∼∼∼

EVERYWHERE:
  ·   ✦   ·  ✧    <- Bright stars (large layer)
    ·       ·      <- Medium stars
  ✧   ·   ·   ·    <- Small stars (distant layer)
    ·  ✦     ·     <- Twinkling effect

COLOR PALETTE:
  Sky: #01010a (very dark blue)
  Stars: #fff2e6 (white-yellow)
  Aurora: #1a334d (blue), #0d4d33 (green)
```

### When to Use
- Norse mythology (celestial themes)
- Chinese mythology (heaven, jade emperor)
- Babylonian mythology (astronomy, stars)
- Any night/sky content

### Effect Characteristics
- **Intensity**: Subtle, atmospheric
- **Motion**: Slow twinkling, aurora flow
- **Focus**: Entire screen (stars), top (aurora)
- **Performance**: Good (layered hash functions)

---

## 🌿 Earth Shader

### Visual Description
```
BACKGROUND PATTERN:
  ╱╲╱╲╱╲╱╲╱╲╱╲    <- Organic Voronoi cells
  ╲╱╲╱╲╱╲╱╲╱╲╱    <- Shifting earth texture
  ╱╲╱╲╱╲╱╲╱╲╱╲

FLOWING PARTICLES:
      ·            <- Particle on curved path
    ·              <- Drifting particle
  ·                <- Following flow
    ·              <- Organic motion

COLOR PALETTE:
  Dark: #140d08 (dark brown)
  Medium: #261e14 (medium brown)
  Light: #1a260d (brown-green)
```

### When to Use
- Celtic mythology (nature spirits, druids)
- Sumerian mythology (earth gods)
- Mayan mythology (forest, nature)
- Yoruba mythology (earth deities)
- Any nature/earth content

### Effect Characteristics
- **Intensity**: Subtle, organic
- **Motion**: Slow pattern shift, curved particle paths
- **Focus**: Entire screen (pattern), flowing particles
- **Performance**: Good (Voronoi + particles)

---

## ☀️ Light Shader

### Visual Description
```
TOP AREA:
  :::::::::::::::   <- Ambient glow
  ···············   <- Soft light

CENTER RAYS:
      ╱│╲          <- Light rays from center
     ╱ │ ╲         <- Radial pattern
    ╱  │  ╲        <- Gentle illumination

PARTICLES:
    ○               <- Glowing particle (pulsing)
  ○       ○         <- Floating lights
      ○   ○         <- Soft halos
        ○

COLOR PALETTE:
  Base: #0d0b0a (very dark warm)
  Rays: #fff2b3 (warm yellow-white)
  Particles: #fff8cc (bright warm white)
```

### When to Use
- Egyptian mythology (Ra, sun gods)
- Buddhist philosophy (enlightenment)
- Roman mythology (Apollo, light)
- Any light/sun/enlightenment themes

### Effect Characteristics
- **Intensity**: Subtle, warm glow
- **Motion**: Pulsing particles, gentle rays
- **Focus**: Top (ambient), center (rays), everywhere (particles)
- **Performance**: Good (simple calculations)

---

## 🌑 Dark Shader

### Visual Description
```
FLOWING SHADOWS:
  ≋≋≋≋≋≋≋≋≋≋≋≋≋    <- Shadow flow pattern
  ∼∼∼∼∼∼∼∼∼∼∼∼∼    <- Drifting darkness
  ≋≋≋≋≋≋≋≋≋≋≋≋≋    <- Slow movement

DARK PARTICLES:
      ·            <- Dark particle rising
    ·              <- Shadow mote
  ·                <- Drifting darkness
      ·

VIGNETTE:
  ▓▓▓▓▓▓▓▓▓▓▓▓▓    <- Darker edges
  ▒▒▒▒▒▒▒▒▒▒▒▒▒    <- Gradient to center
  ░░░░░░░░░░░░░    <- Lighter center

COLOR PALETTE:
  Base: #010102 (nearly black)
  Shadows: #040308 (very dark purple)
  Particles: #26193d (dark purple, subtle)
```

### When to Use
- Default dark mode
- Underworld themes (Hades, Hel)
- Shadow/darkness mythology
- General dark aesthetic

### Effect Characteristics
- **Intensity**: Very subtle, mysterious
- **Motion**: Slow shadow flow, drifting particles
- **Focus**: Entire screen, vignette effect
- **Performance**: Excellent (very simple)

---

## Performance Comparison

| Shader | Complexity | FPS Impact | Mobile Friendly |
|--------|-----------|------------|-----------------|
| Water  | Medium    | Low        | ✓ Yes          |
| Fire   | High      | Medium     | ✓ Yes*         |
| Night  | Medium    | Low        | ✓ Yes          |
| Earth  | Medium    | Low        | ✓ Yes          |
| Light  | Low       | Very Low   | ✓✓ Excellent   |
| Dark   | Very Low  | Very Low   | ✓✓ Excellent   |

*Fire shader may auto-reduce quality on older mobile devices

---

## Mythology Mapping Guide

### Water-Based Mythologies
- **Greek**: Poseidon, Oceanus, nymphs → Water Shader
- **Norse**: Njord, Aegir → Water Shader
- **Hawaiian**: Kanaloa → Water Shader

### Fire-Based Mythologies
- **Hindu**: Agni → Fire Shader
- **Persian**: Zoroastrian fire → Fire Shader
- **Aztec**: Xiuhtecuhtli → Fire Shader
- **Celtic**: Brigid (fire aspect) → Fire Shader

### Sky/Night Mythologies
- **Norse**: Odin, Asgard → Night Shader
- **Chinese**: Jade Emperor, heaven → Night Shader
- **Babylonian**: Ishtar, astronomy → Night Shader
- **Egyptian**: Nut (night sky) → Night Shader

### Earth/Nature Mythologies
- **Celtic**: Cernunnos, nature spirits → Earth Shader
- **Sumerian**: Earth deities → Earth Shader
- **Mayan**: Forest gods → Earth Shader
- **Yoruba**: Orisha of earth → Earth Shader
- **Native American**: Earth mother → Earth Shader

### Light/Sun Mythologies
- **Egyptian**: Ra, Amun-Ra → Light Shader
- **Roman**: Apollo, Sol → Light Shader
- **Buddhist**: Enlightenment → Light Shader
- **Incan**: Inti → Light Shader

### Dark/Underworld Mythologies
- **Greek**: Hades, underworld → Dark Shader
- **Norse**: Hel, Helheim → Dark Shader
- **Egyptian**: Osiris, Duat → Dark Shader
- **Mesopotamian**: Ereshkigal → Dark Shader

---

## Visual Intensity Scale

```
Subtle (0.3-0.5)     → Barely noticeable, professional
Moderate (0.6-0.8)   → Noticeable but not distracting [RECOMMENDED]
Strong (0.9-1.0)     → Clear effect, atmospheric
```

**Recommended default**: 0.7-0.8 for good balance

---

## Animation Speed Reference

| Shader | Animation Speed | Feels Like |
|--------|----------------|------------|
| Water  | Slow (0.3x)    | Gentle ocean |
| Fire   | Medium (1.0x)  | Flickering flames |
| Night  | Very Slow (0.1x) | Celestial motion |
| Earth  | Slow (0.2x)    | Natural growth |
| Light  | Medium (0.8x)  | Flowing light |
| Dark   | Very Slow (0.1x) | Creeping shadows |

---

## Color Temperature Guide

```
Cool Colors (Blues, Purples):
  Water  → Cool blue-green
  Night  → Cool blue-purple
  Dark   → Cool dark purple

Warm Colors (Reds, Yellows):
  Fire   → Warm orange-red
  Earth  → Warm brown-green
  Light  → Warm golden-white
```

---

## Testing Checklist

When evaluating shaders:

- [ ] Effect is **subtle** and doesn't distract from content
- [ ] Text remains **readable** on all panels
- [ ] Animation is **smooth** (60fps)
- [ ] Mobile performance is **acceptable**
- [ ] Colors match **mythology theme**
- [ ] Effect enhances **atmosphere**
- [ ] Respects **reduced motion** preference
- [ ] Fallback gradient is **appropriate**

---

**Pro Tip**: When in doubt, start with intensity at 0.5 and gradually increase to find the right balance for your content.
