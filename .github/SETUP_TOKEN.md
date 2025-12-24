# 🔐 One-Time npm Token Setup

## Quick Visual Guide (5 minutes)

### Step 1: Create Token on npm (2 minutes)

1. **Open:** https://www.npmjs.com/settings/zfaka/tokens
   
2. **Click:** "Generate New Token" → "Granular Access Token"

3. **Fill form:**
   ```
   Token name: github-actions-archetype-engine
   Expiration: 90 days
   ```

4. **Under "Packages and scopes":**
   - Click "Select packages and scopes"
   - Find: `archetype-engine`
   - Enable: ☑️ Read and write

5. **Click:** "Generate Token"

6. **Copy token** (starts with `npm_...`)

### Step 2: Add to GitHub (1 minute)

**Option A - Command Line (Easiest):**
```bash
gh secret set NPM_TOKEN --repo IFAKA/archetype-engine
# Paste token when prompted, press Enter
```

**Option B - Web Browser:**
1. Open: https://github.com/IFAKA/archetype-engine/settings/secrets/actions/new
2. Name: `NPM_TOKEN`
3. Value: Paste token
4. Click "Add secret"

### Step 3: Verify (30 seconds)

```bash
gh secret list --repo IFAKA/archetype-engine
```

Should show:
```
NPM_TOKEN  Updated 2024-12-24
```

---

## ✅ Done! Now you can:

```bash
# Publish new version automatically:
npm version patch
git push origin main --tags

# GitHub Actions will:
# ✓ Run tests
# ✓ Build package
# ✓ Publish to npm
# ✓ Create GitHub release
```

---

## 🔄 Token Expires in 90 Days

npm will email you before it expires. To renew:

1. Create new token (same steps above)
2. Update GitHub secret: `gh secret set NPM_TOKEN --repo IFAKA/archetype-engine`
3. Done!

---

## 📸 Screenshots

### npm Token Page Should Look Like:
```
┌─────────────────────────────────────────────┐
│ Generate New Token                          │
│                                             │
│ ○ Classic Token (Deprecated)                │
│ ● Granular Access Token (Recommended)      │
│                                             │
│ Token name: github-actions-archetype-engine│
│ Expiration: 90 days                         │
│                                             │
│ Packages and scopes:                        │
│ ✓ archetype-engine                          │
│   ☑ Read and write                          │
│                                             │
│ [Generate Token]                            │
└─────────────────────────────────────────────┘
```

### After Generating:
```
┌─────────────────────────────────────────────┐
│ ⚠️ Copy this token now!                     │
│                                             │
│ npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    │
│ [Copy]                                      │
│                                             │
│ You won't be able to see it again.         │
└─────────────────────────────────────────────┘
```
