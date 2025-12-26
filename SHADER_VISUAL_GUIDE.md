# Shader Visual Effect Guide

## Quick Reference: What Each Shader Looks Like

### Water Shader
```
Visual Description:
┌─────────────────────────────────┐
│ ≈≈≈ (gentle waves at top)       │
│                                 │
│  ⚬ ⚪ (rising bubbles)          │
│     ⚬                           │
│  ◊ ◊ ◊ (caustic patterns)       │
│   ◊  ◊                          │
│                                 │
│    (darker at bottom)           │
└─────────────────────────────────┘

Colors: Deep blue (#001428) → Teal (#1e3a5f)
Movement: Gentle upward bubbles, flowing caustics
Speed: Slow and peaceful
```

### Fire Shader
```
Visual Description:
┌─────────────────────────────────┐
│🔥                            🔥  │ ← Flames at edges
│                                 │
│     • •  (rising embers)        │
│   •    •                        │
│  •       •                      │
│    •  •                         │
│                                 │
│🔥                            🔥  │
└─────────────────────────────────┘

Colors: Dark (#0a0500) → Orange (#ff6b1a)
Movement: Rising embers with drift, flickering flames
Speed: Medium, with rapid flicker
```

### Night Shader
```
Visual Description:
┌─────────────────────────────────┐
│ ✧ ✦ ✧  (aurora in upper part)  │
│  ~~ aurora waves ~~             │
│ ✧ ✦ ✧ ✦ ✧ (many stars)        │
│  ✦ ✧ ✦ ✧ ✦                    │
│ ✧  💫 (shooting star)           │
│  ✦ ✧ ✦ ✧                       │
│ ✧ ✦ ✧ ✦                        │
│  (nebula clouds subtle)         │
└─────────────────────────────────┘

Colors: Deep night (#050a15) → Purple/Blue nebula
Movement: Twinkling stars, flowing aurora, shooting stars
Speed: Slow with occasional shooting star
```

### Earth Shader
```
Visual Description:
┌─────────────────────────────────┐
│  ◉  ◉ (floating particles)      │
│ ╱╲╱╲ (growth patterns)          │
│◉    ╱  ╲                        │
│  ▓▒░ (Voronoi cells)            │
│ ░▒▓ ◉                           │
│   ▒░▓                           │
│ ◉    ░▒                         │
│  (vignette at edges)            │
└─────────────────────────────────┘

Colors: Brown (#0f0a05) → Green (#3a5f35)
Movement: Spiraling particles, slow organic growth
Speed: Very slow and natural
```

### Light Shader
```
Visual Description:
┌─────────────────────────────────┐
│     ✨ ⬡ ⬡ (bokeh)              │
│  ⬡    ✨                        │
│     │││ (light rays)            │
│   ⬡ ││├───> (from center)      │
│   ☀ │││                        │
│ ✨  │││  ⬡                     │
│  ⬡   ✨    ⬡                   │
│    (warm glow overall)          │
└─────────────────────────────────┘

Colors: Soft white (#f5f3f0) → Golden (#ffda80)
Movement: Gentle floating bokeh, rotating rays
Speed: Slow and dreamy
```

### Dark Shader
```
Visual Description:
┌─────────────────────────────────┐
│  ✧ (dim stars)                  │
│  ⚫ (wispy particles)            │
│  ⚫~~~                           │
│ ░▒▓ (shadow layers)             │
│  ▓▒░   ⚫                       │
│ ░  ▓▒   ⚫~~~                   │
│  (very dark, purple tint)       │
│ (strong vignette)               │
└─────────────────────────────────┘

Colors: Near black (#05050a) → Dark purple (#1f1426)
Movement: Flowing shadows, wispy drifting particles
Speed: Very slow, mysterious
```

---

## Animation Timings

| Shader | Main Effect Speed | Particle Count | Movement Type |
|--------|------------------|----------------|---------------|
| Water  | Slow (0.12x)     | 8 bubbles      | Rising        |
| Fire   | Medium (0.1x)    | 12 embers      | Rising + Drift|
| Night  | Varied           | 100+ stars     | Twinkling     |
| Earth  | Very Slow (0.08x)| 18 particles   | Spiraling     |
| Light  | Slow (0.2x)      | 25 bokeh       | Floating      |
| Dark   | Very Slow (0.06x)| 15 wisps       | Drifting      |

---

## Effect Intensity Zones

### Water
- Top 12%: Gentle waves
- Full screen: Caustics (subtle)
- Full screen: Rising bubbles
- Upper 60%: God rays

### Fire
- Outer 5-10%: Edge flames
- Full screen: Rising embers
- Full screen: Heat distortion (very subtle)

### Night
- Upper 40-45%: Aurora borealis
- Full screen: Star field (4 layers)
- Full screen: Nebula clouds (subtle)
- Random: Shooting stars (every 13s)

### Earth
- Full screen: Voronoi cells
- Full screen: Growth patterns
- Full screen: Particles (spiral motion)

### Light
- Center: Radial glow
- Full screen: Bokeh particles
- Center: Rotating light rays
- Upper right: Lens flare

### Dark
- Full screen: Shadow layers (3 parallax levels)
- Full screen: Wispy particles
- Full screen: Dim stars (sparse)
- Edges: Strong vignette

---

## Color Palettes Summary

**Water:** Ocean depths
- #001428 (deep ocean)
- #0a2540 (mid water)
- #1e3a5f (surface)

**Fire:** Burning embers
- #0a0500 (ash)
- #2d1200 (smoldering)
- #8b2500 (hot coal)
- #ff6b1a (flame)

**Night:** Cosmic sky
- #050a15 (deep space)
- #0a0e1f (night sky)
- #1a1f3a (twilight)

**Earth:** Natural ground
- #0f0a05 (dark soil)
- #1a1410 (earth)
- #2d4a2b (moss)
- #3a5f35 (vegetation)

**Light:** Golden radiance
- #f5f3f0 (soft white)
- #fef9f3 (warm white)
- #ffda80 (golden)

**Dark:** Void depths
- #05050a (void)
- #0a0a0f (shadow)
- #1a1a2e (dark matter)
- #1f1426 (dark purple)

---

*Use this guide to quickly understand what each shader produces visually*
