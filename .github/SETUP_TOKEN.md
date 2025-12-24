# 🔐 One-Time Trusted Publisher Setup (Better than Tokens!)

npm now supports **Trusted Publishing** - no tokens needed!

## Quick Setup (2 minutes)

### Step 1: Configure Trusted Publisher on npm (1 minute)

1. **Open:** https://www.npmjs.com/package/archetype-engine/settings
   
2. **Scroll to:** "Trusted Publisher" section

3. **Click:** "GitHub Actions" button

4. **Fill in:**
   ```
   Organization or user: IFAKA
   Repository: archetype-engine
   Workflow filename: publish.yml
   Environment name: (leave empty)
   ```

5. **Click:** "Add" or "Save"

### Step 2: Done! (That's it)

No tokens needed. GitHub Actions will use OIDC to authenticate automatically.

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
