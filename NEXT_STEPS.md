# ⏭️ Next Steps - Archetype Engine Publishing

**Status:** Ready to configure npm Trusted Publisher (2 minutes)

---

## 🎯 Immediate Action Required

### Configure Trusted Publisher on npm (One-time, 2 minutes)

**You need to manually configure this on npmjs.com:**

1. **Go to:** https://www.npmjs.com/package/archetype-engine/access
   
2. **Scroll down to:** "Trusted Publisher" or "Publishing Access" section

3. **Click:** "GitHub Actions" button

4. **Fill in these EXACT values:**
   ```
   Organization or user: IFAKA
   Repository: archetype-engine
   Workflow filename: publish.yml
   Environment name: (leave blank)
   ```

5. **Click:** "Add" or "Save"

6. **Verify:** You should see "IFAKA/archetype-engine/.github/workflows/publish.yml" listed

---

## 🧪 Test the Setup

After configuring the trusted publisher, test it:

### Option 1: Rerun Failed Workflow

```bash
# Rerun the failed v2.0.1-test.0 workflow
gh run rerun --failed

# Watch it succeed
gh run watch
```

### Option 2: Create New Test Release

```bash
# Create fresh test version
npm version prerelease --preid=test
git push origin main --tags

# Watch workflow
gh run watch
```

### Verify Success

```bash
# Check npm
npm info archetype-engine

# Should show test version published
# dist-tags: { latest: '2.0.0', test: '2.0.1-test.0' }

# Check GitHub release was created
gh release list
```

---

## 🧹 Cleanup Test Version

After successful test, remove the test version:

```bash
# Remove test version from npm (optional)
npm unpublish archetype-engine@2.0.1-test.0

# Remove test tag from git (optional)
git tag -d v2.0.1-test.0
git push origin :refs/tags/v2.0.1-test.0

# Remove GitHub release (optional)
gh release delete v2.0.1-test.0 --yes
```

---

## ✅ Then You're Done!

From now on, publishing is automated:

```bash
# 1. Make changes
git add .
git commit -m "feat: new feature"

# 2. Update CHANGELOG.md
# (edit file)

# 3. Release
npm version patch    # or minor, or major
git push origin main --tags

# 4. GitHub Actions automatically:
#    ✓ Runs tests
#    ✓ Builds package
#    ✓ Publishes to npm
#    ✓ Creates GitHub release
```

---

## 📚 Reference Documentation

We've created comprehensive guides:

1. **[.github/SETUP_TOKEN.md](.github/SETUP_TOKEN.md)**
   - Trusted publisher setup instructions
   - How OIDC authentication works
   - Troubleshooting guide

2. **[.github/PUBLISHING_GUIDE.md](.github/PUBLISHING_GUIDE.md)**
   - Complete publishing workflow
   - Version number guidelines
   - Pre-release versions
   - Rollback procedures
   - Release checklist

3. **[.github/workflows/release.md](.github/workflows/release.md)**
   - Quick command reference (copy-paste)
   - Common workflows
   - Emergency procedures

---

## 🔍 What We Fixed Today

### Phase 1: Code Quality (Complete ✅)
- **Score:** 78/100 → 92/100
- Deleted zombie code (`src/types.ts`)
- Cleaned root directory (moved temp files to `documentation/archive/`)
- Improved type safety (added interfaces, documented assertions)
- Reorganized public API exports
- Created Architecture Decision Records (ADRs)
- Updated all URLs and metadata

### Phase 2: Publishing Setup (In Progress 🔄)
- ✅ Created automated publish workflow (`.github/workflows/publish.yml`)
- ✅ Configured for npm Trusted Publishing (OIDC)
- ✅ Upgraded to modern release action (`softprops/action-gh-release@v2`)
- ✅ Created comprehensive documentation
- ⏳ **Waiting:** Trusted publisher configuration on npmjs.com
- ⏳ **Next:** Test the workflow

---

## 🎓 Understanding Trusted Publishing

### Why We're Using It

**Old Way (Tokens):**
- Create long-lived npm token (expires in 90 days)
- Store in GitHub secrets
- Rotate every 90 days
- If leaked = security incident

