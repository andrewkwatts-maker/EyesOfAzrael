# Batch 8 Migration Script
$ErrorActionPreference = "Continue"
$batch = Get-Content -Path "H:\Github\EyesOfAzrael\migration-batches\batch-8.json" | ConvertFrom-Json
$baseDir = "H:\Github\EyesOfAzrael"
$firebaseProject = "eyesofazrael"
$firebaseUrl = "https://$firebaseProject-default-rtdb.firebaseio.com"

$migrations = @()
$successCount = 0
$errorCount = 0

function Extract-HTMLContent {
    param([string]$html, [string]$filepath)

    if ($html -match '(?s)<main[^>]*>(.*?)</main>') {
        $mainContent = $matches[1]
    } else {
        $mainContent = $html
    }

    $title = if ($html -match '<title>([^<]+)</title>') { $matches[1].Trim() } else { "" }
    $h1 = if ($html -match '<h1[^>]*>([^<]+)</h1>') { $matches[1] -replace '<[^>]+>', '' } else { "" }

    return @{
        title = $title
        heading = $h1.Trim()
        mainContent = $mainContent.Substring(0, [Math]::Min(5000, $mainContent.Length))
        extractedAt = (Get-Date -Format o)
    }
}

function Update-Firebase {
    param([string]$collection, [string]$assetId, [hashtable]$data)

    $url = "$firebaseUrl/$collection/$assetId.json"
    $json = $data | ConvertTo-Json -Depth 10 -Compress

    try {
        $response = Invoke-RestMethod -Uri $url -Method Patch -Body $json -ContentType "application/json"
        return $true
    } catch {
        Write-Host "Firebase error: $_"
        return $false
    }
}

Write-Host "Starting Batch 8 Migration"
Write-Host ("=" * 60)

foreach ($fileInfo in $batch.files) {
    $htmlPath = Join-Path $baseDir $fileInfo.html_file
    $fileNum = $migrations.Count + 1

    Write-Host "[$fileNum/$($batch.files.Count)] $($fileInfo.html_file)"

    try {
        if (-not (Test-Path $htmlPath)) {
            throw "File not found"
        }

        $html = Get-Content -Path $htmlPath -Raw -Encoding UTF8
        $content = Extract-HTMLContent -html $html -filepath $htmlPath

        $firebaseData = @{
            htmlMigration = @{
                originalFile = $fileInfo.html_file
                extractedContent = $content.mainContent
                title = $content.title
                migratedAt = $content.extractedAt
                migrationBatch = 8
            }
        }

        $updated = Update-Firebase -collection $fileInfo.firebase_collection -assetId $fileInfo.firebase_asset_id -data $firebaseData

        if ($updated) {
            Remove-Item -Path $htmlPath -Force
            $successCount++
            $migrations += @{
                file = $fileInfo.html_file
                status = "SUCCESS"
                collection = $fileInfo.firebase_collection
                assetId = $fileInfo.firebase_asset_id
            }
            Write-Host "  OK - Migrated and deleted" -ForegroundColor Green
        } else {
            throw "Firebase update failed"
        }

    } catch {
        $errorCount++
        $migrations += @{
            file = $fileInfo.html_file
            status = "ERROR"
            error = $_.Exception.Message
        }
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 100
}

$report = @{
    batchNumber = 8
    totalFiles = $batch.files.Count
    successCount = $successCount
    errorCount = $errorCount
    migrations = $migrations
    completedAt = (Get-Date -Format o)
} | ConvertTo-Json -Depth 10

$report | Out-File -FilePath "H:\Github\EyesOfAzrael\BATCH8_MIGRATION_LOG.json" -Encoding UTF8

Write-Host ""
Write-Host ("=" * 60)
Write-Host "Migration Complete!"
Write-Host "Success: $successCount"
Write-Host "Errors: $errorCount"
