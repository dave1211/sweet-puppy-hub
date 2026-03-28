#!/usr/bin/env bash
set -euo pipefail

REPORT="sentinel-report.json"
FINDINGS="[]"
BLOCKED=false
EXIT_CODE=0

add_finding() {
  local severity="$1" issue="$2" file="$3" fixed="$4" blocked="$5" recommendation="$6"
  FINDINGS=$(echo "$FINDINGS" | jq --arg s "$severity" --arg i "$issue" --arg f "$file" \
    --arg fx "$fixed" --arg b "$blocked" --arg r "$recommendation" \
    '. + [{"severity":$s,"issue":$i,"file":$f,"fixed_automatically":($fx=="true"),"blocked":($b=="true"),"recommendation":$r}]')
  if [ "$blocked" = "true" ]; then
    BLOCKED=true
    EXIT_CODE=1
  fi
}

echo "🛡️  Tanner Sentinel — Security Scan"
echo "===================================="
echo ""

# -------------------------------------------------------
# 1. HARD BLOCKS — Fail CI immediately
# -------------------------------------------------------

echo "[1/8] Checking hard blocks..."

# Live mode default enabled
if grep -rn 'liveEnabled:\s*true' src/lib/executionEngine.ts 2>/dev/null | grep -q 'DEFAULT_SAFEGUARDS' ; then
  add_finding "critical" "LIVE trading default changed to enabled" "src/lib/executionEngine.ts" "false" "true" "Revert liveEnabled to false in DEFAULT_SAFEGUARDS"
fi

# Emergency stop removed
if ! grep -q 'triggerEmergencyStop' src/lib/executionEngine.ts 2>/dev/null; then
  add_finding "critical" "Emergency stop function removed" "src/lib/executionEngine.ts" "false" "true" "Restore triggerEmergencyStop function"
fi

# Max trade size removed
if ! grep -q 'maxTradeSOL' src/lib/executionEngine.ts 2>/dev/null; then
  add_finding "critical" "Max trade size safeguard removed" "src/lib/executionEngine.ts" "false" "true" "Restore maxTradeSOL safeguard"
fi

# Service role key in frontend
if grep -rn 'SUPABASE_SERVICE_ROLE_KEY\|service_role' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'node_modules' | grep -v '.d.ts' | head -5 | grep -q .; then
  LEAK_FILES=$(grep -rln 'SUPABASE_SERVICE_ROLE_KEY\|service_role' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'node_modules' | head -5 | tr '\n' ', ')
  add_finding "critical" "Service role key referenced in frontend code" "$LEAK_FILES" "false" "true" "Remove service role references from frontend"
fi

# VITE_ secret misuse
if grep -rn 'VITE_.*SECRET\|VITE_.*SERVICE_ROLE\|VITE_.*PRIVATE_KEY' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'node_modules' | head -5 | grep -q .; then
  add_finding "critical" "Private secret exposed via VITE_ prefix" "src/" "false" "true" "Remove private secrets from VITE_ environment variables"
fi

# Wallet private key logic
if grep -rn 'privateKey\|private_key\|secretKey\|secret_key\|seed_phrase\|seedPhrase\|mnemonic' src/ --include='*.ts' --include='*.tsx' 2>/dev/null \
  | grep -v 'node_modules' | grep -v '\.d\.ts' | grep -v '// ' | grep -v 'publicKey' | grep -v 'PublicKey' | head -5 | grep -q .; then
  PKF=$(grep -rln 'privateKey\|private_key\|secretKey\|secret_key\|seed_phrase\|seedPhrase\|mnemonic' src/ --include='*.ts' --include='*.tsx' 2>/dev/null \
    | grep -v 'node_modules' | grep -v '\.d\.ts' | head -5 | tr '\n' ', ')
  add_finding "critical" "Wallet private key logic detected" "$PKF" "false" "true" "Remove all private key handling from codebase"
fi

echo "  Hard blocks: done"

# -------------------------------------------------------
# 2. SECRET LEAKS
# -------------------------------------------------------
echo "[2/8] Scanning for secret leaks..."

# Hardcoded API keys (long hex/base64 strings that look like keys)
if grep -rn 'sk-[a-zA-Z0-9]\{20,\}\|ghp_[a-zA-Z0-9]\{36\}\|xox[bpas]-[a-zA-Z0-9-]\{10,\}' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'node_modules' | head -3 | grep -q .; then
  add_finding "critical" "Hardcoded API key detected" "src/" "false" "true" "Remove hardcoded API keys and use secrets management"
fi

echo "  Secret scan: done"

# -------------------------------------------------------
# 3. DEPENDENCY & LOCKFILE CHECK (BUN-ONLY POLICY)
# -------------------------------------------------------
echo "[3/8] Checking Bun-only lockfile policy..."