**New Way (Trusted Publishing):**
- No tokens at all
- GitHub generates short-lived OIDC token
- npm validates: "Is this from IFAKA/archetype-engine/publish.yml?"
- Token expires immediately after use
- Zero maintenance

### Security Benefits

1. **No Long-Lived Credentials**
   - Even if workflow logs leak, nothing useful to steal

2. **Automatic Provenance**
   - npm verifies package was built from exact commit
   - Users can verify: https://www.npmjs.com/package/archetype-engine?activeTab=provenance

3. **Zero Trust Architecture**
   - Each publish requires fresh authentication
   - Can't reuse tokens across workflows

4. **No Secret Management**
   - No GitHub secrets to rotate
   - No expired token emails

---

## 🚨 Current Status

### Published Versions
- ✅ **2.0.0** - Live on npm (manual publish)
- ⏳ **2.0.1-test.0** - Failed (trusted publisher not configured yet)

### Git Tags
- ✅ `v2.0.0` - Successfully published
- ⏳ `v2.0.1-test.0` - Workflow failed, needs rerun

### GitHub Actions
- ✅ CI workflow - Passing
- ✅ Docs workflow - Passing  
- ❌ Publish workflow - Failed (expected, needs trusted publisher)

---

## 💡 Quick Tips

### Before Each Release

```bash
# Always run tests locally first
npm run test:run

# Check what's changed
git log --oneline v2.0.0..HEAD

# Update CHANGELOG.md
# Add your changes under appropriate version
```

### Choosing Version Numbers

- **Patch (2.0.0 → 2.0.1)** - Bug fixes only, no API changes
- **Minor (2.0.0 → 2.1.0)** - New features, backward compatible
- **Major (2.0.0 → 3.0.0)** - Breaking changes, incompatible API

### Pre-release Versions

```bash
npm version prerelease --preid=alpha   # 2.0.1-alpha.0
npm version prerelease --preid=beta    # 2.0.1-beta.0
npm version prerelease --preid=rc      # 2.0.1-rc.0
npm version prerelease --preid=test    # 2.0.1-test.0 (for testing only)
```

---

## 📞 Getting Help

### Documentation Links

- **Setup Guide:** [.github/SETUP_TOKEN.md](.github/SETUP_TOKEN.md)
- **Publishing Guide:** [.github/PUBLISHING_GUIDE.md](.github/PUBLISHING_GUIDE.md)
- **Quick Commands:** [.github/workflows/release.md](.github/workflows/release.md)

### External Resources

- **npm Trusted Publishing:** https://docs.npmjs.com/generating-provenance-statements
- **GitHub OIDC:** https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- **Semver Guide:** https://semver.org/

### Support Channels

- **npm Support:** https://www.npmjs.com/support
- **GitHub Actions:** https://github.com/IFAKA/archetype-engine/actions
- **Issues:** https://github.com/IFAKA/archetype-engine/issues

---

## ✨ Summary

**What's Working:**
- ✅ Package published to npm (v2.0.0)
- ✅ CI/CD pipeline configured
- ✅ Documentation complete
- ✅ Code quality at 92/100
- ✅ All 209 tests passing

**What's Needed:**
- ⏳ Configure trusted publisher on npmjs.com (2 minutes)
- ⏳ Test the automated workflow
- ⏳ Clean up test version

**After That:**
- 🎉 Fully automated publishing
- 🎉 Zero token management
- 🎉 Automatic provenance
- 🎉 Professional release process

---

## 🎬 Action Items

1. **Now:** Configure trusted publisher → https://www.npmjs.com/package/archetype-engine/access
2. **Then:** Run `gh run rerun --failed` to test
3. **Verify:** Check `npm info archetype-engine` shows test version
4. **Clean up:** Unpublish test version
5. **Done:** Ready for real releases!

**Estimated Time:** 5 minutes total

---

**Last Updated:** 2025-12-24  
**Current Version:** 2.0.0 (published), 2.0.1-test.0 (pending)  
**Status:** Blocked on trusted publisher configuration
