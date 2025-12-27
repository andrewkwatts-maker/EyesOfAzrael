# Batch 7 File Deletion Script
# Deletes all 103 HTML files from Batch 7 after Firebase migration
# WARNING: This action is IRREVERSIBLE

param(
    [switch]$WhatIf,
    [switch]$Force
)

$baseDir = "H:\Github\EyesOfAzrael"
$batchFile = Join-Path $baseDir "migration-batches\batch-7.json"
$deletedCount = 0
$failedCount = 0
$deletedFiles = @()
$failedFiles = @()

# Read batch configuration
Write-Host "Reading batch configuration..." -ForegroundColor Cyan
$batchData = Get-Content $batchFile | ConvertFrom-Json

$totalFiles = $batchData.files.Count
Write-Host "Found $totalFiles files to delete" -ForegroundColor Yellow

if (-not $Force) {
    Write-Host "`nWARNING: This will permanently delete $totalFiles HTML files!" -ForegroundColor Red
    Write-Host "Use -WhatIf to preview without deleting" -ForegroundColor Yellow
    Write-Host "Use -Force to confirm deletion`n" -ForegroundColor Yellow

    $confirm = Read-Host "Type 'DELETE' to continue, or press Enter to cancel"
    if ($confirm -ne "DELETE") {
        Write-Host "Deletion cancelled" -ForegroundColor Green
        exit
    }
}

Write-Host "`nProcessing files..." -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Gray

foreach ($fileInfo in $batchData.files) {
    $htmlFile = $fileInfo.html_file
    $fullPath = Join-Path $baseDir $htmlFile

    Write-Host "`n[$($deletedCount + $failedCount + 1)/$totalFiles] $htmlFile" -ForegroundColor White

    if (Test-Path $fullPath) {
        if ($WhatIf) {
            Write-Host "  [WHATIF] Would delete: $fullPath" -ForegroundColor Cyan
            $deletedCount++
            $deletedFiles += $htmlFile
        }
        else {
            try {
                Remove-Item $fullPath -Force
                Write-Host "  [DELETED] Successfully removed" -ForegroundColor Green
                $deletedCount++
                $deletedFiles += $htmlFile
            }
            catch {
                Write-Host "  [ERROR] Failed to delete: $_" -ForegroundColor Red
                $failedCount++
                $failedFiles += @{file = $htmlFile; error = $_.Exception.Message}
            }
        }
    }
    else {
        Write-Host "  [SKIP] File not found" -ForegroundColor Yellow
        $failedCount++
        $failedFiles += @{file = $htmlFile; error = "File not found"}
    }
}

# Summary
Write-Host "`n" ("=" * 80) -ForegroundColor Gray
Write-Host "`nDeletion Summary:" -ForegroundColor Cyan
Write-Host "  Total Files: $totalFiles"
if ($WhatIf) {
    Write-Host "  Would Delete: $deletedCount" -ForegroundColor Cyan
}
else {
    Write-Host "  Deleted: $deletedCount" -ForegroundColor Green
}
Write-Host "  Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) {"Red"} else {"Green"})

if ($failedCount -gt 0) {
    Write-Host "`nFailed Files:" -ForegroundColor Red
    foreach ($failed in $failedFiles) {
        Write-Host "  - $($failed.file): $($failed.error)" -ForegroundColor Red
    }
}

# Create deletion log
$logFile = Join-Path $baseDir "batch7_deletion_log.json"
$logData = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    whatif = $WhatIf.IsPresent
    total = $totalFiles
    deleted = $deletedCount
    failed = $failedCount
    deleted_files = $deletedFiles
    failed_files = $failedFiles
}

$logData | ConvertTo-Json -Depth 10 | Set-Content $logFile
Write-Host "`nLog saved to: $logFile" -ForegroundColor Cyan

if ($WhatIf) {
    Write-Host "`nThis was a preview. Use -Force to actually delete files." -ForegroundColor Yellow
}
else {
    Write-Host "`nDeletion complete!" -ForegroundColor Green
}
