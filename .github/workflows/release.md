# 🚀 Quick Release Commands

Copy-paste reference for common release tasks.

---

## Standard Release

```bash
# 1. Make changes, commit, push
git add .
git commit -m "feat: your feature"
git push origin main

# 2. Update CHANGELOG.md
# (edit the file)

# 3. Choose version type and release
npm version patch && git push origin main --tags  # Bug fixes
npm version minor && git push origin main --tags  # New features  
npm version major && git push origin main --tags  # Breaking changes
```

---

## Monitor Release

```bash
# Watch workflow run live
gh run watch

# Check latest run status
gh run list --limit 1

# View detailed logs
gh run view --log

# Check if package published
npm info archetype-engine
```

---

## Pre-release (Alpha/Beta/Test)

```bash
# Create test version
npm version prerelease --preid=test
git push origin main --tags

# Create alpha version
npm version prerelease --preid=alpha
git push origin main --tags

# Create beta version
npm version prerelease --preid=beta
git push origin main --tags

# Remove test version after (optional)
npm unpublish archetype-engine@2.0.2-test.0
```

---

## Fix Failed Release

```bash
# Rerun failed workflow (if trusted publisher was the issue)
gh run rerun --failed

# Or delete tag and retry with new version
git tag -d v2.0.2
git push origin :refs/tags/v2.0.2
npm version patch  # Creates v2.0.3
git push origin main --tags
```

---

## Rollback Bad Release

```bash
# Deprecate (recommended - doesn't break existing installs)
npm deprecate archetype-engine@2.0.2 "Critical bug, use 2.0.3 instead"

# Then release fix
npm version patch
git push origin main --tags

# OR unpublish (only < 72 hours, breaks users!)
npm unpublish archetype-engine@2.0.2
```

---

## Check Package Status

```bash
# View package details
npm info archetype-engine

# View all published versions
npm view archetype-engine versions

# View latest version
npm view archetype-engine version

# View download stats
npm view archetype-engine downloads

# Check GitHub releases
gh release list
gh release view v2.0.2
```

---

## Test Installation

```bash
# Test latest version
cd /tmp
npx create-next-app test-app --typescript --tailwind --app --no-src-dir
cd test-app
npm install archetype-engine@latest
npx archetype init --yes
npx archetype generate
```

---

## Emergency Hotfix

```bash
# Fastest path from bug to fix
git add .
git commit -m "fix: critical bug description"
npm run test:run
npm version patch && git push origin main --tags

# Update changelog after
git commit -am "docs: add changelog for hotfix"
git push
```

---

## Version Number Examples

```bash
# Current: 2.0.1

npm version patch   # → 2.0.2 (bug fixes only)
npm version minor   # → 2.1.0 (new features, backward compatible)
npm version major   # → 3.0.0 (breaking changes)

npm version prepatch   # → 2.0.2-0 (pre-release patch)
npm version preminor   # → 2.1.0-0 (pre-release minor)
npm version premajor   # → 3.0.0-0 (pre-release major)

npm version prerelease --preid=alpha  # → 2.0.2-alpha.0
npm version prerelease --preid=beta   # → 2.0.2-beta.0
npm version prerelease --preid=rc     # → 2.0.2-rc.0
npm version prerelease --preid=test   # → 2.0.2-test.0
```

---

## Useful URLs

- **npm Package:** https://www.npmjs.com/package/archetype-engine
- **GitHub Repo:** https://github.com/IFAKA/archetype-engine
- **Workflows:** https://github.com/IFAKA/archetype-engine/actions
- **Releases:** https://github.com/IFAKA/archetype-engine/releases
- **Trusted Publisher Setup:** https://www.npmjs.com/package/archetype-engine/access
- **Docs:** https://archetype-engine.vercel.app

---

## Workflow Triggers

The publish workflow runs automatically when you push a tag matching `v*.*.*`:

```bash
git push origin main --tags  # Triggers if tag matches v2.0.1, v2.1.0, etc.
```

**What the workflow does:**
1. Runs `npm ci` (install dependencies)
2. Runs `npm run test:run` (all tests must pass)
3. Runs `npm run build` (compile TypeScript)
4. Runs `npm publish --access public` (publish with OIDC auth)
5. Creates GitHub release with changelog link

**Requirements:**
- All tests pass
- Trusted publisher configured on npm
- Tag format: `v{major}.{minor}.{patch}` (e.g., `v2.0.1`)
