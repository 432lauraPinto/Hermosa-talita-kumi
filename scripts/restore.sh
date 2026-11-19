#!/bin/sh
# =====================================================================
# SCRIPT DE RESTAURACIÓN DE RESPALDO — HERMOSA TALITA KUMI
# Restaura base de datos MySQL e imágenes desde un archivo de respaldo
# =====================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root_secret_pass_2026}"
DB_NAME="${DB_NAME:-estetica_db}"

if [ -z "$1" ]; then
  echo "Uso: $0 <archivo_respaldo.sql.gz> [archivo_uploads.tar.gz]"
  echo "Archivos disponibles en $BACKUP_DIR:"
  ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No se encontraron respaldos .sql.gz"
  exit 1
fi

SQL_BACKUP="$1"
UPLOADS_BACKUP="$2"

echo "=== INICIANDO RESTAURACIÓN DE RESPALDO ==="
echo "Archivo SQL: $SQL_BACKUP"

if [ ! -f "$SQL_BACKUP" ]; then
  echo "ERROR: El archivo $SQL_BACKUP no existe."
  exit 1
fi

# 1. Restaurar Base de Datos MySQL
echo "Restaurando base de datos $DB_NAME..."
gunzip -c "$SQL_BACKUP" | mysql --host="$DB_HOST" \
                                --user="$DB_USER" \
                                --password="$DB_PASSWORD" \
                                --default-character-set=utf8mb4 \
                                "$DB_NAME"

echo "Base de datos restaurada correctamente."

# 2. Restaurar Imágenes (si se especifica)
if [ -n "$UPLOADS_BACKUP" ] && [ -f "$UPLOADS_BACKUP" ]; then
  TARGET_UPLOADS="${UPLOADS_DIR:-/app/uploads}"
  mkdir -p "$TARGET_UPLOADS"
  echo "Restaurando imágenes a $TARGET_UPLOADS..."
  tar -xzf "$UPLOADS_BACKUP" -C "$TARGET_UPLOADS"
  echo "Imágenes restauradas correctamente."
fi

echo "=== RESTAURACIÓN FINALIZADA CON ÉXITO ==="
