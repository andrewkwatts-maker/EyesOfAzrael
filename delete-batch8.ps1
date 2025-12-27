$json = Get-Content 'H:\Github\EyesOfAzrael\migration-batches\batch-8.json' | ConvertFrom-Json
$deleted = 0
$notfound = 0

foreach ($item in $json.files) {
    $path = "H:\Github\EyesOfAzrael\$($item.html_file)"
    if (Test-Path $path) {
        Remove-Item $path -Force
        $deleted++
        Write-Host "Deleted: $($item.html_file)"
    } else {
        $notfound++
        Write-Host "Not found: $($item.html_file)"
    }
}

Write-Host ""
Write-Host "Complete! Deleted: $deleted | Not Found: $notfound"
