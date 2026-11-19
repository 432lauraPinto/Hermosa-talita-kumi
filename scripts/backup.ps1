# =====================================================================
# SCRIPT DE RESPALDO POWERSHELL — HERMOSA TALITA KUMI (WINDOWS)
# =====================================================================
param (
    [string]$BackupDir = "./backups",
    [int]$RetentionDays = 7
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetDir = Resolve-Path $BackupDir -ErrorAction SilentlyContinue

if (-not $targetDir) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    $targetDir = Resolve-Path $BackupDir
}

Write-Host "=== INICIANDO RESPALDO POWERSHELL: $timestamp ===" -ForegroundColor Cyan

# 1. Respaldo de SQLite local si existe
$sqliteDb = "./backend/data/estetica.sqlite"
if (Test-Path $sqliteDb) {
    $dbBackup = Join-Path $targetDir "db_sqlite_$timestamp.sqlite"
    Copy-Item $sqliteDb $dbBackup
    Write-Host "Copia de seguridad de base de datos local guardada en: $dbBackup" -ForegroundColor Green
}

# 2. Respaldo de carpeta de uploads
$uploadsFolder = "./backend/uploads"
if (Test-Path $uploadsFolder) {
    $zipBackup = Join-Path $targetDir "uploads_$timestamp.zip"
    Compress-Archive -Path "$uploadsFolder/*" -DestinationPath $zipBackup -Force
    Write-Host "Imágenes comprimidas en: $zipBackup" -ForegroundColor Green
}

# 3. Metadatos de respaldo
$metadata = @{
    timestamp = $timestamp
    created_at = (Get-Date).ToString("o")
    timezone = "America/La_Paz"
    status = "SUCCESS"
} | ConvertTo-Json

Set-Content -Path (Join-Path $targetDir "last_backup.json") -Value $metadata
Write-Host "Metadatos registrados en last_backup.json" -ForegroundColor Green
Write-Host "=== RESPALDO COMPLETADO ===" -ForegroundColor Cyan
