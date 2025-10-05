#!/bin/bash
echo "🧹 Cleaning up all pnpm lockfiles and enforcing npm for Vercel..."
echo "-------------------------------------------------------------"

# 1️⃣ Search for any pnpm-lock.yaml files
echo "🔍 Searching for pnpm-lock.yaml files..."
FOUND_FILES=$(find . -name "pnpm-lock.yaml" -type f)

if [ -z "$FOUND_FILES" ]; then
  echo "✅ No pnpm-lock.yaml files found."
else
  echo "⚠️ Found pnpm-lock.yaml files in:"
  echo "$FOUND_FILES"
  echo
  echo "🗑️ Removing these lockfiles..."
  find . -name "pnpm-lock.yaml" -type f -print -exec rm -v {} \;
  echo "✅ All pnpm lockfiles removed."
fi

# 2️⃣ Ensure package-lock.json exists
if [ ! -f "package-lock.json" ]; then
  echo "📦 Creating package-lock.json with npm install..."
  npm install
else
  echo "✅ package-lock.json already present."
fi

# 3️⃣ Stage & commit changes
echo "📤 Staging and committing changes..."
git add -A
git commit -m "Remove all pnpm lockfiles and enforce npm for Vercel" || echo "⚠️ No changes to commit."

# 4️⃣ Push to GitHub
echo "🚀 Pushing changes to main branch..."
git push origin main

# 5️⃣ Confirmation
echo "-------------------------------------------------------------"
echo "✅ Cleanup complete. Vercel will now build using npm."
echo "🧾 Next: check Vercel logs to confirm 'Detected package-lock.json' message."
echo "-------------------------------------------------------------"#!/bin/bash
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