# CRITICAL: This is a Bun-only repo
# bun.lockb MUST exist
if [ ! -f bun.lockb ]; then
  add_finding "critical" "bun.lockb missing — Bun-only policy violated" "bun.lockb" "false" "true" "Run: bun install --frozen"
fi

# Forbidden lockfiles MUST NOT exist
for FORBIDDEN in package-lock.json yarn.lock pnpm-lock.yaml bun.lock; do
  if [ -f "$FORBIDDEN" ]; then
    add_finding "critical" "Forbidden lockfile detected — Bun-only policy violated" "$FORBIDDEN" "false" "true" "Remove: $FORBIDDEN (this repo uses bun.lockb only)"
  fi
done

# React version drift check using Bun
if command -v bun &>/dev/null && [ -f bun.lockb ]; then
  REACT_VER=$(bun -p "require('./node_modules/react/package.json').version" 2>/dev/null || echo "unknown")
  MAJOR=$(echo "$REACT_VER" | cut -d. -f1)
  if [ "$MAJOR" != "18" ] && [ "$MAJOR" != "unknown" ]; then
    add_finding "critical" "React version drifted to $REACT_VER (must be 18.x)" "package.json" "false" "true" "Pin React to 18.x"
  fi
fi

echo "  Dependencies: done"

# -------------------------------------------------------
# 4. EDGE FUNCTION SECURITY
# -------------------------------------------------------
echo "[4/8] Scanning edge functions..."

for fn in supabase/functions/*/index.ts; do
  [ -f "$fn" ] || continue
  FNAME=$(basename "$(dirname "$fn")")

  # Check for missing CORS headers
  if ! grep -q 'Access-Control-Allow-Origin' "$fn" 2>/dev/null; then
    add_finding "medium" "Missing CORS headers in edge function" "$fn" "false" "false" "Add CORS headers to $FNAME"
  fi

  # Check for missing auth validation (skip wallet-auth which is the auth endpoint itself)
  if [ "$FNAME" != "wallet-auth" ] && ! grep -q 'Authorization\|auth\.\|getClaims\|getUser' "$fn" 2>/dev/null; then
    add_finding "high" "Edge function missing auth validation" "$fn" "false" "false" "Add JWT/auth validation to $FNAME"
  fi

  # Check for raw SQL execution
  if grep -q 'execute_sql\|\.rpc.*sql' "$fn" 2>/dev/null; then
    add_finding "critical" "Raw SQL execution in edge function" "$fn" "false" "true" "Remove raw SQL and use parameterized queries"
  fi
done

echo "  Edge functions: done"

# -------------------------------------------------------
# 5. ENV USAGE
# -------------------------------------------------------
echo "[5/8] Checking env usage..."

# .env committed with real values (check for service role)
if [ -f .env ] && grep -q 'SERVICE_ROLE\|PRIVATE_KEY' .env 2>/dev/null; then
  add_finding "critical" "Service role or private key in .env file" ".env" "false" "true" "Remove secrets from .env, use secrets management"
fi

echo "  Env check: done"

# -------------------------------------------------------
# 6. INPUT VALIDATION
# -------------------------------------------------------
echo "[6/8] Checking input validation..."

for fn in supabase/functions/*/index.ts; do
  [ -f "$fn" ] || continue
  FNAME=$(basename "$(dirname "$fn")")

  # Check if function accepts JSON but doesn't validate
  if grep -q 'req.json()' "$fn" 2>/dev/null; then
    if ! grep -q 'typeof\|\.length\|!.*||' "$fn" 2>/dev/null; then
      add_finding "medium" "Edge function accepts JSON without validation" "$fn" "false" "false" "Add input validation to $FNAME"
    fi
  fi
done

echo "  Input validation: done"

# -------------------------------------------------------
# 7. PROTECTED PATH CHANGES (PR only)
# -------------------------------------------------------
echo "[7/8] Checking protected path changes..."

if [ -n "${GITHUB_BASE_REF:-}" ]; then
  PROTECTED_PATHS=$(cat scripts/security/protected-paths.json | jq -r '.protected_paths[]' 2>/dev/null || true)
  CHANGED=$(git diff --name-only "origin/${GITHUB_BASE_REF}...HEAD" 2>/dev/null || true)

  for path in $PROTECTED_PATHS; do
    if echo "$CHANGED" | grep -q "^${path}$"; then
      add_finding "high" "Protected file modified — requires strict review" "$path" "false" "false" "Review changes to $path carefully before merging"
    fi
  done
fi

echo "  Protected paths: done"

# -------------------------------------------------------
# 8. GENERATE REPORT
# -------------------------------------------------------
echo "[8/8] Generating report..."

TOTAL=$(echo "$FINDINGS" | jq 'length')
BLOCKED_COUNT=$(echo "$FINDINGS" | jq '[.[] | select(.blocked)] | length')
PASSED=true
if [ "$EXIT_CODE" -ne 0 ]; then PASSED=false; fi

