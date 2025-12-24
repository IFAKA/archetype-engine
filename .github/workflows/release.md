# Release Process

This project uses automated publishing to npm via GitHub Actions.

## How It Works

1. **Every push to `main`** - Runs tests and build (`.github/workflows/ci.yml`)
2. **Version tags only** - Publishes to npm (`.github/workflows/publish.yml`)

## Publishing a New Version

### Quick Release (Patch/Minor)

```bash
# 1. Make your changes and commit
git add .
git commit -m "fix: your bug fix"

# 2. Bump version (automatically commits)
npm version patch   # 2.0.0 → 2.0.1 (bug fixes)
# OR
npm version minor   # 2.0.0 → 2.1.0 (new features)

# 3. Push with tags
git push origin main --tags

# 4. GitHub Actions automatically:
#    - Runs tests
#    - Builds package
#    - Publishes to npm
#    - Creates GitHub release
```

### Major Version (Breaking Changes)

```bash
# 1. Update code and tests
git add .
git commit -m "feat!: breaking change description"

# 2. Bump major version
npm version major   # 2.0.0 → 3.0.0

# 3. Update migration guide
vim CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: update changelog for v3.0.0"

# 4. Push with tags
git push origin main --tags
```

## Version Guidelines (Semantic Versioning)

### Patch (2.0.0 → 2.0.1)
- Bug fixes
- Typo corrections
- Documentation updates
- Performance improvements (no API changes)

### Minor (2.0.0 → 2.1.0)
- New features (backwards compatible)
- New field types
- New template options
- Deprecations (with warnings)

### Major (2.0.0 → 3.0.0)
- Breaking API changes
- Removed deprecated features
- Changed default behaviors
- Required migration

## Emergency Rollback

If you publish a broken version:

```bash
# 1. Fix the issue locally
git add .
git commit -m "fix: critical bug"

# 2. Publish hotfix immediately
npm version patch
git push origin main --tags

# 3. Deprecate broken version (within 72 hours of publish)
npm deprecate archetype-engine@2.0.1 "Broken - use 2.0.2 instead"
```

## Pre-release Versions

For testing before official release:

```bash
# 1. Create beta version
npm version prerelease --preid=beta  # 2.0.0 → 2.0.1-beta.0

# 2. Push (will auto-publish with 'beta' tag)
git push origin main --tags

# 3. Users can test with:
npm install archetype-engine@beta
```

## Troubleshooting

### Publish Failed - Version Already Exists
```bash
# You forgot to bump version
npm version patch
git push origin main --tags
```

### Publish Failed - Tests Failed
```bash
# Fix tests first
npm run test:run
git add .
git commit -m "fix: tests"
git push origin main
# Then tag again
```

### Need to Skip CI for Docs
```bash
git commit -m "docs: update readme [skip ci]"
```

## Setup (One-time)

To enable automated publishing, add `NPM_TOKEN` to GitHub secrets:

1. Get npm token:
   ```bash
   npm login
   npm token create --read-only=false
   ```

2. Add to GitHub:
   - Go to: https://github.com/IFAKA/archetype-engine/settings/secrets/actions
   - New secret: `NPM_TOKEN`
   - Paste token

3. Done! Now tags auto-publish.
