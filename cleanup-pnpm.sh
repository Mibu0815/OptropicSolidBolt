#!/bin/bash
echo "🧹 Cleaning up all pnpm lockfiles and enforcing npm for Vercel..."

# 1. Find and delete ALL pnpm-lock.yaml files (recursive)
find . -name "pnpm-lock.yaml" -type f -print -exec rm -v {} \;

# 2. Confirm deletion
echo "✅ All pnpm lockfiles removed."

# 3. Ensure package-lock.json exists
if [ ! -f "package-lock.json" ]; then
  echo "📦 Creating package-lock.json with npm install..."
  npm install
else
  echo "✅ package-lock.json already present."
fi

# 4. Stage and commit
git add -A
git commit -m "Remove all pnpm lockfiles and enforce npm for Vercel" || echo "⚠️ No changes to commit."

# 5. Push to main
git push origin main

# 6. Trigger redeploy
echo "🚀 Redeploy triggered. Check Vercel logs to confirm it now uses npm."

