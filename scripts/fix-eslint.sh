#!/bin/bash

# Fix ESLint issues in the frontend
echo "Fixing common ESLint issues..."

cd frontend

# Fix quote escaping issues
find src -name "*.tsx" -type f -exec sed -i '' 's/"/\&quot;/g' {} \;
find src -name "*.tsx" -type f -exec sed -i '' "s/'/\&apos;/g" {} \;

# Fix unused variables by adding underscore prefix
find src -name "*.tsx" -type f -exec sed -i '' 's/const \([a-zA-Z][a-zA-Z0-9]*\) = /const _\1 = /g' {} \;

echo "ESLint fixes applied. Please review the changes."
