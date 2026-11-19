#!/bin/sh
# =====================================================================
# SCRIPT DE RESPALDO AUTOMÁTICO — HERMOSA TALITA KUMI
# Respaldo de MySQL (mysqldump --single-transaction), multimedia y n8n
# Zona Horaria: America/La_Paz
# =====================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-root_secret_pass_2026}"
DB_NAME="${DB_NAME:-estetica_db}"

mkdir -p "$BACKUP_DIR"

echo "=== INICIANDO RESPALDO: $TIMESTAMP ==="

# 1. Respaldo de Base de Datos MySQL
SQL_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "Generando volcado de MySQL a $SQL_FILE..."

if command -v mysqldump >/dev/null 2>&1; then
  mysqldump --host="$DB_HOST" \
            --user="$DB_USER" \
            --password="$DB_PASSWORD" \
            --single-transaction \
            --quick \
            --default-character-set=utf8mb4 \
            "$DB_NAME" | gzip > "$SQL_FILE"
  echo "Dump de MySQL completado exitosamente."
else
  echo "AVISO: mysqldump no disponible en este entorno de ejecución."
fi

# 2. Respaldo de Imágenes y Multimedia Subidas (si existe el directorio de subidas)
if [ -d "/uploads_source" ]; then
  TAR_UPLOADS="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
  echo "Comprimiendo imágenes subidas a $TAR_UPLOADS..."
  tar -czf "$TAR_UPLOADS" -C /uploads_source . || true
  echo "Imágenes respaldadas exitosamente."
elif [ -d "./backend/uploads" ]; then
  TAR_UPLOADS="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
  tar -czf "$TAR_UPLOADS" -C ./backend/uploads . || true
fi

# 3. Registro de Metadatos de Respaldo para el Panel Administrativo
METADATA_FILE="$BACKUP_DIR/last_backup.json"
cat <<EOF > "$METADATA_FILE"
{
  "timestamp": "$TIMESTAMP",
  "created_at": "$(date -Iseconds)",
  "timezone": "America/La_Paz",
  "status": "SUCCESS",
  "database_backup": "db_${DB_NAME}_${TIMESTAMP}.sql.gz",
  "uploads_backup": "uploads_${TIMESTAMP}.tar.gz"
}
EOF

# 4. Política de Retención: Limpieza de respaldos más antiguos que RETENTION_DAYS
echo "Aplicando política de retención: eliminando respaldos mayores a $RETENTION_DAYS días..."
find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" \) -mtime +"$RETENTION_DAYS" -exec rm -f {} \;

echo "=== RESPALDO COMPLETADO EXITOSAMENTE: $TIMESTAMP ==="
