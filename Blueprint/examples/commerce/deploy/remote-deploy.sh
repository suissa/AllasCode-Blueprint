#!/usr/bin/env bash
set -euo pipefail
ENVIRONMENT="${1:?environment required}"
RELEASE="${2:?release required}"
[[ "$RELEASE" =~ ^v1\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || { echo 'invalid v1 release tag' >&2; exit 2; }
: "${DEPLOY_HOST:?DEPLOY_HOST required}" "${DEPLOY_USER:?DEPLOY_USER required}" "${DEPLOY_KEY:?DEPLOY_KEY required}"
KEY_FILE="$(mktemp)"; trap 'rm -f "$KEY_FILE"' EXIT
chmod 600 "$KEY_FILE"; printf '%s\n' "$DEPLOY_KEY" > "$KEY_FILE"
ssh -i "$KEY_FILE" -o BatchMode=yes -o StrictHostKeyChecking=yes "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "cd /opt/allascode/commerce/${ENVIRONMENT} && RELEASE_VERSION='${RELEASE}' docker compose --env-file production.env -f docker-compose.production.yml pull app && RELEASE_VERSION='${RELEASE}' docker compose --env-file production.env -f docker-compose.production.yml up -d --wait && ./migrate.sh '${RELEASE}' && ./smoke.sh"
