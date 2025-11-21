#!/bin/bash
# Batch update Islamic mythology HTML files with theme CSS variables

FILES=(
    "cosmology/afterlife.html"
    "cosmology/index.html"
    "cosmology/tawhid.html"
    "creatures/jinn.html"
    "deities/index.html"
    "deities/muhammad.html"
    "herbs/index.html"
    "heroes/ibrahim.html"
    "heroes/index.html"
    "heroes/musa.html"
    "rituals/salat.html"
)

cd "H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\islamic" || exit

echo "Applying theme CSS variable replacements..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"

        # Backup
        cp "$file" "$file.bak"

        # Apply replacements using sed (Windows compatible)
        sed -i 's/background: rgba(0, 128, 0, 0\.05)/background: var(--color-surface); backdrop-filter: blur(10px)/g' "$file"
        sed -i 's/background: rgba(0, 128, 0, 0\.03)/background: var(--color-surface); backdrop-filter: blur(10px)/g' "$file"
        sed -i 's/border: 1px solid rgba(0, 128, 0, 0\.[23])/border: 2px solid var(--color-border)/g' "$file"
        sed -i 's/padding: 1rem/padding: var(--space-4)/g' "$file"
        sed -i 's/padding: 1\.5rem/padding: var(--space-6)/g' "$file"
        sed -i 's/padding: 2rem/padding: var(--space-8)/g' "$file"
        sed -i 's/padding: 3rem 2rem/padding: var(--space-12) var(--space-8)/g' "$file"
        sed -i 's/margin: 1rem 0/margin: var(--space-4) 0/g' "$file"
        sed -i 's/margin: 1\.5rem 0/margin: var(--space-6) 0/g' "$file"
        sed -i 's/margin-bottom: 1rem/margin-bottom: var(--space-4)/g' "$file"
        sed -i 's/margin-bottom: 2rem/margin-bottom: var(--space-8)/g' "$file"
        sed -i 's/margin-top: 1\.5rem/margin-top: var(--space-6)/g' "$file"
        sed -i 's/margin-top: 2rem/margin-top: var(--space-8)/g' "$file"
        sed -i 's/margin-top: 3rem/margin-top: var(--space-12)/g' "$file"
        sed -i 's/gap: 1rem/gap: var(--space-4)/g' "$file"
        sed -i 's/border-radius: 8px/border-radius: var(--radius-lg)/g' "$file"
        sed -i 's/border-radius: 10px/border-radius: var(--radius-xl)/g' "$file"
        sed -i 's/border-radius: 15px/border-radius: var(--radius-2xl)/g' "$file"
        sed -i 's/border-radius: 20px/border-radius: var(--radius-full)/g' "$file"
        sed -i 's/font-size: 0\.85rem/font-size: var(--text-sm)/g' "$file"
        sed -i 's/font-size: 1\.1rem/font-size: var(--text-lg)/g' "$file"
        sed -i 's/font-size: 1\.3rem/font-size: var(--text-2xl)/g' "$file"
        sed -i 's/font-size: 4rem/font-size: var(--text-5xl)/g' "$file"
        sed -i 's/font-weight: bold/font-weight: var(--font-bold)/g' "$file"
        sed -i 's/line-height: 1\.8/line-height: var(--leading-relaxed)/g' "$file"
        sed -i 's/line-height: 2/line-height: var(--leading-loose)/g' "$file"
        sed -i 's/color: #666/color: var(--color-text-secondary)/g' "$file"
       sed -i 's/color: var(--mythos-primary)/color: var(--color-primary)/g' "$file"
        sed -i 's/color: var(--mythos-secondary)/color: var(--color-secondary)/g' "$file"
    fi
done

echo "Done! Backups saved with .bak extension"
