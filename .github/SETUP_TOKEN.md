# 🔐 One-Time Trusted Publisher Setup

npm now supports **Trusted Publishing** using OpenID Connect (OIDC) - **no tokens needed!**

## Why Trusted Publishing?

✅ **More Secure** - No long-lived tokens to manage or leak  
✅ **Zero Maintenance** - No 90-day token renewals  
✅ **Automatic Provenance** - npm automatically verifies package authenticity  
✅ **Better DX** - Just push a tag, everything else is automatic

---

## Quick Setup (2 minutes)

### Step 1: Configure Trusted Publisher on npm

⚠️ **Important:** Use `/access` not `/settings` in the URL

1. **Go to:** https://www.npmjs.com/package/archetype-engine/access
   
2. **Scroll to:** "Trusted Publisher" or "Publishing Access" section

3. **Click:** "GitHub Actions" button (or "Add" if it's your first)

4. **Fill in EXACTLY:**
   ```
   Organization or user: IFAKA
   Repository: archetype-engine
   Workflow filename: publish.yml
   Environment name: (leave blank)
   ```

5. **Click:** "Add" or "Save"

### Step 2: Verify Setup

After saving, you should see:

```
Trusted Publishers
├─ GitHub Actions
│  └─ IFAKA/archetype-engine/.github/workflows/publish.yml
└─ [Add another publisher]
```

### Step 3: Test It!

If you have a failed workflow run waiting, rerun it:

```bash
gh run rerun --failed
```

Or create a new test release:

```bash
npm version prerelease --preid=test
git push origin main --tags
```

---

## ✅ Done! Normal Release Process:

```bash
# Bump version (choose one):
npm version patch   # 2.0.0 → 2.0.1 (bug fixes)
npm version minor   # 2.0.0 → 2.1.0 (new features)
npm version major   # 2.0.0 → 3.0.0 (breaking changes)

# Push with tags
git push origin main --tags

# GitHub Actions automatically:
# ✓ Runs tests
# ✓ Builds package
# ✓ Publishes to npm with provenance
# ✓ Creates GitHub release
```

---

## How It Works (Technical)

1. You push a version tag (`v2.0.1`)
2. GitHub Actions workflow triggers
3. GitHub generates a short-lived OIDC token signed with:
   - Repository: `IFAKA/archetype-engine`
   - Workflow: `publish.yml`
   - Commit SHA, actor, etc.
4. npm CLI detects OIDC environment
5. npm verifies the signature against your trusted publisher config
6. If valid, npm issues a temporary publish token (expires immediately)
7. Package publishes with automatic provenance linking to the exact commit

**Security:** Even if someone steals the workflow logs, the token is already expired. No long-lived credentials ever exist.

---

## Troubleshooting

### "Access token expired or revoked"

**Cause:** Trusted publisher not configured yet  
**Fix:** Follow Step 1 above

### "Cannot find trusted publisher"

**Cause:** Workflow filename doesn't match exactly  
**Fix:** Must be `publish.yml` not `publish.yaml` or `.github/workflows/publish.yml`

### "id-token permission denied"

**Cause:** Workflow missing `id-token: write` permission  
**Fix:** Already configured in our workflow, but verify:

```yaml
permissions:
  contents: read
  id-token: write  # Required for OIDC
```

---

## No Maintenance Required!

Unlike tokens:
- ❌ No 90-day expiration
- ❌ No renewal emails
- ❌ No secret rotation
- ❌ No security incidents from leaked tokens

Just set it once and forget it!
