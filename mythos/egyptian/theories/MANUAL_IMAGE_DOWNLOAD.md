# Manual Image Download Instructions

**Note**: Automated downloads were blocked by Wikimedia. Please download these manually.

---

## 📥 DOWNLOAD THESE 5 IMAGES MANUALLY

### Image 1: Thorium-232 Decay Chain
**Visit**: https://commons.wikimedia.org/wiki/File:Decay_Chain_of_Thorium-232.svg
**Steps**:
1. Click the link above
2. Click on the image preview to see full size
3. Right-click → "Save image as..."
4. Save to: `H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories\thorium_decay_chain.svg`

**Attribution**: Created by Wikimedia user, CC BY-SA 4.0
**Use in**: Apep, Ra, Thoth theory sections

---

### Image 2: Alpha Decay Diagram
**Visit**: https://commons.wikimedia.org/wiki/File:Alpha_Decay.svg
**Steps**:
1. Click the link above
2. Click "Download" → "Original file (SVG file)"
3. Save to: `H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories\alpha_decay_diagram.svg`

**Attribution**: Public Domain
**Use in**: Apep, Ra theory sections

---

### Image 3: Radium Watch Dial
**Visit**: https://commons.wikimedia.org/wiki/File:Radium_watch.jpg
**Alternative**: Search "radium luminescent watch" on Wikimedia
**Steps**:
1. Find an image showing green/blue glow on watch dials
2. Download highest resolution
3. Save to: `H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories\radium_dial_glow.jpg`

**Attribution**: CC BY-SA 3.0 (check specific image)
**Use in**: Ra, Bastet theory sections

---

### Image 4: Solar Barque (Book of the Dead)
**Visit**: https://commons.wikimedia.org/wiki/Category:Solar_barques_in_ancient_Egyptian_art
**Steps**:
1. Browse category for clear papyrus image
2. Select image showing Ra's boat with deities
3. Save to: `H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories\solar_barque_papyrus.jpg`

**Attribution**: Ancient artifact, Public Domain
**Use in**: Ra, Apep theory sections

---

### Image 5: Gas Mantle Glow (Thorium)
**Visit**: https://commons.wikimedia.org/wiki/File:Glowing_gas_mantle.JPG
**Steps**:
1. Click the link
2. Download image
3. Save to: `H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories\gas_mantle_thorium.jpg`

**Attribution**: CC BY-SA 3.0
**Use in**: Thoth theory section

---

## ✅ After Download - Verify Files

Run this in PowerShell to check:
```powershell
cd "H:\DaedalusSVN\WorldMythology\mythos\egyptian\theories"
Get-ChildItem *.svg, *.jpg, *.png | Select-Object Name, Length
```

Expected output:
```
Name                                Length
----                                ------
Denderah._Grand_temple._Crypte...   553554
NaqaLionTempleApedemakSnake.jpg     468543
Neith_Ra_Apep_Isotopes.png          2736522
thorium_decay_chain.svg             [NEW]
alpha_decay_diagram.svg             [NEW]
radium_dial_glow.jpg                [NEW]
solar_barque_papyrus.jpg            [NEW]
gas_mantle_thorium.jpg              [NEW]
```

---

## Integration Code Ready

Once downloaded, the images will be automatically integrated using the enhancement scripts.
All attributions are prepared in the deity HTML files.

