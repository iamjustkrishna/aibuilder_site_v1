$baseDir = "C:\Users\krish\Downloads\AIBuilder\Website\aibuilder_site_v1\app\api\admin\curated-videos"
$idDir = Join-Path $baseDir "[id]"

if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
    Write-Host "Created directory: $baseDir"
}

if (-not (Test-Path $idDir)) {
    New-Item -ItemType Directory -Path $idDir -Force | Out-Null
    Write-Host "Created directory: $idDir"
}

Write-Host "`n✅ All directories created successfully!"
