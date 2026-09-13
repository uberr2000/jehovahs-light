#!/usr/bin/env bash
# Source repo-root .env, then exec the remaining command.
# PM2 uses this so PORT (and other vars) come from .env, not package.json.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "error: missing ${ENV_FILE} (copy .env.example and set PORT)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

if [[ -z "${PORT:-}" ]]; then
  echo "error: PORT is not set in ${ENV_FILE}" >&2
  exit 1
fi

if [[ "$#" -eq 0 ]]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 1
fi

exec "$@"