cat > "$REPORT" <<EOF
{
  "scan_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $PASSED,
  "total_findings": $TOTAL,
  "blocked_count": $BLOCKED_COUNT,
  "findings": $FINDINGS
}
EOF

echo ""
echo "===================================="
echo "Scan complete: $TOTAL findings, $BLOCKED_COUNT blocked"
if [ "$PASSED" = "true" ]; then
  echo "✅ All checks passed"
else
  echo "❌ CI BLOCKED — fix critical issues before merging"
fi
echo "Report: $REPORT"
echo "===================================="

exit $EXIT_CODE

# -------------------------------------------------------
# 4. EDGE FUNCTION SECURITY
# -------------------------------------------------------
echo "[4/8] Scanning edge functions..."

for fn in supabase/functions/*/index.ts; do
  [ -f "$fn" ] || continue
  FNAME=$(basename "$(dirname "$fn")")

  # Check for missing CORS headers
  if ! grep -q 'Access-Control-Allow-Origin' "$fn" 2>/dev/null; then
    add_finding "medium" "Missing CORS headers in edge function" "$fn" "false" "false" "Add CORS headers to $FNAME"
  fi

  # Check for missing auth validation (skip wallet-auth which is the auth endpoint itself)
  if [ "$FNAME" != "wallet-auth" ] && ! grep -q 'Authorization\|auth\.\|getClaims\|getUser' "$fn" 2>/dev/null; then
    add_finding "high" "Edge function missing auth validation" "$fn" "false" "false" "Add JWT/auth validation to $FNAME"
  fi

  # Check for raw SQL execution
  if grep -q 'execute_sql\|\.rpc.*sql' "$fn" 2>/dev/null; then
    add_finding "critical" "Raw SQL execution in edge function" "$fn" "false" "true" "Remove raw SQL and use parameterized queries"
  fi
done

echo "  Edge functions: done"

# -------------------------------------------------------
# 5. ENV USAGE
# -------------------------------------------------------
echo "[5/8] Checking env usage..."

# .env committed with real values (check for service role)
if [ -f .env ] && grep -q 'SERVICE_ROLE\|PRIVATE_KEY' .env 2>/dev/null; then
  add_finding "critical" "Service role or private key in .env file" ".env" "false" "true" "Remove secrets from .env, use secrets management"
fi

echo "  Env check: done"

# -------------------------------------------------------
# 6. INPUT VALIDATION
# -------------------------------------------------------
echo "[6/8] Checking input validation..."

for fn in supabase/functions/*/index.ts; do
  [ -f "$fn" ] || continue
  FNAME=$(basename "$(dirname "$fn")")

  # Check if function accepts JSON but doesn't validate
  if grep -q 'req.json()' "$fn" 2>/dev/null; then
    if ! grep -q 'typeof\|\.length\|!.*||' "$fn" 2>/dev/null; then
      add_finding "medium" "Edge function accepts JSON without validation" "$fn" "false" "false" "Add input validation to $FNAME"
    fi
  fi
done

echo "  Input validation: done"

# -------------------------------------------------------
# 7. PROTECTED PATH CHANGES (PR only)
# -------------------------------------------------------
echo "[7/8] Checking protected path changes..."

if [ -n "${GITHUB_BASE_REF:-}" ]; then
  PROTECTED_PATHS=$(cat scripts/security/protected-paths.json | jq -r '.protected_paths[]' 2>/dev/null || true)
  CHANGED=$(git diff --name-only "origin/${GITHUB_BASE_REF}...HEAD" 2>/dev/null || true)

  for path in $PROTECTED_PATHS; do
    if echo "$CHANGED" | grep -q "^${path}$"; then
      add_finding "high" "Protected file modified — requires strict review" "$path" "false" "false" "Review changes to $path carefully before merging"
    fi
  done
fi

echo "  Protected paths: done"

# -------------------------------------------------------
# 8. GENERATE REPORT
# -------------------------------------------------------
echo "[8/8] Generating report..."

TOTAL=$(echo "$FINDINGS" | jq 'length')
BLOCKED_COUNT=$(echo "$FINDINGS" | jq '[.[] | select(.blocked)] | length')
PASSED=true
if [ "$EXIT_CODE" -ne 0 ]; then PASSED=false; fi

cat > "$REPORT" <<EOF
{
  "scan_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $PASSED,
  "total_findings": $TOTAL,
  "blocked_count": $BLOCKED_COUNT,
  "findings": $FINDINGS
}
EOF

echo ""
echo "===================================="
echo "Scan complete: $TOTAL findings, $BLOCKED_COUNT blocked"
if [ "$PASSED" = "true" ]; then
  echo "✅ All checks passed"
else
  echo "❌ CI BLOCKED — fix critical issues before merging"
fi
echo "Report: $REPORT"
echo "===================================="

exit $EXIT_CODE
