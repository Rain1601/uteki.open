#!/bin/bash
# Test company analysis pipeline across models
# Usage: bash test_models.sh [symbol] [provider]

SYMBOL="${1:-AAPL}"
PROVIDER="${2:-}"

# Extract token from Location header (uses # fragment)
LOCATION=$(curl -sv 'http://localhost:8000/api/auth/dev/login' 2>&1 | grep -i 'location:' | tr -d '\r')
TOKEN=$(echo "$LOCATION" | grep -o 'token=[^&"]*' | cut -d= -f2)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get auth token"
  exit 1
fi

run_model() {
  local provider="$1"
  local model="$2"
  local outfile="/tmp/company_test_${provider}${model:+_$model}.json"

  echo "[$provider${model:+/$model}] Starting..."

  local body="{\"symbol\":\"$SYMBOL\",\"provider\":\"$provider\""
  if [ -n "$model" ]; then
    body="${body},\"model\":\"$model\""
  fi
  body="${body}}"

  curl -s -X POST http://localhost:8000/api/company/analyze \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$body" > "$outfile" 2>&1

  /Users/rain/Library/Caches/pypoetry/virtualenvs/uteki-zy_lvDlx-py3.10/bin/python3 -c "
import json, sys
try:
    with open('$outfile') as f:
        data = json.load(f)
except Exception as e:
    print(f'[$provider] PARSE ERROR: {e}')
    with open('$outfile') as f:
        print(f.read()[:500])
    sys.exit(1)

if 'detail' in data:
    print(f'[$provider] API ERROR: {data[\"detail\"]}')
    sys.exit(1)

print()
print('=' * 70)
print(f'  MODEL: {data.get(\"model_used\", \"unknown\")}')
print(f'  SYMBOL: {data.get(\"symbol\")} — {data.get(\"company_name\")} ({data.get(\"sector\")})')
print(f'  LATENCY: {data.get(\"total_latency_ms\", 0)/1000:.1f}s')
print('=' * 70)

# Trace
for t in data.get('trace', []):
    err = f' ERROR={t[\"error\"][:80]}' if t.get('error') else ''
    print(f'  {t[\"skill\"]:20s} [{t[\"status\"]:10s}] {t[\"latency_ms\"]/1000:.1f}s{err}')
print()

# Skill details
for name, skill in data.get('skills', {}).items():
    status = skill.get('parse_status', '?')
    ms = skill.get('latency_ms', 0)
    parsed = skill.get('parsed', {})
    print(f'  ─── {name} [{status}] ({ms/1000:.1f}s) ───')
    if skill.get('error'):
        print(f'    ERROR: {skill[\"error\"][:120]}')
    for k, v in parsed.items():
        s = str(v)
        if len(s) > 100:
            s = s[:100] + '...'
        print(f'    {k}: {s}')
    print()

# Verdict
v = data.get('verdict', {})
print('  ═══ VERDICT ═══')
print(f'    Company Quality:  {v.get(\"quality_verdict\", \"?\")}')
print(f'    Long-term Hold:   {v.get(\"long_term_hold\", \"?\")}')
print(f'    Conviction:       {v.get(\"conviction\", 0):.0%}')
print(f'    Price Assessment: {v.get(\"price_assessment\", \"?\")}')
print(f'    Reasoning:        {v.get(\"reasoning\", \"\")[:120]}')
print(f'    Action:           {v.get(\"action\", \"?\")}')
print(f'    Hold Horizon:     {v.get(\"hold_horizon\", \"?\")}')
print(f'    Sell Triggers:    {v.get(\"sell_triggers\", [])}')
print(f'    Scores:           {v.get(\"philosophy_scores\", {})}')
print(f'    Summary:          {v.get(\"one_sentence\", \"\")}')
print()
"
}

echo "=== Company Analysis: $SYMBOL ==="
echo "Token: ${TOKEN:0:20}..."
echo

if [ -n "$PROVIDER" ]; then
  # Single model
  run_model "$PROVIDER" ""
else
  # All models in parallel
  run_model "openai" "" &
  P1=$!
  run_model "deepseek" "" &
  P2=$!
  run_model "qwen" "" &
  P3=$!

  echo "Running 3 models in parallel..."
  wait $P1 && echo "[openai] Done" || echo "[openai] Failed"
  wait $P2 && echo "[deepseek] Done" || echo "[deepseek] Failed"
  wait $P3 && echo "[qwen] Done" || echo "[qwen] Failed"
fi

echo "All tests complete!"
