# 📦 Publishing Guide for Archetype Engine

Quick reference for releasing new versions of `archetype-engine` to npm.

---

## Prerequisites

✅ Trusted Publisher configured on npm (one-time setup - see [SETUP_TOKEN.md](./SETUP_TOKEN.md))  
✅ GitHub Actions enabled on repository  
✅ All tests passing locally: `npm run test:run`

---

## Publishing a New Version

### 1. Make Your Changes

```bash
# Work on features/fixes
git add .
git commit -m "feat: add new feature"
git push origin main

# Ensure all tests pass
npm run test:run
```

### 2. Update CHANGELOG.md

Add your changes to the appropriate version section:

```markdown
## [2.0.2] - 2025-12-24

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Breaking change description (if major version)
```

### 3. Bump Version

Choose the appropriate version bump:

```bash
# Patch version (2.0.1 → 2.0.2) - Bug fixes only
npm version patch

# Minor version (2.0.1 → 2.1.0) - New features, backward compatible
npm version minor

# Major version (2.0.1 → 3.0.0) - Breaking changes
npm version major
```

This command:
- Updates `package.json` version
- Creates a git commit: `2.0.2`
- Creates a git tag: `v2.0.2`

### 4. Push with Tags

```bash
git push origin main --tags
```

### 5. Monitor the Release

Watch the GitHub Actions workflow:

```bash
# Watch live
gh run watch

# Or check status
gh run list --limit 1
```

The workflow will:
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Run tests
4. ✅ Build TypeScript
5. ✅ Publish to npm (with provenance)
6. ✅ Create GitHub release

### 6. Verify Publication

```bash
# Check npm
npm info archetype-engine

# Should show your new version as 'latest'
# dist-tags: { latest: '2.0.2' }
```

---

## Pre-release Versions (Testing)

### Alpha/Beta/RC Versions

```bash
# Create prerelease version
npm version prerelease --preid=alpha   # 2.0.1 → 2.0.2-alpha.0
npm version prerelease --preid=beta    # 2.0.1 → 2.0.2-beta.0
npm version prerelease --preid=rc      # 2.0.1 → 2.0.2-rc.0

# Push
git push origin main --tags

# Users can install with:
# npm install archetype-engine@alpha
# npm install archetype-engine@beta
```

### Test Versions (Don't Promote to Latest)

```bash
# Create test version
npm version prerelease --preid=test    # 2.0.1 → 2.0.2-test.0

# Push
git push origin main --tags

# After publishing, verify it didn't become 'latest'
npm info archetype-engine

# Clean up test version
npm unpublish archetype-engine@2.0.2-test.0
```

---

## Version Number Guidelines

