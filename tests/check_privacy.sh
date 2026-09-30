#!/bin/bash
if grep -iR "keithrobinson" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude="check_privacy.sh"; then
  echo "❌ PRIVACY BREACH DETECTED: Found real name in codebase."
  exit 1
else
  echo "✅ Privacy check passed."
  exit 0
fi
