#!/usr/bin/env bash
# Fixture tests for deploy/check-app-url.sh. No secrets in fixtures.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK="${ROOT}/deploy/check-app-url.sh"
FIXTURES="${ROOT}/deploy/testdata/app-url"
PASS_LOG="NEXT_PUBLIC_APP_URL host: jehovahs-light.ink.net.tw"

failed=0
passed=0

assert_pass() {
  local name="$1"
  local file="$2"
  local out
  if ! out="$(bash "${CHECK}" "${file}" 2>&1)"; then
    echo "FAIL ${name}: expected exit 0, got non-zero"
    echo "  output: ${out}"
    failed=$((failed + 1))
    return
  fi
  if [ "${out}" != "${PASS_LOG}" ]; then
    echo "FAIL ${name}: unexpected pass log"
    echo "  expected: ${PASS_LOG}"
    echo "  actual:   ${out}"
    failed=$((failed + 1))
    return
  fi
  echo "PASS ${name}"
  passed=$((passed + 1))
}

assert_fail() {
  local name="$1"
  local file="$2"
  local expected="$3"
  local out
  local rc=0
  out="$(bash "${CHECK}" "${file}" 2>&1)" || rc=$?
  if [ "${rc}" -eq 0 ]; then
    echo "FAIL ${name}: expected non-zero exit"
    echo "  output: ${out}"
    failed=$((failed + 1))
    return
  fi
  if [ "${out}" != "${expected}" ]; then
    echo "FAIL ${name}: unexpected fail log"
    echo "  expected: ${expected}"
    echo "  actual:   ${out}"
    failed=$((failed + 1))
    return
  fi
  # Guard must not echo a raw assignment or a full URL. The fail
  # reason may mention the scheme as text (`https:// URL`).
  case "${out}" in
    *NEXT_PUBLIC_APP_URL=*|*http://*|*https://[a-zA-Z0-9]*)
      echo "FAIL ${name}: output leaked a URL or raw assignment"
      echo "  output: ${out}"
      failed=$((failed + 1))
      return
      ;;
  esac
  echo "PASS ${name}"
  passed=$((passed + 1))
}

assert_pass "plain" "${FIXTURES}/pass-plain.env"
assert_pass "double-quoted" "${FIXTURES}/pass-quoted.env"
assert_pass "single-quoted" "${FIXTURES}/pass-single-quoted.env"
assert_pass "whitespace" "${FIXTURES}/pass-whitespace.env"
assert_pass "export" "${FIXTURES}/pass-export.env"
assert_pass "last-wins" "${FIXTURES}/pass-last-wins.env"
assert_pass "path" "${FIXTURES}/pass-path.env"

assert_fail "missing-file" "${FIXTURES}/does-not-exist.env" \
  "error: .env is missing"
assert_fail "missing-key" "${FIXTURES}/fail-missing-key.env" \
  "error: NEXT_PUBLIC_APP_URL is missing or empty"
assert_fail "empty" "${FIXTURES}/fail-empty.env" \
  "error: NEXT_PUBLIC_APP_URL is missing or empty"
assert_fail "http" "${FIXTURES}/fail-http.env" \
  "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
assert_fail "no-host" "${FIXTURES}/fail-no-host.env" \
  "error: NEXT_PUBLIC_APP_URL must be an https:// URL with a host"
assert_fail "your-domain.com" "${FIXTURES}/fail-your-domain.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "example.com" "${FIXTURES}/fail-example-com.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "example.invalid" "${FIXTURES}/fail-example-invalid.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "*.example" "${FIXTURES}/fail-star-example.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "*.invalid" "${FIXTURES}/fail-star-invalid.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "*.test" "${FIXTURES}/fail-star-test.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "*.localhost" "${FIXTURES}/fail-star-localhost.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "localhost" "${FIXTURES}/fail-localhost.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "127.x" "${FIXTURES}/fail-loopback.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"
assert_fail "0.0.0.0" "${FIXTURES}/fail-unspecified.env" \
  "error: NEXT_PUBLIC_APP_URL host is a placeholder or local address"

# `set -x` / `bash -x` must not leak the raw value after the script starts.
xout="$(bash -x "${CHECK}" "${FIXTURES}/pass-plain.env" 2>&1)" || true
case "${xout}" in
  *https://jehovahs-light.ink.net.tw*)
    echo "FAIL xtrace-leak: bash -x printed the raw URL"
    failed=$((failed + 1))
    ;;
  *)
    echo "PASS xtrace-leak"
    passed=$((passed + 1))
    ;;
esac

echo
echo "${passed} passed, ${failed} failed"
if [ "${failed}" -ne 0 ]; then
  exit 1
fi
