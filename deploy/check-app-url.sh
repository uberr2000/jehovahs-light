#!/usr/bin/env bash
# Validate NEXT_PUBLIC_APP_URL from a host .env without sourcing the file.
# next build bakes this value in; a placeholder would ship fake share URLs.
#
# Usage: check-app-url.sh <env-file>
# Prints only the parsed hostname on success, or a rule name on failure.
# Never prints the raw line, the full URL, or any other .env key.
#
# Disable xtrace so `set -x` in a caller cannot leak the value if this
# file is ever sourced. A normal `bash this.sh` starts with xtrace off.
set +x
set -euo pipefail

echo_err() {
  printf '%s\n' "$1"
}

if [ "${1:-}" = "" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL guard requires an .env path argument"
  exit 1
fi

ENV_FILE="$1"

if [ ! -f "${ENV_FILE}" ]; then
  echo_err "error: .env is missing"
  exit 1
fi

# Last matching assignment only. Do not source. Do not print the line.
# Optional `export`, optional whitespace, optional quotes (stripped later).
last_line="$(
  grep -E '^[[:space:]]*(export[[:space:]]+)?NEXT_PUBLIC_APP_URL[[:space:]]*=' \
    "${ENV_FILE}" | tail -n 1 || true
)"

if [ -z "${last_line}" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL is missing or empty"
  exit 1
fi

value="${last_line#*=}"
# Trim leading/trailing whitespace.
value="${value#"${value%%[![:space:]]*}"}"
value="${value%"${value##*[![:space:]]}"}"

if [ -z "${value}" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL is missing or empty"
  exit 1
fi

# Strip one matching pair of surrounding quotes, then trim again.
case "${value}" in
  \"*\")
    value="${value#\"}"
    value="${value%\"}"
    ;;
  \'*\')
    value="${value#\'}"
    value="${value%\'}"
    ;;
  *)
    # Unquoted trailing comment.
    case "${value}" in
      *[[:space:]]#*)
        value="${value%%[[:space:]]#*}"
        ;;
    esac
    ;;
esac
value="${value#"${value%%[![:space:]]*}"}"
value="${value%"${value##*[![:space:]]}"}"

if [ -z "${value}" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL is missing or empty"
  exit 1
fi

# Reject embedded whitespace (not a single URL).
case "${value}" in
  *[[:space:]]*)
    echo_err "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
    exit 1
    ;;
esac

case "${value}" in
  https://*)
    ;;
  *)
    echo_err "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
    exit 1
    ;;
esac

rest="${value#https://}"
authority="${rest%%/*}"
authority="${authority%%\?*}"
authority="${authority%%#*}"

if [ -z "${authority}" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
  exit 1
fi

# Drop userinfo if present; never print it.
case "${authority}" in
  *@*)
    hostport="${authority##*@}"
    ;;
  *)
    hostport="${authority}"
    ;;
esac

# IPv6 in brackets, optional :port after ].
case "${hostport}" in
  \[*\])
    host="${hostport#\[}"
    host="${host%\]}"
    ;;
  \[*\]:*)
    host="${hostport#\[}"
    host="${host%%\]*}"
    ;;
  *)
    host="${hostport%%:*}"
    ;;
esac

if [ -z "${host}" ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
  exit 1
fi

host="$(printf '%s' "${host}" | tr '[:upper:]' '[:lower:]')"

blocked=0
case "${host}" in
  your-domain.com|example.com|example.invalid|localhost|0.0.0.0)
    blocked=1
    ;;
  *.example|*.invalid|*.test|*.localhost)
    blocked=1
    ;;
  127.*)
    blocked=1
    ;;
esac

if [ "${blocked}" -eq 1 ]; then
  echo_err "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
  exit 1
fi

printf 'NEXT_PUBLIC_APP_URL host: %s\n' "${host}"
