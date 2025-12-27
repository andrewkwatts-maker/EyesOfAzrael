# Delete Batch 8 HTML Files
# Safe deletion of redundant HTML files (content preserved in Firebase)

$batch = Get-Content -Path "H:\Github\EyesOfAzrael\migration-batches\batch-8.json" | ConvertFrom-Json
$baseDir = "H:\Github\EyesOfAzrael"

$deletedCount = 0
$notFoundCount = 0
$deletions = @()

Write-Host "Deleting Batch 8 HTML Files (103 files)"
Write-Host ("=" * 60)
Write-Host "Content is preserved in Firebase Firestore"
Write-Host ("=" * 60)
Write-Host ""

foreach ($fileInfo in $batch.files) {
    $htmlPath = Join-Path $baseDir $fileInfo.html_file
    $fileNum = $deletions.Count + 1

    Write-Host "[$fileNum/103] $($fileInfo.html_file)"

    if (Test-Path $htmlPath) {
        try {
            Remove-Item -Path $htmlPath -Force
            $deletedCount++
            $deletions += @{
                file = $fileInfo.html_file
                status = "DELETED"
                collection = $fileInfo.firebase_collection
                assetId = $fileInfo.firebase_asset_id
                migrationPct = $fileInfo.migration_percentage
            }
            Write-Host "  ✓ Deleted" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
            $deletions += @{
                file = $fileInfo.html_file
                status = "ERROR"
                error = $_.Exception.Message
            }
        }
    } else {
        $notFoundCount++
        $deletions += @{
            file = $fileInfo.html_file
            status = "NOT_FOUND"
        }
        Write-Host "  - Not found (already deleted?)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 60)
Write-Host "Deletion Complete!"
Write-Host "Deleted: $deletedCount"
Write-Host "Not Found: $notFoundCount"
Write-Host "Total Processed: 103"

# Save deletion log
$log = @{
    batchNumber = 8
    totalFiles = 103
    deletedCount = $deletedCount
    notFoundCount = $notFoundCount
    avgMigrationPct = $batch.avg_migration_pct
    deletions = $deletions
    completedAt = (Get-Date -Format o)
    note = "Content preserved in Firebase Firestore - HTML files were redundant"
} | ConvertTo-Json -Depth 10

$log | Out-File -FilePath "H:\Github\EyesOfAzrael\batch8-deletion-log.json" -Encoding UTF8

Write-Host ""
Write-Host "Deletion log saved to: batch8-deletion-log.json"
