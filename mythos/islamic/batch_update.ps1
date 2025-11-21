# Batch update Islamic mythology HTML files with theme CSS variables

$baseDir = "H:\DaedalusSVN\PlayTow\EOAPlot\docs\mythos\islamic"

$files = @(
    "cosmology\afterlife.html",
    "cosmology\index.html",
    "cosmology\tawhid.html",
    "creatures\jinn.html",
    "deities\index.html",
    "deities\muhammad.html",
    "herbs\index.html",
    "heroes\ibrahim.html",
    "heroes\index.html",
    "heroes\musa.html",
    "rituals\salat.html"
)

$replacements = @{
    # Backgrounds
    'background: rgba\(0, 128, 0, 0\.05\)' = 'background: var(--color-surface); backdrop-filter: blur(10px)'
    'background: rgba\(0, 128, 0, 0\.03\)' = 'background: var(--color-surface); backdrop-filter: blur(10px)'
    'background: rgba\(255, 193, 7, 0\.1\)' = 'background: var(--color-surface); backdrop-filter: blur(10px)'

    # Borders
    'border: 1px solid rgba\(0, 128, 0, 0\.[23]\)' = 'border: 2px solid var(--color-border)'
    'border-left: 4px solid var\(--mythos-primary\)' = 'border-left: 4px solid var(--color-primary)'
    'border-left: 3px solid var\(--mythos-secondary\)' = 'border-left: 4px solid var(--color-secondary)'

    # Spacing - Padding
    'padding: 1rem(?![0-9])' = 'padding: var(--space-4)'
    'padding: 1\.5rem' = 'padding: var(--space-6)'
    'padding: 2rem' = 'padding: var(--space-8)'
    'padding: 3rem 2rem' = 'padding: var(--space-12) var(--space-8)'

    # Spacing - Margin
    'margin: 1rem 0' = 'margin: var(--space-4) 0'
    'margin: 1\.5rem 0' = 'margin: var(--space-6) 0'
    'margin: 2rem 0' = 'margin: var(--space-8) 0'
    'margin-bottom: 1rem' = 'margin-bottom: var(--space-4)'
    'margin-bottom: 2rem' = 'margin-bottom: var(--space-8)'
    'margin-bottom: 3rem' = 'margin-bottom: var(--space-12)'
    'margin-top: 1rem' = 'margin-top: var(--space-4)'
    'margin-top: 1\.5rem' = 'margin-top: var(--space-6)'
    'margin-top: 2rem' = 'margin-top: var(--space-8)'
    'margin-top: 3rem' = 'margin-top: var(--space-12)'

    # Gap
    'gap: 0\.5rem' = 'gap: var(--space-2)'
    'gap: 1rem' = 'gap: var(--space-4)'

    # Border radius
    'border-radius: 6px' = 'border-radius: var(--radius-md)'
    'border-radius: 8px' = 'border-radius: var(--radius-lg)'
    'border-radius: 10px' = 'border-radius: var(--radius-xl)'
    'border-radius: 15px' = 'border-radius: var(--radius-2xl)'
    'border-radius: 20px' = 'border-radius: var(--radius-full)'

    # Typography
    'font-size: 0\.85rem' = 'font-size: var(--text-sm)'
    'font-size: 0\.9rem' = 'font-size: var(--text-sm)'
    'font-size: 1\.1rem' = 'font-size: var(--text-lg)'
    'font-size: 1\.2rem' = 'font-size: var(--text-xl)'
    'font-size: 1\.3rem' = 'font-size: var(--text-2xl)'
    'font-size: 1\.5rem' = 'font-size: var(--text-2xl)'
    'font-size: 4rem' = 'font-size: var(--text-5xl)'
    'font-weight: bold' = 'font-weight: var(--font-bold)'
    'line-height: 1\.8' = 'line-height: var(--leading-relaxed)'
    'line-height: 2' = 'line-height: var(--leading-loose)'

    # Colors
    'color: #666' = 'color: var(--color-text-secondary)'
    'color: var\(--mythos-primary\)' = 'color: var(--color-primary)'
    'color: var\(--mythos-secondary\)' = 'color: var(--color-secondary)'
    'color: white(?![a-z])' = 'color: var(--color-text-primary)'
}

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $filePath = Join-Path $baseDir $file

    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Green

        $content = Get-Content $filePath -Raw -Encoding UTF8
        $originalContent = $content
        $fileReplacements = 0

        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $newContent = $content -replace $pattern, $replacement

            if ($newContent -ne $content) {
                $matches = [regex]::Matches($content, $pattern)
                $fileReplacements += $matches.Count
                $content = $newContent
            }
        }

        if ($content -ne $originalContent) {
            Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline
            $totalFiles++
            $totalReplacements += $fileReplacements
            Write-Host "  Replaced $fileReplacements patterns" -ForegroundColor Cyan
        } else {
            Write-Host "  No changes needed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Magenta
Write-Host "Total files modified: $totalFiles" -ForegroundColor Green
Write-Host "Total CSS replacements: $totalReplacements" -ForegroundColor Green
