#!/usr/bin/env bash
# Align the running PM2 process with deploy/ecosystem.config.cjs.
#
# Identify the app by name (jehovahs-light), not numeric id 14.
# `pm2 reload 14` does not change an existing start command — the host
# process was historically `npm start` / `next start` while next.config
# uses output: 'standalone'.
#
# Sibling apps on this host must not be touched:
#   /var/www/html/ai.srdc.org.tw
#   /var/www/html/member.rsh-care.com
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

APP_NAME="jehovahs-light"
OLD_APP_NAME="jehovahs-light.ink.net.tw"
ECOSYSTEM="deploy/ecosystem.config.cjs"
INSPECT="deploy/pm2-inspect.cjs"
DEPLOY_PATH="${DEPLOY_PATH:-${ROOT}}"

export APP_NAME OLD_APP_NAME DEPLOY_PATH

if [ ! -f "${ECOSYSTEM}" ]; then
  echo "error: missing ${ECOSYSTEM}"
  exit 1
fi
if [ ! -f "${INSPECT}" ]; then
  echo "error: missing ${INSPECT}"
  exit 1
fi

command -v pm2 >/dev/null
command -v node >/dev/null

pwd_now="$(pwd -P)"
for forbidden in /var/www/html/ai.srdc.org.tw /var/www/html/member.rsh-care.com; do
  case "${pwd_now}" in
    "${forbidden}"|"${forbidden}"/*)
      echo "error: refused to touch sibling app path ${forbidden}"
      exit 1
      ;;
  esac
done

inspect_pm2() {
  # shellcheck disable=SC1090
  eval "$(pm2 jlist | node "${INSPECT}")"
}

print_migration() {
  local name="${1}"
  local id="${2}"
  echo "error: historical PM2 process still named '${name}' (id ${id}) at this path."
  echo "pm2 reload / startOrReload will not retarget a differently named process."
  echo "One-time host migration (this app only — never sibling srdc / member.rsh-care):"
  echo "  cd ${DEPLOY_PATH}"
  echo "  pm2 delete ${name}"
  echo "  pm2 start ${ECOSYSTEM}"
  echo "  pm2 save"
  echo "See docs/deploy.md."
}

inspect_pm2

if [ "${HAS_OLD_AT_PATH}" = "1" ]; then
  print_migration "${OLD_NAME}" "${OLD_ID}"
  exit 1
fi

if [ "${HAS_APP}" = "1" ]; then
  app_cwd_norm="${APP_CWD%/}"
  deploy_norm="${DEPLOY_PATH%/}"
  if [ "${app_cwd_norm}" != "${deploy_norm}" ]; then
    echo "error: PM2 app ${APP_NAME} cwd is ${APP_CWD}, expected ${DEPLOY_PATH}"
    echo "Aborting so sibling apps are not reloaded."
    pm2 show "${APP_NAME}" || true
    exit 1
  fi
fi

if [ -n "${ID14_NAME}" ] && [ "${ID14_NAME}" != "${APP_NAME}" ]; then
  echo "note: PM2 id 14 is named '${ID14_NAME}' (cwd=${ID14_CWD}); leaving it alone."
  echo "This deploy identifies the app by name ${APP_NAME} from ${ECOSYSTEM}."
fi

echo "Applying ${ECOSYSTEM} with startOrReload --update-env (name ${APP_NAME})."
echo "Reload of a numeric id is not enough to switch npm start → standalone."
pm2 startOrReload "${ECOSYSTEM}" --update-env

inspect_pm2

script_ok() {
  [ "${SCRIPT_STANDALONE}" = "1" ]
}

script_is_next_start() {
  [ "${SCRIPT_NEXT_START}" = "1" ]
}

if ! script_ok; then
  echo "startOrReload did not switch the process to standalone/with-env."
  echo "current script blob: ${APP_SCRIPT}"
  echo "Deleting ${APP_NAME} by name and starting from ecosystem."

  if [ "${HAS_APP}" != "1" ]; then
    echo "error: PM2 app ${APP_NAME} missing after startOrReload"
    pm2 list
    exit 1
  fi

  app_cwd_norm="${APP_CWD%/}"
  deploy_norm="${DEPLOY_PATH%/}"
  if [ "${app_cwd_norm}" != "${deploy_norm}" ]; then
    echo "error: refusing pm2 delete; ${APP_NAME} cwd is ${APP_CWD}"
    exit 1
  fi

  pm2 delete "${APP_NAME}"
  pm2 start "${ECOSYSTEM}" --update-env
  inspect_pm2
fi

if [ "${HAS_APP}" != "1" ]; then
  echo "error: PM2 app ${APP_NAME} is not running after ecosystem apply"
  pm2 list
  exit 1
fi

pm2 show "${APP_NAME}"

if script_is_next_start && ! script_ok; then
  echo "error: PM2 ${APP_NAME} is still next start / npm start after ecosystem apply"
  echo "script blob: ${APP_SCRIPT}"
  echo "Failing deploy so a public 502 is not left in place."
  exit 1
fi

if ! script_ok; then
  echo "error: PM2 ${APP_NAME} script does not mention standalone/server.js or with-env.sh"
  echo "script blob: ${APP_SCRIPT}"
  echo "Failing deploy so a public 502 is not left in place."
  exit 1
fi

echo "deploy pm2 ok: name=${APP_NAME} id=${APP_ID} script is standalone/with-env. PORT left unchanged in host .env."