Follow [Semantic Versioning](https://semver.org/):

### Patch (2.0.1 → 2.0.2)
- Bug fixes
- Documentation updates
- Performance improvements (no API changes)
- Internal refactoring

**Examples:**
- Fixed: Broken entity validation
- Updated: README typo
- Improved: Code quality score

### Minor (2.0.1 → 2.1.0)
- New features (backward compatible)
- New optional parameters
- Deprecations (with warnings)

**Examples:**
- Added: Pagination support
- Added: New field type `richText()`
- Deprecated: Old `text().oneOf()` in favor of `enumField()`

### Major (2.0.1 → 3.0.0)
- Breaking changes
- Removed deprecated features
- Changed function signatures
- Changed default behaviors

**Examples:**
- Changed: `defineEntity()` now requires `behaviors` parameter
- Removed: Support for `text().oneOf()` (use `enumField()`)
- Breaking: Renamed `hasMany()` to `manyTo()`

---

## Rollback a Bad Release

### Deprecate (Recommended)

```bash
# Mark version as deprecated (doesn't remove it)
npm deprecate archetype-engine@2.0.2 "This version has a critical bug, use 2.0.3 instead"

# Publish fixed version
npm version patch
git push origin main --tags
```

### Unpublish (Only if < 72 hours old)

```bash
# Remove from npm (use sparingly!)
npm unpublish archetype-engine@2.0.2

# Publish fixed version with same number
npm version 2.0.2
git push origin main --tags
```

⚠️ **Warning:** Unpublishing can break users who depend on that exact version.

---

## Common Workflows

### Quick Patch Release

```bash
# Fix bug, commit, test
git add .
git commit -m "fix: resolve type error in entity validation"
npm run test:run

# Update changelog
# Edit CHANGELOG.md

# Release
npm version patch
git push origin main --tags
```

### Feature Release with Multiple Commits

```bash
# Work on feature over multiple commits
git commit -m "feat: add pagination to list procedures"
git commit -m "feat: add pagination hooks"
git commit -m "docs: document pagination usage"

# When ready to release
# Update CHANGELOG.md with all features

# Release
npm version minor
git push origin main --tags
```

### Emergency Hotfix

```bash
# Fix critical bug
git add .
git commit -m "fix: prevent data loss in batch operations"
npm run test:run

# Skip changelog update for speed
# Release immediately
npm version patch
git push origin main --tags

# Update changelog after
git commit -am "docs: add changelog for v2.0.2 hotfix"
git push
```

---

## Monitoring and Verification

### Check Package Stats

```bash
# View package info
npm info archetype-engine

# Check download stats (via browser)
# https://www.npmjs.com/package/archetype-engine

# View provenance (verify build authenticity)
# https://www.npmjs.com/package/archetype-engine?activeTab=provenance
```

### Verify Installation

```bash
# Test fresh install
cd /tmp
npx create-next-app test-app
cd test-app
npm install archetype-engine@latest
npx archetype init --yes
```

### Check GitHub Release

```bash
# View releases
gh release list

# View specific release
gh release view v2.0.2
```

---

## Troubleshooting

### Workflow Failed on Tests

```bash
# Check logs
gh run view --log

# Fix tests locally
npm run test:run

# Delete failed tag
git tag -d v2.0.2
git push origin :refs/tags/v2.0.2

# Fix and re-release
git commit -am "fix: failing tests"
npm version patch  # Creates new version
git push origin main --tags
```

### Workflow Failed on Publish

```bash
# Check if trusted publisher is configured
# https://www.npmjs.com/package/archetype-engine/access

# Rerun workflow after fixing
gh run rerun --failed
```

### Version Number Conflict

```bash
# If you accidentally released wrong version
npm unpublish archetype-engine@2.0.2  # Only works < 72 hours

# Reset git version
git tag -d v2.0.2
git push origin :refs/tags/v2.0.2
git reset --hard HEAD~1  # Remove version commit

# Release correct version
npm version minor  # Instead of patch
git push origin main --tags
```

---

## Release Checklist

Use this before every release:

- [ ] All tests passing locally (`npm run test:run`)
- [ ] All changes committed and pushed to `main`
- [ ] CHANGELOG.md updated with version and changes
- [ ] Breaking changes documented (if major version)
- [ ] Migration guide written (if needed)
- [ ] Examples updated (if API changed)
- [ ] Version number follows semver
- [ ] No debug code or console.logs left in
- [ ] No TODO comments in critical paths

---

## Emergency Contacts

- **npm Package:** https://www.npmjs.com/package/archetype-engine
- **GitHub Repo:** https://github.com/IFAKA/archetype-engine
- **Issues:** https://github.com/IFAKA/archetype-engine/issues
- **Docs:** https://archetype-engine.vercel.app
- **npm Support:** https://www.npmjs.com/support (for publishing issues)

---

## Automation Details

The publish workflow (`.github/workflows/publish.yml`) runs on every `v*.*.*` tag:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'  # Matches v2.0.1, v2.1.0, v3.0.0, etc.
```

It uses **npm Trusted Publishing (OIDC)** which means:
- ✅ No npm tokens in GitHub secrets
- ✅ Automatic provenance generation
- ✅ More secure than token-based auth
- ✅ Zero maintenance (no token rotation)

See [SETUP_TOKEN.md](./SETUP_TOKEN.md) for setup details.
