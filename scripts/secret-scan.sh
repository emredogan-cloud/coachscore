#!/usr/bin/env bash
#
# Lightweight committed-secret guard. Scans tracked files for high-confidence
# secret VALUE patterns (not variable names) and fails if any are found.
#
# Fast, free, and private-repo-compatible — a CI backstop on top of GitHub's
# native push protection. It matches credential value formats, so referencing a
# variable NAME (e.g. ANTHROPIC_API_KEY) in .env.example or code does not trip
# it. This script and the env template are excluded (they contain the patterns
# themselves, by design).
#
set -euo pipefail

# High-confidence secret value patterns.
patterns=(
  'sk-ant-[A-Za-z0-9_-]{20,}'          # Anthropic API key
  'sk_live_[A-Za-z0-9]{20,}'           # Stripe live secret key
  'sk_test_[A-Za-z0-9]{20,}'           # Stripe test secret key
  'rk_live_[A-Za-z0-9]{20,}'           # Stripe restricted key
  'whsec_[A-Za-z0-9]{20,}'             # Stripe webhook signing secret
  'AKIA[0-9A-Z]{16}'                   # AWS access key id
  'ghp_[A-Za-z0-9]{36}'                # GitHub personal access token
  'gho_[A-Za-z0-9]{36}'                # GitHub OAuth token
  'glpat-[A-Za-z0-9_-]{20,}'           # GitLab personal access token
  'PRIVATE KEY-----'                   # PEM private key block
)

# Collect tracked files, NUL-delimited to be safe with odd names.
mapfile -d '' -t all < <(git ls-files -z)

files=()
for f in "${all[@]}"; do
  case "$f" in
    .env.example | pnpm-lock.yaml | scripts/secret-scan.sh) continue ;;
    *.md) continue ;;
  esac
  files+=("$f")
done

if [[ ${#files[@]} -eq 0 ]]; then
  echo "Committed-secret scan: no tracked files to scan."
  exit 0
fi

found=0
for pattern in "${patterns[@]}"; do
  if matches=$(grep -nEI "$pattern" "${files[@]}" 2>/dev/null); then
    echo "::error::Potential secret matching /$pattern/ found:"
    echo "$matches"
    found=1
  fi
done

if [[ "$found" -ne 0 ]]; then
  echo "Committed-secret scan FAILED. Remove secrets and use environment variables."
  exit 1
fi

echo "Committed-secret scan passed: no secret value patterns in ${#files[@]} tracked files."
