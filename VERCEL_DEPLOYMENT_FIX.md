# Vercel Deployment Fix Guide

## Issue
The deployment failed because of an outdated `pnpm-lock.yaml` file in your GitHub repository that doesn't match the current `package.json`.

## Error Message
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with package.json
```

---

## Solution: Remove pnpm-lock.yaml and Use npm

### Step 1: Remove Old Lockfile from Git

In your local repository (or GitHub directly):

```bash
# Clone your repository (if not already)
git clone https://github.com/Mibu0815/OptropicSolidBolt.git
cd OptropicSolidBolt

# Remove the outdated pnpm lockfile
rm pnpm-lock.yaml

# Commit and push
git add pnpm-lock.yaml
git commit -m "Remove outdated pnpm-lock.yaml, use npm instead"
git push origin main
```

### Step 2: Verify package-lock.json Exists

The repository should now have `package-lock.json` (already generated):

```bash
# Verify it exists
ls -la | grep package-lock.json

# If it doesn't exist, generate it
npm install
git add package-lock.json
git commit -m "Add npm package-lock.json"
git push origin main
```

### Step 3: Update .npmrc for Production

The `.npmrc` file has been updated to comment out the local registry:

```
# Local registry (development only - removed for production)
# registry=http://localhost:9092/npm-registry
```

Commit this change:

```bash
git add .npmrc
git commit -m "Update .npmrc for production deployment"
git push origin main
```

### Step 4: Redeploy on Vercel

After pushing these changes:

1. **Option A: Automatic Redeploy**
   - Vercel will automatically detect the push and redeploy

2. **Option B: Manual Redeploy**
   ```bash
   vercel --prod
   ```

3. **Option C: Redeploy via Dashboard**
   - Go to https://vercel.com/dashboard
   - Find your project
   - Click "Deployments" → "Redeploy"

---

## Alternative: Force pnpm Install (Not Recommended)

If you prefer to keep using pnpm, update the lockfile:

```bash
# Install pnpm
npm install -g pnpm

# Generate updated lockfile
rm pnpm-lock.yaml
pnpm install

# Commit
git add pnpm-lock.yaml package.json
git commit -m "Update pnpm-lock.yaml"
git push origin main
```

---

## Vercel Build Configuration

### Recommended: Use npm (Default)

Vercel will automatically detect `package-lock.json` and use npm.

No configuration needed! ✅

### Optional: Force Package Manager

If you need to force a specific package manager, add to `vercel.json`:

```json
{
  "buildCommand": "npm install && npm run build"
}
```

Or create a `vercel.json` in the root:

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev"
}
```

---

## Files to Commit

Make sure these files are in your GitHub repository:

```
✅ package.json
✅ package-lock.json (npm)
❌ pnpm-lock.yaml (remove this)
✅ .npmrc (with production config)
✅ vercel.json (optional)
```

---

## Quick Fix Commands

Run these in your local repository:

```bash
# 1. Remove pnpm lockfile
rm pnpm-lock.yaml

# 2. Ensure npm lockfile is up to date
rm -f package-lock.json
npm install

# 3. Update .npmrc (already done)
# Comment out local registry

# 4. Verify build works
npm run build

# 5. Commit all changes
git add .
git commit -m "Fix Vercel deployment: use npm, remove pnpm-lock"
git push origin main

# 6. Vercel will auto-redeploy, or manually trigger:
vercel --prod
```

---

## Expected Build Output (Success)

After fixing, you should see:

```
Running build in Washington, D.C., USA (East) – iad1
Build machine configuration: 4 cores, 8 GB
Cloning github.com/Mibu0815/OptropicSolidBolt (Branch: main, Commit: xxxxxx)
Cloning completed: 725.000ms
Running "vercel build"
Vercel CLI 48.2.0
Installing dependencies...
✓ Installed dependencies in 45s
Building...
✓ Built in 12s
Deployment ready!
```

---

## Verification Checklist

After deployment:

- [ ] Deployment succeeded on Vercel
- [ ] Site is accessible at your Vercel URL
- [ ] Health check works: `https://your-app.vercel.app/api/health`
- [ ] Metrics endpoint works: `https://your-app.vercel.app/api/metrics`
- [ ] No build errors in Vercel logs

---

## Troubleshooting

### Issue: "Cannot find module"

**Solution**: Make sure all dependencies are in `package.json`:

```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: "Prisma Client not generated"

**Solution**: The `postinstall` script should handle this, but verify:

```bash
npx prisma generate
npm run build
```

### Issue: ".env variables not found"

**Solution**: Set environment variables in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add required variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SECRET_KEY`
   - `NODE_ENV=production`
   - `BASE_URL`
   - `SENTRY_DSN` (optional)

### Issue: "Build succeeds but app crashes"

**Solution**: Check environment variables and database connectivity:

```bash
# Verify DATABASE_URL is set correctly
# Check Vercel logs for error details
vercel logs <deployment-url>
```

---

## Summary

**Problem**: Outdated `pnpm-lock.yaml` in repository
**Solution**: Remove pnpm lockfile, use npm with `package-lock.json`
**Result**: Clean deployment on Vercel

**Action Required**:
1. Remove `pnpm-lock.yaml` from git
2. Commit `package-lock.json`
3. Update `.npmrc` for production
4. Push to GitHub
5. Redeploy on Vercel

---

## Need Help?

If issues persist:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test build locally: `npm install && npm run build`
4. Review `DEPLOYMENT_GUIDE.md` for detailed instructions

**Status**: Ready to fix and redeploy! 🚀
