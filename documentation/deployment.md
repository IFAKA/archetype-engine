---

1. Publishing to npm

Your archetype-engine package (the main engine, not the website). Here's the process:

First-time setup

# Login to npm (create account at npmjs.com if needed)

npm login

# Verify you're logged in

npm whoami

Before publishing checklist

cd /Users/faka/code/experiment/frameworks/archetype-engine

# 1. Make sure package.json has correct info

# - name: "archetype-engine"

# - version: "0.1.0" (or whatever)

# - main, types, exports are set

# 2. Build the package

npm run build

# 3. Test locally first (see section 2 below)

# 4. Dry run to see what will be published

npm publish --dry-run

Publish

# For first publish (or if package doesn't exist)

npm publish --access public

# For updates, bump version first

npm version patch # 0.1.0 → 0.1.1 (bug fixes)
npm version minor # 0.1.0 → 0.2.0 (new features)
npm version major # 0.1.0 → 1.0.0 (breaking changes)
npm publish

---

2. Local Development (Before Publishing)

Option A: npm link (recommended for active development)

# In archetype-engine directory

cd /Users/faka/code/experiment/frameworks/archetype-engine
npm run build
npm link

# In your test project

cd /path/to/my-test-app
npm link archetype-engine

# Now you can use it

npx archetype init --yes
npx archetype generate

To unlink later:
cd /path/to/my-test-app
npm unlink archetype-engine

cd /Users/faka/code/experiment/frameworks/archetype-engine
npm unlink

Option B: Direct path install

# In your test project

cd /path/to/my-test-app
npm install /Users/faka/code/experiment/frameworks/archetype-engine

Option C: Pack and install (simulates npm publish)

# In archetype-engine directory

cd /Users/faka/code/experiment/frameworks/archetype-engine
npm run build
npm pack

# Creates archetype-engine-0.1.0.tgz

# In your test project

cd /path/to/my-test-app
npm install /Users/faka/code/experiment/frameworks/archetype-engine/archetype-engine-0.1.0.tgz

---

3. Deploy Website to Vercel

Option A: Via Vercel Dashboard (easiest)

1. Push to GitHub (if not already)
   cd /Users/faka/code/experiment/frameworks/archetype-engine
   git add website
   git commit -m "feat: add landing page website"
   git push origin main
2. Go to https://vercel.com → Sign in with GitHub
3. Click "Add New Project" → Import your archetype-engine repo
4. Configure:


    - Root Directory: website
    - Framework Preset: Next.js (auto-detected)
    - Build Command: npm run build (default)
    - Output Directory: .next (default)

5. Click Deploy → Done!

Option B: Via Vercel CLI

# Install Vercel CLI

npm install -g vercel

# Login

vercel login

# Deploy from website directory

cd /Users/faka/code/experiment/frameworks/archetype-engine/website
vercel

# Follow prompts:

# - Set up and deploy? Y

# - Which scope? (select your account)

# - Link to existing project? N

# - Project name: archetype-engine (or custom)

# - Directory: ./ (current)

# - Override settings? N

# For production deploy

vercel --prod

Custom Domain (optional)

After deploying:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., archetype.dev)
3. Update DNS records as instructed

---

Quick Reference

| Task                    | Command                                     |
| ----------------------- | ------------------------------------------- |
| Preview website locally | cd website && npm run dev                   |
| Build website           | cd website && npm run build                 |
| Link engine locally     | npm link (in engine dir)                    |
| Use linked engine       | npm link archetype-engine (in test project) |
| Publish to npm          | npm publish --access public                 |
| Deploy to Vercel        | cd website && vercel --prod                 |
